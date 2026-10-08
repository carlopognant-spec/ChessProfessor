import { Chess } from 'chess.js'

const uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/
export function comparableRoot(engine) {
  const lines = engine?.lines
  if (!Array.isArray(lines)) return false
  const first = lines.find(l => l.multipv === 1), second = lines.find(l => l.multipv === 2)
  const scored = l => l && Number.isInteger(l.depth) && l.depth > 0 && !l.bound
    && !/\b(?:lowerbound|upperbound)\b/.test(l.raw ?? '')
    && (Number.isInteger(l.mate) && l.mate !== 0 || l.mate == null && Number.isFinite(l.evalCp))
  if (!scored(first) || !scored(second) || first.depth !== second.depth) return false
  const roots = lines.map(l => l.pv?.[0])
  return roots.every(uci => uciPattern.test(uci ?? '')) && new Set(roots).size === roots.length
}

// Caller supplies snapshots from one validated homogeneous cache.
// Selection depends on structure and adjacency, never score magnitude or labels.
export function selectRootSnapshot(entry, previous = null) {
  if (comparableRoot(entry.engine)) return { engine: entry.engine, source: 'current-root', changed: false }
  if (previous?.fenAfter !== entry.fenBefore || !comparableRoot(previous.playedEngine)) {
    return { engine: entry.engine, source: 'original-unusable', changed: false }
  }
  try {
    const game = new Chess(previous.fenBefore), beforeSide = game.turn()
    const uci = previous.playedUci ?? previous.uci
    if (!uciPattern.test(uci ?? '')) throw Error('Invalid previous move')
    game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    if (game.fen() !== entry.fenBefore || game.turn() === beforeSide) throw Error('Invalid chain')
    return { engine: previous.playedEngine, source: 'previous-child-same-fen', changed: true }
  } catch { return { engine: entry.engine, source: 'original-unusable', changed: false } }
}
