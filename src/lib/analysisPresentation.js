const ARROW_COLORS = ['#C96B4B', '#D8A24A', '#6B9E78', '#5D8AA8', '#9B6B9E']

function squareToPoint(square) {
  if (!/^[a-h][1-8]$/.test(square ?? '')) return null
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1])
  return {
    x: (file + 0.5) * 12.5,
    y: (8.5 - rank) * 12.5,
  }
}

export function resolveEngineForFen(fen, analysisEntries = []) {
  const entry = analysisEntries.find((candidate) => candidate.fenAfter === fen)
    ?? analysisEntries.find((candidate) => candidate.fenBefore === fen)
  if (!entry) return null
  return entry.fenAfter === fen
    ? entry.playedEngine ?? entry.engine
    : entry.engine
}

export function buildEngineArrows(lines = []) {
  return lines
    .filter((line) => Array.isArray(line?.pv) && line.pv[0]?.length >= 4)
    .sort((left, right) => (left.multipv ?? 1) - (right.multipv ?? 1))
    .slice(0, 5)
    .map((line, index) => ({
      startSquare: line.pv[0].slice(0, 2),
      endSquare: line.pv[0].slice(2, 4),
      color: ARROW_COLORS[index],
    }))
}

export function buildMoveNavigation(moveHistorySan = []) {
  return moveHistorySan.map((san, index) => ({
    ply: index + 1,
    moveNumber: Math.floor(index / 2) + 1,
    side: index % 2 === 0 ? 'w' : 'b',
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