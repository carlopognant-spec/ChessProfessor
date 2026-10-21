// Verify current coverage while preserving all pre-Zaitsev snapshots.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import additions from '../src/data/openingZaitsevCourses.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=v=>createHash('sha256').update(v).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const plan=await read('docs/data/opening-zaitsev-p022-plan.json')
const design=await read('docs/data/opening-zaitsev-p022-design-verification.json')
const scope=await read('docs/data/opening-scope-audit.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
const proof=await read('docs/data/opening-zaitsev-p022-practical-verification.json')
for(const [file,sha]of Object.entries({...original.hashes,...plan.preserveFiles}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile('docs/data/opening-zaitsev-p022-plan.json')),design.inputHashes['docs/data/opening-zaitsev-p022-plan.json'])
const current=new Map(ALL_OPENING_JOURNEYS.map(row=>[row.id,row]))
assert.equal(current.size,283);assert.equal(ALL_OPENING_JOURNEYS.length,283)
const baselineIds=new Set(design.baseline.courses.map(row=>row.id))
const preserved=ALL_OPENING_JOURNEYS.filter(row=>baselineIds.has(row.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
assert.deepEqual(preserved,design.baseline.courses)
assert.equal(hash(JSON.stringify(preserved)),plan.baseline.courseDigest)
const priorPractical=practical.entries.filter(row=>baselineIds.has(row.courseId))
assert.equal(priorPractical.length,282)
assert.equal(hash(JSON.stringify(priorPractical)),plan.baseline.practicalDigest)
assert.equal(practical.entries.length,283)
assert.deepEqual(new Set(practical.entries.map(row=>row.courseId)),new Set(current.keys()))
assert.equal(new Set(practical.entries.map(row=>row.id)).size,283)
const added=ALL_OPENING_JOURNEYS.filter(row=>!baselineIds.has(row.id))
assert.deepEqual(added,additions.entries)
assert.equal(added.length,1);assert.equal(added[0].id,plan.course.id)
assert.deepEqual(added[0].moves,plan.course.moves)
assert.equal(added[0].provenance.documentedPlies,10)
assert.equal(added[0].provenance.authoredContinuationPlies,2)
assert.equal(ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian').length,22)
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
const remaining=design.coverage.chekhover.remainingAbsent.filter(row=>stateById.get(row.id)==='absent')
assert.equal(remaining.length,12)
const inputHashes={}
for(const file of ['docs/data/opening-zaitsev-p022-plan.json','docs/data/opening-zaitsev-p022-design-verification.json',
  'docs/data/opening-zaitsev-p022-practical-verification.json','docs/data/opening-zaitsev-p022-editorial.json','scripts/build-opening-zaitsev-content.mjs',
  'scripts/report-opening-zaitsev-result.mjs','src/data/openingZaitsevCourses.js','src/data/openingZaitsevPracticalCases.js',
  'src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js','src/components/OpeningLibrary.jsx'])
  inputHashes[file]=hash(await fs.readFile(file))
const result={schema:1,lot:plan.lot,status:'implemented-offline-verified',inputHashes,
  preservedBaselineCourses:282,preservedBaselineExercises:282,courseCount:283,sicilianCourseCount:22,practicalCases:283,
  added:added.map(row=>({id:row.id,plies:row.moves.length,provenance:row.provenance})),
  documentedPlies:10,authoredContinuationPlies:2,generatedPlies:0,newPairNotes:2,
  scope:{positions:scope.positions.length,coverage,newlyReached:design.coverage.newlyReached.map(row=>row.id),
    newEcoAnchors:0,chekhover:{positions:22,remainingAbsent:remaining}},
  engine:{signature:proof.engineSignature,goCommands:proof.goCommands,nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
    continuation:proof.continuationChecks.map(row=>({san:row.san,signedCpDifference:row.signedCpDifference,acceptanceLoss:row.acceptanceLoss})),
    exerciseCpChange:proof.evidence[0].cpChange,legalImmediateReplies:proof.evidence[0].legalImmediateReplies,
    minimumImmediateMaterialGain:proof.evidence[0].minimumImmediateMaterialGain},
  checks:{baselineCourses:'PASS',baselineExercises:'PASS',protectedAndFrozenHashes:'PASS',legalSan:'PASS',
    courseExerciseCorrespondence:'PASS',projectedCoverageMatchesActual:'PASS'},
  limitations:['Coverage measures reached source positions, not complete theory or editorial review.',
    'Engine comparisons are finite-budget controls; the authored pair is not attributed to the source catalog.',
    'A negative signed difference between independent searches is not proof that a restricted move is objectively superior.',
    'Browser, build and full test outcomes are recorded separately in the results document.']}
const file=plan.plannedFiles.currentReport,text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(file,'utf8'),text,'Current report differs')
else await fs.writeFile(file,text)
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',courses:283,exercises:283,
  preservedCourses:282,preservedExercises:282,coverage,remainingChekhover:remaining.length,engine:result.engine},null,2))
