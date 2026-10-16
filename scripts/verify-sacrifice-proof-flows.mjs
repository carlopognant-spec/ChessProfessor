import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {buildRefinementPlan,refineGameEntries,selectRefinementView} from '../src/lib/analysisRefinement.js'
import {capturedSearchKey as key,verifyCapturedSearch} from './qa/verify-captured-search.mjs'
const area='agent-output/all-sacrifice-proofs-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const save=(p,v)=>writeFile(`${area}/${p}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
const frozen=await json('agent-output/specials-frozen-candidate-v1.json')
for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
for(const p of ['scripts/verify-sacrifice-proof-flows.mjs','src/lib/sacrificeProofs.js','src/lib/sacrificeSearches.js','src/lib/specialClassification.js','src/lib/specialPolicy.js','src/lib/sacrificeEvidence.js','src/lib/rookAccess.js','src/lib/analysisRefinement.js','src/lib/gameArchive.js','src/components/EnginePanel.jsx'])await read(p)
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),baseline=await json('agent-output/grande-recovery-proof-v1/verification-v20.json'),packets=new Map()
for(const collectionPath of [`${area}/collection.json`,'agent-output/special-completion-evidence-v1/collection.json']){
 const c=await json(collectionPath)
 for(const r of c.records){const b=await read(r.path);assert.equal(sha(b),r.sha256,r.path);const p=JSON.parse(b);verifyCapturedSearch(p);packets.set(key(p.fen,p.nodes,p.multiPv,p.searchMoves),p)}
}
await save('flow-protocol-v2.json',{developmentOnly:true,independentValidation:false,newSearches:0,
 amendment:'Original flow rejected search-27, which legitimately finished without a completed 5-PV snapshot. Now retain a validated completed attempt without promoting it or retrying automatically; all raw searches reused unchanged.',
 selection:'Execute the public proof-only plan repeatedly until no pending queries remain on every original/refined/old development profile and canonical recent archive. No expected labels affect selection.',
 accept:'No formerly correct label regresses, no false Grande or Brilliant, all numerical fields unchanged, initial profile unchanged. Retain every pre-existing correct special.',
 sources:[...sources].map(([path,sha256])=>({path,sha256}))})
let queries=0
const search=async(fen,nodes,multiPv,options={})=>{
 const k=key(fen,nodes,multiPv,options.searchMoves),p=packets.get(k);assert(p,`Unrecorded query ${k}`);queries++;return structuredClone(p.engine)
}
const numbers=baseline.numericFieldsUnchanged
async function flow(input){
 let entries=reclassifyReviewedMoves(input),plan=buildRefinementPlan(entries,{grandeOnly:true})
 if(plan.scope==='grande-recovery-proof-v1')entries=(await refineGameEntries({entries,plan,analyzePosition:search})).entries
 const before=selectRefinementView(entries,true),initial=selectRefinementView(entries,false),batches=[]
 for(let i=0;i<100;i++){
  plan=buildRefinementPlan(entries,{sacrificeOnly:true});assert.equal(plan.scope,'sacrifice-proof-v1')
  if(!plan.queries.length)break
  assert(i<99);assert.equal(plan.positions.length,0);assert(plan.sacrifices.length<=4);assert(plan.queries.length<=16)
  const result=await refineGameEntries({entries,plan,analyzePosition:search})
  assert(result.actualNodes<=plan.actualNodeCap)
  batches.push({plies:plan.selectedPlies,searches:result.searches,actualNodes:result.actualNodes})
  entries=result.entries
 }
 const after=selectRefinementView(entries,true)
 assert.deepEqual(selectRefinementView(entries,false).map(e=>[e.classification,...numbers.map(k=>e[k])]),initial.map(e=>[e.classification,...numbers.map(k=>e[k])]))
 assert.deepEqual(entries.map(e=>[e.engine,e.playedEngine]),input.map(e=>[e.engine,e.playedEngine]))
 for(const[i,e]of after.entries())for(const k of numbers)assert.equal(e[k],before[i][k],`${e.ply}/${k}`)
 assert.equal(buildRefinementPlan(entries,{sacrificeOnly:true}).queries.length,0)
 return{entries,before,after,batches}
}
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),rows=[],flows=[],canonical=[]
for(const c of cases){
 const original=JSON.stringify(c.entries),f=await flow(c.entries)
 assert.equal(JSON.stringify(c.entries),original)
 for(const e of f.after){const b=base.get(`${c.cohort}:${c.id}:${e.ply}`);rows.push({...b,before:b.actual,actual:labels[e.classification],brilliant:e.specialAssessment.brilliant,grande:e.specialAssessment.grande})}
 flows.push({cohort:c.cohort,game:c.id,batches:f.batches});console.log(JSON.stringify(flows.at(-1)))
}
for(const c of cases.filter(c=>c.cohort==='refined')){
 const f=await flow(c.canonical),changes=f.after.flatMap((e,i)=>e.classification!==f.before[i].classification?[{ply:e.ply,before:labels[f.before[i].classification],after:labels[e.classification],expected:c.expected[i]}]:[])
 canonical.push({game:c.id,batches:f.batches,changes})
}
const strongest=rows.filter(r=>r.cohort!=='initial'),changes=rows.filter(r=>r.before!==r.actual),regressions=rows.filter(r=>r.before===r.expected&&r.actual!==r.expected)
const specials=['Grande','Geniale'].map(category=>({category,expected:strongest.filter(r=>r.expected===category).length,correct:strongest.filter(r=>r.expected===category&&r.actual===category).length,false:strongest.filter(r=>r.expected!==category&&r.actual===category).length}))
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.actual===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.actual!==r.expected).length}})
const unresolved=strongest.filter(r=>['Grande','Geniale'].includes(r.expected)&&r.actual!==r.expected||['Grande','Geniale'].includes(r.actual)&&r.actual!==r.expected)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const passed=!regressions.length&&specials.every(s=>!s.false)&&canonical.every(c=>c.changes.every(r=>r.after===r.expected))
await save('verification-v2.json',{passed,version:'counterfactual-v21',developmentOnly:true,independentValidation:false,newSearches:0,reusedQueries:queries,numericFieldsUnchanged:numbers,initialProfilesUnchanged:true,inputsUnchanged:true,summaries,specials,changes,regressions,unresolved,flows,canonical,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))})
console.log(JSON.stringify({passed,summaries,specials,changes:changes.map(r=>({game:r.game,ply:r.ply,before:r.before,actual:r.actual,expected:r.expected})),regressions:regressions.length,unresolved:unresolved.length}));assert(passed)
