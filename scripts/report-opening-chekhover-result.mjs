// Current coverage report; all earlier snapshots remain byte-identical.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,openingWrittenContext} from '../src/lib/openingJourneys.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import additions from '../src/data/openingChekhoverCourses.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=v=>createHash('sha256').update(v).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planFile='docs/data/opening-chekhover-p022-plan.json',plan=await read(planFile)
const designFile='docs/data/opening-chekhover-p022-design-verification.json',design=await read(designFile)
const scope=await read('docs/data/opening-scope-audit.json'),original=await read('docs/data/opening-taxonomy-baseline.json')
const proof=await read(plan.plannedFiles.practicalVerification)
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles}))assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile(planFile)),design.inputHashes[planFile])
const current=new Map(ALL_OPENING_JOURNEYS.map(row=>[row.id,row]))
assert.equal(current.size,286);assert.equal(ALL_OPENING_JOURNEYS.length,286)
const baselineIds=new Set(design.baseline.courses.map(row=>row.id))
const preserved=ALL_OPENING_JOURNEYS.filter(row=>baselineIds.has(row.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
assert.deepEqual(preserved,design.baseline.courses);assert.equal(hash(JSON.stringify(preserved)),plan.baseline.courseDigest)
const priorPractical=practical.entries.filter(row=>baselineIds.has(row.courseId))
assert.equal(priorPractical.length,283);assert.equal(hash(JSON.stringify(priorPractical)),plan.baseline.practicalDigest)
assert.equal(practical.entries.length,286);assert.equal(new Set(practical.entries.map(row=>row.id)).size,286)
assert.deepEqual(new Set(practical.entries.map(row=>row.courseId)),new Set(current.keys()))
const added=ALL_OPENING_JOURNEYS.filter(row=>!baselineIds.has(row.id))
assert.deepEqual(added,additions.entries);assert.equal(added.length,3)
for(const [index,course] of added.entries()){
  assert.deepEqual(course.moves,plan.courses[index].moves)
  assert.equal(course.provenance.documentedPlies,plan.courses[index].provenance.documentedPlies)
  assert.equal(course.provenance.authoredContinuationPlies,plan.courses[index].provenance.authoredContinuationPlies)
}
assert.equal(ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian').length,25)
const positions=new Set(),orders=new Set(),key=b=>b.fen().split(' ').slice(0,4).join(' ')
for(const course of ALL_OPENING_JOURNEYS){const b=new Chess(),prefix=[]
  for(const san of course.moves){assert.equal(b.move(san).san,san);prefix.push(san);positions.add(key(b));orders.add(prefix.join(' '))}
}
const records=new Map(scope.records.map(row=>[row.id,row])),coverage={exact:0,'transposition-only':0,absent:0},states=[]
for(const row of scope.positions){
  const state=row.recordIds.some(id=>orders.has(records.get(id).moves))?'exact':positions.has(row.position)?'transposition-only':'absent'
  coverage[state]++;states.push({id:row.id,state})
}
assert.deepEqual(coverage,design.coverage.projected)
const stateById=new Map(states.map(row=>[row.id,row.state]))
for(const row of design.coverage.newlyReached)assert.equal(stateById.get(row.id),'exact')
const subtreePrefix=added[0].moves.slice(0,7).join(' ')
const subtreeIds=new Set(scope.records.filter(r=>r.moves===subtreePrefix||r.moves.startsWith(subtreePrefix+' ')).map(r=>r.groupId))
const remaining=scope.positions.filter(p=>subtreeIds.has(p.id)&&stateById.get(p.id)==='absent').map(({id,name,ecoRoots})=>({id,name,ecoRoots}))
assert.deepEqual(remaining,design.coverage.chekhover.remainingAbsent);assert.equal(remaining.length,8)
const commentary={explainedHalfMoves:0,pairs:0,writtenPairs:0,fullyWrittenCourses:0}
for(const c of ALL_OPENING_JOURNEYS){let written=0;const pairs=Math.ceil(c.moves.length/2)
  for(let i=0;i<c.moves.length;i+=2)if(openingWrittenContext(c,i).debriefOrigin==='written')written++
  commentary.explainedHalfMoves+=c.moves.length;commentary.pairs+=pairs;commentary.writtenPairs+=written
  if(written===pairs)commentary.fullyWrittenCourses++
}
const inputHashes={}
for(const file of [planFile,designFile,plan.plannedFiles.practicalVerification,plan.plannedFiles.collector,
  plan.plannedFiles.builder,plan.plannedFiles.reporter,plan.plannedFiles.courseModule,plan.plannedFiles.practicalModule,
  'src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingPracticalLibrary.js','src/components/OpeningLibrary.jsx'])
  inputHashes[file]=hash(await fs.readFile(file))
const result={schema:1,lot:plan.lot,status:'implemented-offline-verified',inputHashes,
  preservedBaselineCourses:283,preservedBaselineExercises:283,courseCount:286,sicilianCourseCount:25,practicalCases:286,
  added:added.map(c=>({id:c.id,plies:c.moves.length,provenance:c.provenance})),
  documentedPlies:56,authoredContinuationPlies:2,generatedPlies:0,newPairNotes:4,commentary,
  scope:{positions:scope.positions.length,coverage,newlyReached:design.coverage.newlyReached.map(r=>r.id),newEcoAnchors:0,
    chekhover:{positions:22,remainingAbsent:remaining}},
  engine:{signature:proof.engineSignature,goCommands:proof.goCommands,nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
    continuation:proof.continuationChecks.map(c=>({courseId:c.courseId,san:c.san,signedCpDifference:c.signedCpDifference,acceptanceLoss:c.acceptanceLoss})),
    exercises:proof.evidence.map(e=>({id:e.id,cpChange:e.cpChange,legalImmediateReplies:e.legalImmediateReplies,minimumImmediateMaterialGain:e.minimumImmediateMaterialGain}))},
  checks:{baselineCourses:'PASS',baselineExercises:'PASS',protectedAndFrozenHashes:'PASS',legalSan:'PASS',
    courseExerciseCorrespondence:'PASS',projectedCoverageMatchesActual:'PASS'},
  limitations:['Reached source positions do not establish complete theory, full commentary or learned skill.',
    'Native Stockfish 16 finite-budget controls are not browser Stockfish 19 evidence or full-game proofs.',
    'Authored continuations are separate from the documented source sequences.',
    'Browser, build and full-test outcomes are recorded in the results document.']}
const text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(plan.plannedFiles.result,'utf8'),text,'Current report differs')
else await fs.writeFile(plan.plannedFiles.result,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',courses:286,exercises:286,preservedCourses:283,
  preservedExercises:283,coverage,remainingChekhover:remaining.length,commentary,engine:result.engine},null,2))
