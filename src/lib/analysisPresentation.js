const ARROW_COLORS = ['#C96B4B', '#D8A24A', '#6B9E78']

export function buildEngineArrows(lines = []) {
  return lines
    .filter((line) => Array.isArray(line?.pv) && line.pv[0]?.length >= 4)
    .sort((left, right) => (left.multipv ?? 1) - (right.multipv ?? 1))
    .slice(0, 3)
    .map((line, index) => [line.pv[0].slice(0, 2), line.pv[0].slice(2, 4), ARROW_COLORS[index]])
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