import { Chess } from 'chess.js'
import { calculateWinProbability } from './evaluation.js'

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

// Reuse searches of exact positions; never infer scores from the played result.
export function collectSacrificeEvidence(entry, next, { good = 0.45, consistency = 0.10 } = {}) {
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
      acceptanceLines: complete ? lines : [], confirmations }
  } catch { return null }
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
