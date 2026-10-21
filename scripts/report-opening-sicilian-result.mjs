// Current-state verification; keep the P01/P02.1/design snapshots untouched.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import roadmap from '../src/data/openingRoadmapCourses.js'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const scope=await read('docs/data/opening-scope-audit.json'),baseline=await read('docs/data/opening-taxonomy-baseline.json')
const plan=await read('docs/data/opening-sicilian-p022-plan.json'),design=await read('docs/data/opening-sicilian-p022-design-verification.json')
const proof=await read('docs/data/opening-sicilian-p022-practical-verification.json')
for(const [file,sha]of Object.entries({...baseline.hashes,...plan.preserveFiles}))assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile('src/data/openingCatalog.json')),baseline.sourceCatalogSha256)
const originalIds=new Set(scope.courses.map(row=>row.id)),current=new Map(ALL_OPENING_JOURNEYS.map(row=>[row.id,row]))
assert.equal(current.size,282);assert.equal(ALL_OPENING_JOURNEYS.length,282)
for(const original of scope.courses){
  const actual=current.get(original.id);assert(actual)
  assert.equal(actual.title,original.title);assert.equal(actual.family,original.family)
  assert.equal(actual.moves.join(' '),original.moves)
}
const rows=ALL_OPENING_JOURNEYS.filter(row=>originalIds.has(row.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(hash(JSON.stringify(rows)),baseline.courseDigest,'Original course subset changed')
const added=ALL_OPENING_JOURNEYS.filter(row=>!originalIds.has(row.id))
assert.deepEqual(added.map(row=>row.id),plan.courses.map(row=>row.id))
assert.equal(ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian').length,21)
assert.deepEqual(new Set(practical.entries.map(row=>row.courseId)),new Set(current.keys()))
assert.equal(practical.entries.length,282);assert.equal(new Set(practical.entries.map(row=>row.id)).size,282)
const positions=new Set(),orders=new Set(),key=board=>board.fen().split(' ').slice(0,4).join(' ')
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
const subtrees=design.subtrees.map(row=>({courseId:row.courseId,positions:row.positionGroups,
  remainingAbsent:row.remainingAbsent.filter(position=>stateById.get(position.id)==='absent')}))
assert.equal(subtrees.reduce((n,row)=>n+row.remainingAbsent.length,0),158)
const inputHashes={}
for(const file of ['docs/data/opening-sicilian-p022-plan.json','docs/data/opening-sicilian-p022-design-verification.json',
  'src/data/openingRoadmapCourses.js','src/data/openingRoadmapPracticalCases.js','src/lib/openingPracticalLibrary.js',
  'src/lib/openingJourneys.js','src/components/OpeningLibrary.jsx','src/components/OpeningCourses.jsx',
  'scripts/report-opening-sicilian-result.mjs','docs/data/opening-sicilian-p022-practical-verification.json'])inputHashes[file]=hash(await fs.readFile(file))
const result={schema:1,lot:plan.lot,status:'implemented-offline-verified',inputHashes,
  preservedOriginalCourses:rows.length,courseCount:282,sicilianCourseCount:21,practicalCases:practical.entries.length,
  added:added.map(row=>({id:row.id,plies:row.moves.length,provenance:row.provenance})),
  documentedPlies:roadmap.entries.reduce((n,row)=>n+row.moves.length,0),
  newPairNotes:roadmap.entries.reduce((n,row)=>n+Object.keys(row.editorialNotes).length,0),
  scope:{positions:scope.positions.length,coverage,newlyReached:design.coverage.newlyReached.map(row=>row.id),
    newEcoAnchors:design.coverage.newEcoAnchors.length,subtrees},
  engine:{goCommands:proof.goCommands,nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
    signature:proof.engineSignature,cpChanges:proof.evidence.map(row=>({id:row.id,cp:row.search.cp+row.baseline.cp}))},
  checks:{originalSubsetDigest:'PASS',protectedHashes:'PASS',sourceCatalogBytes:'PASS',courseIdentity:'PASS',
    legalSanAndPositions:'PASS',everyCourseHasExercise:'PASS',projectedCoverageMatchesActual:'PASS'},
  limitations:['Coverage is position reach, not full editorial review or all move orders completed.',
    'Engine and material checks are bounded; no proof of the entire game.',
    'Application tests, build and browser outcomes are recorded separately in the human-readable results report.']}
const file='docs/data/opening-sicilian-p022-result.json',text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(file,'utf8'),text,'Current report differs')
else await fs.writeFile(file,text)
console.log(JSON.stringify({mode:check?'check':'write',courses:282,exercises:282,preservedCourses:280,coverage,
  newPositions:result.scope.newlyReached.length,newEcoAnchors:result.scope.newEcoAnchors,
  engine:result.engine,checks:result.checks},null,2))
