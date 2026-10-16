import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {selectRefinementView,REFINEMENT_POLICY} from '../src/lib/analysisRefinement.js'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {NATIVE_PROOF_POLICY,nativeAlternativeFen} from '../src/lib/nativeEvidence.js'
import {SACRIFICE_SEARCH_POLICY} from '../src/lib/sacrificeSearches.js'
import {applyMoveFacts} from '../src/lib/reviewEvaluation.js'
const area='agent-output/remaining-tactical-families-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const baseline=await json('agent-output/native-winning-integration-v1/verification.json');assert(baseline.passed)
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),deep=new Map(),small=new Map()
for(const collection of ['special-completion-evidence-v1','native-wdl-evidence-v1','native-alternative-evidence-v1']){
 const c=await json(`agent-output/${collection}/collection.json`)
 for(const r of c.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);if(p.nodes===1000000&&p.multiPv===5&&!p.searchMoves&&!deep.has(p.fen))deep.set(p.fen,p.engine)}
}
const sp=await json('agent-output/all-sacrifice-proofs-v1/protocol.json'),sc=await json('agent-output/all-sacrifice-proofs-v1/collection.json')
for(const r of sc.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);small.set(r.index,JSON.parse(b).engine)}
const base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),oldRecovery=await json('agent-output/all-sacrifice-proofs-v1/verification-v2.json')
const recovery=new Set(oldRecovery.rows.filter(r=>r.grande?.decisionProof).map(r=>`${r.cohort}:${r.game}:${r.ply}`))
const raw=(await read('src/lib/specialClassification.js')).toString().replaceAll('\r\n','\n')
for(const p of ['scripts/study-legal-major-classification.mjs',`${area}/queen-evasion.mjs`,`${area}/knight-pin-evasion.mjs`,`${area}/bishop-skewer.mjs`])await read(p)
const queen=new URL(`../${area}/queen-evasion.mjs`,import.meta.url).href,knight=new URL(`../${area}/knight-pin-evasion.mjs`,import.meta.url).href,bishop=new URL(`../${area}/bishop-skewer.mjs`,import.meta.url).href
let candidate=`import {newQueenEvasionWinningMajor} from '${queen}'\nimport {knightPawnEvasionExploitingQueenPin} from '${knight}'\nimport {newBishopRookSkewer,proveBishopSkewerGain,verifyBishopSkewerGain} from '${bishop}'\n`+raw
const hook="    if (assessment.grande.status === 'supported' && !response) assessment.events.push"
assert(candidate.includes(hook))
candidate=candidate.replace(hook,`    if(baseClassification==='best'&&roots.coherent&&best.uci===entry.playedUci&&maintained>=SPECIAL_POLICY.good
      &&!detectMaterialRealization(entry,previous,previousOwn)&&!restoredMateRoute(entry,previous,previousOwn)){
      let tactic=newQueenEvasionWinningMajor(entry,previous,previousOwn)??knightPawnEvasionExploitingQueenPin(entry)
      if(!tactic&&newBishopRookSkewer(entry)){
        const searched=proveBishopSkewerGain(entry,{maxOwnMoves:2,maxNodes:100000})
        if(searched.status==='proved'&&verifyBishopSkewerGain(entry,searched))tactic={kind:'verified-bishop-rook-skewer',...searched}
      }
      if(tactic)assessment.grande={status:'supported',reason:'verified-major-piece-tactic',evidenceKind:'tactical-family',modelVersion:'legal-major-tactics-v1',tactic,bestIndex:best.score,maintainedIndex:maintained,coverage:roots.coverage}
    }
`+hook)
const gate="if(checked.classification!=='great'||checked.specialAssessment.grande.status!=='supported'||!checked.specialAssessment.grande.nativeOutcome)return result"
assert(candidate.includes(gate));candidate=candidate.replace(gate,"if(checked.classification!=='great'||checked.specialAssessment.grande.status!=='supported'||!(checked.specialAssessment.grande.nativeOutcome||checked.specialAssessment.grande.reason==='verified-major-piece-tactic'))return result")
await writeFile(`${area}/candidate-special-classification.js`,candidate,{flag:'wx'})
await writeFile(`${area}/classification-protocol.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,
 hypothesis:'Three separate legal material tactics, guarded by existing numerical Best/coherent pair/held-good/material-realization/restored-mate constraints. Paired decisive certificates can support these tactics without a native unique-Win comparison; their legal proof establishes a different concrete event.',
 selection:'All1116 observations. Reuse validated existing1M pairs for every available entry and all available independent alternative children; never choose evidence via expected labels. Reproduce the exact verified v22 baseline before evaluating the candidate.',
 acceptance:'Three new correct Greats, no regression/false special, unchanged seven numerical fields, no reference/threshold changes.',sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const moduleCode=candidate.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`).replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)
const mod=await import('data:text/javascript;base64,'+Buffer.from(moduleCode).toString('base64'))
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},rows=[]
for(const c of cases){
 const seeded=reclassifyReviewedMoves(structuredClone(c.entries).map(e=>{
  const observations=sp.observations.filter(o=>o.cohort===c.cohort&&o.game===c.id&&o.ply===e.ply)
  const offers=sp.targets.filter(t=>t.fen===e.fenAfter&&observations.some(o=>o.captureUci===t.captureUci))
  const sacrifices=offers.map(t=>({version:SACRIFICE_SEARCH_POLICY.version,fen:t.fen,captureUci:t.captureUci,acceptedFen:t.acceptedFen,
   acceptance:small.get(t.acceptance),confirmation:small.get(t.confirmation),recoveries:t.recoveries.map(r=>({uci:r.uci,afterFen:r.afterFen,search:small.get(r.search),confirmation:small.get(r.confirmation)}))}))
  const hasRecovery=recovery.has(`${c.cohort}:${c.id}:${e.ply}`)
  if(!offers.length&&!hasRecovery)return e
  return{...e,refinement:{...e.refinement,version:REFINEMENT_POLICY.version,
   ...(hasRecovery?{grandeProof:{version:'grande-decision-proof-v1',root:deep.get(e.fenBefore),child:deep.get(e.fenAfter)}}:{}),
   sacrifices:[...(e.refinement?.sacrifices??[]).filter(r=>!sacrifices.some(s=>s.captureUci===r.captureUci)),...sacrifices]}}
 }))
 const projected=selectRefinementView(seeded,true).map(e=>{
  const root=deep.get(e.fenBefore),child=deep.get(e.fenAfter)
  if(!validGrandeSearch(root,e.fenBefore)||!validGrandeSearch(child,e.fenAfter))return e
  const alternatives=root.specialLines.filter(l=>l.pv[0]!==e.playedUci).flatMap(l=>{
   const uci=l.pv[0],fen=nativeAlternativeFen(e,uci),engine=deep.get(fen);return validGrandeSearch(engine,fen)?[{uci,fen,engine}]:[]
  })
  return{...e,nativeDecisionProof:{version:NATIVE_PROOF_POLICY.version,root,child,alternatives,attempts:[]}}
 })
 const before=reclassifyReviewedMoves(projected)
 for(const e of before)assert.equal(labels[e.classification],base.get(`${c.cohort}:${c.id}:${e.ply}`).actual,`${c.cohort}/${c.id}/${e.ply}/v22 baseline`)
 const after=mod.reclassifySpecialMoves(before).map(applyMoveFacts)
 for(const[i,e]of after.entries()){
  for(const k of baseline.numericFieldsUnchanged)assert.equal(e[k],before[i][k],`${c.id}/${e.ply}/${k}`)
  const prior=base.get(`${c.cohort}:${c.id}:${e.ply}`)
  rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:prior.actual,after:labels[e.classification],grande:e.specialAssessment.grande})
 }
 console.log(JSON.stringify({cohort:c.cohort,game:c.id,processed:after.length}))
}
const changes=rows.filter(r=>r.before!==r.after),regressions=changes.filter(r=>r.before===r.expected&&r.after!==r.expected),strongest=rows.filter(r=>r.cohort!=='initial')
const specials=['Grande','Geniale'].map(category=>({category,correct:strongest.filter(r=>r.after===category&&r.expected===category).length,expected:strongest.filter(r=>r.expected===category).length,false:strongest.filter(r=>r.after===category&&r.expected!==category).length}))
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
const accepted=changes.length===3&&changes.every(r=>r.after===r.expected)&&!regressions.length&&specials.every(s=>!s.false)
await writeFile(`${area}/classification-study.json`,JSON.stringify({accepted,developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanged:false,specials,changes,regressions,rows,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({accepted,specials,changes:changes.map(({game,ply,san,before,after,expected})=>({game,ply,san,before,after,expected})),regressions:regressions.length}))
