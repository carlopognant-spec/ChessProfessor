import { Chess } from 'chess.js'
import { auditSacrifices, auditProbability } from './brilliant-sacrifice-audit.js'

const play = (game, uci) => game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })

// Inputs contain engine evidence and the common category, never reference labels.
export function classifyBrilliantOffer(entry, base, supplemental = []) {
  const original = auditSacrifices(entry)
  const evidence = { offers: original.offers, winningNonSacrifices: [], supplementalUsed: [],
    bestDefenseRefuses: !original.bestReplyAcceptsMaterialCandidate }
  const result = (reason, status = 'rejected') => ({ brilliant: status === 'supported', reason, status, evidence })
  if (!['Migliore', 'Ottima'].includes(base) || original.deliveredMate) return result('protected-category')
  if (new Chess(entry.fenBefore).moves().length < 2) return result('forced-move')
  for (const alternative of original.winningAlternatives) {
    const game = new Chess(entry.fenBefore); play(game, alternative.uci)
    const audit = auditSacrifices({ fenBefore: entry.fenBefore, fenAfter: game.fen(), uci: alternative.uci })
    if (!audit.offers.some(o => o.candidateMaterialLoss)) evidence.winningNonSacrifices.push(alternative)
  }
  if (evidence.winningNonSacrifices.length) return result('winning-nonsacrifice-alternative')
  const primary = entry.playedEngine?.lines?.find(l => l.multipv === 1)
  const opponentProbability = auditProbability(primary)
  if (opponentProbability == null) return result('missing-after-score', 'insufficient')
  evidence.afterProbability = 1 - opponentProbability
  if (evidence.afterProbability < 0.45) return result('poor-after-position')
  const lines = [...(entry.playedEngine?.lines ?? [])]
  const offers = original.offers.filter(o => o.candidateMaterialLoss)
  if (!offers.length) return result('no-material-offer')
  for (const offer of offers) {
    if (offer.cachedAcceptance) continue
    const matches = supplemental.filter(s => s.fen === entry.fenAfter && s.rootUci === offer.replyUci)
      .sort((a, b) => b.budgetNodes - a.budgetNodes)
    const source = matches[0]
    if (!source) continue
    if (source.engineVersion !== 'Stockfish 19 WASM' || source.completed?.pv?.[0] !== source.rootUci
      || auditProbability(source.completed) == null) throw Error('Invalid supplementary evidence')
    lines.push({ ...source.completed, multipv: lines.length + 1 })
    evidence.supplementalUsed.push({ rootUci: source.rootUci, budgetNodes: source.budgetNodes })
  }
  const augmented = auditSacrifices({ ...entry, playedEngine: { ...entry.playedEngine, lines } })
  const accepted = augmented.offers.filter(o => o.candidateMaterialLoss)
  evidence.offers = augmented.offers
  if (accepted.some(o => o.continuation?.probabilityMover == null)) return result('missing-acceptance-score', 'insufficient')
  if (accepted.some(o => o.continuation.probabilityMover < 0.45)) return result('uncompensated-acceptance')
  const substantial = accepted.filter(o => !o.continuation.immediateRecoveryByCapture)
  if (!substantial.length) return result('ordinary-exchanges')
  const supported = substantial.filter(o => o.continuation.completeHorizon)
  if (!supported.length) return result('short-acceptance-pv', 'insufficient')
  evidence.qualifyingAcceptances = supported.map(o => ({ replyUci: o.replyUci, isMovedPiece: o.isMovedPiece }))
  return result('supported-material-offer', 'supported')
}
