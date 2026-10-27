// Design evidence only: no engine process, network, application writes or env loading.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex,curriculumCheckpoint} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check')
const hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planPath='docs/data/opening-sicilian-early-p022-plan.json'
const plan=await read(planPath),scope=await read('docs/data/opening-scope-audit.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(Object.keys(plan.preserveFiles).length,169)
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
const selectedIds=[...new Set(plan.courses.flatMap(c=>c.sourceRecords.map(s=>s.positionId)))]
assert.equal(selectedIds.length,4)
assert.equal(new Set([...rows,...plan.courses].map(c=>c.id)).size,293)
assert.equal(siblings.length,32)
// Check every fixed descendant of the three selected early Black choices.
const descendants=scope.records.filter(r=>plan.sourceSubtreePrefixes.some(prefix=>r.moves===prefix||r.moves.startsWith(prefix+' ')))
assert.deepEqual(descendants.filter(r=>r.source==='eco').map(r=>r.id).sort(),[...new Set(plan.courses.flatMap(c=>c.sourceRecords.map(s=>s.id)))].sort())
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
const courses=[],exercises=[],jobs=[],navigation=[]
function verifyFork(left,right,index){
  assert.equal(commonPrefix(left.moves,right.moves),index)
  const fork=curriculumFork(siblings,left.moves,index),turn=replay(left.moves.slice(0,index)).turn()
  assert(fork?.children.has(left.moves[index]));assert(fork.children.has(right.moves[index]))
  for(const [from,to] of [[left,right],[right,left]]){
    assert.equal(curriculumReturnIndex(siblings,[from.id],to),index)
    const checkpoint=curriculumCheckpoint(siblings,to,index)
    assert.deepEqual(checkpoint,{index,reason:'fork'})
    assert.equal(practiceMove(from.moves,index,turn,to.moves[index]).status,'different-line')
    const followed=practiceMove(to.moves,index,turn,to.moves[index])
    assert(['correct','complete'].includes(followed.status))
    assert.equal(followed.index,Math.min(index+2,to.moves.length))
    navigation.push({from:from.id,to:to.id,index,turn,checkpoint,
      afterExplicitFollow:{index:followed.index,status:followed.status},
      training:Object.fromEntries(['w','b'].map(side=>[side,playFrom(to,side,index)]))})
  }
}
for(const course of plan.courses){
  const {provenance:p,exercise:ex}=course
  assert(!rows.some(row=>row.id===course.id))
  assert(!practical.entries.some(row=>row.id===ex.id))
  assert.equal(ex.id,'practice:'+course.id)
  assert.equal(course.moves.length,p.documentedPlies+p.authoredContinuationPlies)
  assert.equal(p.generatedPlies,0)
  for(const source of course.sourceRecords){
    const record=records.get(source.id),position=positions.get(source.positionId)
    const prefix=course.moves.slice(0,source.plies),board=replay(prefix)
    assert(record.eco);assert.equal(record.moves,prefix.join(' '));assert.equal(record.groupId,position.id)
    assert.deepEqual(catalog.entries.find(row=>row.id===source.id.slice(4)).moves,prefix)
    assert.equal(key(board),position.position);assert.equal(position.ecoRoots.length,0)
  }
  assert.equal(course.sourceRecords.at(-1).plies,p.documentedPlies)
  const endpoint=replay(course.moves);assert(!endpoint.isGameOver())
  const parent=rows.find(row=>row.id===course.existingParentCourseId)
  assert.equal(course.relationship,'fork');verifyFork(parent,course,course.sharedPrefixPlies)
  // The changed Black reply at index 7 belongs to the pair starting at index 6.
  const firstPair=Math.floor(course.sharedPrefixPlies/2)*2
  assert.deepEqual(Object.keys(course.editorialNotes).map(Number),
    Array.from({length:(course.moves.length-firstPair)/2},(_,i)=>firstPair+2*i))
  for(const field of ['title','contrast','whitePlan','blackPlan','endpointReason','sourceDisclosure'])assert(course[field]?.length)
  assert(ex.beforeIndex<=course.moves.length)
  const board=replay(course.moves.slice(0,ex.beforeIndex)),before=board.fen()
  const initial=material(board,ex.exerciseSide)
  assert.notEqual(board.turn(),ex.exerciseSide);assert.notEqual(ex.mistake,course.moves[ex.beforeIndex])
  board.move(ex.mistake);const after=board.fen();assert.equal(board.turn(),ex.exerciseSide)
  const captures=board.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)
  assert.deepEqual(captures,[ex.answer]);assert.equal(board.move(ex.answer).captured,ex.capturedType)
  const answerFen=board.fen(),replies=[]
  let minimum=material(board,ex.exerciseSide)-initial
  for(const reply of board.moves()){
    board.move(reply);assert(!board.isGameOver(),'Unexpected immediate terminal state')
    const gain=material(board,ex.exerciseSide)-initial
    replies.push({san:reply,fen:board.fen(),materialGain:gain});minimum=Math.min(minimum,gain);board.undo()
  }
  assert.equal(replies.length,ex.expectedLegalImmediateReplies)
  assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
  assert(minimum>=plan.enginePlan.minimumImmediateMaterial)
  assert.equal(practiceMove(board.history(),ex.beforeIndex+1,ex.exerciseSide,ex.answer).status,'complete')
  const id=course.id.slice('sicilian:'.length)
  assert.deepEqual(course.authoredMoves.map(a=>a.index),
    Array.from({length:p.authoredContinuationPlies},(_,i)=>p.documentedPlies+i))
  let baselineShared=false
  for(const a of course.authoredMoves){
    const controlFen=replay(course.moves.slice(0,a.index)).fen()
    assert.equal(course.moves[a.index],a.san)
    const move=new Chess(controlFen).move(a.san);assert.equal(move.from+move.to,a.uci)
    const shared=controlFen===before;baselineShared ||= shared
    jobs.push({id:id+':continuation-control:'+a.index,courseId:course.id,authoredIndex:a.index,
      fen:controlFen,roots:[],uses:shared?['continuation-control','exercise-baseline']:['continuation-control']})
    jobs.push({id:id+':authored:'+a.index,courseId:course.id,authoredIndex:a.index,
      fen:controlFen,roots:[a.uci],expectedAnswer:a.san,uses:['authored-comparison']})
  }
  if(!baselineShared)jobs.push({id:id+':exercise-baseline',courseId:course.id,fen:before,roots:[],uses:['exercise-baseline']})
  jobs.push({id:id+':deviation',courseId:course.id,fen:after,roots:[],expectedAnswer:ex.answer,uses:['exercise-answer']})
  courses.push({id:course.id,sourceRecords:course.sourceRecords,endpointFen:endpoint.fen(),
    sharedPrefixPlies:course.sharedPrefixPlies,relationship:course.relationship,
    fullTraining:Object.fromEntries(['w','b'].map(side=>[side,playFrom(course,side,initialPracticeIndex(course.moves,side))])),
    browserStatus:'pending-implementation'})
  exercises.push({id:ex.id,before,after,answerFen,capturedType:ex.capturedType,immediateTargetCaptures:captures,
    minimumImmediateMaterialGain:minimum,legalImmediateReplies:replies.length,replies,engineStatus:'not-run'})
}
for(let i=0;i<plan.courses.length;i++)for(let j=i+1;j<plan.courses.length;j++)verifyFork(plan.courses[i],plan.courses[j],7)
assert.equal(navigation.length,12)
for(const row of navigation)row.browserMode='live-and-checkpoint'
for(const [left,right,index] of plan.navigation.comparisonPairs){
  verifyFork(siblings.find(c=>c.id===left),siblings.find(c=>c.id===right),index)
  for(const row of navigation.slice(-2))row.browserMode='checkpoint-only'
}
assert.equal(navigation.length,16)
const parent=rows.find(c=>c.id===plan.navigation.rootFork.existingCourseId)
const root=curriculumFork(siblings,parent.moves,7)
assert.deepEqual([...root.children.keys()],plan.navigation.rootFork.moves)
const rootBranches=[...root.children].map(([san,node])=>({san,representative:node.courses[0].id}))
assert.deepEqual(rootBranches.map(b=>b.representative),['sicilian',...plan.courses.map(c=>c.id)])
const uncovered=plan.navigation.uncoveredAlternative,uncoveredCourse=plan.courses.find(c=>c.id===uncovered.courseId)
assert.equal(practiceMove(uncoveredCourse.moves,uncovered.index,'w',uncovered.san).status,'different-line')
assert(!siblings.some(c=>uncoveredCourse.moves.slice(0,uncovered.index).every((san,i)=>c.moves[i]===san)&&c.moves[uncovered.index]===uncovered.san))
const contained=curriculumCheckpoint(siblings,parent,parent.moves.length)
assert.deepEqual(contained,{index:0,reason:'contained-route'})
// Geometry is checked at each written pair, not inferred from opening labels.
const [g6,a6,e5]=plan.courses,at=(c,n)=>replay(c.moves.slice(0,n))
assert.equal(at(g6,8).get('d6')?.type,'p');assert.equal(at(g6,8).get('g8')?.type,'n')
assert(at(g6,10).attackers('d4','b').includes('g7'))
assert(at(g6,10).attackers('d4','w').includes('d1'))
assert(at(g6,12).attackers('e4','b').includes('f6'))
assert(at(g6,12).attackers('e4','w').includes('c3'))
assert(!at(g6,12).attackers('d4','b').includes('g7'))
assert(at(g6,14).attackers('f7','w').includes('c4'))
assert(at(g6,14).attackers('d4','b').includes('c6'))
for(const sq of ['d1','e3'])assert(at(g6,14).attackers('d4','w').includes(sq))
for(const sq of ['e1','e8'])assert.equal(at(g6,14).get(sq)?.type,'k')
assert.equal(at(g6,14).get('f2')?.type,'p')
const accelerated=rows.find(c=>c.id==='sicilian:accelerated-dragon'),dragon=rows.find(c=>c.id==='sicilian:dragon')
assert.equal(at(accelerated,4).get('d7')?.type,'p');assert.equal(at(accelerated,4).get('c6')?.type,'n')
assert.notEqual(key(at(g6,14)),key(at(dragon,14)))
assert(at(a6,8).attackers('b5','b').includes('a6'));assert(!at(a6,8).isAttacked('d4','b'))
const najdorf=rows.find(c=>c.id==='sicilian:najdorf'),a6End=at(a6,10),najdorfEntry=at(najdorf,10)
assert.equal(key(a6End),key(najdorfEntry));assert.notEqual(a6End.fen(),najdorfEntry.fen())
assert.equal(a6End.fen().split(' ')[4],'2');assert.equal(najdorfEntry.fen().split(' ')[4],'0')
assert.equal(commonPrefix(a6.moves,najdorf.moves),7)
const transposition={courseId:a6.id,existingCourseId:najdorf.id,existingIndex:10,
  positionKey:key(a6End),courseFen:a6End.fen(),existingFen:najdorfEntry.fen(),sameFullFen:false,
  reason:'Same first four FEN fields; halfmove clocks differ. Engine jobs must keep full FEN.',
  commonPrefixPlies:7,returnCheckpoint:{index:7,reason:'fork'},automaticCompletionPolicy:'none; browser verification pending'}
assert(at(e5,8).attackers('d4','b').includes('e5'));assert(at(e5,8).attackers('e5','b').includes('d6'))
assert.equal(at(e5,10).get('b3')?.type,'n');assert.equal(at(e5,10).get('b1')?.type,'n')
assert(at(e5,10).attackers('e4','b').includes('f6'));assert(!at(e5,10).attackers('e4','w').includes('b3'))
assert.equal(new Chess(exercises[0].answerFen).move('Nxe4').captured,'p')
assert(new Chess(exercises[1].after).isCheck());assert(!new Chess(exercises[1].answerFen).isCheck())
assert.equal(new Chess(exercises[1].answerFen).move('Nxb5').captured,'p')
assert.equal(new Chess(exercises[2].answerFen).move('Qxd4').captured,'p')
assert.equal(jobs.length,12)
assert.equal(new Set(jobs.map(j=>JSON.stringify([j.fen,j.roots]))).size,jobs.length)
assert.equal(jobs.filter(j=>j.uses.includes('exercise-baseline')).length,3)
assert.equal(jobs.filter(j=>j.uses.includes('continuation-control')).length,4)
assert.equal(jobs.filter(j=>j.uses.includes('exercise-baseline')&&j.uses.includes('continuation-control')).length,2)
assert.equal(plan.enginePlan.primaryJobs,jobs.length)
assert.equal(plan.enginePlan.maximumGoCommands,2*jobs.length)
assert.equal(plan.enginePlan.maximumRequestedNodes,2*jobs.length*plan.enginePlan.nodesPerGo)
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
assert.deepEqual(count('projected'),plan.expectedCoverage)
const newlyReached=states.filter(row=>row.before==='absent'&&row.projected!=='absent')
assert.deepEqual(newlyReached.filter(r=>r.projected==='exact').map(r=>r.id).sort(),selectedIds.sort())
assert.deepEqual(newlyReached.filter(r=>r.projected==='transposition-only').map(r=>r.id),[plan.additionalTranspositionPosition])
assert(newlyReached.every(r=>r.ecoRoots.length===0))
const nextIds=new Set(scope.records.filter(r=>plan.nextDesign.sourcePrefixes.some(prefix=>r.moves===prefix||r.moves.startsWith(prefix+' '))).map(r=>r.groupId))
const nextPositions=states.filter(row=>nextIds.has(row.id))
assert.equal(nextPositions.length,plan.nextDesign.expectedSourcePositions)
assert(nextPositions.every(row=>row.before==='absent'&&row.projected==='absent'))
const inputHashes={}
for(const file of [planPath,'scripts/verify-opening-sicilian-early-design.mjs','src/components/OpeningLibrary.jsx',
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js','src/lib/openingPracticalLibrary.js'])
  inputHashes[file]=hash(await fs.readFile(file))
const sum=field=>plan.courses.reduce((n,c)=>n+c.provenance[field],0)
assert.equal(sum('documentedPlies'),30);assert.equal(sum('authoredContinuationPlies'),4)
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,
  baseline:{courses:rows,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},
  preservedFiles:Object.keys(plan.preserveFiles).length,plannedCourses:3,
  documentedPlies:sum('documentedPlies'),authoredContinuationPlies:sum('authoredContinuationPlies'),
  generatedPlies:0,engineSearchesExecuted:0,courses,exercises,engineJobs:jobs,
  navigation:{forks:navigation,rootBranches,transposition,uncoveredAlternative:uncovered,
    existingContainedRouteCheckpoint:contained,browserStatus:'not-run'},
  coverage:{baseline:count('before'),projected:count('projected'),newlyReached,newEcoAnchors:0,
    selectedPositionIds:selectedIds,sourceSubtreeRecords:descendants,
    selectedPositionReferences:scope.records.filter(r=>selectedIds.includes(r.groupId))},
  nextDesign:{...plan.nextDesign,positions:nextPositions},
  limitations:['Design only: production remains at 290 courses and exercises.',
    'Four authored plies and three exercises await bounded engine evidence; no full-game or uniqueness proof.',
    'Current practice and checkpoint helpers were exercised offline; browser behavior and persistence await integration.',
    'Counts measure distinct reached source positions, not complete theory, complete commentary or learned skill.']}
const output='docs/data/opening-sicilian-early-p022-design-verification.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Design report changed')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',baselineCourses:rows.length,plannedCourses:3,
  preservedFiles:result.preservedFiles,documentedPlies:30,authoredContinuationPlies:4,
  legalExerciseReplies:exercises.reduce((n,e)=>n+e.legalImmediateReplies,0),
  minimumImmediateMaterialGains:exercises.map(e=>e.minimumImmediateMaterialGain),
  directedForkTransitions:navigation.length,engineSearchesExecuted:0,plannedPrimaryJobs:jobs.length,
  projectedCoverage:result.coverage.projected,newExactPositions:4,additionalTranspositions:1},null,2))
