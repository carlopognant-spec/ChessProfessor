import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
import{reclassifyReviewedMoves}from'../src/lib/reviewMoves.js'
import{classifyReviewedMove}from'../src/lib/reviewEvaluation.js'
import{analyzeGame,createGameAnalysisSession}from'../src/lib/gameAnalysis.js'
import{createOpeningBook}from'../src/lib/openingBook.js'
import{tracedSpecialSource}from'./qa/trace-special-rules.mjs'
const area='agent-output/rule-precedence-audit-v1',sha=b=>createHash('sha256').update(b).digest('hex'),parse=async p=>JSON.parse(await readFile(p,'utf8'))
const study=await parse(`${area}/episode-study.json`),audit=await parse(`${area}/audit.json`)
assert(study.accepted)
const changed=new Set(['src/lib/specialClassification.js','src/lib/specialPolicy.js'])
for(const s of study.sources)if(!changed.has(s.path))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
for(const s of audit.sources)if(!changed.has(s.path)){
 const path=s.path==='scripts/qa/trace-special-rules.mjs'?`${area}/trace-helper-before.mjs`:s.path
 assert.equal(sha(await readFile(path)),s.sha256,s.path)
}
const sources=[]
for(const path of [...changed,'src/lib/opportunityEpisodes.js','scripts/qa/trace-special-rules.mjs','scripts/verify-opportunity-episodes.mjs'])sources.push({path,sha256:sha(await readFile(path))})
const {cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json'),original=JSON.stringify(cases)
const baseline=new Map(audit.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const changes=new Map(study.changes.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const rows=[]
for(const c of cases){const after=reclassifyReviewedMoves(c.entries)
 for(const[i,e]of after.entries()){
  const key=`${c.cohort}:${c.id}:${e.ply}`,before=baseline.get(key);assert(before)
  assert.equal(labels[e.classification],changes.get(key)?.after??before.actual)
  for(const field of ['bestEval','bestMate','playedEval','playedMate','dropPct','bestProbability','playedProbability'])assert(e[field]===c.entries[i][field],`${key}:${field}`)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:before.actual,after:labels[e.classification],assessment:e.opportunityAssessment})
 }
 console.log(JSON.stringify({verified:c.id,cohort:c.cohort}))}
assert.equal(rows.length,1116);assert.equal(JSON.stringify(cases),original)
const c=cases.find(c=>c.cohort==='refined'&&c.id==='185262315732'),sequence=c.entries.slice(58,62)
const known=new Map(sequence.flatMap(e=>[[e.fenBefore,e.engine],[e.fenAfter,e.playedEngine]])),session=createGameAnalysisSession();let calls=0
const lookup=async fen=>{calls++;assert(known.has(fen),'No engine fallback');return known.get(fen)}
const options={moves:sequence.map(e=>e.playedMove),baseFen:sequence[0].fenBefore,session,openingBook:createOpeningBook(),analyzePosition:lookup,analyzePlayedPosition:lookup}
const first=await analyzeGame(options),cached=await analyzeGame(options)
assert.deepEqual(first.map(e=>e.classification),['blunder','missed','blunder','missed']);assert.deepEqual(first,cached)
assert.equal(session.get(`analysis:${sequence[2].fenBefore}:${sequence[2].playedMove}`).opportunityAssessment,undefined)
const tracedModule=await import(tracedSpecialSource(await readFile('src/lib/specialClassification.js','utf8'),await readFile('src/lib/moveOpportunities.js','utf8')))
const traced=tracedModule.reclassifySpecialMoves(sequence.map(classifyReviewedMove))
assert.deepEqual(traced.map(e=>e.classification),first.map(e=>e.classification))
await writeFile(`${area}/current-episode-trace.json`,JSON.stringify(traced.map(e=>({ply:e.ply,san:e.playedMove,classification:e.classification,trace:e.specialAssessment.ruleTrace})),null,2)+'\n',{flag:'wx'})
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/verification.json`,JSON.stringify({passed:true,version:'counterfactual-v15',newSearches:0,independentValidation:false,
 verifiedClassifications:1116,summaries:study.summaries,changes:rows.filter(r=>r.before!==r.after),rows,
 pipeline:{classifications:first.map(e=>e.classification),cachedCalls:calls,traceMatched:true},sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,summaries:study.summaries.map(({cohort,before,after,corrected,regressed})=>({cohort,before,after,corrected,regressed})),cachedCalls:calls}))
