import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
import{applyMoveFacts}from'../src/lib/reviewEvaluation.js'
const area='agent-output/special-completion-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const ledger=await parse(`${area}/ledger.json`)
for(const s of ledger.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
const tactical=await parse(`${area}/tactical-study.json`)
assert(tactical.results.find(r=>r.id==='combined').accepted)
for(const p of ['scripts/study-deferred-special-responses.mjs',`${area}/candidate-deferred.mjs`,`${area}/deferred-hypothesis.md`,`${area}/candidate-combined.js`])await read(p)
const{cases}=await parse(`${area}/cohorts.json`),original=JSON.stringify(cases)
const baseline=new Map(ledger.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.actual]))
await writeFile(`${area}/deferred-protocol-fixed-import.json`,JSON.stringify({newSearches:0,independentValidation:false,variants:['deferred-only','tactics-and-deferred'],sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},results=[]
const helper=new URL(`../${area}/candidate-deferred.mjs`,import.meta.url).href
for(const id of ['deferred-only','tactics-and-deferred']){
 let source=(await readFile(id==='deferred-only'?'src/lib/specialClassification.js':`${area}/candidate-combined.js`,'utf8')).replaceAll('\r\n','\n')
 const hook='  const equivalent = equivalentResponseAlternative(entry, roots)';assert(source.includes(hook))
 source=`import {deferredForcingResponse} from '${helper}'\n`+source.replace(hook,`  const deferred = deferredForcingResponse(entry, roots, forcing)
  if (deferred) return { status: 'rejected', reason: 'forcing-response-can-be-delayed', deferred }
`+hook)
 await writeFile(`${area}/candidate-${id}-fixed-import.js`,source,{flag:'wx'})
 const modSource=source.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)
 const mod=await import('data:text/javascript;base64,'+Buffer.from(modSource).toString('base64')),rows=[]
 for(const c of cases){const after=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
  for(const[i,e]of after.entries())rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:baseline.get(`${c.cohort}:${c.id}:${e.ply}`),after:labels[e.classification],grande:e.specialAssessment?.grande})}
 const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort),cc=rr.filter(r=>r.before!==r.after)
  return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
   corrected:cc.filter(r=>r.after===r.expected).length,regressed:cc.filter(r=>r.before===r.expected).length,other:cc.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
   specials:['Grande','Geniale','Mossa mancata'].map(category=>({category,beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
 const accepted=summaries.some(s=>s.corrected>0)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
 const r={id,accepted,summaries,changes:rows.filter(r=>r.before!==r.after)};results.push(r)
 await writeFile(`${area}/deferred-${id}.json`,JSON.stringify(r,null,2)+'\n',{flag:'wx'})
 console.log(JSON.stringify({id,accepted,summaries:summaries.map(({cohort,before,after,corrected,regressed,other})=>({cohort,before,after,corrected,regressed,other})),changes:r.changes.map(({game,ply,san,before,after,expected})=>({game,ply,san,before,after,expected}))}))
}
assert.equal(JSON.stringify(cases),original);for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/deferred-study.json`,JSON.stringify({results,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
