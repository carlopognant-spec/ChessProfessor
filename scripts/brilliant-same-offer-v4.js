import { Chess } from 'chess.js'
import { auditProbability, auditSacrifices } from './brilliant-sacrifice-audit.js'
import { classifyAttributedBrilliant } from './brilliant-offer-attribution-v3.js'

const play = (game, uci) => game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
export function auditWinningSameOffer(entry) {
  const audit = auditSacrifices(entry), playedUci = entry.uci ?? entry.playedUci
  const lines = entry.engine?.lines ?? []
  const played = lines.filter(l => l.pv?.[0] === playedUci)
  const playedProbability = played.length === 1 ? auditProbability(played[0]) : null
  const evidence = { playedRootCount: played.length, playedDepth: played.length === 1 ? played[0].depth : null,
    playedProbability, alternatives: [], matches: [] }
  const stationary = audit.offers.filter(o => o.candidateMaterialLoss && !o.isMovedPiece)
  if (!stationary.length) return evidence
  for (const line of lines.filter(l => l.pv?.[0] !== playedUci)) {
    const sequence = new Chess(entry.fenBefore), rootUci = line.pv?.[0]
    if (!rootUci) continue
    const move = play(sequence, rootUci), fenAfter = sequence.fen()
    for (const uci of line.pv.slice(1)) play(sequence, uci)
    const alternative = auditSacrifices({ fenBefore: entry.fenBefore, fenAfter, uci: rootUci })
    const probability = auditProbability(line)
    const alternativeRootCount = lines.filter(l => l.pv?.[0] === rootUci).length
    const comparable = played.length === 1 && alternativeRootCount === 1 && played[0].depth > 0 && line.depth === played[0].depth
      && playedProbability != null && probability != null
    const sameOffers = stationary.filter(o => alternative.offers.some(a => a.candidateMaterialLoss
      && !a.isMovedPiece && a.offeredSquare === o.offeredSquare && a.offeredType === o.offeredType))
      .map(o => ({ square: o.offeredSquare, type: o.offeredType, color: audit.side }))
    const item = { uci: rootUci, san: move.san, depth: line.depth, evalCp: line.evalCp ?? null,
      mate: line.mate ?? null, probability, comparable, alternativeRootCount, sameOffers }
    evidence.alternatives.push(item)
    if (comparable && playedProbability >= 0.75 && probability >= 0.75 && sameOffers.length) evidence.matches.push(item)
  }
  return evidence
}

export function classifySameOfferBrilliant(entry, base, previousOwn, intervening, supplemental = []) {
  const original = classifyAttributedBrilliant(entry, base, previousOwn, intervening, supplemental)
  const comparison = auditWinningSameOffer(entry)
  if (!original.brilliant) return { ...original, comparison }
  const newOffers = original.attributions.filter(a => a.status === 'new').map(a => {
    const offer = original.evidence.offers.find(o => o.replyUci === a.replyUci)
    const vetoes = offer.isMovedPiece ? [] : comparison.matches.filter(m => m.sameOffers.some(s => s.square === offer.offeredSquare && s.type === offer.offeredType))
    return { replyUci: a.replyUci, movedPiece: offer.isMovedPiece, vetoes: vetoes.map(m => m.uci) }
  })
  if (!newOffers.length) throw Error('Supported v3 candidate without attributable acceptance')
  return { ...original, comparison, newOffers, ...(newOffers.every(o => o.vetoes.length)
    ? { brilliant: false, status: 'rejected', reason: 'winning-alternative-with-same-offer' } : {}) }
}
