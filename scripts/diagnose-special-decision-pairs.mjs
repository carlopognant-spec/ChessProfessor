// Diagnostic only: compare separate special-decision evidence with the ordinary
// profile. Does not modify the app, thresholds, labels, or recorded searches.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
const area='agent-output/special-completion-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const baseline=await parse(`${area}/verification-v17.json`)
for(const s of baseline.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
await read('scripts/diagnose-special-decision-pairs.mjs')
const {cases}=await parse(`${area}/cohorts.json`),original=JSON.stringify(cases)
const collection=await parse('agent-output/special-completion-evidence-v1/collection.json'),packets=new Map()
for(const r of collection.records){const packet=await parse(r.path);assert.equal(sources.get(r.path),r.sha256,r.path);packets.set(r.fen,packet.engine)}
await writeFile(`${area}/special-decision-pairs-diagnostic-protocol.json`,JSON.stringify({diagnosticOnly:true,newSearches:0,
 independentValidation:false,selection:'Every entry with both FENs in the already fixed 104-position development evidence collection; include all controls. Recompute a four-ply context, but project special promotions only onto eligible Best/Excellent final ordinary labels. No integration decision.',
 sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const before=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},rows=[]
for(const c of cases){
 for(const [i,e]of c.entries.entries()){
  if(!packets.has(e.fenBefore)||!packets.has(e.fenAfter))continue
  const start=Math.max(0,i-2),entries=c.entries.slice(start,i+2).map(x=>({...x,
   engine:packets.get(x.fenBefore)??x.engine,playedEngine:packets.get(x.fenAfter)??x.playedEngine}))
  const checked=reclassifyReviewedMoves(entries)[i-start],prior=before.get(`${c.cohort}:${c.id}:${e.ply}`)
  const wouldPromote=['Migliore','Ottima'].includes(prior.actual)&&['great','brilliant'].includes(checked.classification)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:prior.actual,
   separateProof:labels[checked.classification],wouldPromote,proposed:wouldPromote?labels[checked.classification]:prior.actual,
   numericalProfileChanged:['bestEval','playedEval','bestMate','playedMate','dropPct'].filter(k=>checked[k]!==e[k]),
   grande:checked.specialAssessment.grande,brilliant:checked.specialAssessment.brilliant})
 }
 console.log(JSON.stringify({diagnosed:c.id,cohort:c.cohort}))
}
assert.equal(JSON.stringify(cases),original)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const promotions=rows.filter(r=>r.wouldPromote),summary={observationsWithPairs:rows.length,
 corrected:promotions.filter(r=>r.proposed===r.expected).length,regressed:promotions.filter(r=>r.before===r.expected).length,
 otherWrong:promotions.filter(r=>r.before!==r.expected&&r.proposed!==r.expected).length}
await writeFile(`${area}/special-decision-pairs-diagnostic.json`,JSON.stringify({diagnosticOnly:true,newSearches:0,independentValidation:false,summary,promotions,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({summary,promotions:promotions.map(({cohort,game,ply,san,before,proposed,expected})=>({cohort,game,ply,san,before,proposed,expected}))}))
