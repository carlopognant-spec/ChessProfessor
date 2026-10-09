import { Chess } from 'chess.js'

const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const uciOf = move => `${move.from}${move.to}${move.promotion ?? ''}`
const captureSquare = move => move.flags.includes('e') ? `${move.to[0]}${move.from[1]}` : move.to
const play = (game, uci) => game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
const material = (game, side) => game.board().flat().filter(Boolean)
  .reduce((sum, piece) => sum + (piece.color === side ? 1 : -1) * values[piece.type], 0)

function trackTarget(target, reply) {
  if (target.square === reply.from) return { ...target, square: reply.to, type: reply.promotion ?? target.type }
  if (target.type === 'r' && /[kq]/.test(reply.flags)) {
    const rank = reply.from[1]
    if (reply.flags.includes('k') && target.square === `h${rank}`) return { ...target, square: `f${rank}` }
    if (reply.flags.includes('q') && target.square === `a${rank}`) return { ...target, square: `d${rank}` }
  }
  return { ...target }
}

export function auditLegalFork(entry) {
  const start = new Chess(entry.fenBefore), side = start.turn(), initial = material(start, side)
  const candidate = play(start, entry.uci)
  if (start.fen() !== entry.fenAfter || candidate.san !== entry.san) throw Error('Candidate SAN/FEN mismatch')
  const afterCandidate = material(start, side)
  const opponent = start.turn()
  const targets = start.board().flat().filter(piece => piece && piece.color === opponent
    && start.attackers(piece.square, side).includes(candidate.to))
    .map(piece => ({ id: piece.square, square: piece.square, type: piece.type }))
  let capturesEnumerated = 0, recaptureMovesEnumerated = 0
  const replies = start.moves({ verbose: true }).map(reply => {
    const game = new Chess(entry.fenAfter)
    play(game, uciOf(reply))
    const attackerCaptured = Boolean(reply.captured && captureSquare(reply) === candidate.to)
    const trackedTargets = targets.map(target => trackTarget(target, reply)).map(target => ({ ...target,
      moved: target.square !== target.id,
      defenders: game.attackers(target.square, opponent),
      attackedBySamePiece: !attackerCaptured && game.attackers(target.square, side).includes(candidate.to),
    }))
    const legalMoves = game.moves({ verbose: true })
    const captures = attackerCaptured ? [] : legalMoves.filter(move => move.from === candidate.to && move.captured
      && trackedTargets.some(target => target.type !== 'k' && target.square === captureSquare(move))).map(move => {
      capturesEnumerated++
      const sequence = new Chess(game.fen())
      play(sequence, uciOf(move))
      const afterCapture = material(sequence, side) - initial
      const responses = sequence.moves({ verbose: true })
      recaptureMovesEnumerated += responses.length
      const recaptures = responses.filter(response => response.captured && captureSquare(response) === move.to).map(response => {
        const finish = new Chess(sequence.fen())
        play(finish, uciOf(response))
        return { uci: uciOf(response), san: response.san, materialDelta: material(finish, side) - initial }
      })
      const worstImmediateDelta = Math.min(afterCapture, ...recaptures.map(response => response.materialDelta))
      return { uci: uciOf(move), san: move.san,
        targetId: trackedTargets.find(target => target.square === captureSquare(move)).id,
        capturedType: move.captured, afterCaptureDelta: afterCapture, recaptures, worstImmediateDelta,
        incrementalDelta: worstImmediateDelta - (afterCandidate - initial),
        givesMate: sequence.isCheckmate() }
    })
    return { uci: uciOf(reply), san: reply.san, fenAfterReply: game.fen(), attackerCaptured,
      givesCheck: game.isCheck(), givesMate: game.isCheckmate(), stalemate: game.isStalemate(),
      materialDeltaAfterReply: material(game, side) - initial, trackedTargets, captures,
      legalContinuations: legalMoves.length,
      bestIncrementalDelta: captures.length ? Math.max(...captures.map(capture => capture.incrementalDelta)) : null }
  })
  const pvSupport = (entry.playedEngine?.lines ?? []).map(line => {
    const game = new Chess(entry.fenAfter), events = []
    for (const uci of line.pv ?? []) {
      const move = play(game, uci)
      events.push({ uci, san: move.san, materialDelta: material(game, side) - initial })
    }
    if (events.length && !replies.some(reply => reply.uci === events[0].uci)) throw Error('PV reply mismatch')
    return { depth: line.depth ?? null, multipv: line.multipv ?? null, evalCpOpponent: line.evalCp ?? null,
      mateOpponent: line.mate ?? null, bound: Boolean(line.bound || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')),
      raw: line.raw ?? null, events, endsInMate: game.isCheckmate() }
  })
  const withoutCapture = replies.filter(reply => !reply.captures.length)
  const withoutPositiveIncrement = replies.filter(reply => reply.bestIncrementalDelta == null || reply.bestIncrementalDelta <= 0)
  return { side, candidate: { uci: entry.uci, san: candidate.san, type: candidate.piece, square: candidate.to },
    candidateMaterialDelta: afterCandidate - initial, targets, replies, pvSupport,
    summary: { legalReplies: replies.length, capturesEnumerated, recaptureMovesEnumerated,
      attackerCaptureReplies: replies.filter(reply => reply.attackerCaptured).length,
      noCaptureReplies: withoutCapture.map(reply => reply.san),
      noPositiveIncrementReplies: withoutPositiveIncrement.map(reply => reply.san),
      minimumBestIncrementalDelta: replies.length && !withoutCapture.length
        ? Math.min(...replies.map(reply => reply.bestIncrementalDelta)) : null,
      everyReplyAllowsPositiveImmediateIncrement: replies.length > 0 && !withoutPositiveIncrement.length,
      cachedReplyCount: new Set(pvSupport.flatMap(line => line.events[0] ? [line.events[0].uci] : [])).size,
      terminalAfterCandidate: start.isGameOver() },
  }
}
