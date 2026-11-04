import { Chess } from 'chess.js'

const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/
export const uciOf = move => `${move.from}${move.to}${move.promotion ?? ''}`

export function playUci(game, uci) {
  if (typeof uci !== 'string' || !uciPattern.test(uci)) throw new TypeError('Mossa UCI non valida nello storico')
  return game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
}

export function normalizeHistory(history, fen) {
  if (!history || typeof history.initialFen !== 'string' || !Array.isArray(history.moves)) {
    throw new TypeError('Storico della posizione non valido')
  }
  const game = new Chess(history.initialFen)
  const initialFen = game.fen()
  const moves = [...history.moves]
  for (const move of moves) playUci(game, move)
  if (fen !== undefined && game.fen() !== new Chess(fen).fen()) throw new Error('Storico e posizione non corrispondono')
  return { initialFen, moves }
}

export function historyKey(history) {
  return history ? JSON.stringify([history.initialFen, history.moves]) : ''
}

export function appendHistory(history, uci) {
  return { initialFen: history.initialFen, moves: [...history.moves, uci] }
}

export function historyFromSan(initialFen, moves) {
  const game = new Chess(initialFen)
  return { initialFen: game.fen(), moves: moves.map(san => uciOf(game.move(san))) }
}

export function decodePositionCommand(command) {
  const [fen, moves = ''] = command.slice('position fen '.length).split(' moves ')
  const game = new Chess(fen)
  for (const move of moves.split(' ').filter(Boolean)) playUci(game, move)
  return game.fen()
}

// FEN includes the move counters, so mainline positions at different plies stay distinct.
export function positionHistories(entries, plan = {}) {
  const known = new Map()
  if (!entries.some(e => e.engine?.history || e.playedEngine?.history)) return known
  const add = (fen, history) => {
    if (!history) throw Error('Storico della partita incompleto')
    if (known.has(fen) && historyKey(known.get(fen)) !== historyKey(history)) throw Error('Storici ambigui per la posizione')
    known.set(fen, history)
  }
  for (const e of entries) {
    add(e.fenBefore, e.engine?.history)
    add(e.fenAfter, e.playedEngine?.history)
    if (historyKey(appendHistory(e.engine.history, e.playedUci ?? uciOf(new Chess(e.fenBefore).move(e.playedMove)))) !== historyKey(e.playedEngine.history)) {
      throw Error('Storico della mossa incoerente')
    }
  }
  for (const target of plan.sacrifices ?? []) {
    const history = known.get(target.fen)
    const accepted = appendHistory(history, target.captureUci)
    add(target.acceptedFen, accepted)
    for (const recovery of target.recoveries ?? []) add(recovery.afterFen, appendHistory(accepted, recovery.uci))
  }
  for (const target of plan.targets ?? []) {
    const entry = entries.find(e => e.ply === target.ply)
    for (const alternative of target.alternatives ?? []) add(alternative.fen, appendHistory(entry.engine.history, alternative.uci))
  }
  return known
}

export function historyAwareSearch(analyzePosition, histories) {
  if (!histories.size) return analyzePosition
  return async (fen, nodes, multiPv, options = {}) => {
    const history = histories.get(fen)
    if (!history) throw Error('Storico della variante mancante')
    const result = await analyzePosition(fen, nodes, multiPv, { ...options, history })
    if (historyKey(result?.history) !== historyKey(history)) throw Error('Risultato senza storico coerente')
    return result
  }
}

export function refinementHistoryMatches(entry, data = entry.refinement) {
  if (!data) return true
  try {
    const histories = positionHistories([entry], {
      sacrifices: data.sacrifices,
      targets: [{ ply: entry.ply, alternatives: [...(data.nativeProof?.alternatives ?? []),
        ...(data.nativeProof?.attempts ?? []).filter(r => r.uci)] }],
    })
    const searches = [data.engine, data.playedEngine, data.grandeProof?.root, data.grandeProof?.child,
      data.nativeProof?.root, data.nativeProof?.child,
      ...(data.nativeProof?.alternatives ?? []).map(r => r.engine),
      ...(data.nativeProof?.attempts ?? []).map(r => r.engine),
      ...(data.sacrificeAttempts ?? []).map(r => r.engine),
      ...(data.sacrifices ?? []).flatMap(r => [r.acceptance, r.confirmation,
        ...(r.recoveries ?? []).flatMap(s => [s.search, s.confirmation])])].filter(Boolean)
    return searches.every(search => histories.size
      ? historyKey(search.history) === historyKey(histories.get(search.fen)) && histories.has(search.fen)
      : !search.history)
  } catch { return false }
}
