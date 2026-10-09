import { Chess } from 'chess.js'
import { classifyMissedOpportunity, formatMissedOpportunity } from './missedOpportunity.js'

const primaryLine = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
const isBound = line => Boolean(line?.bound || /\b(?:upperbound|lowerbound)\b/.test(line?.raw ?? ''))

// The original winning-opportunity policy remains intact for frozen research.
// A lost mating line is a separate local rule, even when a material win remains.
export function classifyMoveOpportunity(entry, previous) {
  if (['great', 'brilliant'].includes(entry.classification)) return entry
  const result = classifyMissedOpportunity(entry, previous)
  if (result.classification === 'missed' || ['book', 'unclassified'].includes(result.classification)
    || entry.isBookMove || entry.playedMate === 0 || entry.playedMate > 0 || entry.isEngineBest === true) return result
  const primary = primaryLine(entry.engine)
  const child = primaryLine(entry.playedEngine)
  const mate = primary?.mate
  if (!Number.isSafeInteger(mate) || mate <= 0 || mate > 128 || entry.bestMate !== mate
    || isBound(primary) || !child || isBound(child)
    || child.mate != null || !Number.isFinite(child.evalCp)
    || !Number.isFinite(entry.playedProbability)) return result
  const playedRoot = entry.engine?.lines?.find(line => line.pv?.[0] === entry.playedUci)
  // Conflicting evidence or a retained winning mate must never become a miss.
  if (playedRoot?.mate > 0 || isBound(playedRoot)) return result
  const pv = primary.pv
  if (!Array.isArray(pv) || pv.length !== 2 * mate - 1 || pv[0] === entry.playedUci) return result
  try {
    const game = new Chess(entry.fenBefore), side = game.turn()
    const play = uci => {
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
      return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    }
    play(entry.playedUci)
    if (entry.fenAfter && game.fen() !== entry.fenAfter) return result
    game.load(entry.fenBefore)
    const san = pv.map(uci => play(uci).san)
    if (!game.isCheckmate() || game.turn() === side) return result
    return { ...result, classification: 'missed', missedOpportunityReason: 'verified-mate-not-retained',
      missedOpportunity: { kind: 'forced-mate', mateIn: mate,
        bestProbability: entry.bestProbability, playedProbability: entry.playedProbability,
        alternative: { uci: pv.slice(0, 8), san: san.slice(0, 8) },
        matingLine: { uci: [...pv], san },
        policyVersion: 'missed-mate-v1' } }
  } catch { return result }
}

export function reclassifyMoveOpportunities(entries = []) {
  const results = []
  for (const entry of entries) results.push(classifyMoveOpportunity(entry, results.at(-1)))
  return results
}

export function formatMoveOpportunity(opportunity) {
  if (opportunity?.kind === 'forced-mate') {
    return `Matto in ${opportunity.mateIn} non mantenuto. La variante era ${opportunity.alternative.san.join(' ')}.`
  }
  return formatMissedOpportunity(opportunity)
}
