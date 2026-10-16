import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView,buildRefinementPlan,refineGameEntries} from '../src/lib/analysisRefinement.js'
const area='agent-output/grande-recovery-proof-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const baseline=await parse(`${area}/verification-v20.json`)
for(const s of baseline.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
for(const p of ['scripts/study-rook-activation.mjs',`${area}/candidate-rook-access.mjs`,`${area}/rook-access-hypothesis.md`,`${area}/forced-recoveries-hypothesis.md`])await read(p)
const {cases}=await parse('agent-output/special-completion-v1/cohorts.json'),original=JSON.stringify(cases)
const collection=await parse('agent-output/special-completion-evidence-v1/collection.json'),packets=new Map()
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);packets.set(p.fen,p)}
const rookProtocol=await parse('agent-output/rook-activation-evidence-v1/protocol.json'),rookCollection=await parse('agent-output/rook-activation-evidence-v1/collection.json'),rookPackets=new Map()
assert((await parse('agent-output/rook-activation-evidence-v1/replay-check.json')).passed)
for(const r of rookCollection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);rookPackets.set(r.index,JSON.parse(b).engine)}
const helpers=new URL(`../${area}/candidate-rook-access.mjs`,import.meta.url).href
const moduleSource=(source,base)=>source.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`).replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,base).href}'`)
const evidenceRaw=(await read('src/lib/sacrificeEvidence.js')).toString(),raw=(await read('src/lib/specialClassification.js')).toString()
await writeFile(`${area}/sacrifice-evidence-before-v21.js`,evidenceRaw,{flag:'wx'})
await writeFile(`${area}/special-before-v21.js`,raw,{flag:'wx'})
let evidence=`import {validSacrificeSearch} from '${new URL('../src/lib/sacrificeSearches.js',import.meta.url).href}'\n`+evidenceRaw.replaceAll('\r\n','\n')
const returnHook='  return { ...evidence, acceptanceSearches:';assert(evidence.includes(returnHook))
evidence=evidence.replace(returnHook,`  return { ...evidence, forcedRecoveries: stored.map(r=>({captureUci:r.captureUci,fen:r.acceptedFen,recoveries:r.recoveries??[]})), acceptanceSearches:`)
const recoveryHook='    const candidates = evidence?.recoverySearches?.filter';assert(evidence.includes(recoveryHook))
evidence=evidence.replace(recoveryHook,`    const explicit = assessForcedRecoveries(evidence,captureUci,acceptedFen,recoveryUcis,{good,consistency})
    if (explicit) return explicit
`+recoveryHook)
evidence+=`
function assessForcedRecoveries(evidence,captureUci,fen,ucis,{good,consistency}) {
 try {
  const groups=evidence?.forcedRecoveries?.filter(r=>r.captureUci===captureUci&&r.fen===fen)
  if(groups?.length!==1)return null
  const choices=[]
  for(const uci of ucis){
   const rows=groups[0].recoveries.filter(r=>r.uci===uci);if(rows.length!==1)return null
   const r=rows[0],b=new Chess(fen);b.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
   if(r.afterFen!==b.fen()||!validSacrificeSearch(r.search,fen,uci)||!validSacrificeSearch(r.confirmation,r.afterFen))return null
   for(const e of [r.search,r.confirmation])if(e.actualNodes<=0||e.actualNodes>e.analysisMetadata.budget.value+5000)return null
   const a=index(primary(r.search)),z=index(primary(r.confirmation))
   if(a==null||z==null||Math.max(a,1-z)>=good||Math.abs(a-(1-z))>consistency)return null
   choices.push({uci,rootIndex:a,childIndex:1-z,scope:'forced-root-and-child-search'})
  }
  return{kind:'unfavorable-material-recoveries',source:'explicit-forced-recovery-proofs',choices,proofAgainstEveryDefense:false}
 }catch{return null}
}
`
await writeFile(`${area}/candidate-forced-recoveries.js`,evidence,{flag:'wx'})
const evidenceModule='data:text/javascript;base64,'+Buffer.from(moduleSource(evidence,new URL('../src/lib/sacrificeEvidence.js',import.meta.url))).toString('base64')
const baseSource=raw.replaceAll('\r\n','\n').replace("from './sacrificeEvidence.js'",`from '${evidenceModule}'`)
const variants=[{id:'evidence-only',source:baseSource}]
let candidate=`import {newRookKingFileAccess,verifiedRookAttackParticipation} from '${helpers}'\n`+baseSource
const replace=(from,to)=>{assert(candidate.includes(from),from);candidate=candidate.replace(from,to)}
const offerHook='  const offered = offers(entry.fenBefore, entry.fenAfter, side, baseline)'
replace(offerHook,offerHook+`
  const rookAccess = roots.raw.every(l=>l.mate==null) && primary(entry.engine)?.mate==null && primary(entry.playedEngine)?.mate==null
    ? newRookKingFileAccess(entry) : null`)
replace("        return { status: 'rejected', reason: 'persistent-offer' }",`        if (!rookAccess) return { status: 'rejected', reason: 'persistent-offer' }
        offer.persistent = true`)
const corroborationHook='    const recoveryAssessment = recoveries.length && corroboration'
replace(corroborationHook,`    const rookActivation = offer.persistent && rookAccess ? verifiedRookAttackParticipation(entry,rookAccess,acceptance.pv) : null
    if (offer.persistent && !rookActivation) return { status: 'rejected', reason: 'persistent-offer' }
    if (rookActivation && !corroboration) { incomplete.push('unresolved-tactical-sequence'); continue }
`+corroborationHook)
replace("      compensation: 'engine-estimate', afterIndex: 1 - score(acceptance),",`      compensation: 'engine-estimate', afterIndex: 1 - score(acceptance),
      ...(rookActivation ? {rookActivation} : {}),`)
replace('      if (!qualifying.some(offer => offer.forcedMatingAcceptance)) {','      if (!qualifying.some(offer => offer.forcedMatingAcceptance || offer.rookActivation)) {')
replace("  return { status: 'supported', reason: 'compensated-new-offer', offers: qualifying,", "  return { status: 'supported', reason: qualifying.some(o=>o.rookActivation) ? 'compensated-rook-activation' : 'compensated-new-offer', offers: qualifying,")
variants.push({id:'rook-activation',source:candidate})
await writeFile(`${area}/rook-activation-study-protocol.json`,JSON.stringify({variants:variants.map(v=>v.id),newSearches:0,independentValidation:false,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const before=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.actual]))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},inputs=[]
for(const c of cases){
 let entries=reclassifyReviewedMoves(c.entries),plan=buildRefinementPlan(entries,{grandeOnly:true})
 if(plan.scope==='grande-recovery-proof-v1')entries=selectRefinementView((await refineGameEntries({entries,plan,analyzePosition:async(f)=>structuredClone(packets.get(f).engine)})).entries,true)
 entries=entries.map(e=>{
  const offers=rookProtocol.offers.filter(o=>o.game===c.id&&o.ply===e.ply)
  if(!offers.length)return e
  const added=offers.map(o=>({version:'acceptance-search-v1',fen:o.fen,captureUci:o.capture,acceptedFen:o.acceptedFen,
   acceptance:rookPackets.get(o.acceptance),confirmation:rookPackets.get(o.confirmation),recoveries:o.recoveries.map(r=>({uci:r.uci,afterFen:r.afterFen,search:rookPackets.get(r.search),confirmation:rookPackets.get(r.confirmation)}))}))
  return{...e,sacrificeSearches:[...(e.sacrificeSearches??[]).filter(r=>!added.some(a=>a.captureUci===r.captureUci)),...added]}
 })
 inputs.push({...c,entries})
}
const results=[]
for(const variant of variants){
 await writeFile(`${area}/candidate-${variant.id}.js`,variant.source,{flag:'wx'})
 const mod=await import('data:text/javascript;base64,'+Buffer.from(moduleSource(variant.source,new URL('../src/lib/specialClassification.js',import.meta.url))).toString('base64')),rows=[]
 for(const c of inputs){
  const after=mod.reclassifySpecialMoves(c.entries).map(applyMoveFacts)
  for(const [i,e]of after.entries()){
   for(const field of baseline.numericFieldsUnchanged)assert(e[field]===c.entries[i][field],`${c.id}/${e.ply}/${field}`)
   rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:before.get(`${c.cohort}:${c.id}:${e.ply}`),after:labels[e.classification],brilliant:e.specialAssessment.brilliant})
  }
  console.log(JSON.stringify({variant:variant.id,tested:c.id,cohort:c.cohort}))
 }
 const summaries=['initial','refined','old'].map(cohort=>{const rr=rows.filter(r=>r.cohort===cohort);return{cohort,before:rr.filter(r=>r.before===r.expected).length,after:rr.filter(r=>r.after===r.expected).length,corrected:rr.filter(r=>r.before!==r.expected&&r.after===r.expected).length,regressed:rr.filter(r=>r.before===r.expected&&r.after!==r.expected).length,
  specials:['Grande','Geniale','Mossa mancata'].map(category=>({category,beforeTP:rr.filter(r=>r.expected===category&&r.before===category).length,afterTP:rr.filter(r=>r.expected===category&&r.after===category).length,beforeFP:rr.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rr.filter(r=>r.expected!==category&&r.after===category).length}))}})
 const safe=summaries.every(s=>!s.regressed&&s.specials.every(t=>t.afterTP>=t.beforeTP&&t.afterFP<=t.beforeFP))
 const result={id:variant.id,accepted:safe&&(variant.id==='evidence-only'||summaries.some(s=>s.corrected>0)),summaries,changes:rows.filter(r=>r.before!==r.after)}
 results.push(result)
 console.log(JSON.stringify({variant:variant.id,accepted:result.accepted,summaries,changes:result.changes.map(({cohort,game,ply,san,before,after,expected})=>({cohort,game,ply,san,before,after,expected}))}))
}
assert.equal(JSON.stringify(cases),original);for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/rook-activation-study.json`,JSON.stringify({results,newSearches:0,independentValidation:false,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
