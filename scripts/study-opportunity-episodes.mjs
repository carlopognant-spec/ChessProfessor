import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
import{applyMoveFacts}from'../src/lib/reviewEvaluation.js'
const area='agent-output/rule-precedence-audit-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b}
const parse=async p=>JSON.parse(await read(p))
const audit=await parse(`${area}/audit.json`)
for(const s of audit.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await read(`${area}/episode-hypothesis.md`);await read(`${area}/candidate-episode.mjs`);await read('scripts/study-opportunity-episodes.mjs')
const {cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json'),original=JSON.stringify(cases)
const before=new Map(audit.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const source=(await read('src/lib/specialClassification.js')).toString('utf8').replaceAll('\r\n','\n')
await writeFile(`${area}/special-before.js`,source,{flag:'wx'})
let candidate=`import{retainEstablishedWinningBlunder}from'${new URL(`../${area}/candidate-episode.mjs`,import.meta.url).href}'\n`+source
const marker='  let result = classifyMoveOpportunity(entry, previous)'
assert.equal(candidate.split(marker).length,2)
candidate=candidate.replace(marker,marker+'\n  result = retainEstablishedWinningBlunder(result, entry, previous, previousOwn)')
const guard="  if (result.classification === 'missed') {"
assert.equal(candidate.split(guard).length,2)
candidate=candidate.replace(guard,"  if (result.opportunityAssessment?.status === 'retain-numerical') return result\n"+guard)
const url='data:text/javascript;base64,'+Buffer.from(candidate.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)).toString('base64')
await writeFile(`${area}/episode-protocol.json`,JSON.stringify({sources:[...sources].map(([path,sha256])=>({path,sha256})),newSearches:0},null,2)+'\n',{flag:'wx'})
const mod=await import(url),rows=[]
for(const c of cases){const entries=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
 for(const [i,e]of entries.entries())rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:before.get(`${c.cohort}:${c.id}:${e.ply}`).actual,
  after:({book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'})[e.classification],assessment:e.opportunityAssessment})
 console.log(JSON.stringify({studied:c.id,cohort:c.cohort}))}
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort),cc=rr.filter(r=>r.before!==r.after);return{cohort,
 before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
 corrected:cc.filter(r=>r.after===r.expected).length,regressed:cc.filter(r=>r.before===r.expected).length,
 other:cc.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
 specials:['Mossa mancata','Grande','Geniale'].map(category=>({category,
 beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
 beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
assert.deepEqual(summaries.map(s=>s.before),[175,193,338]);assert.equal(JSON.stringify(cases),original)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const accepted=summaries.some(s=>s.corrected)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
await writeFile(`${area}/episode-study.json`,JSON.stringify({accepted,newSearches:0,independentValidation:false,summaries,changes:rows.filter(r=>r.before!==r.after),rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({accepted,summaries:summaries.map(({cohort,before,after,corrected,regressed,other})=>({cohort,before,after,corrected,regressed,other}))}))
