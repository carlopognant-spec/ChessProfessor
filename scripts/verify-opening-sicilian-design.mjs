// Offline design evidence only. Never starts an engine or writes production data.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check')
const hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planPath='docs/data/opening-sicilian-p022-plan.json'
const plan=await read(planPath),scope=await read('docs/data/opening-scope-audit.json')
const baseline=await read('docs/data/opening-taxonomy-baseline.json')
const raw=await fs.readFile('src/data/openingCatalog.json'),catalog=JSON.parse(raw)
assert.equal(hash(raw),plan.sourceCatalogSha256)
for(const [file,sha]of Object.entries({...baseline.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
const courseRows=ALL_OPENING_JOURNEYS.map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(hash(JSON.stringify(courseRows)),baseline.courseDigest,'Design baseline changed; do not silently refresh')
const sourceManifest=await read('docs/data/opening-audit-sources/manifest.json')
for(const file of sourceManifest.files)
  assert.equal(hash(await fs.readFile(`docs/data/opening-audit-sources/${file.name}`)),file.sha256)
const key=board=>board.fen().split(' ').slice(0,4).join(' ')
const parse=pgn=>{const board=new Chess();board.loadPgn(pgn);return board.history()}
const replay=moves=>{const board=new Chess();for(const san of moves)assert.equal(board.move(san).san,san);return board}
const value={p:1,n:3,b:3,r:5,q:9,k:0}
const material=(board,side)=>board.board().flat().filter(Boolean)
  .reduce((sum,piece)=>sum+(piece.color===side?1:-1)*value[piece.type],0)
const beforePositions=new Set(),beforeOrders=new Set()
function addRoute(moves,positions,orders){
  const board=new Chess(),prefix=[]
  for(const san of moves){board.move(san);prefix.push(san);positions.add(key(board));orders.add(prefix.join(' '))}
}
for(const course of ALL_OPENING_JOURNEYS)addRoute(course.moves,beforePositions,beforeOrders)
const afterPositions=new Set(beforePositions),afterOrders=new Set(beforeOrders),courses=[],jobs=[]
const positionById=new Map(scope.positions.map(row=>[row.id,row]))
const planned=plan.courses.map(row=>({...row,moves:parse(row.sourcePgn)}))
assert.equal(new Set(planned.map(row=>row.id)).size,planned.length)
for(const course of planned){
  assert(!ALL_OPENING_JOURNEYS.some(row=>row.id===course.id))
  const source=catalog.entries.find(row=>row.id===course.sourceId)
  assert(source)
  assert.deepEqual(course.moves,source.moves)
  assert.equal(course.moves.length,course.sourcePlies)
  assert.equal(course.modelContinuationPlies,0)
  const endpoint=replay(course.moves)
  assert(!endpoint.isGameOver())
  const root=parse(course.rootPgn),rootPosition=positionById.get(course.rootPositionId)
  assert.equal(key(replay(root)),rootPosition.position)
  assert(!beforePositions.has(rootPosition.position),'Root is already covered')
  assert.deepEqual(course.moves.slice(0,root.length),root)
  assert.equal(root.length,course.characteristicPly)
  const parent=ALL_OPENING_JOURNEYS.find(row=>row.id===course.existingParentCourseId)
  assert.equal(commonPrefix(parent.moves,course.moves),course.sharedPrefixPlies)
  const fork=curriculumFork([...ALL_OPENING_JOURNEYS.filter(row=>row.family===course.family),...planned],course.moves,course.sharedPrefixPlies)
  assert(fork?.children.has(course.moves[course.sharedPrefixPlies]))
  assert(fork.children.has(parent.moves[course.sharedPrefixPlies]))
  const training={}
  for(const side of ['w','b']){
    let index=initialPracticeIndex(course.moves,side),turns=0
    while(index<course.moves.length){
      const result=practiceMove(course.moves,index,side,course.moves[index])
      assert(['correct','complete'].includes(result.status))
      assert(result.index>index)
      index=result.index;turns++
    }
    assert.equal(index,course.moves.length)
    training[side]={turns,endpointReached:true}
  }
  for(const index of Object.keys(course.editorialNotes)){
    assert.equal(Number(index)%2,0)
    assert(Number(index)<course.moves.length)
  }
  addRoute(course.moves,afterPositions,afterOrders)
  const ex=course.exercise,board=replay(course.moves.slice(0,ex.beforeIndex))
  assert.notEqual(board.turn(),ex.exerciseSide)
  assert(ex.beforeIndex>=course.characteristicPly)
  const before=board.fen(),initial=material(board,ex.exerciseSide)
  assert.notEqual(ex.mistake,course.moves[ex.beforeIndex])
  board.move(ex.mistake)
  const after=board.fen()
  assert.equal(board.turn(),ex.exerciseSide)
  const queenCaptures=board.moves({verbose:true}).filter(move=>move.captured==='q').map(move=>move.san)
  assert.deepEqual(queenCaptures,[ex.answer],'Only uniqueness of immediate queen capture is asserted')
  assert.equal(board.move(ex.answer).captured,'q')
  const answerFen=board.fen(),replyRows=[]
  let minimum=material(board,ex.exerciseSide)-initial
  for(const reply of board.moves({verbose:true})){
    board.move(reply)
    assert(!board.isCheckmate())
    const gain=material(board,ex.exerciseSide)-initial
    minimum=Math.min(minimum,gain)
    replyRows.push({san:reply.san,fen:board.fen(),materialGain:gain})
    board.undo()
  }
  assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
  assert.equal(replyRows.length,ex.expectedLegalImmediateReplies)
  assert.equal(practiceMove(board.history(),ex.beforeIndex+1,ex.exerciseSide,ex.answer).status,'complete')
  jobs.push({id:`${ex.id}:baseline`,fen:before,roots:[]},{id:`${ex.id}:deviation`,fen:after,roots:[],expectedAnswer:ex.answer})
  courses.push({id:course.id,sourceId:source.id,sourceName:source.name,sourceEco:source.eco,
    rootPositionId:course.rootPositionId,rootFen:replay(root).fen(),endpointFen:endpoint.fen(),
    documentedPlies:course.moves.length,sharedPrefixPlies:course.sharedPrefixPlies,
    training,exercise:{id:ex.id,before,after,answer:ex.answer,answerFen,
      immediateQueenCaptures:queenCaptures,minimumImmediateMaterialGain:minimum,
      legalImmediateReplies:replyRows.length,replies:replyRows,engineStatus:'not-run'}})
}
assert.equal(jobs.length,plan.enginePlan.primaryJobs)
// Verify the tactical distinction supporting the Chekhover explanation.
const chek=replay(planned.find(row=>row.id==='sicilian:chekhover-bd7').moves.slice(0,9))
assert(!chek.moves().includes('Nxd4'),'Bb5 must prevent the knight capture by pinning to the king')
chek.move('Bd7')
// White to move now: the previous pin has been removed geometrically.
assert.equal(chek.get('d7')?.type,'b')
assert.equal(chek.get('e8')?.type,'k')
const projections=scope.positions.map(position=>{
  const records=position.recordIds.map(id=>scope.records.find(row=>row.id===id))
  const reach=(positions,orders)=>records.some(row=>orders.has(row.moves))?'exact':
    positions.has(position.position)?'transposition-only':'absent'
  return {id:position.id,name:position.name,before:reach(beforePositions,beforeOrders),
    projected:reach(afterPositions,afterOrders),ecoRoots:position.ecoRoots}
})
const count=field=>Object.fromEntries(['exact','transposition-only','absent']
  .map(status=>[status,projections.filter(row=>row[field]===status).length]))
const subtreeRows=planned.map(course=>{
  const prefix=parse(course.rootPgn).join(' ')
  const direct=scope.records.filter(row=>row.moves===prefix||row.moves.startsWith(prefix+' '))
  const ids=new Set(direct.map(row=>row.groupId))
  const allOrders=scope.records.filter(row=>ids.has(row.groupId))
  const rows=projections.filter(row=>ids.has(row.id))
  return {courseId:course.id,rootPositionId:course.rootPositionId,
    directReferences:direct.length,directOrders:new Set(direct.map(row=>row.moves)).size,
    positionGroups:ids.size,allReferencesIncludingOtherOrders:allOrders.length,
    allOrdersIncludingTranspositions:new Set(allOrders.map(row=>row.moves)).size,
    newlyReached:rows.filter(row=>row.before==='absent'&&row.projected!=='absent').map(row=>row.id),
    remainingAbsent:rows.filter(row=>row.projected==='absent').map(row=>({id:row.id,name:row.name,ecoRoots:row.ecoRoots})),
    recordIds:allOrders.map(row=>row.id)}
})
const newlyReached=projections.filter(row=>row.before==='absent'&&row.projected!=='absent')
const inputHashes={}
for(const file of [planPath,'docs/data/opening-scope-audit.json','docs/data/opening-taxonomy-baseline.json',
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js',
  'scripts/verify-opening-sicilian-design.mjs'])inputHashes[file]=hash(await fs.readFile(file))
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,
  baselineCourses:ALL_OPENING_JOURNEYS.length,baselineSicilianCourses:ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian').length,
  plannedCourses:courses.length,plannedDocumentedPlies:courses.reduce((n,row)=>n+row.documentedPlies,0),
  engineSearchesExecuted:0,legalExerciseReplies:courses.reduce((n,row)=>n+row.exercise.legalImmediateReplies,0),
  coverage:{baseline:count('before'),projected:count('projected'),newlyReached,newEcoAnchors:newlyReached.filter(row=>row.ecoRoots.length)},
  courses,subtrees:subtreeRows,engineJobs:jobs,
  limitations:['Projection only: no published course was added.',
    'Position coverage does not imply editorial completeness or coverage of every move order.',
    'Material checks cover one legal opponent reply, not the full game.',
    'The unique immediate queen capture is not a proof of a unique winning move.',
    'Engine validation is pending and may prevent exercise publication.']}
const output='docs/data/opening-sicilian-p022-design-verification.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Design report changed')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',status:result.status,
  courses:courses.length,documentedPlies:result.plannedDocumentedPlies,legalExerciseReplies:result.legalExerciseReplies,
  engineSearchesExecuted:0,baseline:result.coverage.baseline,projected:result.coverage.projected,
  newlyReached:newlyReached.length,newEcoAnchors:result.coverage.newEcoAnchors.length,
  subtrees:subtreeRows.map(({recordIds,newlyReached,remainingAbsent,...row})=>({...row,
    newlyReached:newlyReached.length,remainingAbsent:remainingAbsent.length}))},null,2))
