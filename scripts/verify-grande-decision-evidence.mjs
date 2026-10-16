import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {analyzeGame,createGameAnalysisSession} from '../src/lib/gameAnalysis.js'
import {createOpeningBook} from '../src/lib/openingBook.js'
const area='agent-output/grande-decision-evidence-v1',sha=b=>createHash('sha256').update(b).digest('hex')
const parse=async p=>JSON.parse(await readFile(p,'utf8'))
const study=await parse(`${area}/study.json`),combined=study.results.find(r=>r.id==='combined')
assert(combined.accepted)
const changed=new Set(['src/lib/specialClassification.js','src/lib/specialPolicy.js'])
for(const s of study.sources)if(!changed.has(s.path))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const sources=[]
for(const path of [...changed,'src/lib/responseEvidence.js','scripts/verify-grande-decision-evidence.mjs'])sources.push({path,sha256:sha(await readFile(path))})
const {cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json')
const baseline=await parse('agent-output/special-evidence-dossier-v1/verification.json')
const baseMap=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const changes=new Map(combined.changes.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const label={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const rows=[],pipeline=[],original=JSON.stringify(cases)
let alignedContexts=0
for(const c of cases){
 const after=reclassifyReviewedMoves(c.entries)
 for(const [i,e]of after.entries()){
  const key=`${c.cohort}:${c.id}:${e.ply}`,base=baseMap.get(key);assert(base)
  assert.equal(label[e.classification],changes.get(key)?.after??base.after)
  for(const field of ['bestEval','bestMate','playedEval','playedMate','dropPct','bestProbability','playedProbability'])assert(e[field]===c.entries[i][field],`${key}:${field}`)
  if(e.specialAssessment?.context){
   assert.equal(e.specialAssessment.context.before,1-after[i-1].bestProbability)
   assert.equal(e.specialAssessment.context.available,e.bestProbability)
   alignedContexts++
  }
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:base.after,after:label[e.classification],great:e.specialAssessment?.grande,context:e.specialAssessment?.context})
 }
 console.log(JSON.stringify({verified:c.id,cohort:c.cohort}))
}
assert.equal(rows.length,1116);assert.equal(JSON.stringify(cases),original)
for(const [id,end]of [['185262315732',30],['185230271130',18]]){
 const c=cases.find(c=>c.cohort==='refined'&&c.id===id),pair=c.entries.slice(end-2,end)
 const known=new Map(pair.flatMap(e=>[[e.fenBefore,e.engine],[e.fenAfter,e.playedEngine]]))
 const session=createGameAnalysisSession();let calls=0
 const lookup=async fen=>{calls++;assert(known.has(fen),'No engine fallback');return known.get(fen)}
 const options={moves:pair.map(e=>e.playedMove),baseFen:pair[0].fenBefore,session,openingBook:createOpeningBook(),analyzePosition:lookup,analyzePlayedPosition:lookup}
 const first=await analyzeGame(options),cached=await analyzeGame(options)
 assert.equal(first[1].classification,'best');assert.deepEqual(first,cached)
 assert.equal(session.get(`analysis:${pair[1].fenBefore}:${pair[1].playedMove}`).specialAssessment,undefined)
 pipeline.push({id,ply:end,classification:first[1].classification,cachedCalls:calls})
}
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/verification.json`,JSON.stringify({passed:true,newSearches:0,independentValidation:false,version:'counterfactual-v14',
 verifiedClassifications:1116,alignedContexts,summaries:combined.summaries,changes:rows.filter(r=>r.before!==r.after),rows,pipeline,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,alignedContexts,summaries:combined.summaries.map(({cohort,before,after,corrected,regressed})=>({cohort,before,after,corrected,regressed})),pipeline}))
