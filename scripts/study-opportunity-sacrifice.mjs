// Compare all predeclared variants together, offline, without app mutations.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {classifyReviewedMove,applyMoveFacts} from '../src/lib/reviewEvaluation.js'
const area='agent-output/opportunity-sacrifice-batch-v1',sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>JSON.parse(await readFile(p,'utf8'))
const audit=await read(`${area}/diagnosis.json`),{cases}=await read(`${area}/cohorts.json`)
for(const s of audit.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const sources=[...audit.sources]
for(const path of [`${area}/hypotheses.md`,`${area}/candidate-evidence.mjs`,'scripts/study-opportunity-sacrifice.mjs',`${area}/cohorts.json`,`${area}/diagnosis.json`])sources.push({path,sha256:sha(await readFile(path))})
const specialSource=await readFile('src/lib/specialClassification.js','utf8'),opportunitySource=await readFile('src/lib/moveOpportunities.js','utf8')
await writeFile(`${area}/special-before.js`,specialSource,{flag:'wx'})
await writeFile(`${area}/opportunities-before.js`,opportunitySource,{flag:'wx'})
const helperUrl=new URL(`../${area}/candidate-evidence.mjs`,import.meta.url).href
const absoluteModule=(source,file)=>'data:text/javascript;base64,'+Buffer.from(source
  .replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL(path,new URL(file,import.meta.url)).href}'`)).toString('base64')
const oldCondition=`if (!alternativeOffers.length || qualifying.every(offer => !offer.movedPiece`
assert.equal(specialSource.split(oldCondition).length,2)
function build(v){
  let opportunity=opportunitySource
  if(v.mate){
    opportunity=`import {completedComparisonLines} from '${helperUrl}'\n`+opportunity
    opportunity=opportunity.replace('const primary = primaryLine(entry.engine)',
      `const comparison = entry.evaluationEvidence?.source === 'completed-snapshot' ? completedComparisonLines(entry) : null
  const primary = comparison?.[0] ?? primaryLine(entry.engine)`)
      .replace("const playedRoot = entry.engine?.lines?.find(line => line.pv?.[0] === entry.playedUci)",
        "const playedRoot = (comparison ?? entry.engine?.lines)?.find(line => line.pv?.[0] === entry.playedUci)")
  }
  if(v.equilibrium||v.intermediate){
    opportunity=`import {additionalOpportunity} from '${helperUrl}'\n`+opportunity
    opportunity=opportunity.replace('export function classifyMoveOpportunity(entry, previous) {','function originalOpportunity(entry, previous) {')
    opportunity+=`\nexport function classifyMoveOpportunity(entry,previous){return additionalOpportunity(originalOpportunity(entry,previous),entry,previous,{equilibrium:${Boolean(v.equilibrium)},intermediate:${Boolean(v.intermediate)}})}\n`
  }
  const oppUrl=absoluteModule(opportunity,'../src/lib/moveOpportunities.js')
  let special=specialSource.replace("from './moveOpportunities.js'",`from '${oppUrl}'`)
  if(v.alternative){
    special=`import {preExistingAlternativeOffer} from '${helperUrl}'\n`+special
    special=special.replace(oldCondition,`if (!alternativeOffers.length || alternativeOffers.every(other => preExistingAlternativeOffer(entry, other)) || qualifying.every(offer => !offer.movedPiece`)
  }
  return{opportunity,special,url:absoluteModule(special,'../src/lib/specialClassification.js')}
}
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const numerical=new Map(cases.map(c=>[c,c.entries.map(classifyReviewedMove)])),original=JSON.stringify(cases)
async function compare(v){
  const proposed=build(v),module=await import(proposed.url),rows=[]
  for(const c of cases){
    const after=module.reclassifySpecialMoves(numerical.get(c)).map(applyMoveFacts)
    for(const[e,i]of after.map((e,i)=>[e,i]))rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],
      before:labels[c.entries[i].classification],after:labels[e.classification],reason:e.missedOpportunityReason,
      opportunity:e.missedOpportunity,brilliant:e.specialAssessment?.brilliant,fenBefore:e.fenBefore})
    console.log(JSON.stringify({variant:v.id,compared:c.id,cohort:c.cohort}))
  }
  const summaries=['initial','refined','old'].map(cohort=>{
    const rr=rows.filter(r=>r.cohort===cohort),changes=rr.filter(r=>r.before!==r.after)
    return{cohort,total:rr.length,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
      corrected:changes.filter(r=>r.after===r.expected).length,regressed:changes.filter(r=>r.before===r.expected).length,
      other:changes.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
      categories:['Geniale','Grande','Mossa mancata'].map(category=>({category,
        beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
        beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}
  })
  assert.deepEqual(summaries.map(s=>s.before),[172,188,338])
  const benefit=summaries.some(s=>s.corrected>0||s.categories.some(c=>c.afterFP<c.beforeFP))
  const safe=summaries.every(s=>s.regressed===0&&s.categories.every(c=>c.afterTP>=c.beforeTP&&c.afterFP<=c.beforeFP))
  const report={...v,accepted:benefit&&safe,summaries,changes:rows.filter(r=>r.before!==r.after)}
  await writeFile(`${area}/variant-${v.id}.json`,JSON.stringify(report,null,2)+'\n',{flag:'wx'})
  return{report,rows}
}
const variants=[{id:'equilibrium',equilibrium:true},{id:'intermediate',intermediate:true},{id:'snapshot-mate',mate:true},{id:'existing-offer',alternative:true}]
const compared=[]
for(const v of variants)compared.push(await compare(v))
const accepted=variants.filter((_,i)=>compared[i].report.accepted)
const combined=await compare({id:'combined',equilibrium:accepted.some(v=>v.equilibrium),intermediate:accepted.some(v=>v.intermediate),mate:accepted.some(v=>v.mate),alternative:accepted.some(v=>v.alternative)})
assert.equal(JSON.stringify(cases),original)
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/study.json`,JSON.stringify({newSearches:0,independentValidation:false,applicationChanged:false,
  accepted:accepted.map(v=>v.id),variants:compared.map(c=>c.report),combined:combined.report,rows:combined.rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({accepted:accepted.map(v=>v.id),combined:combined.report.summaries},null,2))
