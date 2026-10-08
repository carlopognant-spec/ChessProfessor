import { Chess } from 'chess.js'
import { classifyBrilliantOffer } from './brilliant-offer-v2.js'

export function attributeOffer(entry, offer, previousOwn, intervening) {
  if (offer.isMovedPiece) return { status: 'new', reason: 'moved-piece' }
  if (!previousOwn || !intervening) return { status: 'unknown', reason: 'missing-history' }
  if (previousOwn.ply !== entry.ply - 2 || intervening.ply !== entry.ply - 1
    || previousOwn.fenAfter !== intervening.fenBefore || intervening.fenAfter !== entry.fenBefore) throw Error('Broken history chain')
  const before = new Chess(entry.fenBefore), earlier = new Chess(previousOwn.fenAfter)
  const side = before.turn(), piece = earlier.get(offer.offeredSquare)
  if (earlier.turn() === side) throw Error('Wrong historical side to move')
  if (!piece || piece.color !== side || piece.type !== offer.offeredType) return { status: 'new', reason: 'piece-not-previously-present' }
  const captures = earlier.moves({ verbose: true }).filter(m => m.to === offer.offeredSquare && m.captured === piece.type)
  return { status: captures.length ? 'persistent' : 'new', reason: captures.length ? 'previously-legally-capturable' : 'new-legal-offer',
    earlierCaptures: captures.map(m => ({ san: m.san, uci: `${m.from}${m.to}${m.promotion ?? ''}` })) }
}

export function classifyAttributedBrilliant(entry, base, previousOwn, intervening, supplemental = []) {
  const original = classifyBrilliantOffer(entry, base, supplemental)
  if (!original.brilliant) return { ...original, attributions: [] }
  const attributions = original.evidence.qualifyingAcceptances.map(q => {
    const offer = original.evidence.offers.find(o => o.replyUci === q.replyUci)
    return { replyUci: q.replyUci, offeredSquare: offer.offeredSquare,
      ...attributeOffer(entry, offer, previousOwn, intervening),
      laterRecoveryPly: offer.continuation.laterRecoveryPly,
      continuation: offer.continuation.events }
  })
  if (attributions.some(a => a.status === 'new')) return { ...original, attributions }
  const unknown = attributions.some(a => a.status === 'unknown')
  return { ...original, brilliant: false, status: unknown ? 'insufficient' : 'rejected',
    reason: unknown ? 'unknown-offer-attribution' : 'persistent-offer', attributions }
}
