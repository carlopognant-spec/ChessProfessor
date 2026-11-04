import { Chess } from 'chess.js'
import { classifyReviewedMove } from './reviewEvaluation.js'

const ARROW_COLORS = ['#5A8CFF', '#7BA6FF', '#8AB1FF', '#A0C0FF', '#B9D0FF']
const ARROW_WIDTHS = [4.5, 3.6, 2.9, 2.3, 1.6]
const ARROW_OPACITIES = [1, 0.74, 0.62, 0.49, 0.33]

function scoreStrength(line = {}) {
  if (line.mate != null) {
    return Math.abs(line.mate) * 40
  }
  return Math.abs(Number(line.evalCp ?? 0)) * 0.6
}

function squareToPoint(square, orientation = 'white') {
  if (!/^[a-h][1-8]$/.test(square ?? '')) return null
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = Number(square[1])
  return {
    x: orientation === 'black' ? 100 - (file + 0.5) * 12.5 : (file + 0.5) * 12.5,
    y: orientation === 'black' ? 100 - (8.5 - rank) * 12.5 : (8.5 - rank) * 12.5,
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
  let reviewed
  try { reviewed = classifyReviewedMove(entry) } catch { return { entry, bestMove: null, playedBest: false } }
  const primary = reviewed.evaluationEvidence?.snapshotUsed ? entry.engine.specialLines?.[0]
    : entry.engine.lines?.find(line => (line.multipv ?? 1) === 1) ?? entry.engine
  const bestMove = primary?.pv?.[0]
  let sameMove = false, playedBest = false, equivalentBest = false, better = false
  try {
    const before = new Chess(entry.fenBefore), after = new Chess(entry.fenBefore)
    const played = after.move(entry.playedMove)
    const playedUci = `${played.from}${played.to}${played.promotion ?? ''}`
    const root = primary ?? entry.engine
    if (after.fen() !== entry.fenAfter || entry.engine.fen && entry.engine.fen !== entry.fenBefore
      || entry.playedUci && entry.playedUci !== playedUci || entry.uci && entry.uci !== playedUci
      || entry.playedEngine.fen && entry.playedEngine.fen !== entry.fenAfter
      || entry.engine.bestmove && entry.engine.bestmove !== bestMove
      || root.bound || root.lowerbound || root.upperbound
      || /\b(?:lowerbound|upperbound)\b/.test(root.raw ?? '')) return { entry, bestMove: null, playedBest: false }
    before.move({ from: bestMove.slice(0, 2), to: bestMove.slice(2, 4), promotion: bestMove[4] })
    sameMove = playedUci === bestMove
    playedBest = sameMove && (Number.isFinite(root.evalCp) || Number.isFinite(root.mate))
    equivalentBest = Boolean(reviewed.evaluationEvidence?.equivalentBest)
    better = reviewed.evaluationSource === 'root-pv' && reviewed.evaluationEvidence?.status === 'coherent'
      && reviewed.bestProbability > reviewed.playedProbability
  } catch { return { entry, bestMove: null, playedBest: false } }
  return {
    entry,
    playedBest,
    referencePlayed: sameMove,
    equivalentBest,
    better,
    bestMove: sameMove || equivalentBest || entry.isBookMove && !['mistake', 'blunder'].includes(entry.classification) || entry.classification === 'book'
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

export function buildEngineArrowSegments(arrows = [], fen, orientation = 'white') {
  let board
  try { if (fen) board = new Chess(fen) } catch { /* Invalid drafts have no piece-aware arrows. */ }
  return arrows.flatMap((arrow, index) => {
    const start = squareToPoint(arrow.startSquare, orientation)
    const end = squareToPoint(arrow.endSquare, orientation)
    if (!start || !end) return []
    return [{
      ...arrow,
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      markerId: `engine-arrow-${index}`,
      ...(board?.get(arrow.startSquare)?.type === 'n'
        && [Math.abs(start.x - end.x), Math.abs(start.y - end.y)].sort((a, b) => a - b).join(',') === '12.5,25'
        ? { bend: Math.abs(end.x - start.x) > Math.abs(end.y - start.y)
          ? { x: end.x, y: start.y } : { x: start.x, y: end.y } } : {}),
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
