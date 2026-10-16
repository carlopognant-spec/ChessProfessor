// Read-only diagnosis of development games. No engine and no holdout labels.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView} from '../src/lib/analysisRefinement.js'
const area='agent-output/opportunity-sacrifice-batch-v1',watched=new Map()
const sha=b=>createHash('sha256').update(b).digest('hex')
async function watch(p){const b=await readFile(p);watched.set(p,sha(b));return b}
async function input(p){return JSON.parse(await watch(p))}
async function tree(folder){for(const e of await readdir(folder,{withFileTypes:true})){const p=`${folder}/${e.name}`;if(e.isDirectory())await tree(p);else if(e.isFile())await watch(p)}}
const label={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
await mkdir(area,{recursive:true});await tree('src');await watch('scripts/audit-opportunity-sacrifice.mjs')
const frozen=await input('agent-output/specials-frozen-candidate-v1.json')
for(const s of frozen.sources)assert.equal(sha(await watch(s.path)),s.sha256)
const prior=await input('agent-output/refinement-quality-priority-v2/measurement-manifest.json')
for(const s of prior.sources)if(s.path.startsWith('src/'))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const cases=[]
for(const id of ['185262315732','184316820266','184316313800','185230271130','185230000668']){
  const initial=await input(`agent-output/new-references-200k-v1/game-${id}.json`)
  const deep=await input(`agent-output/refinement-quality-priority-v2/priority-game-${id}-round-2.json`)
  const ref=await input(`Partite/Confermate/chesscom-${id}/riferimento.json`)
  cases.push({cohort:'initial',id,entries:reclassifyReviewedMoves(initial.liveEntries),expected:ref.annotations.map(a=>a.category)})
  cases.push({cohort:'refined',id,entries:selectRefinementView(deep.entries,true),canonical:deep.entries,expected:ref.annotations.map(a=>a.category)})
  console.log(JSON.stringify({loaded:id}))
}
for(const c of (await input('agent-output/review-batch-v1/cohorts.json')).cases.filter(c=>c.cohort==='old'))cases.push({...c,entries:reclassifyReviewedMoves(c.entries)})
const primary=e=>e?.lines?.find(l=>l.multipv===1)??e
const rows=cases.flatMap(c=>c.entries.map((e,i)=>({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],actual:label[e.classification],numerical:label[e.numericalClassification],
  fenBefore:e.fenBefore,fenAfter:e.fenAfter,best:e.bestProbability,played:e.playedProbability,bestMate:e.bestMate,playedMate:e.playedMate,drop:e.dropPct,
  status:e.evaluationEvidence?.status,source:e.evaluationEvidence?.source,isEngineBest:e.isEngineBest,missReason:e.missedOpportunityReason,opportunity:e.missedOpportunity,
  previous:i?{san:c.entries[i-1].playedMove,numerical:c.entries[i-1].numericalClassification,best:c.entries[i-1].bestProbability,played:c.entries[i-1].playedProbability}:null,
  special:e.specialAssessment,root:primary(e.engine),child:primary(e.playedEngine),playedRoot:(e.engine?.specialLines??e.engine?.lines??[]).find(l=>l.pv?.[0]===e.playedUci)})))
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,total:rr.length,exact:rr.filter(r=>r.expected===r.actual).length,
  categories:['Geniale','Grande','Mossa mancata'].map(category=>({category,expected:rr.filter(r=>r.expected===category).length,tp:rr.filter(r=>r.actual===category&&r.expected===category).length,fp:rr.filter(r=>r.actual===category&&r.expected!==category).length}))}})
assert.deepEqual(summaries.map(s=>s.exact),[172,188,338]);assert.equal(rows.length,1116)
for(const[p,h]of watched)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/cohorts.json`,JSON.stringify({cases},null,2)+'\n',{flag:'wx'})
await writeFile(`${area}/diagnosis.json`,JSON.stringify({newSearches:0,independentValidation:false,summaries,rows,sources:[...watched].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({summaries,brilliant:rows.filter(r=>r.actual==='Geniale'||r.expected==='Geniale').map(r=>({cohort:r.cohort,game:r.game,ply:r.ply,san:r.san,expected:r.expected,actual:r.actual,numerical:r.numerical,best:r.best,played:r.played,reason:r.special?.brilliant?.reason,offers:r.special?.brilliant?.offers}))},null,2))
