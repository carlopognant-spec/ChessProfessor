import { Chess } from 'chess.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const uciOf = move => `${move.from}${move.to}${move.promotion ?? ''}`
function material(game, side) {
  return game.board().flat().filter(Boolean).reduce((sum, p) => sum + (p.color === side ? 1 : -1) * values[p.type], 0)
}
function play(game, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid UCI')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}
export function auditProbability(line) {
  if (!line || line.bound || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}
export function auditSacrifices(entry) {
  const before = new Chess(entry.fenBefore), side = before.turn(), initialMaterial = material(before, side)
  const game = new Chess(entry.fenBefore), moved = play(game, entry.uci ?? entry.playedUci)
  if (game.fen() !== entry.fenAfter) throw Error('FEN mismatch')
  const childLines = entry.playedEngine?.lines ?? []
  const primary = childLines.find(l => l.multipv === 1)
  const offers = game.moves({ verbose: true }).filter(m => ['n', 'b', 'r', 'q'].includes(m.captured)).map(reply => {
    const accepted = new Chess(entry.fenAfter); accepted.move(uciToMove(uciOf(reply)))
    const origin = reply.to === moved.to ? moved.from : reply.to
    const opponent = side === 'w' ? 'b' : 'w'
    const delta = material(accepted, side) - initialMaterial
    const line = childLines.find(l => l.pv?.[0] === uciOf(reply))
    let continuation = null
    if (line) {
      const sequence = new Chess(entry.fenAfter), events = []
      for (const uci of line.pv) {
        const move = play(sequence, uci)
        events.push({ san: move.san, uci, captured: move.captured ?? null,
          materialDelta: material(sequence, side) - initialMaterial, mate: sequence.isCheckmate() })
      }
      continuation = { depth: line.depth, rawCpOpponent: line.evalCp ?? null, rawMateOpponent: line.mate ?? null,
        probabilityMover: auditProbability(line) == null ? null : 1 - auditProbability(line),
        events: events.slice(0, 8), availablePlies: events.length,
        completeHorizon: events.length >= 8 || sequence.isCheckmate(),
        immediateRecovery: events[1]?.materialDelta >= 0,
        immediateRecoveryByCapture: Boolean(events[1]?.captured && events[1].materialDelta >= 0),
        laterRecoveryPly: events.findIndex((e, index) => index >= 2 && e.materialDelta >= 0) < 0 ? null
          : events.findIndex((e, index) => index >= 2 && e.materialDelta >= 0) + 1,
        endIsMate: sequence.isCheckmate() }
    }
    return { replyUci: uciOf(reply), replySan: reply.san, offeredType: reply.captured, offeredSquare: reply.to,
      offeredValue: values[reply.captured], isMovedPiece: reply.to === moved.to,
      geometricallyAttackedBefore: before.attackers(origin, opponent).length > 0,
      materialDeltaAfterOffer: material(game, side) - initialMaterial, materialDeltaAfterAcceptance: delta,
      candidateMaterialLoss: delta <= -2, bestDefenseAcceptsThis: primary?.pv?.[0] === uciOf(reply),
      cachedAcceptance: Boolean(line), continuation }
  })
  // PVs that do not accept an offered piece are still checked for legality.
  for (const line of childLines) {
    const sequence = new Chess(entry.fenAfter)
    for (const uci of line.pv ?? []) play(sequence, uci)
  }
  const rootAlternatives = (entry.engine?.lines ?? []).filter(l => l.pv?.[0] !== (entry.uci ?? entry.playedUci))
    .map(l => ({ uci: l.pv?.[0], depth: l.depth, evalCp: l.evalCp ?? null, mate: l.mate ?? null, probabilityMover: auditProbability(l) }))
  return { side, initialMaterial, materialAfterOffer: material(game, side), offers,
    bestReply: primary?.pv?.[0] ?? null,
    bestReplyAcceptsMaterialCandidate: offers.some(o => o.candidateMaterialLoss && o.bestDefenseAcceptsThis),
    winningAlternatives: rootAlternatives.filter(l => l.probabilityMover != null && l.probabilityMover >= 0.75),
    rootAlternatives, deliveredMate: game.isCheckmate() }
}
function uciToMove(uci) { return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] } }
