import{readFile,writeFile}from'node:fs/promises'
import{createHash}from'node:crypto'
import assert from'node:assert/strict'
import{applyMoveFacts}from'../src/lib/reviewEvaluation.js'
const area='agent-output/special-completion-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const ledger=await parse(`${area}/ledger.json`)
for(const s of ledger.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
await read('scripts/study-special-tactics.mjs');await read(`${area}/candidate-tactics.mjs`);await read(`${area}/tactical-hypotheses.md`)
const{cases}=await parse(`${area}/cohorts.json`),original=JSON.stringify(cases)
const raw=(await read('src/lib/specialClassification.js')).toString(),source=raw.replaceAll('\r\n','\n')
await writeFile(`${area}/special-before.js`,raw,{flag:'wx'})
const helper=new URL(`../${area}/candidate-tactics.mjs`,import.meta.url).href
const toModule=s=>'data:text/javascript;base64,'+Buffer.from(s.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)).toString('base64')
await writeFile(`${area}/tactical-protocol.json`,JSON.stringify({newSearches:0,independentValidation:false,
 variants:['checking-capture','checking-fork','combined'],sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const baseline=new Map(ledger.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.actual])),results=[]
for(const variant of [{id:'checking-capture',capture:true},{id:'checking-fork',fork:true},{id:'combined',capture:true,fork:true}]){
 let candidate=`import {checkingAttackerCapture,checkingMajorFork} from '${helper}'\n`+source
 if(variant.capture){
  assert(candidate.includes('  if (move.captured) return null'))
  candidate=candidate.replace('  if (move.captured) return null',`  const checkingCapture = move.captured ? checkingAttackerCapture(entry, previous) : null
  if (move.captured && !checkingCapture) return null`)
  const previousGuard="  if (!['mistake', 'blunder'].includes(numerical.classification)) return null"
  assert(candidate.includes(previousGuard))
  candidate=candidate.replace(previousGuard,"  if (!(checkingCapture ? ['inaccuracy', 'mistake', 'blunder'] : ['mistake', 'blunder']).includes(numerical.classification)) return null")
  const hook='  const forcing = assessForcingResponse(entry, roots)'
  assert(candidate.includes(hook))
  candidate=candidate.replace(hook,`  if (checkingCapture) {
    if (Math.min(best, 1 - after) < SPECIAL_POLICY.good) return null
    return { status: 'supported', reason: 'active-checking-attacker-capture', evidenceKind: 'tactical-family',
      modelVersion: 'checking-attacker-recovery-v1', tactic: checkingCapture,
      previousPly: previous.ply, previousMove: previous.playedMove,
      previousNumericalClassification: numerical.classification,
      bestIndex: best, afterIndex: 1 - after,
      coverage: { analyzed: 1, legal: before.moves().length, allLegal: false, scope: 'best-move-and-legal-check-evasion' } }
  }
`+hook)
 }
 if(variant.fork){const hook='    const maintained = Math.min(played.score, 1 - child)'
  assert(candidate.includes(hook))
  candidate=candidate.replace(hook,hook+`
    const checkingFork = baseClassification === 'best' && best.uci === entry.playedUci && maintained >= SPECIAL_POLICY.good
      && !detectMaterialRealization(entry, previous, previousOwn) ? checkingMajorFork(entry) : null
    if (checkingFork) assessment.grande = { status: 'supported', reason: 'verified-checking-major-fork',
      evidenceKind: 'tactical-family', modelVersion: 'checking-major-fork-v1', tactic: checkingFork,
      bestIndex: best.score, maintainedIndex: maintained, coverage: roots.coverage }`)
 }
 await writeFile(`${area}/candidate-${variant.id}.js`,candidate,{flag:'wx'})
 const mod=await import(toModule(candidate)),rows=[]
 for(const c of cases){const after=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
  for(const[i,e]of after.entries()){
   for(const field of ['bestEval','bestMate','playedEval','playedMate','dropPct','bestProbability','playedProbability'])assert(e[field]===c.entries[i][field],`${c.id}/${e.ply}/${field}`)
   rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:baseline.get(`${c.cohort}:${c.id}:${e.ply}`),after:labels[e.classification],grande:e.specialAssessment?.grande})
  }
 }
 const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort),cc=rr.filter(r=>r.before!==r.after)
  return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,
   corrected:cc.filter(r=>r.after===r.expected).length,regressed:cc.filter(r=>r.before===r.expected).length,
   other:cc.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,
   specials:['Grande','Geniale','Mossa mancata'].map(category=>({category,
    beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,
    beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}
 })
 const accepted=summaries.some(s=>s.corrected>0)&&summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
 const r={...variant,accepted,summaries,changes:rows.filter(r=>r.before!==r.after)};results.push(r)
 await writeFile(`${area}/tactical-${variant.id}.json`,JSON.stringify(r,null,2)+'\n',{flag:'wx'})
 console.log(JSON.stringify({id:variant.id,accepted,summaries:summaries.map(({cohort,before,after,corrected,regressed,other})=>({cohort,before,after,corrected,regressed,other})),changes:r.changes.map(({game,ply,san,before,after,expected})=>({game,ply,san,before,after,expected}))}))
}
assert.equal(JSON.stringify(cases),original)
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/tactical-study.json`,JSON.stringify({newSearches:0,independentValidation:false,results,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
