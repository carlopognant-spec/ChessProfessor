import {NATIVE_PROOF_POLICY,nativeProofFor,validNativeAttempt} from './nativeEvidence.js'
import {validGrandeSearch} from './grandeProofs.js'
import {potentialNativeSearch} from './nativeWinningChoice.js'
import {pendingNativeAlternatives} from './specialClassification.js'
import {restoredMateRoute} from './restoredMateRoute.js'
function knownEvidence(entries){
 const complete=new Map(),attempted=new Map()
 const add=(engine,fen)=>{
  if(!validNativeAttempt(engine,fen))return
  if(!attempted.has(fen))attempted.set(fen,engine)
  if(!complete.has(fen)&&validGrandeSearch(engine,fen))complete.set(fen,engine)
 }
 // Retain the exact separately stored certificate before reusing other searches.
 for(const e of entries){const p=nativeProofFor(e);if(!p)continue
  add(p.root,e.fenBefore);add(p.child,e.fenAfter)
  for(const r of p.alternatives)add(r.engine,r.fen)
  for(const r of p.attempts)add(r.engine,r.fen)
 }
 for(const e of entries){
  for(const engine of [e.engine,e.refinement?.engine,e.refinement?.grandeProof?.root])add(engine,e.fenBefore)
  for(const engine of [e.playedEngine,e.refinement?.playedEngine,e.refinement?.grandeProof?.child])add(engine,e.fenAfter)
  for(const r of e.refinement?.sacrifices??[])add(r.confirmation,r.acceptedFen)
 }
 return{complete,attempted}
}
export function buildNativeProofPlan(entries,view,version){
 const {complete,attempted}=knownEvidence(entries),positions=new Set(),targets=[]
 let candidateCount=0
 for(const[i,e]of view.entries()){
  if(!potentialNativeSearch(e)||restoredMateRoute(e,view[i-1],view[i-2]))continue
  candidateCount++
  if(targets.length>=NATIVE_PROOF_POLICY.maxMoves)continue
  const raw=entries[i],pair=[e.fenBefore,e.fenAfter],missing=pair.filter(f=>!attempted.has(f))
  let target
  if(missing.length)target={ply:e.ply,phase:'pair',alternatives:[]}
  else{
   if(!pair.every(f=>complete.has(f)))continue
   const data={version:NATIVE_PROOF_POLICY.version,root:complete.get(e.fenBefore),child:complete.get(e.fenAfter)}
   const alternatives=pendingNativeAlternatives(e,view[i-1],view[i-2],data)
   if(!alternatives?.length)continue
   const old=nativeProofFor(raw),allStored=old?.root&&old.child&&alternatives.every(a=>old.alternatives.some(r=>r.uci===a.uci&&r.fen===a.fen))
   if(allStored)continue
   for(const a of alternatives)if(!attempted.has(a.fen))missing.push(a.fen)
   if(!missing.length&&!alternatives.every(a=>complete.has(a.fen)))continue
   target={ply:e.ply,phase:'alternatives',alternatives}
  }
  const fresh=missing.filter(f=>!positions.has(f))
  if(positions.size+fresh.length>NATIVE_PROOF_POLICY.maxPositions)continue
  targets.push(target);for(const f of fresh)positions.add(f)
 }
 const selectedPlies=targets.map(t=>t.ply)
 return{version,scope:NATIVE_PROOF_POLICY.scope,selectionVersion:NATIVE_PROOF_POLICY.version,selectedPlies,candidateCount,
  selection:targets.map(t=>({ply:t.ply,reason:'critical-outcome-evidence',phase:t.phase,priority:0})),targets,
  positions:[...positions],sacrifices:[],extraSearches:0,nodes:NATIVE_PROOF_POLICY.nodes,
  nominalNodes:positions.size*NATIVE_PROOF_POLICY.nodes,actualNodeCap:positions.size*(NATIVE_PROOF_POLICY.nodes+NATIVE_PROOF_POLICY.reserve)}
}
const abort=signal=>{if(signal?.aborted){const e=new Error('Verifica interrotta');e.name='AbortError';throw e}}
export async function refineNativeProofs({entries,plan,analyzePosition,signal,onEntries,onProgress}){
 const {complete,attempted}=knownEvidence(entries)
 let updated=entries,actualNodes=0,searches=0
 const publish=()=>{
  updated=entries.map(e=>{
   const target=plan.targets.find(t=>t.ply===e.ply);if(!target)return e
   const prior=nativeProofFor(e),alternatives=new Map((prior?.alternatives??[]).map(r=>[r.uci,r]))
   for(const a of target.alternatives){const engine=complete.get(a.fen);if(engine)alternatives.set(a.uci,{...a,engine})}
   const relevant=[{fen:e.fenBefore},{fen:e.fenAfter},...target.alternatives],attempts=new Map((prior?.attempts??[]).map(r=>[r.fen,r]))
   for(const r of relevant){const engine=attempted.get(r.fen);if(engine)attempts.set(r.fen,{...r,engine})}
   return{...e,refinement:{...e.refinement,version:plan.version,nativeProof:{version:NATIVE_PROOF_POLICY.version,
    root:complete.get(e.fenBefore)??prior?.root??null,child:complete.get(e.fenAfter)??prior?.child??null,
    alternatives:[...alternatives.values()],attempts:[...attempts.values()]}}}
  })
  onEntries?.(updated)
 }
 abort(signal);publish()
 for(const fen of plan.positions){
  abort(signal)
  if(actualNodes+plan.nodes+NATIVE_PROOF_POLICY.reserve>plan.actualNodeCap)throw Error('Budget di verifica esaurito')
  const engine=await analyzePosition(fen,plan.nodes,5)
  abort(signal)
  if(!validNativeAttempt(engine,fen)||engine.analysisMetadata.multiPv!==5)throw Error('Prova della scelta decisiva incompatibile')
  actualNodes+=engine.actualNodes
  if(actualNodes>plan.actualNodeCap)throw Error('Budget di verifica superato')
  attempted.set(fen,engine);if(validGrandeSearch(engine,fen))complete.set(fen,engine)
  searches++;publish();onProgress?.({current:searches,total:plan.positions.length,moves:plan.selectedPlies.length})
 }
 return{entries:updated,actualNodes,searches,selectedPlies:plan.selectedPlies}
}
