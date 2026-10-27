// Offline design evidence. Uses the shared pipeline; never starts an engine.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {json,runtime,replay,positionKey,hash,hashes,verifyHashes,exerciseEvidence,engineJobs,coverageIndex,write} from './openings/common.mjs'
import {commonPrefix,curriculumTree,curriculumFork,curriculumReturnIndex,curriculumCheckpoint} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'

assert(process.argv.slice(2).every(a=>a==='--check'))
const check=process.argv.includes('--check'),stem='docs/data/opening-taimanov-be2-p022'
const planPath=stem+'-plan.json',plan=await json(planPath),scope=await json('docs/data/opening-scope-audit.json')
const original=await json('docs/data/opening-taxonomy-baseline.json')
await verifyHashes({...original.hashes,...plan.preserveFiles,[plan.enginePlan.executable]:plan.enginePlan.sha256})
const {courses:live,practical}=await runtime(),ids=new Set(plan.courses.map(c=>c.id))
const baseline=live.filter(c=>!ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(baseline.length,plan.baseline.courseCount);assert.equal(hash(JSON.stringify(baseline)),plan.baseline.courseDigest)
assert.equal(hash(JSON.stringify(practical.entries.filter(e=>!ids.has(e.courseId)))),plan.baseline.practicalDigest)
const all=[...baseline,...plan.courses],siblings=all.filter(c=>c.family==='sicilian')
assert.equal(new Set(all.map(c=>c.id)).size,all.length)
const sourceRecords=new Map(scope.records.map(r=>[r.id,r])),positions=new Map(scope.positions.map(p=>[p.id,p]))
const descendants=scope.records.filter(r=>plan.sourceSubtreePrefixes.some(p=>r.moves===p||r.moves.startsWith(p+' ')))
const orders=[...new Set(descendants.map(r=>r.moves))],leaves=orders.filter(a=>!orders.some(b=>b.startsWith(a+' ')))
assert.deepEqual(plan.courses.map(c=>c.moves.slice(0,c.provenance.documentedPlies).join(' ')).sort(),leaves.sort())
assert.equal(leaves.length,9)
function training(course,side,start){
 let i=start,turns=0
 if(i<course.moves.length&&replay(course.moves.slice(0,i)).turn()!==side)i++
 while(i<course.moves.length){const r=practiceMove(course.moves,i,side,course.moves[i]);assert(['correct','complete'].includes(r.status));assert(r.index>i);i=r.index;turns++}
 assert.equal(i,course.moves.length);assert(turns>0)
 return {start,learnerTurns:turns,endpointReached:true}
}
const exercises=[],courseEvidence=[]
for(const c of plan.courses){
 const p=c.provenance;assert.equal(c.moves.length,p.documentedPlies+p.authoredContinuationPlies);assert.equal(p.generatedPlies,0)
 assert(!replay(c.moves).isGameOver());assert.equal(c.sourceRecords.at(-1).plies,p.documentedPlies)
 for(const ref of c.sourceRecords){const r=sourceRecords.get(ref.id),b=replay(c.moves.slice(0,ref.plies));assert.equal(r.moves,b.history().join(' '));assert.equal(r.groupId,ref.positionId);assert.equal(positionKey(b),positions.get(ref.positionId).position)}
 assert.equal(commonPrefix(c.moves,baseline.find(r=>r.id===c.existingParentCourseId).moves),8)
 assert.deepEqual(Object.keys(c.editorialNotes).map(Number),Array.from({length:(c.moves.length-8)/2},(_,i)=>8+2*i))
 for(const f of ['title','contrast','whitePlan','blackPlan','endpointReason','sourceDisclosure'])assert(c[f]?.length)
 const ex=exerciseEvidence(c,plan.enginePlan.minimumImmediateMaterial);exercises.push(ex)
 assert.equal(practiceMove(ex.moves,c.exercise.beforeIndex+1,c.exercise.exerciseSide,c.exercise.answer).status,'complete')
 courseEvidence.push({id:c.id,endpointFen:replay(c.moves).fen(),fullTraining:Object.fromEntries(['w','b'].map(s=>[s,training(c,s,initialPracticeIndex(c.moves,s))])),sourceRecords:c.sourceRecords})
}
const jobs=engineJobs(plan,exercises)
assert.equal(jobs.length,37);assert.equal(jobs.length,plan.enginePlan.primaryJobs)
assert.equal(new Set(jobs.map(j=>JSON.stringify([j.fen,j.roots]))).size,jobs.length,'Unexpected repeated search: review sharing before collecting')
assert.equal(plan.enginePlan.maximumGoCommands,jobs.length*2)
assert.equal(plan.enginePlan.maximumRequestedNodes,jobs.length*2*plan.enginePlan.nodesPerGo)
const routes=[baseline.find(c=>c.id==='sicilian:taimanov'),...plan.courses],transitions=[]
for(const from of routes)for(const to of routes){
 if(from===to)continue
 const index=commonPrefix(from.moves,to.moves),turn=replay(to.moves.slice(0,index)).turn()
 const fork=curriculumFork(siblings,to.moves,index);assert(fork?.children.has(from.moves[index]));assert(fork.children.has(to.moves[index]))
 assert.equal(curriculumReturnIndex(siblings,[from.id],to),index)
 assert.deepEqual(curriculumCheckpoint(siblings,to,index),{index,reason:'fork'})
 assert.equal(practiceMove(from.moves,index,turn,to.moves[index]).status,'different-line')
 const followed=practiceMove(to.moves,index,turn,to.moves[index]);assert(['correct','complete'].includes(followed.status))
 transitions.push({from:from.id,to:to.id,index,turn,afterFollow:followed.index,training:Object.fromEntries(['w','b'].map(s=>[s,training(to,s,index)]))})
}
assert.equal(transitions.length,90)
// A spanning set per real fork covers every branch without a quadratic browser matrix.
const browserPairs=[]
function visit(node){
 const children=[...node.children.values()]
 if(children.length>1)for(const target of children.slice(1))browserPairs.push({from:children[0].courses[0].id,to:target.courses[0].id,index:node.prefix.length,turn:replay(node.prefix).turn()})
 for(const child of children)visit(child)
}
visit(curriculumTree(routes));assert.equal(browserPairs.length,9)
const u=plan.navigation.uncoveredAlternative,uc=plan.courses.find(c=>c.id===u.courseId)
assert.equal(practiceMove(uc.moves,u.index,replay(uc.moves.slice(0,u.index)).turn(),u.san).status,'different-line')
assert(!siblings.some(c=>commonPrefix(uc.moves,c.moves)>=u.index&&c.moves[u.index]===u.san))
const facts=[]
function fact(course,index,label,test){const b=replay(course.moves.slice(0,index));assert(test(b),label);facts.push({courseId:course.id,index,label,fen:b.fen()})}
const [nge7,b5,a3b5,cb5,cbe7,a3be7,exchange,na4,nb6]=plan.courses
fact(nge7,10,'Qc7 blocked on c-file by Nc6',b=>b.get('c7')?.type==='q'&&b.get('c6')?.type==='n'&&!b.attackers('c2','b').includes('c7'))
fact(nge7,12,'Be3 defends Nd4; a6 controls b5; d7 unmoved',b=>b.attackers('d4','w').includes('e3')&&b.attackers('b5','b').includes('a6')&&b.get('d7')?.type==='p')
fact(nge7,14,'Ng8-e7 blocks Bf8; Nge7 does not attack e4',b=>b.get('e7')?.type==='n'&&b.get('f8')?.type==='b'&&!b.attackers('e4','b').includes('e7'))
fact(nge7,16,'Ng6 controls e5/f4 and frees e7; White castled',b=>b.get('g1')?.type==='k'&&!b.get('e7')&&b.attackers('e5','b').includes('g6')&&b.attackers('f4','b').includes('g6')&&b.attackers('e4','w').includes('c3'))
fact(b5,16,'Qxc6 recaptures, b5 and d7 preserved',b=>b.get('c6')?.type==='q'&&b.get('b5')?.type==='p'&&b.get('d7')?.type==='p')
for(const c of [a3b5,cb5,cbe7,a3be7,exchange,na4,nb6])fact(c,14,'Nf6 attacks e4, Nc3 defends e4',b=>b.attackers('e4','b').includes('f6')&&b.attackers('e4','w').includes('c3'))
fact(a3b5,16,'a3 controls b4 not b5; both kings central',b=>b.attackers('b4','w').includes('a3')&&!b.attackers('b5','w').includes('a3')&&b.get('e1')?.type==='k'&&b.get('e8')?.type==='k')
fact(cb5,16,'White castled; a2 and b5 distinguish order',b=>b.get('g1')?.type==='k'&&b.get('a2')?.type==='p'&&b.get('b5')?.type==='p'&&b.get('f8')?.type==='b')
for(const c of [a3b5,cb5])fact(c,18,'Bb7 diagonal blocked by Nc6; a3 controls b4',b=>b.get('b7')?.type==='b'&&b.get('c6')?.type==='n'&&!b.attackers('e4','b').includes('b7')&&b.attackers('b4','w').includes('a3'))
fact(cbe7,16,'White castled, Black can castle but has not',b=>b.get('g1')?.type==='k'&&b.get('e8')?.type==='k'&&b.get('e7')?.type==='b'&&b.moves().includes('a3'))
assert(replay(cbe7.moves.slice(0,16).concat('a3')).moves().includes('O-O'))
fact(cbe7,18,'f4/d6 contest e5, f4 does not defend e4',b=>b.attackers('e5','w').includes('f4')&&b.attackers('e5','b').includes('d6')&&!b.attackers('e4','w').includes('f4')&&b.get('e8')?.type==='k')
fact(a3be7,18,'Both castled, a3 controls b4, d7 remains',b=>b.get('g1')?.type==='k'&&b.get('g8')?.type==='k'&&b.get('f1')?.type==='r'&&b.get('f8')?.type==='r'&&b.attackers('b4','w').includes('a3')&&b.get('d7')?.type==='p')
for(const c of [exchange,na4,nb6])fact(c,16,'Bb4 attacks c3; Nc3 is not pinned to castled king',b=>b.get('g1')?.type==='k'&&b.attackers('c3','b').includes('b4')&&b.moves().includes('Na4'))
fact(exchange,18,'b-pawn in c6 controls d5, bishop still attacks c3',b=>b.get('c6')?.type==='p'&&!b.get('b7')&&b.attackers('d5','b').includes('c6')&&b.attackers('c3','b').includes('b4'))
fact(na4,18,'Na4 controls b6/c5 but not e4; both kings castled',b=>b.attackers('b6','w').includes('a4')&&b.attackers('c5','w').includes('a4')&&!b.isAttacked('e4','w')&&b.attackers('e4','b').includes('f6')&&b.get('g8')?.type==='k')
fact(na4,20,'Exchange leaves Na4, Bb4, pawn c6 and castled kings',b=>b.get('a4')?.type==='n'&&b.get('b4')?.type==='b'&&b.get('c6')?.type==='p'&&b.get('g1')?.type==='k'&&b.get('g8')?.type==='k')
fact(nb6,21,'Nb6 attacks Ra8/Bc8, not Qc7; Be3 defends Nb6',b=>b.attackers('a8','w').includes('b6')&&b.attackers('c8','w').includes('b6')&&!b.attackers('c7','w').includes('b6')&&b.attackers('b6','w').includes('e3'))
fact(nb6,22,'Rb8 leaves fork and defends Bc8',b=>b.get('b8')?.type==='r'&&!b.attackers('b8','w').includes('b6')&&b.attackers('c8','b').includes('b8'))
const before=coverageIndex(baseline,scope),after=coverageIndex(all,scope),statesBefore=new Map(before.states.map(r=>[r.id,r.state])),statesAfter=new Map(after.states.map(r=>[r.id,r.state]))
assert.deepEqual(before.coverage,plan.baseline.coverage);assert.deepEqual(after.coverage,plan.expectedCoverage)
const newlyReached=after.states.filter(r=>statesBefore.get(r.id)==='absent'&&r.state!=='absent').map(r=>({id:r.id,name:positions.get(r.id).name,before:'absent',projected:r.state,ecoRoots:positions.get(r.id).ecoRoots}))
assert.equal(newlyReached.length,25);assert.equal(newlyReached.filter(r=>r.projected==='exact').length,24)
const selectedPositionIds=[...new Set(descendants.map(r=>r.groupId))].sort()
assert.equal(selectedPositionIds.length,20);assert(selectedPositionIds.every(id=>statesAfter.get(id)==='exact'))
const candidateRecords=scope.records.filter(r=>r.moves===plan.candidateRoot||r.moves.startsWith(plan.candidateRoot+' '))
const candidateIds=[...new Set(candidateRecords.map(r=>r.groupId))].sort()
const residual=candidateIds.filter(id=>statesAfter.get(id)==='absent').map(id=>({id,recordIds:candidateRecords.filter(r=>r.groupId===id).map(r=>r.id)}))
assert.equal(candidateIds.filter(id=>statesBefore.get(id)==='absent').length,122);assert.equal(residual.length,98)
const transpositions=[]
const converged=[a3b5,cb5].map(c=>replay(c.moves))
assert.equal(positionKey(converged[0]),positionKey(converged[1]));assert.notEqual(converged[0].fen(),converged[1].fen())
assert.equal(commonPrefix(a3b5.moves,cb5.moves),14)
const internalConvergence={courseIds:[a3b5.id,cb5.id],indices:[18,18],position:positionKey(converged[0]),fens:converged.map(b=>b.fen()),sameFullFen:false,commonPrefixPlies:14,completionPolicy:'No completion by position; both orders keep their own progress and checkpoint.'}
const index=new Map()
for(const c of baseline){const b=replay([]);for(let i=0;i<c.moves.length;i++){b.move(c.moves[i]);const key=positionKey(b);if(!index.has(key))index.set(key,[]);index.get(key).push({courseId:c.id,index:i+1,fen:b.fen()})}}
for(const c of plan.courses){const b=replay([]);for(let i=0;i<c.moves.length;i++){b.move(c.moves[i]);if(i<8)continue;for(const old of index.get(positionKey(b))??[])transpositions.push({courseId:c.id,index:i+1,fen:b.fen(),existing:old,sameFullFen:b.fen()===old.fen,commonPrefixPlies:commonPrefix(c.moves,baseline.find(x=>x.id===old.courseId).moves)})}}
const inputHashes=await hashes([planPath,'scripts/verify-opening-taimanov-be2-design.mjs','scripts/openings/common.mjs','src/components/OpeningLibrary.jsx','src/lib/openingJourneys.js','src/lib/openingCurriculum.js','src/lib/openingLibrary.js','src/lib/openingPracticalLibrary.js'])
const result={schema:1,lot:plan.lot,status:'design-verified-not-published',inputHashes,baseline:{courses:baseline,courseDigest:plan.baseline.courseDigest,practicalDigest:plan.baseline.practicalDigest},preservedFiles:Object.keys(plan.preserveFiles).length,plannedCourses:9,documentedPlies:150,authoredContinuationPlies:14,generatedPlies:0,engineSearchesExecuted:0,courses:courseEvidence,exercises,engineJobs:jobs,geometryFacts:facts,
 navigation:{forks:transitions,browserPairs,transpositions,internalConvergence,uncoveredAlternative:u,browserStatus:'not-run',browserPlan:{newCourseCases:18,newExerciseCases:9,liveForkCases:18,checkpointCases:36,uncoveredCases:1,newCases:82,existingRegressionCases:8,selectedCases:90,allAvailableAfterIntegration:223}},
 coverage:{baseline:before.coverage,projected:after.coverage,newlyReached,newEcoAnchors:new Set(newlyReached.flatMap(r=>r.ecoRoots)).size,selectedPositionIds,sourceSubtreeRecords:descendants,selectedPositionReferences:scope.records.filter(r=>selectedPositionIds.includes(r.groupId))},
 candidateReview:{prefix:plan.candidateRoot,records:candidateRecords.length,positions:candidateIds.length,absentBefore:122,absentProjected:98,residual},
 limitations:['Design only; nine courses and exercises are not installed.','All 37 engine jobs remain unexecuted. Fourteen authored moves and nine exercises require the frozen acceptance gates.','Immediate material is checked over every legal single reply, not the whole game.','Offline navigation checks do not establish browser persistence; all 82 planned new browser cases remain pending.','Finite source coverage and commentary are not a measure of complete theory or learning.']}
const text=JSON.stringify(result,null,2)+'\n'
if(check)assert.equal(await fs.readFile(stem+'-design-verification.json','utf8'),text)
else await write(stem+'-design-verification.json',text)
console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',plannedCourses:9,preservedFiles:result.preservedFiles,documentedPlies:150,authoredPlies:14,exerciseReplies:exercises.reduce((n,e)=>n+e.replies.length,0),directedTransitions:transitions.length,geometryFacts:facts.length,newExactPositions:newlyReached.filter(r=>r.projected==='exact').length,newTransposedPositions:newlyReached.filter(r=>r.projected==='transposition-only').length,newEcoAnchors:result.coverage.newEcoAnchors,plannedEngineJobs:jobs.length,engineSearchesExecuted:0,projectedCoverage:after.coverage,browserPlan:result.navigation.browserPlan},null,2))
