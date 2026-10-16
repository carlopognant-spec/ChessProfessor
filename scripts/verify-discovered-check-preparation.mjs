import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView,buildRefinementPlan,refineGameEntries} from '../src/lib/analysisRefinement.js'
const area='agent-output/grande-recovery-proof-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const protocol=await parse(`${area}/protocol.json`),baseline=await parse(`${area}/verification.json`),study=await parse(`${area}/discovered-check-error-domain-study.json`)
const allowed=new Set(protocol.sources.map(s=>s.path))
for(const s of baseline.sources)if(!allowed.has(s.path))assert.equal(sha(await read(s.path)),s.sha256,s.path)
const frozen=await parse('agent-output/specials-frozen-candidate-v1.json')
for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
for(const p of [...allowed,'src/lib/grandeProofs.js','src/lib/discoveredCheck.js','scripts/verify-discovered-check-preparation.mjs'])await read(p)
const oldSource=(await read(`${area}/analysisRefinement.js.before`)).toString()
 .replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/analysisRefinement.js',import.meta.url)).href}'`)
const old=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'))
const {cases}=await parse('agent-output/special-completion-v1/cohorts.json'),original=JSON.stringify(cases)
const collection=await parse('agent-output/special-completion-evidence-v1/collection.json'),packets=new Map()
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256,r.path);const p=JSON.parse(b);packets.set(p.fen,p)}
await writeFile(`${area}/candidate-lock-v20.json`,JSON.stringify({newSearches:0,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),newChanges=new Map(study.changes.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.after]));assert(study.accepted)
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},rows=[],plans=[],flows=[]
let reusedQueries=0
const search=async(fen,nodes,multiPv)=>{const p=packets.get(fen);assert(p,`Unrecorded query: ${fen}`);assert.equal(p.nodes,nodes);assert.equal(p.multiPv,multiPv);reusedQueries++;return structuredClone(p.engine)}
for(const c of cases){
 const entries=reclassifyReviewedMoves(c.entries)
 for(const e of entries){const key=`${c.cohort}:${c.id}:${e.ply}`,r=base.get(key);assert.equal(labels[e.classification],newChanges.get(key)??(r.grande?.decisionProof?r.before:r.actual))}
 assert.deepEqual(buildRefinementPlan(entries),old.buildRefinementPlan(entries))
 const initial=JSON.stringify(entries),before=selectRefinementView(entries,true),plan=buildRefinementPlan(entries,{grandeOnly:true})
 let after=before
 if(plan.scope==='grande-recovery-proof-v1'){
  assert(plan.positions.length<=24&&plan.selectedPlies.length<=12&&plan.extraSearches===0)
  const result=await refineGameEntries({entries,plan,analyzePosition:search})
  after=selectRefinementView(result.entries,true)
  assert.deepEqual(result.entries.map(e=>[e.engine,e.playedEngine]),entries.map(e=>[e.engine,e.playedEngine]))
  assert.deepEqual(buildRefinementPlan(result.entries),buildRefinementPlan(entries))
  assert.equal(buildRefinementPlan(result.entries,{grandeOnly:true}).selectedPlies.length,0)
  assert.deepEqual(selectRefinementView(result.entries,false).map(e=>e.classification),entries.map(e=>e.classification))
  plans.push({cohort:c.cohort,game:c.id,selected:plan.selectedPlies,positions:plan.positions.length,actualNodes:result.actualNodes})
 }else assert.deepEqual(plan,old.buildRefinementPlan(entries,{grandeOnly:true}))
 assert.equal(JSON.stringify(entries),initial)
 for(const [i,e]of after.entries()){
  for(const field of baseline.numericFieldsUnchanged)assert(e[field]===before[i][field],`${c.id}/${e.ply}/${field}`)
  rows.push({...base.get(`${c.cohort}:${c.id}:${e.ply}`),before:base.get(`${c.cohort}:${c.id}:${e.ply}`).actual,actual:labels[e.classification],grande:e.specialAssessment.grande})
 }
 console.log(JSON.stringify({verified:c.id,cohort:c.cohort,proof:plan.scope==='grande-recovery-proof-v1'}))
}
for(const c of cases.filter(c=>c.cohort==='refined')){
 const entries=reclassifyReviewedMoves(c.canonical),before=selectRefinementView(entries,true),plan=buildRefinementPlan(entries,{grandeOnly:true})
 if(plan.scope!=='grande-recovery-proof-v1')continue
 const result=await refineGameEntries({entries,plan,analyzePosition:search}),after=selectRefinementView(result.entries,true)
 for(const [i,e]of after.entries())for(const k of baseline.numericFieldsUnchanged)assert(e[k]===before[i][k],`canonical:${c.id}/${e.ply}/${k}`)
 const changes=after.flatMap((e,i)=>e.classification!==before[i].classification?[{ply:e.ply,before:labels[before[i].classification],after:labels[e.classification],expected:c.expected[i]}]:[])
 assert(changes.every(c=>c.after===c.expected));flows.push({game:c.id,selected:plan.selectedPlies,changes})
}
const changes=rows.filter(r=>r.before!==r.actual)
assert.deepEqual(changes.map(r=>[r.cohort,r.game,r.ply,r.actual]),[['old','game-1-chigorin-steinitz-1892',43,'Grande']])
assert(changes.every(r=>r.actual===r.expected));assert.equal(rows.length,1116)
assert.equal(JSON.stringify(cases),original)
const strongest=rows.filter(r=>r.cohort!=='initial'),specials=['Grande','Geniale'].map(category=>({category,expected:strongest.filter(r=>r.expected===category).length,correct:strongest.filter(r=>r.expected===category&&r.actual===category).length,false:strongest.filter(r=>r.expected!==category&&r.actual===category).length}))
assert.deepEqual(specials.map(r=>[r.correct,r.expected,r.false]),[[24,34,0],[3,4,0]])
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.actual===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.actual!==r.expected).length}})
const unresolved=strongest.filter(r=>['Grande','Geniale'].includes(r.expected)&&r.expected!==r.actual||['Grande','Geniale'].includes(r.actual)&&r.expected!==r.actual)
assert.equal(unresolved.length,11)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/verification-v20.json`,JSON.stringify({passed:true,version:'counterfactual-v20',developmentOnly:true,independentValidation:false,newSearches:0,reusedQueries,ordinaryPlansUnchanged:true,numericFieldsUnchanged:baseline.numericFieldsUnchanged,inputsUnchanged:true,summaries,specials,unresolved,changes,plans,flows,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,summaries,specials,plans,flows,reusedQueries}))
