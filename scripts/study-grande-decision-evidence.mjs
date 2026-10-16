import {readFile,writeFile,readdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
const area='agent-output/grande-decision-evidence-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b}
const parse=async p=>JSON.parse(await read(p))
async function tree(p){for(const e of await readdir(p,{withFileTypes:true})){const f=`${p}/${e.name}`;if(e.isDirectory())await tree(f);else if(e.isFile())await read(f)}}
await tree('src');await read('scripts/study-grande-decision-evidence.mjs')
await read(`${area}/hypotheses.md`);await read(`${area}/candidate-response.mjs`)
const frozen=await parse('agent-output/specials-frozen-candidate-v1.json')
for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
const baseline=await parse('agent-output/special-evidence-dossier-v1/verification.json')
for(const s of baseline.sources.filter(s=>s.path.startsWith('src/')))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const {cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json'),original=JSON.stringify(cases)
const label={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const baseMap=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const rawSource=await readFile('src/lib/specialClassification.js','utf8'),source=rawSource.replaceAll('\r\n','\n')
try {assert.equal(await readFile(`${area}/special-before.js`,'utf8'),rawSource)}
catch(e){if(e.code!=='ENOENT')throw e;await writeFile(`${area}/special-before.js`,rawSource,{flag:'wx'})}
const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)).toString('base64')
const helper=new URL(`../${area}/candidate-response.mjs`,import.meta.url).href
const old=`const prior = score(primary(previous.engine))\n    const current = score(primary(entry.engine))`
assert(source.includes(old));assert(source.includes('const equivalent = equivalentResponseAlternative(entry, roots)'))
await writeFile(`${area}/protocol.json`,JSON.stringify({newSearches:0,independentValidation:false,baseline:[173,191,338],
 sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const results=[]
for(const v of [{id:'aligned-context',context:true},{id:'forcing-response',forcing:true},{id:'combined',context:true,forcing:true}]){
 let candidate=source
 if(v.context)candidate=`import {REVIEW_POLICY_VERSION} from '${new URL('../src/lib/reviewEvaluation.js',import.meta.url).href}'\n`+candidate.replace(old,
 `const prior = previous.evaluationEvidence?.version === REVIEW_POLICY_VERSION ? previous.bestProbability : score(primary(previous.engine))
    const current = entry.evaluationEvidence?.version === REVIEW_POLICY_VERSION ? entry.bestProbability : score(primary(entry.engine))`)
 if(v.forcing)candidate=`import {forcingResponse} from '${helper}'\n`+candidate.replace('const equivalent = equivalentResponseAlternative(entry, roots)',
 `const forcing = forcingResponse(entry, roots)
  if (forcing.applicable && forcing.kind === 'no-forcing-event') return {status:'rejected',reason:'no-forcing-response-established',forcing}
  const equivalent = equivalentResponseAlternative(entry, roots)`)
 const mod=await import(moduleUrl(candidate)),rows=[]
 for(const c of cases){const after=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
  for(const [i,e]of after.entries()){const base=baseMap.get(`${c.cohort}:${c.id}:${e.ply}`);assert(base);rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,
    expected:c.expected[i],before:base.after,after:label[e.classification],great:e.specialAssessment?.grande,context:e.specialAssessment?.context})}}
 const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort),cc=rr.filter(r=>r.before!==r.after);return{cohort,
  before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
  corrected:cc.filter(r=>r.after===r.expected).length,regressed:cc.filter(r=>r.before===r.expected).length,
  other:cc.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
  specials:['Mossa mancata','Grande','Geniale'].map(category=>({category,
    beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
    beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
 assert.deepEqual(summaries.map(s=>s.before),[173,191,338])
 const accepted=summaries.some(s=>s.corrected>0)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
 const result={...v,accepted,summaries,changes:rows.filter(r=>r.before!==r.after)}
 await writeFile(`${area}/variant-${v.id}.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'});results.push(result)
 console.log(JSON.stringify({id:v.id,accepted,summaries:summaries.map(({cohort,before,after,corrected,regressed,other})=>({cohort,before,after,corrected,regressed,other}))}))
}
assert.equal(JSON.stringify(cases),original)
for(const [p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/study.json`,JSON.stringify({newSearches:0,independentValidation:false,results,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
