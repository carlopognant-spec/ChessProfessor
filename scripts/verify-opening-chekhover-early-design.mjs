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
const planPath='docs/data/opening-chekhover-early-p022-plan.json'
const plan=await read(planPath),scope=await read('docs/data/opening-scope-audit.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(Object.keys(plan.preserveFiles).length,134)
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
assert.equal(selectedIds.length,3)
assert.equal(new Set([...rows,...plan.courses].map(c=>c.id)).size,290)
assert.equal(siblings.length,29)
// Check every fixed descendant of both selected early Black choices.
const descendants=scope.records.filter(r=>plan.sourceSubtreePrefixes.some(prefix=>r.moves===prefix||r.moves.startsWith(prefix+' ')))
assert.deepEqual(descendants.map(r=>r.id).sort(),[...new Set(plan.courses.flatMap(c=>c.sourceRecords.map(s=>s.id)))].sort())
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
    assert.equal(record.eco,'B53');assert.equal(record.moves,prefix.join(' '));assert.equal(record.groupId,position.id)
    assert.deepEqual(catalog.entries.find(row=>row.id===source.id.slice(4)).moves,prefix)
    assert.equal(key(board),position.position);assert.equal(position.ecoRoots.length,0)
    assert(!position.recordIds.some(id=>id.startsWith('lichess:')))
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
verifyFork(...plan.courses,plan.navigation.siblingFork.index)
// Four real Black choices coexist; the two new choices have distinct representatives.
const parent=rows.find(c=>c.id===plan.navigation.rootFork.existingCourseId)
const root=curriculumFork(siblings,parent.moves,7)
assert.deepEqual([...root.children.keys()],plan.navigation.rootFork.moves)
const rootBranches=[...root.children].map(([san,node])=>({san,representative:node.courses[0].id}))
for(const course of plan.courses){
  const representative=siblings.find(c=>c.id!==parent.id&&parent.moves.slice(0,7).every((san,i)=>c.moves[i]===san)&&c.moves[7]===course.moves[7])
  assert.equal(representative.id,course.id)
}
const uncovered=plan.navigation.uncoveredAlternative,uncoveredCourse=plan.courses.find(c=>c.id===uncovered.courseId)
assert.equal(practiceMove(uncoveredCourse.moves,uncovered.index,'w',uncovered.san).status,'different-line')
assert(!siblings.some(c=>uncoveredCourse.moves.slice(0,uncovered.index).every((san,i)=>c.moves[i]===san)&&c.moves[uncovered.index]===uncovered.san))
// Existing contained-route safeguard remains applicable and is not a new dependency.
const contained=curriculumCheckpoint(siblings,parent,parent.moves.length)
assert.deepEqual(contained,{index:0,reason:'contained-route'})

// Position-bound editorial assertions, including counterchecks against common false claims.
const [nf6,bd7]=plan.courses.map(c=>replay(c.moves))
assert.equal(nf6.fen(),bd7.fen(),'The two authored demonstrations must transpose exactly')
assert.equal(commonPrefix(plan.courses[0].moves,plan.courses[1].moves),7)
assert(!scope.positions.some(p=>p.position===key(nf6)),'Do not attribute the authored endpoint to the fixed sources')
const transposition={courseIds:plan.courses.map(c=>c.id),endpointFen:nf6.fen(),commonPrefixPlies:7,
  sourcePositionAtEndpoint:false,returnCheckpoint:{index:7,reason:'fork'},
  automaticCompletionPolicy:'none-from-endpoint-transposition; browser verification pending'}
const nf6Root=replay(plan.courses[0].moves.slice(0,8)),bd7Root=replay(plan.courses[1].moves.slice(0,8))
assert(nf6Root.attackers('e4','b').includes('f6'));assert(nf6Root.attackers('e4','w').includes('d4'))
assert(!nf6Root.isAttacked('d4','b'));assert.equal(nf6Root.get('b8')?.type,'n')
assert.equal(bd7Root.get('d7')?.type,'b')
for(const square of ['b8','g8'])assert.equal(bd7Root.get(square)?.type,'n')
assert(bd7Root.attackers('a4','b').includes('d7'))
const laterBd7=replay(parent.moves.slice(0,10))
assert.equal(laterBd7.get('c6')?.type,'n');assert(!laterBd7.attackers('a4','b').includes('d7'))
for(const b of [nf6,bd7]){
  assert.equal(b.get('e1')?.type,'k');assert.equal(b.get('e8')?.type,'k')
  assert.equal(b.get('b8')?.type,'n');assert.equal(b.get('f8')?.type,'b')
  assert(b.attackers('e4','b').includes('f6'))
  for(const s of ['c3','d4'])assert(b.attackers('e4','w').includes(s))
  assert(b.attackers('a4','b').includes('d7'))
}
const ex1=new Chess(exercises[0].answerFen)
assert.deepEqual(ex1.get('f5'),{type:'p',color:'w'});assert.equal(ex1.get('e4'),undefined)
ex1.move('Nc6');assert(ex1.attackers('d4','b').includes('c6'))
const ex2=new Chess(exercises[1].after)
assert(!ex2.isCheck(),'Qa4 is not check because Bd7 interrupts the diagonal to e8')
const capture=ex2.move('Bxa4');assert.equal(capture.from,'d7');assert.equal(capture.captured,'q')
assert.equal(jobs.length,plan.enginePlan.primaryJobs)
assert.equal(new Set(jobs.map(j=>JSON.stringify([j.fen,j.roots]))).size,jobs.length)
assert.equal(jobs.filter(j=>j.uses.includes('exercise-baseline')).length,2)
assert.equal(jobs.filter(j=>j.uses.includes('continuation-control')).length,3)
assert.equal(jobs[0].fen,exercises[0].before)
assert.equal(jobs[3].fen,exercises[1].before)
for(const [index,job] of jobs.entries())if(job.uses.includes('continuation-control')){
  const selected=jobs[index+1]
  assert.equal(job.fen,selected.fen);assert.equal(job.authoredIndex,selected.authoredIndex)
  assert.equal(job.courseId,selected.courseId);assert.equal(job.roots.length,0)
  assert.equal(selected.roots.length,1);assert(selected.uses.includes('authored-comparison'))
}
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
assert.deepEqual(count('projected'),{exact:1952,'transposition-only':201,absent:10169})
const newlyReached=states.filter(row=>row.before==='absent'&&row.projected!=='absent')
assert.deepEqual(newlyReached.map(row=>row.id).sort(),selectedIds.sort())
assert(newlyReached.every(row=>row.projected==='exact'&&row.ecoRoots.length===0))
const subtreePrefix=plan.courses[0].moves.slice(0,7).join(' ')
const subtreeIds=new Set(scope.records.filter(row=>row.moves===subtreePrefix||row.moves.startsWith(subtreePrefix+' ')).map(row=>row.groupId))
const subtree=states.filter(row=>subtreeIds.has(row.id))
assert.equal(subtree.length,22);assert.equal(subtree.filter(row=>row.projected==='absent').length,0)
assert(subtree.every(row=>row.projected==='exact'),'All 22 fixed Chekhover positions must have an exact source order')
const nextIds=new Set(scope.records.filter(r=>plan.nextDesign.sourcePrefixes.some(prefix=>r.moves===prefix||r.moves.startsWith(prefix+' '))).map(r=>r.groupId))
const nextPositions=states.filter(row=>nextIds.has(row.id))
assert.equal(nextPositions.length,plan.nextDesign.expectedSourcePositions)
assert(nextPositions.every(row=>row.before==='absent'&&row.projected==='absent'))
const inputHashes={}
for(const file of [planPath,'scripts/verify-opening-chekhover-early-design.mjs','src/components/OpeningLibrary.jsx',
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js','src/lib/openingPracticalLibrary.js'])
  inputHashes[file]=hash(await fs.readFile(file))
const sum=field=>plan.courses.reduce((n,c)=>n+c.provenance[field],0)
assert.equal(sum('documentedPlies'),17);assert.equal(sum('authoredContinuationPlies'),3)
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,
  baseline:{courses:rows,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},
  preservedFiles:Object.keys(plan.preserveFiles).length,plannedCourses:2,
  documentedPlies:sum('documentedPlies'),authoredContinuationPlies:sum('authoredContinuationPlies'),
  generatedPlies:0,engineSearchesExecuted:0,courses,exercises,engineJobs:jobs,
  navigation:{forks:navigation,rootBranches,transposition,uncoveredAlternative:uncovered,
    existingContainedRouteCheckpoint:contained,browserStatus:'not-run'},
  coverage:{baseline:count('before'),projected:count('projected'),newlyReached,newEcoAnchors:0,
    chekhover:{positions:22,absentBefore:subtree.filter(row=>row.before==='absent').length,
      exactAfter:subtree.filter(row=>row.projected==='exact').length,
      remainingAbsent:subtree.filter(row=>row.projected==='absent').map(({id,name,ecoRoots})=>({id,name,ecoRoots}))}},
  nextDesign:{...plan.nextDesign,positions:nextPositions},
  limitations:['Design only: production remains at 288 courses and exercises.',
    'Three authored plies and both exercises await bounded engine evidence; no full-game or uniqueness proof.',
    'Current practice and checkpoint helpers were exercised offline; browser behavior and persistence await integration.',
    'Counts measure distinct reached source positions, not complete theory, complete commentary or learned skill.']}
const output='docs/data/opening-chekhover-early-p022-design-verification.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Design report changed')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',baselineCourses:rows.length,plannedCourses:2,
  preservedFiles:result.preservedFiles,documentedPlies:17,authoredContinuationPlies:3,
  legalExerciseReplies:exercises.reduce((n,e)=>n+e.legalImmediateReplies,0),
  minimumImmediateMaterialGains:exercises.map(e=>e.minimumImmediateMaterialGain),
  directedForkTransitions:navigation.length,engineSearchesExecuted:0,plannedPrimaryJobs:jobs.length,
  projectedCoverage:result.coverage.projected,remainingChekhover:0},null,2))
