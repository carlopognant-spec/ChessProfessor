// Offline SIC-08 specification: source references, protected baseline and bounded jobs.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {json,hash,hashes,fileHash,encode,write,replay,runtime,coverageIndex,exerciseEvidence,engineJobs} from './openings/common.mjs'
import {analyzePlan} from './openings/planning.mjs'
import {verifyReusedJob} from './openings/artifacts.mjs'

const stem='docs/data/opening-taimanov-bd3-p022',planPath=stem+'-plan.json',designPath=stem+'-design-verification.json'
const reviewed=await json(stem+'-course-design.json')
assert.equal(reviewed.status,'reviewed-candidates-not-engine-verified')
assert.equal(reviewed.courses.length,7)
const prior=await json('docs/data/opening-taimanov-be2-p022-r1-plan.json')
const scope=await json('docs/data/opening-scope-audit.json'),{courses,practical}=await runtime()
const baseline=courses.map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(baseline.length,302,'Design must precede SIC-08 integration')
const prefix='e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Bd3'
const subtree=scope.records.filter(r=>r.moves===prefix||r.moves.startsWith(prefix+' '))
const orders=[...new Set(subtree.map(r=>r.moves))],leaves=orders.filter(o=>!orders.some(b=>b.startsWith(o+' '))).sort()
const specs=reviewed.courses.map(c=>{
 const documentedPlies=c.documentedPlies,documented=c.moves.slice(0,documentedPlies).join(' ')
 assert(leaves.includes(documented),'Course must terminate at a documented subtree leaf')
 const id='sicilian:taimanov-bd3-'+c.suffix
 const sourceRecords=scope.records.filter(r=>documented===r.moves||documented.startsWith(r.moves+' '))
   .map(r=>({id:r.id,positionId:r.groupId,plies:r.moves.split(' ').length})).sort((a,b)=>a.plies-b.plies||a.id.localeCompare(b.id))
 const authoredMoves=c.moves.slice(documentedPlies).map((san,i)=>{const b=replay(c.moves.slice(0,documentedPlies+i)),m=b.move(san);return {index:documentedPlies+i,san,uci:m.from+m.to+(m.promotion??'')}})
 const {suffix,...data}=c
 for(const name of ['contrast','whitePlan','blackPlan','endpointReason','sourceDisclosure'])assert(data[name]?.length)
 return {...data,id,family:'sicilian',sourceRecords,provenance:{kind:'documented-prefix-with-authored-continuation',documentedPlies,authoredContinuationPlies:authoredMoves.length,generatedPlies:0},
   authoredMoves,existingParentCourseId:'sicilian:taimanov-be2-nge7',sharedPrefixPlies:12,relationship:'fork',exercise:{...c.exercise,id:'practice:'+id}}
})
assert.deepEqual(specs.map(c=>c.moves.slice(0,c.provenance.documentedPlies).join(' ')).sort(),leaves)
const preserved=[...Object.keys(prior.preserveFiles),
 'src/data/openingTaimanovBe2Courses.js','src/data/openingTaimanovBe2PracticalCases.js',
 'docs/data/opening-taimanov-be2-p022-r1-plan.json','docs/data/opening-taimanov-be2-p022-r1-design-verification.json',
 'docs/data/opening-taimanov-be2-p022-r1-practical-verification.json','docs/data/opening-taimanov-be2-p022-r1-result.json',
 'docs/data/opening-taimanov-be2-p022-r1-qa.json','docs/OPENING-TAIMANOV-BE2-P022-R1-RESULTS.md']
async function collectFiles(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){assert(!e.isSymbolicLink());const path=dir+'/'+e.name;if(e.isDirectory())await collectFiles(path);else preserved.push(path)}}
for(const dir of ['docs/data/opening-taimanov-be2-p022-engine',prior.plannedFiles.engineDirectory])await collectFiles(dir)
const before=coverageIndex(baseline,scope),after=coverageIndex([...baseline,...specs],scope)
const selectedIds=[...new Set(subtree.map(r=>r.groupId))]
assert.equal(selectedIds.length,14);assert(selectedIds.every(id=>before.states.find(p=>p.id===id).state==='absent'))
assert(selectedIds.every(id=>after.states.find(p=>p.id===id).state==='exact'))
const plan={schema:1,lot:'P02.2-SIC-08',designedOn:'2026-10-28',status:'reviewed-design-not-installed',
 sourceSubtreePrefixes:[prefix],candidateRoot:'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3',courses:specs,
 baseline:{courseCount:302,courseDigest:hash(JSON.stringify(baseline)),practicalCount:302,practicalDigest:hash(JSON.stringify(practical.entries)),coverage:before.coverage},
 expectedCoverage:after.coverage,preserveFiles:await hashes(preserved),source:prior.source,
 enginePlan:{...prior.enginePlan,publicationPolicy:'Publish all seven routes and seven exercises together only after every authored comparison and exercise passes. Preserve failed evidence and explicitly review any failure; no candidate sweep, threshold change, retry or budget increase.'},
 plannedFiles:{courseModule:'src/data/openingTaimanovBd3Courses.js',practicalModule:'src/data/openingTaimanovBd3PracticalCases.js',engineDirectory:stem+'-engine',practicalVerification:stem+'-practical-verification.json',result:stem+'-result.json',resultDocument:'docs/OPENING-TAIMANOV-BD3-P022-RESULTS.md'},
 navigation:{existingParentCourseId:'sicilian:taimanov-be2-nge7',rootIndex:12,rootMoves:['Be2','Bd3'],newRepresentative:specs[0].id,
 uncoveredAlternative:{courseId:specs[0].id,index:12,san:'Qd2',status:'legal-source-backed-uncovered-not-error'},preserveContainedRouteGuard:true},
 nextDesign:{status:'remaining corpus A branches retained',scope:'Taimanov with Be3/a6/a3, f4, Qd2 and early ...Nf6; other Taimanov branches and the previously deferred Sicilian Bc4/Bd3/f3 orders remain in scope.'}}
const exercises=specs.map(c=>exerciseEvidence(c,2)),jobs=engineJobs(plan,exercises)
plan.enginePlan.primaryJobs=jobs.length
// Reuse only exact complete search inputs from existing registered immutable ledgers.
const registry=await json('docs/data/opening-pipeline/lots.json'),sources=[]
for(const config of Object.values(registry.lots)){const p=await json(config.plan);if(sources.some(s=>s.directory===p.plannedFiles.engineDirectory))continue
 const directory=p.plannedFiles.engineDirectory;try{const manifest=await json(directory+'/manifest.json');sources.push({directory,manifest,manifestSha256:await fileHash(directory+'/manifest.json')})}catch(e){if(e.code!=='ENOENT')throw e}}
const reused=[]
for(const job of jobs)for(const source of sources){const index=source.manifest.jobs.findIndex(j=>j.fen===job.fen&&JSON.stringify(j.roots)===JSON.stringify(job.roots));if(index<0)continue
 const reference={jobId:job.id,directory:source.directory,jobIndex:index+1,manifestSha256:source.manifestSha256}
 await verifyReusedJob(reference,job,{...plan.enginePlan,primaryJobs:jobs.length});reused.push(reference);break}
if(reused.length)plan.reuseEngineJobs=reused
plan.enginePlan.maximumGoCommands=(jobs.length-reused.length)*2
plan.enginePlan.maximumRequestedNodes=plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo
const analysis=analyzePlan(plan,baseline,scope)
const facts=(reviewed.geometryFacts??[]).map(f=>{
 const c=specs.find(c=>c.id==='sicilian:taimanov-bd3-'+f.suffix);assert(c);assert.equal(replay(c.moves.slice(0,f.index)).fen(),f.fen)
 return {...f,courseId:c.id}
})
assert(facts.length>=7,'Review position-specific geometry for every route')
const browserPlan={newCourseCases:14,newExerciseCases:7,liveForkCases:analysis.navigation.browserPairs.length*2,checkpointCases:analysis.navigation.browserPairs.length*4,uncoveredCases:1,existingRegressionCases:8}
browserPlan.newCases=browserPlan.newCourseCases+browserPlan.newExerciseCases+browserPlan.liveForkCases+browserPlan.checkpointCases+1
browserPlan.selectedCases=browserPlan.newCases+8;browserPlan.allAvailableAfterIntegration=223+browserPlan.newCases
const check=process.argv.includes('--check')
async function output(file,value){if(check)assert.equal(await fs.readFile(file,'utf8'),encode(value),file);else await write(file,value)}
await output(planPath,plan)
const design={...analysis,status:'design-verified-not-published',inputHashes:await hashes([planPath,'scripts/design-opening-taimanov-bd3.mjs',stem+'-course-design.json','scripts/openings/common.mjs','scripts/openings/planning.mjs','src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js']),
 baseline:{courses:baseline,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},preservedFiles:preserved.length,geometryFacts:facts,
 navigation:{...analysis.navigation,forks:analysis.navigation.transitions,uncoveredAlternative:plan.navigation.uncoveredAlternative,browserPlan},
 sourceSubtree:{records:subtree.map(r=>r.id),positionIds:selectedIds,allProjectedExact:true},reviewSource:stem+'-course-design.json',limits:'Finite catalog subtree coverage. Authored continuations and constructed exercises still require the frozen engine gates and application QA.'}
await output(designPath,design)
console.log(encode({status:'PASS',plan:planPath,design:designPath,...analysis.summary,preservedFiles:Object.keys(plan.preserveFiles).length,reusedJobs:reused.length,maximumGoCommands:plan.enginePlan.maximumGoCommands,browserPlan,projectedCoverage:plan.expectedCoverage}))
