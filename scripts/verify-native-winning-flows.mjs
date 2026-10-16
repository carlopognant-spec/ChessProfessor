import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {buildRefinementPlan,refineGameEntries,selectRefinementView,REFINEMENT_POLICY} from '../src/lib/analysisRefinement.js'
import {SACRIFICE_SEARCH_POLICY} from '../src/lib/sacrificeSearches.js'
import {NATIVE_PROOF_POLICY} from '../src/lib/nativeEvidence.js'
const area='agent-output/native-winning-integration-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const save=(n,v)=>writeFile(`${area}/${n}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
const frozen=await json('agent-output/specials-frozen-candidate-v1.json');for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
for(const p of ['scripts/verify-native-winning-flows.mjs','src/lib/specialClassification.js','src/lib/specialPolicy.js','src/lib/nativeWdl.js','src/lib/nativeWinningChoice.js','src/lib/restoredMateRoute.js','src/lib/nativeEvidence.js','src/lib/nativeProofs.js','src/lib/responseEvidence.js','src/lib/analysisRefinement.js','src/lib/gameArchive.js','src/components/EnginePanel.jsx'])await read(p)
const baseline=await json('agent-output/all-sacrifice-proofs-v1/verification-v2.json'),base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
assert(baseline.passed)
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),deep=new Map(),small=new Map()
for(const collection of ['special-completion-evidence-v1','native-wdl-evidence-v1','native-alternative-evidence-v1']){
 const c=await json(`agent-output/${collection}/collection.json`)
 for(const r of c.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);if(p.nodes===1000000&&p.multiPv===5&&!p.searchMoves&&!deep.has(p.fen))deep.set(p.fen,p.engine)}
}
const normal=await json('agent-output/new-refinement-measurement-v1/collection.json');assert(normal.complete)
for(let i=0;i<normal.searches;i++){
 const p=await json(`agent-output/new-refinement-measurement-v1/search-${String(i).padStart(3,'0')}.json`)
 if(p.nodes===1000000&&p.multiPv===5&&!p.searchMoves&&!deep.has(p.fen))deep.set(p.fen,p.engine)
}
const sp=await json('agent-output/all-sacrifice-proofs-v1/protocol.json'),sc=await json('agent-output/all-sacrifice-proofs-v1/collection.json')
for(const r of sc.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);small.set(r.index,JSON.parse(b).engine)}
await save('flow-protocol.json',{version:'counterfactual-v22',developmentOnly:true,independentValidation:false,newSearches:0,
 scope:'Replay the public criticalOnly plan to quiescence on all1116 observations and5 canonical archives. Reuse prior verified sacrifice/recovery certificates and assert the exact v21 label baseline before starting. No reference labels select searches.',
 acceptance:'Only four new correct Greats, no new false specials or regressions; seven numerical fields, initial views, original engines and normal plans unchanged.',sources:[...sources].map(([path,sha256])=>({path,sha256}))})
const numeric=entries=>entries.map(e=>baseline.numericFieldsUnchanged.map(k=>e[k])),labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
function seed(c,input,canonical=false){return reclassifyReviewedMoves(structuredClone(input).map(e=>{
 const obs=sp.observations.filter(o=>o.game===c.id&&o.ply===e.ply&&(canonical||o.cohort===c.cohort))
 const ts=sp.targets.filter(t=>t.fen===e.fenAfter&&obs.some(o=>o.captureUci===t.captureUci))
 const sacrifices=ts.map(t=>({version:SACRIFICE_SEARCH_POLICY.version,fen:t.fen,captureUci:t.captureUci,acceptedFen:t.acceptedFen,
  acceptance:small.get(t.acceptance),confirmation:small.get(t.confirmation),recoveries:t.recoveries.map(r=>({uci:r.uci,afterFen:r.afterFen,search:small.get(r.search),confirmation:small.get(r.confirmation)}))}))
 const recovery=base.get(`${c.cohort}:${c.id}:${e.ply}`)?.grande?.decisionProof
 if(!sacrifices.length&&!recovery)return e
 return{...e,refinement:{...e.refinement,version:REFINEMENT_POLICY.version,
  ...(recovery?{grandeProof:{version:'grande-decision-proof-v1',root:deep.get(e.fenBefore),child:deep.get(e.fenAfter)}}:{}),
  sacrifices:[...(e.refinement?.sacrifices??[]).filter(r=>!sacrifices.some(s=>s.captureUci===r.captureUci)),...sacrifices]}}
}))}
let queries=0
const search=async(fen,nodes,multiPv)=>{assert.equal(nodes,1000000);assert.equal(multiPv,5);const engine=deep.get(fen);assert(engine,`Unrecorded native query ${fen}`);queries++;return structuredClone(engine)}
async function flow(c,input,canonical=false){
 let entries=seed(c,input,canonical),before=selectRefinementView(entries,true),initial=entries.map(e=>e.classification),numbers=numeric(before),batches=[]
 const ordinary=buildRefinementPlan(entries)
 if(!canonical)for(const e of before)assert.equal(labels[e.classification],base.get(`${c.cohort}:${c.id}:${e.ply}`).actual,`${c.cohort}/${c.id}/${e.ply}/v21 baseline`)
 for(let i=0;i<100;i++){
  const plan=buildRefinementPlan(entries,{criticalOnly:true});assert.equal(plan.scope,NATIVE_PROOF_POLICY.scope)
  if(!plan.selectedPlies.length)break
  assert(i<99);assert(plan.positions.length<=24&&plan.selectedPlies.length<=12&&plan.extraSearches===0)
  const result=await refineGameEntries({entries,plan,analyzePosition:search});assert(result.actualNodes<=plan.actualNodeCap)
  batches.push({plies:plan.selectedPlies,phases:plan.selection.map(s=>s.phase),searches:result.searches,actualNodes:result.actualNodes})
  entries=result.entries
 }
 const after=selectRefinementView(entries,true)
 assert.deepEqual(numeric(after),numbers)
 assert.deepEqual(selectRefinementView(entries,false).map(e=>e.classification),initial)
 assert.deepEqual(entries.map(e=>[e.engine,e.playedEngine]),input.map(e=>[e.engine,e.playedEngine]))
 assert.deepEqual(buildRefinementPlan(entries),ordinary)
 assert.equal(buildRefinementPlan(entries,{criticalOnly:true}).selectedPlies.length,0)
 return{entries,before,after,batches}
}
const rows=[],flows=[],canonical=[]
for(const c of cases){
 const original=JSON.stringify(c.entries),f=await flow(c,c.entries);assert.equal(JSON.stringify(c.entries),original)
 for(const e of f.after){const b=base.get(`${c.cohort}:${c.id}:${e.ply}`);rows.push({...b,before:b.actual,actual:labels[e.classification],grande:e.specialAssessment.grande})}
 flows.push({cohort:c.cohort,game:c.id,batches:f.batches});console.log(JSON.stringify({cohort:c.cohort,game:c.id,batches:f.batches}))
}
for(const c of cases.filter(c=>c.cohort==='refined')){
 const f=await flow(c,c.canonical,true),changes=f.after.flatMap((e,i)=>e.classification!==f.before[i].classification?[{ply:e.ply,before:labels[f.before[i].classification],after:labels[e.classification],expected:c.expected[i]}]:[])
 canonical.push({game:c.id,batches:f.batches,changes});console.log(JSON.stringify({canonical:c.id,batches:f.batches.length,changes}))
}
const changes=rows.filter(r=>r.before!==r.actual),regressions=changes.filter(r=>r.before===r.expected&&r.actual!==r.expected),strongest=rows.filter(r=>r.cohort!=='initial')
const specials=['Grande','Geniale'].map(category=>({category,expected:strongest.filter(r=>r.expected===category).length,correct:strongest.filter(r=>r.expected===category&&r.actual===category).length,false:strongest.filter(r=>r.expected!==category&&r.actual===category).length}))
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.actual===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.actual!==r.expected).length}})
const unresolved=strongest.filter(r=>['Grande','Geniale'].includes(r.expected)&&r.expected!==r.actual||['Grande','Geniale'].includes(r.actual)&&r.actual!==r.expected)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const passed=changes.length===4&&changes.every(r=>r.actual===r.expected)&&!regressions.length&&specials.every(s=>!s.false)&&specials[0].correct===28&&specials[1].correct===4&&canonical.every(c=>c.changes.every(r=>r.after===r.expected))
await save('verification.json',{passed,version:'counterfactual-v22',developmentOnly:true,independentValidation:false,newSearches:0,reusedQueries:queries,numericFieldsUnchanged:baseline.numericFieldsUnchanged,initialViewsUnchanged:true,normalPlansUnchanged:true,priorV21BaselineReproduced:true,summaries,specials,changes,regressions,unresolved,flows,canonical,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))})
console.log(JSON.stringify({passed,summaries,specials,changes:changes.map(({game,ply,san,before,actual,expected})=>({game,ply,san,before,actual,expected})),regressions:regressions.length,remaining:unresolved.length}));assert(passed)
