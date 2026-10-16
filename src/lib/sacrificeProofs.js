import {SACRIFICE_SEARCH_POLICY,pendingSacrificeTargets,sacrificeSearchFor,materialRecoveryTargets,validBoundedSacrificeSearch,preferredSacrificeConfirmation,validSacrificeAttempt,mergeSacrificeAttempts} from './sacrificeSearches.js'
export const SACRIFICE_PROOF_SCOPE='sacrifice-proof-v1'
export const SACRIFICE_PROOF_LIMITS=Object.freeze({maxRecoveries:4})
const key=(fen,uci=null)=>fen+'|'+(uci??'*')
function knownSearches(entries) {
  const known=new Map()
  const add=(engine)=>{
    if(!engine?.fen)return
    const uci=engine.analysisMetadata?.searchMoves?.[0]??null
    if(!validBoundedSacrificeSearch(engine,engine.fen,uci))return
    const k=key(engine.fen,uci),prior=known.get(k)
    known.set(k,uci?engine:preferredSacrificeConfirmation(engine.fen,prior,engine))
  }
  for(const e of entries){
    for(const r of mergeSacrificeAttempts(e.refinement?.sacrificeAttempts))add(r.engine)
    for(const engine of [e.engine,e.playedEngine,e.refinement?.engine,e.refinement?.playedEngine])add(engine)
    for(const row of [...(e.refinement?.sacrifices??[]),...(e.sacrificeSearches??[])]){
      add(row.acceptance);add(row.confirmation)
      for(const r of row.recoveries??[]){add(r.search);add(r.confirmation)}
    }
  }
  return known
}
export function buildSacrificeProofPlan(entries,view,version) {
  const known=knownSearches(entries),queries=[],sacrifices=[],queued=new Set()
  const attempts=new Map(mergeSacrificeAttempts(...entries.map(e=>e.refinement?.sacrificeAttempts)).map(r=>[key(r.fen,r.uci),r]))
  const tried=(fen,uci=null)=>known.has(key(fen,uci))||attempts.has(key(fen,uci))
  let recoveryCount=0
  const request=(target,kind,fen,uci=null,recoveryUci=null)=>{
    const k=key(fen,uci)
    if(tried(fen,uci)||queued.has(k))return
    queued.add(k)
    queries.push({ply:target.ply,captureUci:target.captureUci,kind,fen,uci,recoveryUci,nodes:SACRIFICE_SEARCH_POLICY.nodes,multiPv:uci?1:5})
  }
  const pending=pendingSacrificeTargets(view,{includeRecoveries:true})
  for(const target of pending){
    if(sacrifices.length>=SACRIFICE_SEARCH_POLICY.maxOffers)break
    const entry=entries.find(e=>e.ply===target.ply)
    const recoveries=materialRecoveryTargets(entry,target.captureUci)
    const missing=recoveries.filter(r=>!r.terminal&&(!tried(target.acceptedFen,r.uci)||!tried(r.afterFen)))
    const baseMissing=!tried(target.fen,target.captureUci)||!tried(target.acceptedFen)
    if(!baseMissing&&!missing.length)continue
    const selected=missing.slice(0,Math.max(0,SACRIFICE_PROOF_LIMITS.maxRecoveries-recoveryCount))
    if(!baseMissing&&!selected.length)continue
    recoveryCount+=selected.length
    const t={...target,recoveries:recoveries.map(r=>({...r,selected:selected.some(s=>s.uci===r.uci)}))}
    sacrifices.push(t)
    request(t,'acceptance',t.fen,t.captureUci)
    request(t,'confirmation',t.acceptedFen)
    for(const r of selected){
      request(t,'recovery',t.acceptedFen,r.uci,r.uci)
      request(t,'recovery-confirmation',r.afterFen,null,r.uci)
    }
  }
  const selectedPlies=[...new Set(sacrifices.map(t=>t.ply))]
  return {version,scope:SACRIFICE_PROOF_SCOPE,selectionVersion:SACRIFICE_PROOF_SCOPE,
    selectedPlies,candidateCount:pending.length,selection:selectedPlies.map(ply=>({ply,reason:'sacrifice-evidence',priority:0})),
    positions:[],sacrifices,queries,extraSearches:queries.length,nodes:SACRIFICE_SEARCH_POLICY.nodes,
    nominalNodes:queries.length*SACRIFICE_SEARCH_POLICY.nodes,
    actualNodeCap:queries.length*(SACRIFICE_SEARCH_POLICY.nodes+SACRIFICE_SEARCH_POLICY.reserve)}
}
function abort(signal){if(signal?.aborted){const e=new Error('Verifica interrotta');e.name='AbortError';throw e}}
export async function refineSacrificeProofs({entries,plan,analyzePosition,signal,onEntries,onProgress}) {
  const known=knownSearches(entries)
  const attempts=new Map(mergeSacrificeAttempts(...entries.map(e=>e.refinement?.sacrificeAttempts)).map(r=>[key(r.fen,r.uci),r]))
  let updated=entries,actualNodes=0,completed=0
  const publish=()=>{
    updated=entries.map(e=>{
      const targets=plan.sacrifices.filter(t=>t.ply===e.ply);if(!targets.length)return e
      const rows=targets.map(t=>{
        const prior=sacrificeSearchFor(e,t.captureUci)
        return {version:SACRIFICE_SEARCH_POLICY.version,ply:e.ply,captureUci:t.captureUci,fen:t.fen,acceptedFen:t.acceptedFen,
          acceptance:known.get(key(t.fen,t.captureUci))??prior?.acceptance??null,
          confirmation:known.get(key(t.acceptedFen))??prior?.confirmation??null,
          recoveries:t.recoveries.flatMap(r=>{
            const old=prior?.recoveries?.find(x=>x.uci===r.uci)
            const search=known.get(key(t.acceptedFen,r.uci))??old?.search??null
            const confirmation=known.get(key(r.afterFen))??old?.confirmation??null
            return search||confirmation?[{uci:r.uci,afterFen:r.afterFen,search,confirmation}]:[]
          })}
      })
      const relevant=new Set(targets.flatMap(t=>[key(t.fen,t.captureUci),key(t.acceptedFen),...t.recoveries.flatMap(r=>[key(t.acceptedFen,r.uci),key(r.afterFen)])]))
      return {...e,refinement:{...e.refinement,version:plan.version,
        sacrificeAttempts:mergeSacrificeAttempts(e.refinement?.sacrificeAttempts,[...attempts].filter(([k])=>relevant.has(k)).map(([,r])=>r)),
        sacrifices:[...(e.refinement?.sacrifices??[]).filter(r=>!rows.some(n=>n.captureUci===r.captureUci)),...rows]}}
    })
    onEntries?.(updated)
  }
  abort(signal);publish()
  for(const q of plan.queries){
    abort(signal)
    if(actualNodes+q.nodes+SACRIFICE_SEARCH_POLICY.reserve>plan.actualNodeCap)throw Error('Budget di verifica esaurito')
    const engine=await analyzePosition(q.fen,q.nodes,q.multiPv,q.uci?{searchMoves:[q.uci]}:{})
    abort(signal)
    if(!validSacrificeAttempt(engine,q.fen,q.uci)||engine.analysisMetadata.budget.value!==q.nodes
      ||engine.analysisMetadata.multiPv!==q.multiPv)throw Error('Prova del sacrificio incompatibile')
    actualNodes+=engine.actualNodes
    if(actualNodes>plan.actualNodeCap)throw Error('Budget di verifica superato')
    attempts.set(key(q.fen,q.uci),{version:SACRIFICE_SEARCH_POLICY.version,fen:q.fen,uci:q.uci,engine})
    if(validBoundedSacrificeSearch(engine,q.fen,q.uci))known.set(key(q.fen,q.uci),engine)
    completed++;publish()
    onProgress?.({current:completed,total:plan.queries.length,moves:plan.selectedPlies.length})
  }
  return {entries:updated,actualNodes,searches:completed,selectedPlies:plan.selectedPlies}
}
