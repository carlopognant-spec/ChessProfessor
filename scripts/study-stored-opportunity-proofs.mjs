import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
const area='agent-output/special-evidence-dossier-v1',sha=b=>createHash('sha256').update(b).digest('hex')
const sources=new Map(),read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b}
const dossier=JSON.parse(await read(`${area}/dossier.json`))
for(const s of dossier.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await read(`${area}/hypotheses.md`);await read(`${area}/candidate-proof.mjs`);await read('scripts/study-stored-opportunity-proofs.mjs')
const {cases}=JSON.parse(await read(`${area}/cohorts.json`)),original=JSON.stringify(cases)
const helper=new URL(`../${area}/candidate-proof.mjs`,import.meta.url).href
const moduleUrl=(source,file)=>'data:text/javascript;base64,'+Buffer.from(source
 .replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL(file,import.meta.url)).href}'`)).toString('base64')
const evidence=await readFile('src/lib/opportunityEvidence.js','utf8')
const opportunity=await readFile('src/lib/moveOpportunities.js','utf8')
const special=await readFile('src/lib/specialClassification.js','utf8')
const oldGuard=`|| [current, prior].some(e => e.evaluationEvidence?.status !== 'coherent'
        || e.evaluationEvidence.source !== 'completed-snapshot')`
assert(evidence.includes(oldGuard))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const results=[]
for(const v of [{id:'independent-prior',prior:true},{id:'stored-mate',mate:true},{id:'combined',prior:true,mate:true}]){
 let ev=evidence
 if(v.prior)ev=`import {independentPriorSupports} from '${helper}'\n`+ev.replace(oldGuard,`|| current.evaluationEvidence?.status !== 'coherent'
      || current.evaluationEvidence.source !== 'completed-snapshot'
      || !(prior.evaluationEvidence?.status === 'coherent' && prior.evaluationEvidence.source === 'completed-snapshot'
        || independentPriorSupports(prior, current))`)
 let op=opportunity.replace("from './opportunityEvidence.js'",`from '${moduleUrl(ev,'../src/lib/opportunityEvidence.js')}'`)
 if(v.mate){op=`import {storedContinuationMiss} from '${helper}'\n`+op
  op=op.replace('return classifyCoherentWinningOpportunity(classifyOriginalOpportunity(entry, previous), entry, previous)',
    'return storedContinuationMiss(classifyCoherentWinningOpportunity(classifyOriginalOpportunity(entry, previous), entry, previous), entry, previous)')}
 const mod=await import(moduleUrl(special.replace("from './moveOpportunities.js'",`from '${moduleUrl(op,'../src/lib/moveOpportunities.js')}'`),'../src/lib/specialClassification.js'))
 const rows=[]
 for(const c of cases){
  const after=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
  for(const [i,e]of after.entries())rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],
   before:labels[c.entries[i].classification],after:labels[e.classification],reason:e.missedOpportunityReason,opportunity:e.missedOpportunity})
 }
 const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort),cc=rr.filter(r=>r.before!==r.after);return{cohort,
  before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
  corrected:cc.filter(r=>r.after===r.expected).length,regressed:cc.filter(r=>r.before===r.expected).length,
  other:cc.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
  specials:['Mossa mancata','Grande','Geniale'].map(category=>({category,
   beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
   beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
 assert.deepEqual(summaries.map(s=>s.before),[172,189,338])
 const accepted=summaries.some(s=>s.corrected>0)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
 const result={...v,accepted,summaries,changes:rows.filter(r=>r.before!==r.after)}
 await writeFile(`${area}/proof-${v.id}.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
 results.push(result);console.log(JSON.stringify({id:v.id,accepted,summaries:summaries.map(({cohort,before,after,corrected,regressed,other})=>({cohort,before,after,corrected,regressed,other}))}))
}
assert.equal(JSON.stringify(cases),original)
for(const [p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/proof-study.json`,JSON.stringify({newSearches:0,independentValidation:false,applicationChanged:false,
 results,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
