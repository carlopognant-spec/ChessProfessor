import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView,buildRefinementPlan,refineGameEntries} from '../src/lib/analysisRefinement.js'
const area='agent-output/grande-recovery-proof-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const baseline=await parse(`${area}/verification.json`)
for(const s of baseline.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
await read(`${area}/discovered-check-hypothesis.md`);await read(`${area}/candidate-discovered-check.mjs`);await read('scripts/study-discovered-check-preparation.mjs')
const {cases}=await parse('agent-output/special-completion-v1/cohorts.json'),original=JSON.stringify(cases)
const collection=await parse('agent-output/special-completion-evidence-v1/collection.json'),packets=new Map()
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);packets.set(p.fen,p)}
const raw=(await read('src/lib/specialClassification.js')).toString(),source=raw.replaceAll('\r\n','\n')
await writeFile(`${area}/special-before-v20.js`,raw,{flag:'wx'})
let candidate=`import {newDiscoveredChecks} from '${new URL(`../${area}/candidate-discovered-check.mjs`,import.meta.url).href}'\n`+source
const replace=(from,to)=>{assert(candidate.includes(from),from);candidate=candidate.replace(from,to)}
const hook="  const matingThreat = !move.captured && numerical.classification === 'inaccuracy' ? newMatingThreat(entry) : null"
replace(hook,hook+"\n  const discovery = !move.captured && numerical.classification === 'inaccuracy' ? newDiscoveredChecks(entry) : null")
replace('  if (matingThreat && Math.min(best, 1 - after)', '  if ((matingThreat || discovery) && Math.min(best, 1 - after)')
replace('  if (!matingThreat && !(checkingCapture', '  if (!matingThreat && !discovery && !(checkingCapture')
replace("  if (forcing.applicable && forcing.kind === 'no-forcing-event')", "  if (forcing.applicable && forcing.kind === 'no-forcing-event' && !discovery)")
const finish="  if (matingThreat) return { status: 'supported', reason: 'new-mating-threat-after-inaccuracy',"
replace(finish,`  if (discovery) return { status: 'supported', reason: 'new-discovered-check-after-inaccuracy',
    evidenceKind: 'tactical-family', modelVersion: 'discovered-check-preparation-v1', tactic: discovery,
    previousPly: previous.ply, previousMove: previous.playedMove, previousNumericalClassification: numerical.classification,
    bestIndex: best, afterIndex: 1 - after,
    coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-new-discovered-checks' } }
`+finish)
await writeFile(`${area}/candidate-discovered-check.js`,candidate,{flag:'wx'})
await writeFile(`${area}/discovered-check-protocol.json`,JSON.stringify({variants:1,newSearches:0,independentValidation:false,baseline:'v19 including explicit recovery proof where selected',sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const rewritten=candidate.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)
const mod=await import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'))
const before=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.actual]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},rows=[]
for(const c of cases){
 let inputs=reclassifyReviewedMoves(c.entries)
 const plan=buildRefinementPlan(inputs,{grandeOnly:true})
 if(plan.scope==='grande-recovery-proof-v1'){
  const result=await refineGameEntries({entries:inputs,plan,analyzePosition:async(f,n,m)=>{
   const p=packets.get(f);assert(p);assert.equal(p.nodes,n);assert.equal(p.multiPv,m);return structuredClone(p.engine)}})
  inputs=selectRefinementView(result.entries,true)
 }
 for(const e of inputs)assert.equal(labels[e.classification],before.get(`${c.cohort}:${c.id}:${e.ply}`),`${c.id}/${e.ply}`)
 const after=mod.reclassifySpecialMoves(inputs).map(applyMoveFacts)
 for(const [i,e]of after.entries()){
  for(const field of baseline.numericFieldsUnchanged)assert(e[field]===inputs[i][field],`${c.id}/${e.ply}/${field}`)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:before.get(`${c.cohort}:${c.id}:${e.ply}`),after:labels[e.classification],grande:e.specialAssessment.grande})
 }
 console.log(JSON.stringify({tested:c.id,cohort:c.cohort}))
}
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,corrected:rr.filter(r=>r.before!==r.expected&&r.after===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.after!==r.expected).length,
 specials:['Grande','Geniale','Mossa mancata'].map(category=>({category,beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
const accepted=summaries.some(s=>s.corrected>0)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
assert.equal(JSON.stringify(cases),original);for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const result={accepted,newSearches:0,independentValidation:false,summaries,changes:rows.filter(r=>r.before!==r.after),sources:[...sources].map(([path,sha256])=>({path,sha256}))}
await writeFile(`${area}/discovered-check-study.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({accepted,summaries,changes:result.changes.map(({cohort,game,ply,san,before,after,expected})=>({cohort,game,ply,san,before,after,expected}))}))
