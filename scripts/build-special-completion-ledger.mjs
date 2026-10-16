// Whole development corpus; references reserved for validation are never read.
import {readFile,writeFile,mkdir,readdir}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
import{reclassifyReviewedMoves}from'../src/lib/reviewMoves.js'
const area='agent-output/special-completion-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
await mkdir(area)
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
async function tree(p){for(const e of await readdir(p,{withFileTypes:true})){const f=`${p}/${e.name}`;if(e.isDirectory())await tree(f);else if(e.isFile())await read(f)}}
await tree('src');await read('scripts/build-special-completion-ledger.mjs')
const frozen=await parse('agent-output/specials-frozen-candidate-v1.json')
for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
const normal=await parse('agent-output/rule-precedence-audit-v1/verification.json')
const verified=await parse('agent-output/empirical-grande-verification-v1/verification.json')
const{cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json')
const original=JSON.stringify(cases),base=new Map(normal.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.after]))
for(const r of verified.rows)base.set(`refined:${r.game}:${r.ply}`,r.after)
const additional=[]
for(const i of [1,2])additional.push(await parse(`agent-output/grande-comparison-probe-v1/search-${i}.json`))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const projected=[],rows=[]
for(const c of cases){
 const entries=c.entries.map(e=>{
  if(c.cohort!=='refined')return e
  const root=additional.find(p=>p.fen===e.fenBefore),child=additional.find(p=>p.fen===e.fenAfter)
  return root||child?{...e,engine:root?.engine??e.engine,playedEngine:child?.engine??e.playedEngine}:e
 })
 const reviewed=reclassifyReviewedMoves(entries)
 for(const[i,e]of reviewed.entries()){
  const key=`${c.cohort}:${c.id}:${e.ply}`
  assert.equal(labels[e.classification],base.get(key),key)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],actual:labels[e.classification],
   numerical:e.numericalClassification,grande:e.specialAssessment?.grande,brilliant:e.specialAssessment?.brilliant,
   fenBefore:e.fenBefore,fenAfter:e.fenAfter})
 }
 projected.push({...c,entries:reviewed})
 console.log(JSON.stringify({baselineVerified:c.id,cohort:c.cohort}))
}
assert.equal(JSON.stringify(cases),original);assert.equal(rows.length,1116)
const primary=rows.filter(r=>r.cohort!=='initial'),special=['Grande','Geniale']
const summary=rr=>special.map(category=>({category,expected:rr.filter(r=>r.expected===category).length,
 correct:rr.filter(r=>r.expected===category&&r.actual===category).length,
 false:rr.filter(r=>r.expected!==category&&r.actual===category).length}))
const unresolved=primary.filter(r=>special.includes(r.expected)&&r.actual!==r.expected||special.includes(r.actual)&&r.actual!==r.expected)
const dossier={date:'2026-10-15',version:'counterfactual-v15',scope:'All 13 development games, strongest recorded profile; initial-profile regressions also tracked.',
 developmentOnly:true,independentValidation:false,newSearches:0,distinctMoves:854,summaries:{strongest:summary(primary),initial:summary(rows.filter(r=>r.cohort==='initial'))},
 unresolved,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))}
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/cohorts.json`,JSON.stringify({cases:projected},null,2)+'\n',{flag:'wx'})
await writeFile(`${area}/ledger.json`,JSON.stringify(dossier,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,unresolved:unresolved.length,summaries:dossier.summaries}))
