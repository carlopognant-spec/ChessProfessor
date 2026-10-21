// Offline design evidence only. Never launches an engine or writes application data.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check')
const hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planPath='docs/data/opening-chekhover-p022-plan.json'
const plan=await read(planPath),scope=await read('docs/data/opening-scope-audit.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
assert.equal(plan.preserveFiles['src/data/openingCatalog.json'],plan.source.catalogSha256)
const rows=ALL_OPENING_JOURNEYS.map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(rows.length,plan.baseline.courseCount)
assert.equal(hash(JSON.stringify(rows)),plan.baseline.courseDigest,'Baseline changed: do not silently refresh')
assert.equal(practical.entries.length,plan.baseline.practicalCount)
assert.equal(hash(JSON.stringify(practical.entries)),plan.baseline.practicalDigest)
const replay=moves=>{const b=new Chess();for(const san of moves)assert.equal(b.move(san).san,san);return b}
const key=b=>b.fen().split(' ').slice(0,4).join(' ')
const records=new Map(scope.records.map(row=>[row.id,row]))
const positions=new Map(scope.positions.map(row=>[row.id,row]))
const catalog=await read('src/data/openingCatalog.json')
const siblings=[...ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian'),...plan.courses]
const selectedIds=plan.courses.flatMap(c=>c.sourceRecords.map(s=>s.positionId))
assert.equal(new Set(selectedIds).size,4)
assert.equal(new Set([...rows,...plan.courses].map(c=>c.id)).size,286)
const value={p:1,n:3,b:3,r:5,q:9,k:0}
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((sum,p)=>sum+(p.color===side?1:-1)*value[p.type],0)
function playFrom(course,side,start){
  let index=start,turns=0
  if(index<course.moves.length&&replay(course.moves.slice(0,index)).turn()!==side)index++
  while(index<course.moves.length){
    const result=practiceMove(course.moves,index,side,course.moves[index])
    assert(['correct','complete'].includes(result.status));assert(result.index>index)
    index=result.index;turns++
  }
  assert.equal(index,course.moves.length);assert(turns>0)
  return {start,learnerTurns:turns,endpointReached:true}
}
const courses=[],exercises=[],jobs=[]
for(const course of plan.courses){
  const {provenance:p,exercise:ex}=course
  assert(!rows.some(row=>row.id===course.id))
  assert(!practical.entries.some(row=>row.id===ex.id))
  assert.equal(course.moves.length,p.documentedPlies+p.authoredContinuationPlies)
  assert.equal(p.generatedPlies,0)
  for(const source of course.sourceRecords){
    const record=records.get(source.id),position=positions.get(source.positionId)
    const prefix=course.moves.slice(0,source.plies),board=replay(prefix)
    assert.equal(record.moves,prefix.join(' '));assert.equal(record.groupId,position.id)
    assert.deepEqual(catalog.entries.find(row=>row.id===source.id.slice(4)).moves,prefix)
    assert.equal(key(board),position.position);assert.equal(position.ecoRoots.length,0)
    assert(!position.recordIds.some(id=>id.startsWith('lichess:')))
  }
  assert.equal(course.sourceRecords.at(-1).plies,p.documentedPlies)
  const rootPrefix=course.moves.slice(0,course.sourceRecords[0].plies).join(' ')
  const descendants=scope.records.filter(r=>r.moves===rootPrefix||r.moves.startsWith(rootPrefix+' '))
  assert.deepEqual(descendants.map(r=>r.id).sort(),course.sourceRecords.map(r=>r.id).sort(),
    'Fixed source descendants changed: review selected endpoint')
  const endpoint=replay(course.moves);assert(!endpoint.isGameOver())
  const parent=rows.find(row=>row.id===course.existingParentCourseId)
  assert.equal(commonPrefix(parent.moves,course.moves),course.sharedPrefixPlies)
  const prefix=course.sharedPrefixPlies
  assert.equal(curriculumReturnIndex(siblings,[parent.id],course),prefix)
  const reverse=curriculumReturnIndex(siblings,[course.id],parent)
  assert.equal(reverse,prefix)
  const fork=curriculumFork(siblings,course.moves,prefix)
  if(course.relationship==='fork'){
    assert(fork?.children.has(parent.moves[prefix]));assert(fork.children.has(course.moves[prefix]))
    assert.equal(practiceMove(parent.moves,prefix,'w',course.moves[prefix]).status,'different-line')
    assert.equal(practiceMove(course.moves,prefix,'w',parent.moves[prefix]).status,'different-line')
  }else{
    assert.equal(course.relationship,'strict-continuation');assert.equal(prefix,parent.moves.length)
    assert.equal(fork,null,'A course ending is not a competing move')
  }
  // Proposed UI guard, NOT an assertion that the current UI already implements it.
  const proposedReverseStart=reverse>=parent.moves.length?0:reverse
  const training={}
  for(const side of ['w','b'])training[side]={
    full:playFrom(course,side,initialPracticeIndex(course.moves,side)),
    checkpoint:playFrom(course,side,prefix),
    reverseWithProposedGuard:playFrom(parent,side,proposedReverseStart),
  }
  for(const index of Object.keys(course.editorialNotes)){
    assert.equal(Number(index)%2,0);assert(Number(index)>=prefix&&Number(index)<course.moves.length)
  }
  assert(ex.beforeIndex<=course.moves.length)
  const board=replay(course.moves.slice(0,ex.beforeIndex)),before=board.fen()
  const initial=material(board,ex.exerciseSide)
  assert.notEqual(board.turn(),ex.exerciseSide);assert.notEqual(ex.mistake,course.moves[ex.beforeIndex])
  board.move(ex.mistake);const after=board.fen();assert.equal(board.turn(),ex.exerciseSide)
  const captures=board.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)
  assert.deepEqual(captures,[ex.answer])
  assert.equal(board.move(ex.answer).captured,ex.capturedType)
  const answerFen=board.fen(),replies=[]
  let minimum=material(board,ex.exerciseSide)-initial
  for(const reply of board.moves()){
    board.move(reply);assert(!board.isGameOver(),'Unexpected immediate terminal state')
    const gain=material(board,ex.exerciseSide)-initial
    replies.push({san:reply,fen:board.fen(),materialGain:gain});minimum=Math.min(minimum,gain);board.undo()
  }
  assert.equal(replies.length,ex.expectedLegalImmediateReplies)
  assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
  assert.equal(practiceMove(board.history(),ex.beforeIndex+1,ex.exerciseSide,ex.answer).status,'complete')
  const id=course.id.slice('sicilian:'.length)
  if(course.authoredMove){
    const a=course.authoredMove,controlFen=replay(course.moves.slice(0,a.index)).fen()
    assert.equal(a.index,p.documentedPlies);assert.equal(course.moves[a.index],a.san)
    const move=new Chess(controlFen).move(a.san);assert.equal(move.from+move.to,a.uci)
    jobs.push({id:id+':continuation-control',fen:controlFen,roots:[],uses:controlFen===before?['continuation-control','exercise-baseline']:['continuation-control']})
    jobs.push({id:id+':authored',fen:controlFen,roots:[a.uci],expectedAnswer:a.san,uses:['authored-comparison']})
    if(controlFen!==before)jobs.push({id:id+':exercise-baseline',fen:before,roots:[],uses:['exercise-baseline']})
  }else jobs.push({id:id+':exercise-baseline',fen:before,roots:[],uses:['exercise-baseline']})
  jobs.push({id:id+':deviation',fen:after,roots:[],expectedAnswer:ex.answer,uses:['exercise-answer']})
  courses.push({id:course.id,sourceRecords:course.sourceRecords,endpointFen:endpoint.fen(),
    sharedPrefixPlies:prefix,relationship:course.relationship,rawReverseReturnIndex:reverse,
    proposedReverseStart,training,browserStatus:'pending-implementation'})
  exercises.push({id:ex.id,before,after,answerFen,capturedType:ex.capturedType,immediateTargetCaptures:captures,
    minimumImmediateMaterialGain:minimum,legalImmediateReplies:replies.length,replies,engineStatus:'not-run'})
}
// Position-bound checks for claims in the written plan.
const [c4,qd3,qd2]=plan.courses.map(c=>replay(c.moves))
for(const square of ['e1','e8'])assert.equal(c4.get(square)?.type,'k')
assert.equal(c4.get('f8')?.type,'b');assert.equal(c4.get('g7'),undefined)
assert(c4.isAttacked('d5','w'));assert(c4.isAttacked('e4','w'));assert(c4.isAttacked('e4','b'))
assert.equal(qd3.get('d3')?.type,'q');assert.equal(qd3.get('h1')?.type,'r');assert.equal(qd3.get('e1'),undefined)
for(const board of [qd3,qd2]){assert.equal(board.get('c1')?.type,'k');assert.equal(board.get('g8')?.type,'k')}
assert.equal(qd2.get('d2')?.type,'q');assert.equal(qd2.get('e1')?.type,'r')
assert.equal(qd2.get('c7')?.type,'q');assert.equal(qd2.get('c6')?.type,'b')
for(const square of ['b8','c8','d8','e8'])assert.equal(qd2.get(square),undefined)
assert.equal(qd2.get('a8')?.type,'r');assert.equal(qd2.get('f8')?.type,'r')
assert.equal(jobs.length,plan.enginePlan.primaryJobs)
assert.equal(new Set(jobs.map(j=>JSON.stringify([j.fen,j.roots]))).size,jobs.length)
assert.equal(jobs.filter(j=>j.uses.includes('exercise-baseline')).length,3)
assert.equal(jobs.filter(j=>j.uses.includes('continuation-control')).length,2)
assert.equal(plan.enginePlan.maximumGoCommands,2*jobs.length)
assert.equal(plan.enginePlan.maximumRequestedNodes,plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo)
const beforePositions=new Set(),beforeOrders=new Set()
function add(moves,positions,orders){const board=new Chess(),prefix=[]
  for(const san of moves){board.move(san);prefix.push(san);positions.add(key(board));orders.add(prefix.join(' '))}
}
for(const row of rows)add(row.moves,beforePositions,beforeOrders)
const afterPositions=new Set(beforePositions),afterOrders=new Set(beforeOrders)
for(const course of plan.courses)add(course.moves,afterPositions,afterOrders)
const states=scope.positions.map(row=>{
  const reach=(positions,orders)=>row.recordIds.some(id=>orders.has(records.get(id).moves))?'exact':positions.has(row.position)?'transposition-only':'absent'
  return {id:row.id,name:row.name,before:reach(beforePositions,beforeOrders),projected:reach(afterPositions,afterOrders),ecoRoots:row.ecoRoots}
})
const count=field=>Object.fromEntries(['exact','transposition-only','absent'].map(status=>[status,states.filter(row=>row[field]===status).length]))
assert.deepEqual(count('before'),plan.baseline.coverage)
const newlyReached=states.filter(row=>row.before==='absent'&&row.projected!=='absent')
assert.deepEqual(newlyReached.map(row=>row.id).sort(),selectedIds.sort())
assert(newlyReached.every(row=>row.projected==='exact'&&row.ecoRoots.length===0))
const subtreePrefix=plan.courses[0].moves.slice(0,7).join(' ')
const subtreeIds=new Set(scope.records.filter(row=>row.moves===subtreePrefix||row.moves.startsWith(subtreePrefix+' ')).map(row=>row.groupId))
const subtree=states.filter(row=>subtreeIds.has(row.id))
assert.equal(subtree.length,22)
assert.equal(subtree.filter(row=>row.projected==='absent').length,8)
const inputHashes={}
for(const file of [planPath,'scripts/verify-opening-chekhover-design.mjs','src/components/OpeningLibrary.jsx',
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js','src/lib/openingPracticalLibrary.js'])
  inputHashes[file]=hash(await fs.readFile(file))
const sum=field=>plan.courses.reduce((n,c)=>n+c.provenance[field],0)
assert.equal(sum('documentedPlies'),56);assert.equal(sum('authoredContinuationPlies'),2)
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,
  baseline:{courses:rows,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},
  plannedCourses:3,documentedPlies:sum('documentedPlies'),authoredContinuationPlies:sum('authoredContinuationPlies'),
  generatedPlies:0,engineSearchesExecuted:0,courses,exercises,engineJobs:jobs,
  coverage:{baseline:count('before'),projected:count('projected'),newlyReached,newEcoAnchors:0,
    chekhover:{positions:22,absentBefore:subtree.filter(row=>row.before==='absent').length,
      remainingAbsent:subtree.filter(row=>row.projected==='absent').map(({id,name,ecoRoots})=>({id,name,ecoRoots}))}},
  limitations:['Design only: production remains at 283 courses and exercises.',
    'Two authored plies and all exercises await bounded engine evidence; no full-game or uniqueness proof.',
    'Practice logic was exercised offline. The proposed contained-route guard is simulated here, not implemented or browser-tested.',
    'Counts measure distinct reached source positions, not complete theory, complete commentary or learned skill.']}
const output='docs/data/opening-chekhover-p022-design-verification.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Design report changed')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',baselineCourses:rows.length,plannedCourses:3,
  documentedPlies:56,authoredContinuationPlies:2,legalExerciseReplies:exercises.reduce((n,e)=>n+e.legalImmediateReplies,0),
  minimumImmediateMaterialGains:exercises.map(e=>e.minimumImmediateMaterialGain),engineSearchesExecuted:0,
  plannedPrimaryJobs:jobs.length,projectedCoverage:result.coverage.projected,remainingChekhover:8},null,2))
