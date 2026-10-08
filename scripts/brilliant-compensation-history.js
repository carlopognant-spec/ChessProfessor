import { Chess } from 'chess.js'
import { auditProbability, auditSacrifices } from './brilliant-sacrifice-audit.js'
import { attributeOffer } from './brilliant-offer-attribution-v3.js'

function scoresAt(fen, rootUci, collections) {
  const rows = []
  for (const { source, lines } of collections) {
    for (const line of lines ?? []) {
      if (line.pv?.[0] !== rootUci) continue
      const game = new Chess(fen)
      for (const uci of line.pv) game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      const probabilityOpponent = auditProbability(line)
      rows.push({ source, depth: line.depth, evalCpOpponent: line.evalCp ?? null, mateOpponent: line.mate ?? null,
        probabilityMover: line.depth > 0 && probabilityOpponent != null ? 1 - probabilityOpponent : null,
        pv: line.pv, raw: line.raw ?? null })
    }
  }
  const usable = rows.filter(r => r.probabilityMover != null)
  return { rootUci, rows, usableCount: usable.length,
    minProbability: usable.length ? Math.min(...usable.map(r => r.probabilityMover)) : null,
    maxProbability: usable.length ? Math.max(...usable.map(r => r.probabilityMover)) : null }
}

export function auditCompensationHistory(entry, previousOwn, intervening) {
  const audit = auditSacrifices(entry)
  const offers = audit.offers.filter(o => o.candidateMaterialLoss).map(offer => {
    const attribution = attributeOffer(entry, offer, previousOwn, intervening)
    const current = scoresAt(entry.fenAfter, offer.replyUci,
      [{ source: 'current-playedEngine', lines: entry.playedEngine?.lines }])
    if (attribution.status !== 'persistent') return { offer, attribution, current, previous: [], status: attribution.status === 'new' ? 'new-offer' : 'missing-history' }
    const previous = attribution.earlierCaptures.map(c => scoresAt(previousOwn.fenAfter, c.uci,
      [{ source: 'previous-own-playedEngine', lines: previousOwn.playedEngine?.lines },
        { source: 'intervening-root-engine', lines: intervening.engine?.lines }]))
    let status
    if (!current.usableCount || previous.some(p => !p.usableCount)) status = 'missing-score-coverage'
    else if (current.minProbability < 0.45) status = current.maxProbability >= 0.45 ? 'current-score-disagreement' : 'currently-uncompensated'
    else if (previous.every(p => p.maxProbability < 0.45)) status = 'previously-poor-now-compensated'
    else if (previous.every(p => p.minProbability >= 0.45)) status = 'already-compensated'
    else status = 'previous-score-or-defense-disagreement'
    return { offer, attribution, current, previous, status }
  })
  return { offers, comparisonIsTemporalNotCausal: true }
}
