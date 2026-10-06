import { Chess } from 'chess.js'
import { ENGINE_CONFIG } from './engineConfig.js'

function verifiedAlternative(entry) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(entry.playedUci ?? '')) return null
  const primary = entry.engine?.lines?.find(line => line.multipv === 1) ?? entry.engine
  const pv = primary?.pv
  if (!Array.isArray(pv) || !pv.length || pv[0] === entry.playedUci) return null
  try {
    new Chess(entry.fenBefore).move({ from: entry.playedUci.slice(0, 2), to: entry.playedUci.slice(2, 4), promotion: entry.playedUci[4] })
    const game = new Chess(entry.fenBefore)
    const san = []
    const uci = pv.slice(0, 8)
    for (const move of uci) {
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return null
      san.push(game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] }).san)
    }
    if (uci.length < 2 && !game.isCheckmate()) return null
    return { uci, san }
  } catch { return null }
}

export function classifyMissedOpportunity(entry, previous, policy = ENGINE_CONFIG.missedOpportunity) {
  const baseClassification = entry.baseClassification ?? entry.classification
  const result = { ...entry, classification: baseClassification, baseClassification, missedOpportunity: null }
  const reject = reason => ({ ...result, missedOpportunityReason: reason })
  if (entry.isBookMove || baseClassification === 'book' || entry.playedMate === 0 || baseClassification === 'unclassified') return reject('protected-category')
  if (!previous || previous.fenAfter !== entry.fenBefore) return reject('no-adjacent-opponent')
  try {
    if (new Chess(previous.fenBefore).turn() === new Chess(entry.fenBefore).turn()) return reject('no-adjacent-opponent')
  } catch { return reject('invalid-position') }
  if (previous.isBookMove || !['mistake', 'blunder'].includes(previous.baseClassification ?? previous.classification)) return reject('no-opponent-error')
  const values = [previous.bestProbability, previous.playedProbability, entry.bestProbability, entry.playedProbability]
  if (!values.every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return reject('missing-scores')
  const beforeProbability = 1 - previous.bestProbability
  const offeredProbability = 1 - previous.playedProbability
  if (beforeProbability > policy.nonWinningProbability) return reject('already-advantaged')
  if (offeredProbability < policy.winningProbability || entry.bestProbability < policy.winningProbability) return reject('no-confirmed-winning-opportunity')
  if (entry.playedProbability > policy.nonWinningProbability) return reject('winning-chance-retained')
  const alternative = verifiedAlternative(entry)
  if (!alternative) return reject('no-verified-alternative')
  return {
    ...result,
    classification: 'missed',
    missedOpportunityReason: 'confirmed',
    missedOpportunity: {
      previousPly: previous.ply ?? null,
      previousMove: previous.playedMove ?? previous.san ?? null,
      beforeProbability, offeredProbability,
      bestProbability: entry.bestProbability,
      playedProbability: entry.playedProbability,
      alternative,
      policy: { ...policy },
    },
  }
}

export function formatMissedOpportunity(opportunity) {
  if (!opportunity) return ''
  return `Dopo ${opportunity.previousMove ?? 'la mossa avversaria'}, l'occasione era ${opportunity.alternative.san.join(' ')}.`
}
