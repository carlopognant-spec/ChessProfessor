import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
import {tracedSpecialSource} from './qa/trace-special-rules.mjs'
const area='agent-output/rule-precedence-audit-v1',sources=new Map(),sha=b=>createHash('sha256').update(b).digest('hex')
await mkdir(area)
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b}
const parse=async p=>JSON.parse(await read(p))
async function tree(p){for(const e of await readdir(p,{withFileTypes:true})){if(e.isDirectory())await tree(`${p}/${e.name}`);else if(e.isFile())await read(`${p}/${e.name}`)}}
await tree('src');await read('scripts/audit-rule-precedence.mjs');await read('scripts/qa/trace-special-rules.mjs')
const frozen=await parse('agent-output/specials-frozen-candidate-v1.json');for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
const baseline=await parse('agent-output/grande-decision-evidence-v1/verification.json')
for(const s of baseline.sources.filter(s=>s.path.startsWith('src/')))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const {cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json'),original=JSON.stringify(cases)
const label={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
await writeFile(`${area}/protocol.json`,JSON.stringify({newSearches:0,independentValidation:false,
 operation:'Trace actually evaluated rules without changing labels; analyze histories and concrete alternatives separately. Unreached rules are not assumed to pass.',sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const mod=await import(tracedSpecialSource(await readFile('src/lib/specialClassification.js','utf8'),await readFile('src/lib/moveOpportunities.js','utf8')))
const baseMap=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),rows=[]
for(const c of cases){
 const entries=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
 for(const [i,e]of entries.entries()){
  const base=baseMap.get(`${c.cohort}:${c.id}:${e.ply}`);assert.equal(label[e.classification],base.after)
  const trace=e.specialAssessment.ruleTrace
  if(e.moveFacts?.forced)trace.push({rule:'forced-fact',category:'forced',status:'final'})
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],actual:label[e.classification],numerical:e.numericalClassification,
   trace,opportunity:e.missedOpportunity,opportunityReason:e.missedOpportunityReason,
   previousOwn:i<2?null:{ply:entries[i-2].ply,san:entries[i-2].playedMove,classification:entries[i-2].classification,numerical:entries[i-2].numericalClassification,best:entries[i-2].bestProbability,played:entries[i-2].playedProbability},
   supportedLabels:[...new Set(trace.filter(t=>t.status==='supported'&&['great','brilliant','missed'].includes(t.category)).map(t=>t.category))]})
 }
 console.log(JSON.stringify({traced:c.id,cohort:c.cohort}))
}
assert.equal(rows.length,1116);assert.equal(JSON.stringify(cases),original)
const overlaps=rows.filter(r=>r.supportedLabels.length>1)
const displaced=rows.filter(r=>r.trace.some(t=>t.status==='supported'&&t.category==='great')&&!['Grande','Geniale'].includes(r.actual))
const dossier=await parse('agent-output/special-evidence-dossier-v1/dossier.json')
const alternatives=dossier.rows.filter(r=>r.cohort==='refined'&&r.actual==='Grande'&&r.expected==='Migliore'
 &&baseMap.get(`${r.cohort}:${r.game}:${r.ply}`)?.after==='Grande').map(r=>({game:r.game,ply:r.ply,move:r.move,fen:r.fenBefore,
 best:r.roots.first,alternative:r.roots.second,gapPct:r.roots.gapPct,warning:'PV outcomes describe stored engine lines, not exhaustive proof against every defense.'}))
for(const [p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/audit.json`,JSON.stringify({newSearches:0,independentValidation:false,applicationChanged:false,verifiedLabels:1116,
 overlaps,displaced,alternatives,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({verified:1116,overlaps:overlaps.length,displaced:displaced.length,alternatives:alternatives.map(r=>({game:r.game,move:r.move}))}))
