import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {analyzeGame,createGameAnalysisSession} from '../src/lib/gameAnalysis.js'
import {createOpeningBook} from '../src/lib/openingBook.js'
const area='agent-output/special-evidence-dossier-v1',sha=b=>createHash('sha256').update(b).digest('hex')
const parse=async p=>JSON.parse(await readFile(p,'utf8'))
const {cases}=await parse(`${area}/cohorts.json`),study=await parse(`${area}/proof-study.json`)
assert(study.results.every(r=>r.accepted))
const allowed=new Set(['src/lib/opportunityEvidence.js','src/lib/moveOpportunities.js','src/lib/specialClassification.js','src/lib/specialPolicy.js'])
for(const s of study.sources)if(!allowed.has(s.path))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const sources=[]
for(const p of [...allowed,'src/lib/opportunityProofs.js','scripts/verify-stored-opportunity-proofs.mjs'])sources.push({path:p,sha256:sha(await readFile(p))})
const proposed=study.results.find(r=>r.id==='combined')
const expectedChanges=new Map(proposed.changes.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',missed:'Mossa mancata',great:'Grande',brilliant:'Geniale',unclassified:'Non valutabile'}
const rows=[],pipeline=[],original=JSON.stringify(cases)
for(const c of cases){
 const entries=reclassifyReviewedMoves(c.entries)
 for(const [i,e]of entries.entries()){
  const before=c.entries[i],change=expectedChanges.get(`${c.cohort}:${c.id}:${e.ply}`)
  assert.equal(labels[e.classification],change?.after??labels[before.classification])
  // JSON normalizes -0 to 0; both represent the same saved numeric score.
  for(const k of ['bestEval','bestMate','playedEval','playedMate','dropPct','bestProbability','playedProbability'])assert(e[k]===before[k],`${c.id}:${e.ply}:${k}`)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:labels[before.classification],after:labels[e.classification],reason:e.missedOpportunityReason,opportunity:e.missedOpportunity})
 }
 console.log(JSON.stringify({verified:c.id,cohort:c.cohort}))
}
assert.equal(rows.length,1116);assert.equal(JSON.stringify(cases),original)
for(const [id,end]of [['184316820266',15],['185262315732',57]]){
 const c=cases.find(c=>c.cohort==='refined'&&c.id===id),pair=c.entries.slice(end-2,end)
 const known=new Map(pair.flatMap(e=>[[e.fenBefore,e.engine],[e.fenAfter,e.playedEngine]]))
 const session=createGameAnalysisSession();let calls=0
 const analyzePosition=async fen=>{calls++;assert(known.has(fen),'No engine fallback');return known.get(fen)}
 const options={baseFen:pair[0].fenBefore,moves:pair.map(e=>e.playedMove),openingBook:createOpeningBook(),session,analyzePosition,analyzePlayedPosition:analyzePosition}
 const first=await analyzeGame(options),second=await analyzeGame(options)
 assert.equal(first[1].classification,'missed');assert.deepEqual(first,second)
 assert.equal(session.get(`analysis:${pair[1].fenBefore}:${pair[1].playedMove}`).missedOpportunity,undefined)
 pipeline.push({id,ply:end,classification:first[1].classification,cachedCalls:calls})
}
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256)
await writeFile(`${area}/verification.json`,JSON.stringify({passed:true,newSearches:0,independentValidation:false,
 policy:'counterfactual-v13',verifiedClassifications:1116,summaries:proposed.summaries,pipeline,
 changes:rows.filter(r=>r.before!==r.after),rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,summaries:proposed.summaries.map(({cohort,before,after,corrected,regressed})=>({cohort,before,after,corrected,regressed})),pipeline}))
