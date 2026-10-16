import {validSacrificeSearch} from './sacrificeSearches.js'
import { Chess } from 'chess.js'
import { calculateWinProbability } from './evaluation.js'
import { sacrificeSearchFor } from './sacrificeSearches.js'

const uciOf = move => `${move.from}${move.to}${move.promotion ?? ''}`
const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
function index(line) {
  if (!line || !Number.isInteger(line.depth) || line.depth < 1 || line.bound
    || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}
function play(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
function legalPV(fen, line) {
  if (!Array.isArray(line?.pv) || !line.pv.length || line.pv.length > 256) return false
  const game = new Chess(fen)
  for (const uci of line.pv) play(game, uci)
  return true
}

// A stationary piece already legally capturable before an alternative is not
// a new offer created by that alternative. Pins and opened lines matter.
export function preExistingAlternativeOffer(entry, offer) {
  try {
    const board = new Chess(entry.fenBefore), side = board.turn(), piece = board.get(offer.square)
    if (offer.movedPiece || piece?.color !== side || piece.type !== offer.type) return false
    const fields = board.fen().split(' ')
    fields[1] = side === 'w' ? 'b' : 'w'
    fields[3] = '-'
    return new Chess(fields.join(' ')).moves({ verbose: true })
      .some(move => uciOf(move) === offer.uci && move.captured === offer.type)
  } catch { return false }
}

// Reuse searches of exact positions; never infer scores from the played result.
function collectNextEvidence(entry, next, { good = 0.45, consistency = 0.10 } = {}) {
  if (!entry || !next || next.ply !== entry.ply + 1 || next.fenBefore !== entry.fenAfter) return null
  try {
    const game = new Chess(entry.fenBefore), side = game.turn()
    play(game, entry.playedUci ?? entry.uci)
    if (game.fen() !== entry.fenAfter || game.turn() === side) return null
    const accepted = play(game, next.playedUci ?? next.uci)
    if (game.fen() !== next.fenAfter || game.turn() !== side) return null
    const confirmation = primary(next.playedEngine), confirmationIndex = index(confirmation)
    const confirmations = accepted.captured && confirmationIndex != null
      && confirmationIndex >= good && confirmation.pv?.length >= 2
      && (!next.playedEngine.fen || next.playedEngine.fen === next.fenAfter)
      && legalPV(next.fenAfter, confirmation)
      ? [{ captureUci: uciOf(accepted), fen: next.fenAfter, line: confirmation,
        index: confirmationIndex, source: 'after-acceptance-child-search' }] : []

    const lines = [...(next.engine?.specialLines ?? next.engine?.lines ?? [])].sort((a, b) => a.multipv - b.multipv)
    const child = index(primary(entry.playedEngine)), best = index(lines[0])
    const requested = next.engine?.analysisMetadata?.multiPv ?? lines.length
    const legalCount = new Chess(next.fenBefore).moves().length
    const complete = lines.length >= 2 && lines.length >= Math.min(requested, legalCount)
      && new Set(lines.map(line => line.depth)).size === 1
      && new Set(lines.map(line => line.pv?.[0])).size === lines.length
      && lines.every((line, i) => line.multipv === i + 1 && index(line) != null
        && legalPV(next.fenBefore, line) && (!i || index(lines[i - 1]) >= index(line)))
      && child != null && best != null && Math.abs(child - best) <= consistency
      && (!next.engine.fen || next.engine.fen === next.fenBefore)
    return { fen: entry.fenAfter, source: 'next-root-snapshot',
      acceptanceLines: complete ? lines : [], confirmations,
      recoverySearches: confirmations.length ? [{ captureUci: uciOf(accepted), fen: next.fenAfter,
        engine: next.playedEngine, source: 'after-acceptance-child-search' }] : [] }
  } catch { return null }
}

export function collectSacrificeEvidence(entry, next, policy = {}) {
  const natural = collectNextEvidence(entry, next, policy)
  const stored = (entry?.sacrificeSearches ?? []).map(row => sacrificeSearchFor({ ...entry,
    refinement: { sacrifices: entry.sacrificeSearches } }, row.captureUci))
    .filter(row => row?.acceptance && row?.confirmation)
  if (!stored.length) return natural
  const evidence = natural ?? { fen: entry.fenAfter, source: 'optional-acceptance-search',
    acceptanceLines: [], confirmations: [], recoverySearches: [] }
  const captures = new Set(stored.map(r => r.captureUci))
  return { ...evidence, forcedRecoveries: stored.map(r=>({captureUci:r.captureUci,fen:r.acceptedFen,recoveries:r.recoveries??[]})), acceptanceSearches: stored.map(r => ({ captureUci: r.captureUci,
    line: r.acceptance.specialLines[0], source: 'optional-forced-acceptance-search' })),
    confirmations: [...evidence.confirmations.filter(r => !captures.has(r.captureUci)), ...stored.map(r => {
      const line = primary(r.confirmation)
      return { captureUci: r.captureUci, fen: r.acceptedFen, line, index: index(line), source: 'optional-acceptance-child-search' }
    })],
    recoverySearches: [...evidence.recoverySearches.filter(r => !captures.has(r.captureUci)), ...stored.map(r => ({
      captureUci: r.captureUci, fen: r.acceptedFen, engine: r.confirmation, source: 'optional-acceptance-child-search' }))] }
}

export function confirmedCompensation(evidence, captureUci, acceptedFen, acceptance, { good = 0.45, consistency = 0.10 } = {}) {
  const acceptedIndex = index(acceptance)
  const confirmation = evidence?.confirmations?.find(row => row.captureUci === captureUci && row.fen === acceptedFen)
  if (acceptedIndex == null || !confirmation || 1 - acceptedIndex < good
    || confirmation.index < good || Math.abs((1 - acceptedIndex) - confirmation.index) > consistency) return null
  return { kind: 'corroborated-compensation', acceptanceDepth: acceptance.depth,
    confirmationDepth: confirmation.line.depth, acceptanceIndex: 1 - acceptedIndex,
    confirmationIndex: confirmation.index, source: confirmation.source,
    defenseScope: 'agreement-of-engine-estimates', proofAgainstEveryDefense: false }
}

// A complete top-K iteration also bounds omitted roots by its worst score.
// Omitted captures require that ranking; legal availability alone is insufficient.
export function assessImmediateRecoveries(evidence, captureUci, acceptedFen, recoveryUcis, { good = 0.45, consistency = 0.10 } = {}) {
  try {
    if (!recoveryUcis?.length || new Set(recoveryUcis).size !== recoveryUcis.length) return null
    const explicit = assessForcedRecoveries(evidence,captureUci,acceptedFen,recoveryUcis,{good,consistency})
    if (explicit) return explicit
    const candidates = evidence?.recoverySearches?.filter(r => r.captureUci === captureUci && r.fen === acceptedFen)
    if (candidates?.length !== 1) return null
    const search = candidates[0], engine = search.engine
    if (engine?.fen && engine.fen !== acceptedFen) return null
    const game = new Chess(acceptedFen), legal = game.moves({ verbose: true }).map(uciOf)
    if (recoveryUcis.some(u => !legal.includes(u))) return null
    const lines = engine?.specialLines ?? engine?.lines ?? []
    const requested = engine?.analysisMetadata?.multiPv ?? lines.length
    if (!Number.isSafeInteger(requested) || requested < 2 || lines.length < 2
      || lines.length !== Math.min(requested, legal.length)
      || new Set(lines.map(l => l.depth)).size !== 1
      || new Set(lines.map(l => l.pv?.[0])).size !== lines.length
      || lines.some((l, i) => l.multipv !== i + 1 || l.lowerbound || l.upperbound
        || index(l) == null || !legal.includes(l.pv?.[0])
        || !legalPV(acceptedFen, l) || i && index(l) > index(lines[i - 1]))
      || engine.bestmove && lines[0].pv[0] !== engine.bestmove
      || index(primary(engine)) == null
      || Math.abs(index(lines[0]) - index(primary(engine))) > consistency) return null
    const worst = index(lines.at(-1)), choices = []
    for (const uci of recoveryUcis) {
      const matched = lines.find(l => l.pv[0] === uci)
      const upperIndex = matched ? index(matched) : worst
      if (upperIndex >= good) return null
      choices.push({ uci, upperIndex, scope: matched ? 'scored-root' : 'below-complete-top-k' })
    }
    return { kind: 'unfavorable-material-recoveries', source: search.source, depth: lines[0].depth,
      analyzed: lines.length, legalMoves: legal.length, allLegal: lines.length === legal.length,
      choices, proofAgainstEveryDefense: false }
  } catch { return null }
}

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
