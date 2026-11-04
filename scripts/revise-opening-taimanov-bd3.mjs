// Explicit SIC-08 R1 review. Preserves the original plan, tooling and engine ledger.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {json,hashes,fileHash,write,encode,replay,exerciseEvidence,engineJobs,coverageIndex} from './openings/common.mjs'
import {analyzePlan} from './openings/planning.mjs'
import {verifyReusedJob} from './openings/artifacts.mjs'

const original='docs/data/opening-taimanov-bd3-p022',stem=original+'-r1'
const oldPlan=await json(original+'-plan.json'),oldDesign=await json(original+'-design-verification.json')
const reviewed=await json(stem+'-course-design.json')
assert.equal(reviewed.status,'reviewed-revision-candidates-not-engine-verified')
const plan=structuredClone(oldPlan)
plan.lot='P02.2-SIC-08-R1';plan.status='reviewed-revision-not-installed';plan.revisionOf=original+'-plan.json'
plan.revisionReason='After ...h5, immediate Nxc6 and ...dxc6 exceeded the unchanged loss limit. The reviewed continuation plays h3 against ...Ng4, followed by the central and bishop exchanges. The exercise is relocated to the documented source endpoint.'
const revised=reviewed.courses.find(c=>c.suffix==='nf6-h5'),index=plan.courses.findIndex(c=>c.id.endsWith(':taimanov-bd3-nf6-h5'))
assert(revised&&index>=0)
for(const c of reviewed.courses){if(c.suffix==='nf6-h5')continue;const before=oldPlan.courses.find(p=>p.id==='sicilian:taimanov-bd3-'+c.suffix);assert.deepEqual(c.moves,before.moves);assert.deepEqual(c.exercise, before.exercise)}
const previous=plan.courses[index],authoredMoves=revised.moves.slice(revised.documentedPlies).map((san,i)=>{const m=replay(revised.moves.slice(0,revised.documentedPlies+i)).move(san);return {index:revised.documentedPlies+i,san,uci:m.from+m.to+(m.promotion??'')}})
plan.courses[index]={...previous,...revised,id:previous.id,family:previous.family,provenance:{...previous.provenance,authoredContinuationPlies:authoredMoves.length},authoredMoves,exercise:{...revised.exercise,id:previous.exercise.id}}
const preserve=[...Object.keys(oldPlan.preserveFiles),original+'-plan.json',original+'-design-verification.json',original+'-course-design.json',original+'-gate-review.json','scripts/design-opening-taimanov-bd3.mjs']
async function files(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){assert(!e.isSymbolicLink());const p=dir+'/'+e.name;if(e.isDirectory())await files(p);else preserve.push(p)}}
await files(oldPlan.plannedFiles.engineDirectory)
plan.preserveFiles=await hashes(preserve)
plan.plannedFiles.engineDirectory=stem+'-engine';plan.plannedFiles.practicalVerification=stem+'-practical-verification.json';plan.plannedFiles.result=stem+'-result.json';plan.plannedFiles.resultDocument='docs/OPENING-TAIMANOV-BD3-P022-R1-RESULTS.md'
const scope=await json('docs/data/opening-scope-audit.json')
plan.expectedCoverage=coverageIndex([...oldDesign.baseline.courses,...plan.courses],scope).coverage
const exercises=plan.courses.map(c=>exerciseEvidence(c,2)),jobs=engineJobs(plan,exercises)
const directory=oldPlan.plannedFiles.engineDirectory,manifest=await json(directory+'/manifest.json'),manifestSha256=await fileHash(directory+'/manifest.json')
plan.enginePlan.primaryJobs=jobs.length
plan.reuseEngineJobs=[]
for(const job of jobs){const i=manifest.jobs.findIndex(old=>old.fen===job.fen&&JSON.stringify(old.roots)===JSON.stringify(job.roots));if(i<0)continue
 const reference={jobId:job.id,directory,jobIndex:i+1,manifestSha256};await verifyReusedJob(reference,job,plan.enginePlan);plan.reuseEngineJobs.push(reference)}
plan.enginePlan.maximumGoCommands=(jobs.length-plan.reuseEngineJobs.length)*2
plan.enginePlan.maximumRequestedNodes=plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo
assert.equal(jobs.length,42);assert.equal(plan.reuseEngineJobs.length,30)
plan.revisionBudget={previousGoCommands:34,newPrimaryJobs:12,reusedJobs:30,maximumNewGoCommands:24,combinedMaximumGoCommands:58,combinedMaximumRequestedNodes:11600000,originalMaximumGoCommands:68,thresholdsUnchanged:true,policy:'Single reviewed revision. No repeated compatible searches, candidate sweep, automatic retry, threshold or original aggregate budget increase.'}
assert(plan.revisionBudget.combinedMaximumGoCommands<=oldPlan.enginePlan.maximumGoCommands)
const analysis=analyzePlan(plan,oldDesign.baseline.courses,scope)
const facts=reviewed.geometryFacts.map(f=>{const c=plan.courses.find(c=>c.id==='sicilian:taimanov-bd3-'+f.suffix);assert(c);assert.equal(replay(c.moves.slice(0,f.index)).fen(),f.fen);return {...f,courseId:c.id}})
const check=process.argv.includes('--check'),planPath=stem+'-plan.json',designPath=stem+'-design-verification.json'
async function output(file,value){if(check)assert.equal(await fs.readFile(file,'utf8'),encode(value),file);else await write(file,value)}
await output(planPath,plan)
const design={...analysis,status:'revised-design-verified-not-published',inputHashes:await hashes([planPath,'scripts/revise-opening-taimanov-bd3.mjs',stem+'-course-design.json','scripts/openings/common.mjs','scripts/openings/planning.mjs','src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js']),
 baseline:oldDesign.baseline,preservedFiles:Object.keys(plan.preserveFiles).length,geometryFacts:facts,navigation:{...analysis.navigation,forks:analysis.navigation.transitions,uncoveredAlternative:plan.navigation.uncoveredAlternative,browserPlan:oldDesign.navigation.browserPlan},
 sourceSubtree:oldDesign.sourceSubtree,revisionBudget:plan.revisionBudget,originalDesign:original+'-design-verification.json',reviewSource:stem+'-course-design.json',limits:'Frozen original failed design and ledger preserved. All seventeen authored comparisons and seven exercises still require acceptance; browser and application QA pending.'}
await output(designPath,design)
console.log(encode({status:'PASS',plan:planPath,design:designPath,...analysis.summary,geometryFacts:facts.length,preservedFiles:Object.keys(plan.preserveFiles).length,revisionBudget:plan.revisionBudget,projectedCoverage:plan.expectedCoverage}))
