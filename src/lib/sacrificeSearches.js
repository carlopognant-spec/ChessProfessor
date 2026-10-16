import { Chess } from 'chess.js'
import { createAnalysisMetadata, analysisMetadataKey } from './analysisMetadata.js'
import { ENGINE_CONFIG } from './engineConfig.js'

export const SACRIFICE_SEARCH_POLICY = Object.freeze({ version: 'acceptance-search-v1', nodes: 200000, maxOffers: 4, reserve: 5000 })
const uciOf = m => `${m.from}${m.to}${m.promotion ?? ''}`
export function acceptanceFen(fen, uci) {
  const game = new Chess(fen)
  const move = game.moves({ verbose: true }).find(m => uciOf(m) === uci)
  if (!move || !['n', 'b', 'r', 'q'].includes(move.captured)) throw Error('Accettazione del sacrificio non valida')
  game.move(move.san)
  return game.fen()
}

// A restricted search is evidence for this root only, never a position evaluation.
export function validSacrificeSearch(engine, fen, captureUci = null, {allowIncomplete=false}={}) {
  try {
    const nodes = captureUci ? [SACRIFICE_SEARCH_POLICY.nodes] : [SACRIFICE_SEARCH_POLICY.nodes, 1000000]
    if (engine?.fen !== fen || !Number.isSafeInteger(engine.actualNodes) || engine.actualNodes < 0
      || !nodes.some(n => analysisMetadataKey(engine.analysisMetadata) === analysisMetadataKey({
        ...createAnalysisMetadata({ nodes: n, multiPv: captureUci ? 1 : ENGINE_CONFIG.multiPv }),
        ...(captureUci ? { searchMoves: [captureUci] } : {}) }))) return false
    const legal = new Chess(fen).moves({ verbose: true }).map(uciOf)
    const incomplete=allowIncomplete&&Array.isArray(engine.specialLines)&&engine.specialLines.length===0
    const lines = incomplete?engine.lines:engine.specialLines
    if (!Array.isArray(lines) || lines.length !== Math.min(captureUci ? 1 : ENGINE_CONFIG.multiPv, legal.length)
      || !lines.length || !incomplete&&new Set(lines.map(l => l.depth)).size !== 1
      || new Set(lines.map(l => l.pv?.[0])).size !== lines.length
      || engine.bestmove !== lines[0].pv?.[0]) return false
    for (const [i, l] of [...lines, ...(engine.lines ?? [])].entries()) {
      if (!Number.isInteger(l.depth) || l.depth < 1 || l.bound || l.lowerbound || l.upperbound
        || /\b(?:lowerbound|upperbound)\b/.test(l.raw ?? '')
        || !(Number.isFinite(l.evalCp) || Number.isInteger(l.mate) && l.mate !== 0)
        || !l.pv?.length || l.pv.length > 256 || !legal.includes(l.pv[0])
        || captureUci && l.pv[0] !== captureUci || i < lines.length && l.multipv !== i + 1) return false
      const replay = new Chess(fen)
      for (const u of l.pv) {
        if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u)) return false
        replay.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
      }
    }
    return true
  } catch { return false }
}

// Choose by validated search conditions, never by the score or desired label.
export function preferredSacrificeConfirmation(fen, ...engines) {
  return engines.reduce((chosen, engine) => {
    if (!validSacrificeSearch(engine, fen)) return chosen
    return !chosen || engine.analysisMetadata.budget.value > chosen.analysisMetadata.budget.value ? engine : chosen
  }, null)
}

export function sacrificeSearchFor(entry, captureUci) {
  try {
    const fen = acceptanceFen(entry.fenAfter, captureUci)
    const rows = entry.refinement?.sacrifices?.filter(r => r.version === SACRIFICE_SEARCH_POLICY.version
      && r.captureUci === captureUci && r.fen === entry.fenAfter && r.acceptedFen === fen) ?? []
    if (rows.length !== 1) return null
    const row = rows[0]
    return { ...row, acceptance: validBoundedSacrificeSearch(row.acceptance, entry.fenAfter, captureUci) ? row.acceptance : null,
      confirmation: validBoundedSacrificeSearch(row.confirmation, fen) ? row.confirmation : null,
      recoveries: validatedRecoveryProofs(fen,row.recoveries) }
  } catch { return null }
}

export function validBoundedSacrificeSearch(engine,fen,uci=null) {
  return validSacrificeSearch(engine,fen,uci) && engine.actualNodes>0
    && engine.actualNodes<=engine.analysisMetadata.budget.value+SACRIFICE_SEARCH_POLICY.reserve
}
// A completed node search can end between MultiPV iterations. Remember the
// attempt without treating its unequal-depth lines as a comparison certificate.
export function validSacrificeAttempt(engine,fen,uci=null) {
  return validSacrificeSearch(engine,fen,uci,{allowIncomplete:true})&&engine.actualNodes>0
    &&engine.actualNodes<=engine.analysisMetadata.budget.value+SACRIFICE_SEARCH_POLICY.reserve
}
export function mergeSacrificeAttempts(...collections) {
  const known=new Map()
  for(const rows of collections)for(const row of Array.isArray(rows)?rows:[]){
    if(row?.version!==SACRIFICE_SEARCH_POLICY.version||!validSacrificeAttempt(row.engine,row.fen,row.uci??null))continue
    known.set(row.fen+'|'+(row.uci??'*'),{version:row.version,fen:row.fen,uci:row.uci??null,engine:row.engine})
  }
  return [...known.values()]
}
export function validatedRecoveryProofs(fen,rows=[]) {
  if (!Array.isArray(rows)) return []
  return rows.flatMap(row=>{
    try {
      if (rows.filter(r=>r.uci===row.uci).length!==1) return []
      const afterFen=acceptanceFen(fen,row.uci)
      if (row.afterFen!==afterFen) return []
      const search=validBoundedSacrificeSearch(row.search,fen,row.uci)?row.search:null
      const confirmation=validBoundedSacrificeSearch(row.confirmation,afterFen)?row.confirmation:null
      return search||confirmation?[{uci:row.uci,afterFen,search,confirmation}]:[]
    } catch { return [] }
  })
}
export function mergeRecoveryProofs(fen,...collections) {
  const known=new Map()
  for (const rows of collections) for (const row of validatedRecoveryProofs(fen,rows)) {
    const prior=known.get(row.uci)
    known.set(row.uci,{...row,search:row.search??prior?.search??null,
      confirmation:preferredSacrificeConfirmation(row.afterFen,prior?.confirmation,row.confirmation)})
  }
  return [...known.values()]
}
export function materialRecoveryTargets(entry,captureUci) {
  const value={p:1,n:3,b:3,r:5,q:9,k:0}
  const before=new Chess(entry.fenBefore),side=before.turn()
  const material=b=>b.board().flat().filter(Boolean).reduce((sum,p)=>sum+(p.color===side?1:-1)*value[p.type],0)
  const baseline=material(before),fen=acceptanceFen(entry.fenAfter,captureUci),accepted=new Chess(fen)
  return accepted.moves({verbose:true}).filter(m=>m.captured).flatMap(m=>{
    const b=new Chess(fen);b.move(m.san)
    return material(b)>=baseline?[{uci:uciOf(m),afterFen:b.fen(),terminal:b.isGameOver()}]:[]
  })
}

export function pendingSacrificeTargets(entries,{includeRecoveries=false}={}) {
  return entries.flatMap(e => e.specialAssessment?.brilliant?.status !== 'candidate'
    || !['missing-acceptance-analysis', 'unresolved-immediate-recovery', 'unresolved-tactical-sequence']
      .includes(e.specialAssessment.brilliant.reason) ? []
    : (e.specialAssessment.brilliant.offers ?? []).flatMap(offer => {
      try {
        const saved = sacrificeSearchFor(e, offer.uci)
        return saved?.acceptance && saved?.confirmation && !(includeRecoveries && e.specialAssessment.brilliant.reason==='unresolved-immediate-recovery') ? []
          : [{ ply: e.ply, captureUci: offer.uci, fen: e.fenAfter, acceptedFen: acceptanceFen(e.fenAfter, offer.uci) }]
      } catch { return [] }
    }))
}
