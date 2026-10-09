const ARROW_COLORS = ['#5A8CFF', '#7BA6FF', '#8AB1FF', '#A0C0FF', '#B9D0FF']
const ARROW_WIDTHS = [4.5, 3.6, 2.9, 2.3, 1.6]
const ARROW_OPACITIES = [1, 0.74, 0.62, 0.49, 0.33]

function scoreStrength(line = {}) {
  if (line.mate != null) {
    return Math.abs(line.mate) * 40
  }
  return Math.abs(Number(line.evalCp ?? 0)) * 0.6
}

function squareToPoint(square) {
  if (!/^[a-h][1-8]$/.test(square ?? '')) return null
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1])
  return {
    x: (file + 0.5) * 12.5,
    y: (8.5 - rank) * 12.5,
  }
}

export function resolveEngineForFen(fen, analysisEntries = [], engineData = null) {
  const entry = analysisEntries.find((candidate) => candidate.fenAfter === fen)
    ?? analysisEntries.find((candidate) => candidate.fenBefore === fen)
  if (!entry) return engineData?.fen === fen ? engineData : null
  return entry.fenAfter === fen
    ? entry.playedEngine ?? null
    : entry.engine
}

export function buildEngineArrows(lines = []) {
  return lines
    .filter((line) => Array.isArray(line?.pv) && line.pv[0]?.length >= 4)
    .sort((left, right) => (left.multipv ?? 1) - (right.multipv ?? 1))
    .slice(0, 5)
    .map((line, index) => {
      const strength = scoreStrength(line)
      const scoreFactor = Math.max(0.35, Math.min(1, 0.75 + strength / 500))
      const strokeWidth = ARROW_WIDTHS[index] * scoreFactor
      const opacity = ARROW_OPACITIES[index] * scoreFactor

      return {
        startSquare: line.pv[0].slice(0, 2),
        endSquare: line.pv[0].slice(2, 4),
        color: ARROW_COLORS[index],
        opacity: Number(opacity.toFixed(2)),
        strokeWidth: Number(strokeWidth.toFixed(2)),
      }
    })
}

export function resolveAnalysisEntryForPosition(fen, moves = [], entries = []) {
  if (!moves.length) return null
  return entries.find(entry => entry.ply === moves.length && entry.fenAfter === fen &&
    entry.playedMove === moves.at(-1) &&
    entry.moveHistorySan?.length === moves.length - 1 &&
    entry.moveHistorySan.every((san, index) => san === moves[index])) ?? null
}

export function resolveMoveReview(fen, moves = [], entries = []) {
  const entry = resolveAnalysisEntryForPosition(fen, moves, entries)
  if (!entry?.engine || !entry.playedEngine || !entry.classification) return null
  const primary = entry.engine.lines?.find(line => (line.multipv ?? 1) === 1)
  const bestMove = entry.bestUci ?? primary?.pv?.[0] ?? entry.engine.pv?.[0]
  return {
    entry,
    bestMove: entry.isBookMove || entry.classification === 'book'
      ? null : (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(bestMove ?? '') ? bestMove : null),
  }
}

export function buildMoveNavigation(moveHistorySan = [], baseFen = '') {
  const fields = baseFen.split(' ')
  const startsBlack = fields[1] === 'b'
  const firstNumber = Number(fields[5]) || 1
  return moveHistorySan.map((san, index) => ({
    ply: index + 1,
    moveNumber: firstNumber + Math.floor((index + Number(startsBlack)) / 2),
    side: (index + Number(startsBlack)) % 2 === 0 ? 'w' : 'b',
    san,
    moves: moveHistorySan.slice(0, index + 1),
  }))
}

export function getKeyboardNavigationTarget(key, currentPly, moveHistorySan = []) {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null
  const nextPly = key === 'ArrowLeft' ? currentPly - 1 : currentPly + 1
  const boundedPly = Math.min(moveHistorySan.length, Math.max(0, nextPly))
  return moveHistorySan.slice(0, boundedPly)
}

export function buildEngineArrowSegments(arrows = []) {
  return arrows.flatMap((arrow, index) => {
    const start = squareToPoint(arrow.startSquare)
    const end = squareToPoint(arrow.endSquare)
    if (!start || !end) return []
    return [{
      ...arrow,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      markerId: `engine-arrow-${index}`,
    }]
  })
}

export function getButtonNavigationTarget(action, currentPly, timeline = []) {
  if (action === 'first') return timeline.slice(0, 0)
  if (action === 'last') return [...timeline]
  return getKeyboardNavigationTarget(
    action === 'previous' ? 'ArrowLeft' : action === 'next' ? 'ArrowRight' : '',
    currentPly,
    timeline,
  )
}
