import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
const area='agent-output/special-completion-v1'
const parse=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex')
const baseline=await parse(`${area}/verification-v16.json`),study=await parse(`${area}/forced-mating-sacrifice-study.json`)
assert(study.accepted)
const allowed=new Set(['src/lib/specialClassification.js','src/lib/specialPolicy.js'])
for(const s of baseline.sources)if(!allowed.has(s.path))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const sources=await Promise.all([...allowed,'src/lib/tacticalEvidence.js','src/lib/deferredResponse.js','scripts/verify-forced-mating-sacrifice.mjs'].map(async path=>({path,sha256:sha(await readFile(path))})))
const {cases}=await parse(`${area}/cohorts.json`),original=JSON.stringify(cases)
const before=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const changes=new Map(study.changes.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},rows=[]
for(const c of cases){
 const after=reclassifyReviewedMoves(c.entries)
 for(const [i,e]of after.entries()){
  const key=`${c.cohort}:${c.id}:${e.ply}`,prior=before.get(key)
  assert.equal(labels[e.classification],changes.get(key)?.after??prior.actual,key)
  for(const field of baseline.numericFieldsUnchanged)assert(e[field]===c.entries[i][field],`${key}:${field}`)
  assert.equal(e.specialAssessment.version,'counterfactual-v17')
  rows.push({...prior,before:prior.actual,actual:labels[e.classification],grande:e.specialAssessment.grande,brilliant:e.specialAssessment.brilliant})
 }
 console.log(JSON.stringify({verified:c.id,cohort:c.cohort}))
}
assert.equal(JSON.stringify(cases),original)
const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.actual===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.actual!==r.expected).length}})
assert(summaries.every(r=>!r.regressed))
const primary=rows.filter(r=>r.cohort!=='initial'),specials=['Grande','Geniale'].map(category=>({category,expected:primary.filter(r=>r.expected===category).length,correct:primary.filter(r=>r.expected===category&&r.actual===category).length,false:primary.filter(r=>r.expected!==category&&r.actual===category).length}))
assert.deepEqual(specials.map(r=>[r.correct,r.expected,r.false]),[[21,34,0],[3,4,0]])
const unresolved=primary.filter(r=>['Grande','Geniale'].includes(r.expected)&&r.actual!==r.expected||['Grande','Geniale'].includes(r.actual)&&r.actual!==r.expected)
assert.equal(unresolved.length,14)
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/verification-v17.json`,JSON.stringify({passed:true,version:'counterfactual-v17',developmentOnly:true,independentValidation:false,distinctMoves:854,observations:1116,newSearches:0,inputsUnchanged:true,numericFieldsUnchanged:baseline.numericFieldsUnchanged,summaries,specials,unresolved,changes:rows.filter(r=>r.before!==r.actual),rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,summaries,specials,unresolved:unresolved.length}))
