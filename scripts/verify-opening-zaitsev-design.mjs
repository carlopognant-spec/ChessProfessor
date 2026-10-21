// Offline design evidence. Does not launch engines or write application data.
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
const planPath='docs/data/opening-zaitsev-p022-plan.json'
const plan=await read(planPath),course=plan.course
const scope=await read('docs/data/opening-scope-audit.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
for(const [file,sha]of Object.entries({...original.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
const sourceManifest=await read('docs/data/opening-audit-sources/manifest.json')
for(const file of sourceManifest.files)
  assert.equal(hash(await fs.readFile(`docs/data/opening-audit-sources/${file.name}`)),file.sha256)
const rows=ALL_OPENING_JOURNEYS.map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(rows.length,plan.baseline.courseCount)
assert.equal(hash(JSON.stringify(rows)),plan.baseline.courseDigest,'Design baseline changed; do not silently refresh')
assert.equal(practical.entries.length,plan.baseline.practicalCount)
assert.equal(hash(JSON.stringify(practical.entries)),plan.baseline.practicalDigest)
assert(!rows.some(row=>row.id===course.id))
assert(!practical.entries.some(row=>row.id===course.exercise.id))
const replay=moves=>{const b=new Chess();for(const san of moves)assert.equal(b.move(san).san,san);return b}
const key=b=>b.fen().split(' ').slice(0,4).join(' ')
const root=new Chess();root.loadPgn(course.rootPgn)
const rootMoves=root.history(),rootOrder=rootMoves.join(' ')
const catalog=await read('src/data/openingCatalog.json')
const source=catalog.entries.find(row=>row.id===plan.source.catalogId)
assert.deepEqual(source.moves,rootMoves)
assert.equal(source.name,plan.source.name);assert.equal(source.eco,plan.source.eco)
assert.equal(rootMoves.length,10);assert.equal(course.characteristicPly,10)
assert.deepEqual(course.moves.slice(0,10),rootMoves)
assert.deepEqual(course.moves.slice(10),['Bxc6','Qxc6'])
assert.equal(course.provenance.documentedPlies,10)
assert.equal(course.provenance.authoredContinuationPlies,2)
assert.equal(course.provenance.generatedPlies,0)
const sourceRecords=scope.records.filter(row=>row.moves===rootOrder||row.moves.startsWith(rootOrder+' '))
assert.deepEqual(sourceRecords.map(row=>row.id).sort(),[...plan.source.recordIds].sort())
assert(sourceRecords.every(row=>row.moves===rootOrder),'Longer fixed source found; revisit provenance')
const position=scope.positions.find(row=>row.id===course.rootPositionId)
assert.equal(key(root),position.position)
assert.equal(position.ecoRoots.length,0)
const endpoint=replay(course.moves)
assert(!endpoint.isGameOver())
assert.equal(endpoint.get('c6')?.type,'q')
assert.equal(endpoint.get('c8')?.type,'b');assert.equal(endpoint.get('f8')?.type,'b')
assert.equal(endpoint.get('b7')?.type,'p');assert.equal(endpoint.get('d6')?.type,'p')
assert(endpoint.isAttacked('e4','b'))
assert(endpoint.isAttacked('e4','w'))
assert.equal(endpoint.get('d4')?.type,'q')
assert.equal(endpoint.get('e1')?.type,'k');assert.equal(endpoint.get('e8')?.type,'k')
const parent=ALL_OPENING_JOURNEYS.find(row=>row.id===course.existingParentCourseId)
assert.equal(commonPrefix(parent.moves,course.moves),course.sharedPrefixPlies)
assert.equal(course.sharedPrefixPlies,9)
const siblings=[...ALL_OPENING_JOURNEYS.filter(row=>row.family===course.family),course]
const fork=curriculumFork(siblings,course.moves,9)
assert(fork.children.has('Bd7'));assert(fork.children.has('Qd7'))
assert.equal(curriculumReturnIndex(siblings,[parent.id],course),9)
assert.equal(curriculumReturnIndex(siblings,[course.id],parent),9)
const training={}
for(const side of ['w','b']){
  let index=initialPracticeIndex(course.moves,side),turns=0,postForkTurns=0
  while(index<course.moves.length){
    if(index>=9)postForkTurns++
    const result=practiceMove(course.moves,index,side,course.moves[index])
    assert(['correct','complete'].includes(result.status));assert(result.index>index)
    index=result.index;turns++
  }
  assert.equal(index,12);assert(postForkTurns>0)
  training[side]={turns,postForkTurns,endpointReached:true}
}
assert.equal(practiceMove(parent.moves,9,'b','Qd7').status,'different-line')
assert.equal(practiceMove(course.moves,9,'b','Bd7').status,'different-line')
assert.equal(practiceMove(course.moves,10,'w','Qd3').status,'different-line')
for(const index of Object.keys(course.editorialNotes)){
  assert.equal(Number(index)%2,0);assert(Number(index)>=8&&Number(index)<12)
}
const value={p:1,n:3,b:3,r:5,q:9,k:0}
const material=(b,side)=>b.board().flat().filter(Boolean)
  .reduce((sum,p)=>sum+(p.color===side?1:-1)*value[p.type],0)
const ex=course.exercise,b=replay(course.moves.slice(0,ex.beforeIndex))
assert.equal(ex.beforeIndex,course.characteristicPly)
assert.notEqual(b.turn(),ex.exerciseSide)
const before=b.fen(),initial=material(b,ex.exerciseSide)
assert.notEqual(ex.mistake,course.moves[ex.beforeIndex]);b.move(ex.mistake)
const after=b.fen();assert.equal(b.turn(),ex.exerciseSide)
const captures=b.moves({verbose:true}).filter(move=>move.captured==='q').map(move=>move.san)
assert.deepEqual(captures,[ex.answer])
assert.equal(b.move(ex.answer).captured,'q')
const answerFen=b.fen(),replies=[]
let minimum=material(b,ex.exerciseSide)-initial
for(const reply of b.moves()){
  b.move(reply);assert(!b.isCheckmate())
  const gain=material(b,ex.exerciseSide)-initial
  replies.push({san:reply,fen:b.fen(),materialGain:gain});minimum=Math.min(minimum,gain)
  b.undo()
}
assert.equal(replies.length,ex.expectedLegalImmediateReplies)
assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
assert.equal(practiceMove(b.history(),11,'b',ex.answer).status,'complete')
// Counterexamples prevent teaching that every knight move loses a queen,
// or that every bishop retreat leaves White without a queen-trade resource.
const beforeFork=replay(rootMoves.slice(0,9))
assert(!beforeFork.moves().includes('Nxd4'))
const exchange=replay([...rootMoves,'Nc3','Nxd4','Bxd7+','Bxd7','Nxd4'])
assert.equal(material(exchange,'b'),0)
const retreatCounterexample=replay([...rootMoves,'Ba4','Nxd4','Bxd7+','Bxd7','Nxd4'])
assert.equal(material(retreatCounterexample,'b'),0)
const afterCapture=replay([...rootMoves,'Bxc6'])
const jobs=[
  {id:'zaitsev:root-control',fen:before,roots:[],uses:['continuation-white-control','exercise-baseline']},
  {id:'zaitsev:authored-Bxc6',fen:before,roots:['b5c6'],expectedAnswer:'Bxc6'},
  {id:'zaitsev:recapture-control',fen:afterCapture.fen(),roots:[]},
  {id:'zaitsev:authored-Qxc6',fen:afterCapture.fen(),roots:['d7c6'],expectedAnswer:'Qxc6'},
  {id:'zaitsev:deviation',fen:after,roots:[],expectedAnswer:'Nxd4'},
]
assert.equal(jobs.length,plan.enginePlan.primaryJobs)
assert.equal(plan.enginePlan.maximumGoCommands,2*jobs.length)
assert.equal(plan.enginePlan.maximumRequestedNodes,plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo)
for(const job of jobs){
  const legal=new Chess(job.fen).moves({verbose:true}).map(move=>move.from+move.to+(move.promotion??''))
  for(const move of job.roots)assert(legal.includes(move))
}
const beforePositions=new Set(),beforeOrders=new Set()
function add(moves,positions,orders){const board=new Chess(),prefix=[]
  for(const san of moves){board.move(san);prefix.push(san);positions.add(key(board));orders.add(prefix.join(' '))}
}
for(const row of rows)add(row.moves,beforePositions,beforeOrders)
const afterPositions=new Set(beforePositions),afterOrders=new Set(beforeOrders)
add(course.moves,afterPositions,afterOrders)
const records=new Map(scope.records.map(row=>[row.id,row]))
const states=scope.positions.map(row=>{
  const reach=(positions,orders)=>row.recordIds.some(id=>orders.has(records.get(id).moves))?'exact':positions.has(row.position)?'transposition-only':'absent'
  return {id:row.id,name:row.name,before:reach(beforePositions,beforeOrders),projected:reach(afterPositions,afterOrders),ecoRoots:row.ecoRoots}
})
const count=field=>Object.fromEntries(['exact','transposition-only','absent'].map(status=>[status,states.filter(row=>row[field]===status).length]))
assert.deepEqual(count('before'),plan.baseline.coverage)
const newPositions=states.filter(row=>row.before==='absent'&&row.projected!=='absent')
assert.deepEqual(newPositions.map(row=>row.id),[course.rootPositionId])
const subtreePrefix=rootMoves.slice(0,7).join(' ')
const subtreeIds=new Set(scope.records.filter(row=>row.moves===subtreePrefix||row.moves.startsWith(subtreePrefix+' ')).map(row=>row.groupId))
const subtree=states.filter(row=>subtreeIds.has(row.id))
assert.equal(subtree.length,22)
const inputHashes={}
for(const file of [planPath,'scripts/verify-opening-zaitsev-design.mjs','docs/data/opening-scope-audit.json',
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js','src/lib/openingPracticalLibrary.js'])
  inputHashes[file]=hash(await fs.readFile(file))
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,
  baseline:{courses:rows,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},
  plannedCourses:1,documentedPlies:10,authoredContinuationPlies:2,generatedPlies:0,engineSearchesExecuted:0,
  source:{...plan.source,exactSourceReferences:sourceRecords.length,longerSequencesInFixedSources:0},
  course:{id:course.id,rootFen:root.fen(),endpointFen:endpoint.fen(),training,sharedPrefixPlies:9},
  exercise:{id:ex.id,before,after,answerFen,immediateQueenCaptures:captures,minimumImmediateMaterialGain:minimum,
    legalImmediateReplies:replies.length,replies,engineStatus:'not-run'},
  counterexamples:{absolutePinBeforeQd7:true,queenTradeAfterNc3:exchange.history(),bishopRetreatWithQueenTrade:retreatCounterexample.history()},
  engineJobs:jobs,
  coverage:{baseline:count('before'),projected:count('projected'),newlyReached:newPositions,newEcoAnchors:0,
    chekhover:{positions:subtree.length,absentBefore:subtree.filter(row=>row.before==='absent').length,
      remainingAbsent:subtree.filter(row=>row.projected==='absent').map(({id,name,ecoRoots})=>({id,name,ecoRoots}))}},
  limitations:['Design only: no published coverage or engine result added.',
    'Two authored plies are not documented by the fixed source corpus and remain subject to the declared engine gate.',
    'Immediate material enumeration is not a full-game proof or uniqueness of all winning moves.',
    'Counterexamples establish legality and equal final material, not a best-play evaluation.',
    'Practice logic was exercised offline; new browser behavior is pending implementation.']}
const output='docs/data/opening-zaitsev-p022-design-verification.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Design report changed')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',baselineCourses:rows.length,
  plannedCourses:1,documentedPlies:10,authoredContinuationPlies:2,legalExerciseReplies:replies.length,
  minimumImmediateMaterialGain:minimum,engineSearchesExecuted:0,plannedPrimaryJobs:jobs.length,
  baselineCoverage:result.coverage.baseline,projectedCoverage:result.coverage.projected,
  remainingChekhover:result.coverage.chekhover.remainingAbsent.length},null,2))
