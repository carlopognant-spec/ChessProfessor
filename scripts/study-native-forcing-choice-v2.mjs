import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {classifyReviewedMove,applyMoveFacts} from '../src/lib/reviewEvaluation.js'
const area='agent-output/native-wdl-study-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
assert((await json(`${area}/interval-verification.json`)).passed)
const broad=await json(`${area}/criticality-study.json`);assert(broad.falsePositives.length)
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),baseline=await json('agent-output/grande-recovery-proof-v1/verification-v20.json')
const before=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r.actual])),deep=new Map(),small=new Map()
for(const [path,map]of [['agent-output/special-completion-evidence-v1/collection.json',deep],['agent-output/all-sacrifice-proofs-v1/collection.json',small]]){
 const collection=await json(path);for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);map.set(map===deep?p.fen:r.index,p.engine)}
}
const nativeCollection=await json('agent-output/native-wdl-evidence-v1/collection.json'),nativePackets=new Map();
for(const r of nativeCollection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);nativePackets.set(p.fen,p.engine)}
const nativeSelection=await json('agent-output/native-wdl-study-v1/selected-targets.json')
const protocol=await json('agent-output/all-sacrifice-proofs-v1/protocol.json'),raw=(await read('src/lib/specialClassification.js')).toString().replaceAll('\r\n','\n')
await read(`${area}/candidate-native-winning-choice.mjs`);await read('scripts/study-native-forcing-choice-v2.mjs')
const hook='      const conversion = roots.coherent && maintained >= SPECIAL_POLICY.winning && alternative.score <= SPECIAL_POLICY.nonWinning\n        && best.score - alternative.score >= SPECIAL_POLICY.gap'
assert(raw.includes(hook))
const helper=new URL(`../${area}/candidate-native-winning-choice.mjs`,import.meta.url).href
let candidate=`import {nativeWinningChoice} from '${helper}'\n`+raw.replace(hook,
 '      const nativeChoice = nativeWinningChoice(entry,roots)\n'+hook+' || Boolean(nativeChoice)')
const reason="reason: defense ? 'critical-defense' : 'critical-winning-choice',"
assert(candidate.includes(reason));candidate=candidate.replace(reason,"reason: defense ? 'critical-defense' : nativeChoice ? 'critical-native-winning-choice' : 'critical-winning-choice',\n          ...(nativeChoice&&!defense ? {nativeOutcome:nativeChoice} : {}),")

const nativeApply=`
function applyNativeDecisionProof(result,entry,previous,previousOwn){
 if(result.classification!=='best'||result.isBookMove||result.moveFacts?.forced||!previous)return result
 const proof=grandeProofFor(entry,entry.nativeDecisionProof)
 if(!proof?.root||!proof.child)return result
 const current=classifyReviewedMove({...entry,engine:proof.root,playedEngine:proof.child})
 if(current.classification!=='best'||current.isEngineBest!==true||current.evaluationEvidence?.source!=='completed-snapshot'||current.evaluationEvidence.status!=='coherent')return result
 const prior=classifyReviewedMove({...previous,playedEngine:proof.root})
 const checked=classifySpecialMove(current,prior,previousOwn)
 if(checked.classification!=='great'||checked.specialAssessment.grande.status!=='supported'||!checked.specialAssessment.grande.nativeOutcome)return result
 return {...result,classification:'great',specialAssessment:{...result.specialAssessment,grande:{...checked.specialAssessment.grande,decisionProof:{version:proof.version,nodes:1000000,numericalProfileUnchanged:true,source:'supplemental-native-outcome-verification'}}}}
}`
const pushHook='results.push(applyGrandeDecisionProof(result, entry, results.at(-1), results.at(-2)))'
assert(candidate.includes(pushHook))
candidate=candidate.replace(pushHook,'results.push(applyNativeDecisionProof(applyGrandeDecisionProof(result, entry, results.at(-1), results.at(-2)), entry, results.at(-1), results.at(-2)))')+nativeApply
await writeFile(`${area}/candidate-forcing-choice-v2.js`,candidate,{flag:'wx'})
await writeFile(`${area}/forcing-choice-protocol-v2.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newSearches:0,
 rationale:'Broad native-outcome-only model rejected: it recognizes ordinary material realizations and quiet Nd6. Add the already-existing necessary forcing-event domain; preserve ordinary-material and decision-novelty guards. These guards have structural meaning independent of labels.',
 selection:'All1116 observations. Freeze v1 rule; extend evidence to all65 selected potential forcing choices, including negative controls. Native-only certificates cannot promote via another rule. Reuse the same original104-pair general proof control and sacrifice evidence as v1. No reference-label selection.',
 distinction:'Deferring a forcing event while losing Win outcome does not disprove a critical winning choice. Native proof checks ordinal outcome separation; no categorical guarantee against unexamined roots.',
 accept:'Positive batch, zero regressions/new false specials; unchanged seven numerical fields. Diagnostic only, no production changes.',sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
const moduleSource=s=>s.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`).replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'},results=[]
for(const [id,code]of [['existing-guards-control',raw],['native-forcing-choice',candidate]]){
 const mod=await import('data:text/javascript;base64,'+Buffer.from(moduleSource(code)).toString('base64')),rows=[]
 for(const c of cases){
  const input=c.entries.map(e=>{
   const root=deep.get(e.fenBefore),child=deep.get(e.fenAfter)
   const observations=protocol.observations.filter(o=>o.cohort===c.cohort&&o.game===c.id&&o.ply===e.ply)
   const targets=protocol.targets.filter(t=>observations.some(o=>o.captureUci===t.captureUci&&o.key===protocol.observations.find(o=>o.cohort===c.cohort&&o.game===c.id&&o.ply===e.ply&&o.captureUci===t.captureUci)?.key)&&t.fen===e.fenAfter)
   const added=targets.map(t=>({version:'acceptance-search-v1',fen:t.fen,captureUci:t.captureUci,acceptedFen:t.acceptedFen,acceptance:small.get(t.acceptance),confirmation:small.get(t.confirmation),recoveries:t.recoveries.map(r=>({...r,search:small.get(r.search),confirmation:small.get(r.confirmation)}))}))
   const selected=nativeSelection.selected.some(t=>t.cohort===c.cohort&&t.game===c.id&&t.ply===e.ply)
   const nativeRoot=selected?nativePackets.get(e.fenBefore):null,nativeChild=selected?nativePackets.get(e.fenAfter):null
   return classifyReviewedMove({...e,...(nativeRoot&&nativeChild?{nativeDecisionProof:{version:'grande-decision-proof-v1',root:nativeRoot,child:nativeChild}}:{}),...(root&&child?{grandeDecisionProof:{version:'grande-decision-proof-v1',root,child}}:{}),
    sacrificeSearches:[...(e.sacrificeSearches??[]).filter(r=>!added.some(a=>a.captureUci===r.captureUci)),...added]})
  })
  const after=mod.reclassifySpecialMoves(input).map(applyMoveFacts)
  for(const[i,e]of after.entries()){
   for(const k of baseline.numericFieldsUnchanged)assert.equal(e[k],input[i][k],`${id}/${c.id}/${e.ply}/${k}`)
   const prior=before.get(`${c.cohort}:${c.id}:${e.ply}`)
   rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:prior,after:labels[e.classification],grande:e.specialAssessment.grande})
  }
  console.log(JSON.stringify({variant:id,cohort:c.cohort,game:c.id}))
 }
 const changes=rows.filter(r=>r.before!==r.after),regressions=changes.filter(r=>r.before===r.expected&&r.after!==r.expected)
 const falseSpecials=rows.filter(r=>['Grande','Geniale'].includes(r.after)&&r.after!==r.expected)
 const result={id,accepted:!regressions.length&&!falseSpecials.length,changes,regressions,falseSpecials,rows}
 results.push(result);console.log(JSON.stringify({variant:id,accepted:result.accepted,changes:changes.map(({cohort,game,ply,san,before,after,expected})=>({cohort,game,ply,san,before,after,expected})),regressions:regressions.length,falseSpecials:falseSpecials.length}))
}
for(const[p,h]of sources)assert.equal(sha(await readFile(p)),h,p)
await writeFile(`${area}/forcing-choice-study-v2.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newSearches:0,productionChanged:false,results,sources:[...sources].map(([path,sha256])=>({path,sha256}))},null,2)+'\n',{flag:'wx'})
