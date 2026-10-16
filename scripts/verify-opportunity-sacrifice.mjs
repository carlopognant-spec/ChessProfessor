// Verify the integrated batch and its application flow from recorded evidence.
// No engine process, new searches, external labels in classifiers or holdout grading.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView,buildRefinementPlan,refineGameEntries} from '../src/lib/analysisRefinement.js'
import {analyzeGame} from '../src/lib/gameAnalysis.js'
import {createOpeningBook} from '../src/lib/openingBook.js'
import {verifyCapturedSearch,capturedSearchKey as key} from './qa/verify-captured-search.mjs'
import {SPECIAL_POLICY} from '../src/lib/specialClassification.js'
const area='agent-output/opportunity-sacrifice-batch-v1',sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>JSON.parse(await readFile(p,'utf8')),watched=new Map()
async function input(p){const b=await readFile(p);watched.set(p,sha(b));return JSON.parse(b)}
const audit=await input(`${area}/diagnosis.json`),study=await input(`${area}/study.json`),{cases}=await input(`${area}/cohorts.json`)
assert.deepEqual(study.accepted,['intermediate','existing-offer']);assert.equal(SPECIAL_POLICY.version,'counterfactual-v12')
const changed=new Set(['src/lib/specialClassification.js','src/lib/sacrificeEvidence.js','src/lib/moveOpportunities.js'])
for(const s of audit.sources){const b=await readFile(s.path);if(!changed.has(s.path))assert.equal(sha(b),s.sha256,s.path);watched.set(s.path,sha(b))}
for(const p of ['src/lib/specialPolicy.js','src/lib/opportunityEvidence.js','scripts/verify-opportunity-sacrifice.mjs'])watched.set(p,sha(await readFile(p)))
const holdout=await read('agent-output/holdout-validation-v1/manifest.json')
for(const s of holdout.sources.filter(s=>s.path.startsWith('Partite/Validazione/'))){const b=await readFile(s.path);assert.equal(sha(b),s.sha256);watched.set(s.path,s.sha256)}
for(const p of ['agent-output/holdout-validation-v1/results.json','agent-output/holdout-validation-v1/offline-check.json'])watched.set(p,sha(await readFile(p)))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const proposed=new Map(study.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),rows=[],current=new Map()
for(const c of cases){
  const preserved=JSON.stringify(c),after=c.cohort==='refined'?selectRefinementView(c.canonical,true):reclassifyReviewedMoves(c.entries)
  for(const[e,i]of after.map((e,i)=>[e,i])){
    const prediction=labels[e.classification],expected=proposed.get(`${c.cohort}:${c.id}:${e.ply}`)
    assert.equal(prediction,expected.after,`Predeclared batch: ${c.cohort} ${c.id}/${e.ply}`)
    rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:labels[c.entries[i].classification],after:prediction,
      opportunity:e.missedOpportunity,brilliant:e.specialAssessment?.brilliant,fenBefore:e.fenBefore,fenAfter:e.fenAfter})
  }
  current.set(`${c.cohort}:${c.id}`,after)
  assert.equal(JSON.stringify(c),preserved)
  console.log(JSON.stringify({verified:c.id,cohort:c.cohort}))
}
assert.equal(rows.length,1116)
const book=createOpeningBook((await input('src/data/openingPositions.json')).positions),liveChecks=[]
const games=cases.filter(c=>c.cohort==='initial')
for(const c of games){
  const positions=new Map(c.entries.flatMap(e=>[[e.fenBefore,e.engine],[e.fenAfter,e.playedEngine]]))
  const lookup=async fen=>{assert.ok(positions.has(fen));return positions.get(fen)}
  const live=await analyzeGame({moves:c.entries.map(e=>e.playedMove),openingBook:book,analyzePosition:lookup,analyzePlayedPosition:lookup})
  const reviewed=reclassifyReviewedMoves(live)
  assert.deepEqual(reviewed.map(e=>e.classification),current.get(`initial:${c.id}`).map(e=>e.classification))
  liveChecks.push({id:c.id,plies:reviewed.length,passed:true})
  console.log(JSON.stringify({livePassed:c.id}))
}
// Replay both explicit refinement requests with exact cached FEN/profile/scope.
const pool=new Map(),oldCollection=await input('agent-output/new-refinement-measurement-v1/collection.json')
const priorityCollection=await input('agent-output/refinement-quality-priority-v2/measurement-collection.json')
let verifiedPackets=0
for(const[path,hash]of [...oldCollection.packets.map(r=>[`agent-output/new-refinement-measurement-v1/${r.file}`,r.sha256]),...priorityCollection.packets.map(r=>[r.path,r.sha256])]){
  const bytes=await readFile(path);assert.equal(sha(bytes),hash,path);watched.set(path,hash);const p=JSON.parse(bytes)
  verifyCapturedSearch(p);pool.set(key(p.fen,p.nodes,p.multiPv,p.searchMoves),p.engine);verifiedPackets++
}
for(let i=0;i<7;i++){
  const p=await input(`agent-output/targeted-special-evidence-v1/search-${i}.json`),searchMoves=p.scope==='forced-root-move'?[p.uci]:undefined
  const packet={...p,...(searchMoves?{searchMoves,engine:{...p.engine,analysisMetadata:{...p.engine.analysisMetadata,searchMoves}}}:{})}
  verifyCapturedSearch(packet);pool.set(key(p.fen,p.nodes,p.multiPv,searchMoves),packet.engine);verifiedPackets++
}
const calls=[],jobs=[],missing=[]
const lookup=async(fen,nodes,multiPv,options={})=>{
  const packet=pool.get(key(fen,nodes,multiPv,options.searchMoves))
  if(!packet){missing.push({fen,nodes,multiPv,options});throw Error('Required evidence not recorded; no engine fallback')}
  calls.push({fen,nodes,multiPv,...options});return packet
}
const states=games.map(c=>({id:c.id,entries:current.get(`initial:${c.id}`)}))
for(let round=1;round<=2;round++)for(const g of states){
  const plan=buildRefinementPlan(g.entries);if(!plan.selectedPlies.length)continue
  const before=JSON.stringify(g.entries),old=priorityCollection.jobs.find(j=>j.game===g.id&&j.round===round)
  assert.deepEqual(plan,old.plan,'Same captured search plan; no new grading-driven selection')
  const result=await refineGameEntries({entries:g.entries,plan,analyzePosition:lookup})
  assert.equal(JSON.stringify(g.entries),before);g.entries=result.entries
  const view=selectRefinementView(g.entries,true),recorded=await input(`agent-output/refinement-quality-priority-v2/priority-game-${g.id}-round-${round}.json`)
  if(round===2)assert.deepEqual(view.map(e=>e.classification),current.get(`refined:${g.id}`).map(e=>e.classification))
  // Score/position selection is independent of the new derived categories.
  assert.deepEqual(view.map(e=>[e.bestEval,e.playedEval,e.bestMate,e.playedMate]),recorded.view.map(e=>[e.bestEval,e.playedEval,e.bestMate,e.playedMate]))
  jobs.push({id:g.id,round,plies:view.length,searches:result.searches})
  console.log(JSON.stringify({flowPassed:g.id,round}))
}
assert.equal(missing.length,0);assert.equal(jobs.length,10);assert.equal(calls.length,177)
for(const[p,h]of watched)assert.equal(sha(await readFile(p)),h,p)
const summaries=['initial','refined','old'].map(cohort=>{
  const rr=rows.filter(r=>r.cohort===cohort),changed=rr.filter(r=>r.before!==r.after)
  return{cohort,total:rr.length,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
    corrected:changed.filter(r=>r.after===r.expected).length,regressed:changed.filter(r=>r.before===r.expected).length,
    other:changed.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
    categories:['Geniale','Grande','Mossa mancata'].map(category=>({category,
      beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
      beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}
})
assert.deepEqual(summaries.map(s=>s.after),[172,189,338]);assert.ok(summaries.every(s=>s.regressed===0))
const result={passed:true,newSearches:0,independentValidation:false,policy:SPECIAL_POLICY.version,summaries,
  verifiedPlies:1116,liveChecks,jobs,replayedCalls:calls.length,verifiedPackets,missing,
  changes:rows.filter(r=>r.before!==r.after),rows,sources:[...watched].map(([path,sha256])=>({path,sha256}))}
await writeFile(`${area}/verification.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,newSearches:0,verifiedPlies:1116,replayedCalls:calls.length,summaries},null,2))
