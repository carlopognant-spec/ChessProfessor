import { createAnalysisCache } from './analysisCache.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, evaluationFields, MOVE_CLASSIFICATION } from './classification.js'

const CLASSIFICATION_ORDER = Object.values(MOVE_CLASSIFICATION)

function throwIfAborted(signal) {
  if (signal?.aborted) {
    const error = new Error('analysis aborted')
    error.name = 'AbortError'
    throw error
  }
}

export function createGameAnalysisSession({ cache = createAnalysisCache(), maxEntries = ENGINE_CONFIG.maxAnalysisEntries } = {}) {
  const entries = new Map()
  let explorerStopped = false

  const write = (key, value) => {
    if (entries.size >= maxEntries) {
      const oldestKey = entries.keys().next().value
      if (oldestKey) {
        entries.delete(oldestKey)
        cache.delete?.(oldestKey)
      }
    }

    entries.set(key, value)
    cache.set(key, value)
    return value
  }

  const read = (key) => {
    const cached = entries.get(key) ?? cache.get(key)
    if (cached !== null && cached !== undefined) {
      entries.set(key, cached)
      return cached
    }
    return null
  }

  return {
    get: read,
    set: write,
    clear() {
      entries.clear()
      cache.clear()
      explorerStopped = false
    },
    size() {
      return entries.size
    },
    config: ENGINE_CONFIG,
    isExplorerStopped() {
      return explorerStopped
    },
    stopExplorer() {
      explorerStopped = true
    },
  }
}

export function shouldStopExplorerAtThreshold(explorerData, threshold = ENGINE_CONFIG.explorerThreshold) {
  const totalGames = (explorerData?.white ?? 0) + (explorerData?.draws ?? 0) + (explorerData?.black ?? 0)
  return totalGames < threshold
}

export async function analyzeGame({
  moves = [],
  analyzePosition,
  analyzePlayedPosition,
  fetchExplorer,
  session = createGameAnalysisSession(),
  explorerThreshold = ENGINE_CONFIG.explorerThreshold,
  signal,
  onProgress,
  onEntry,
} = {}) {
  if (typeof analyzePosition !== 'function') {
    throw new TypeError('analyzePosition deve essere una funzione')
  }

  const game = new Chess()
  const results = []
  let explorerStopped = session.isExplorerStopped?.() ?? false
  let bookPathActive = true

  for (const [index, san] of moves.entries()) {
    throwIfAborted(signal)
    const fenBefore = game.fen()
    const cacheKey = `analysis:${fenBefore}`
    let entry = session.get(cacheKey)

    if (!entry) {
      const engine = await analyzePosition(fenBefore)
      throwIfAborted(signal)

      let explorer = null
      if (!explorerStopped && typeof fetchExplorer === 'function') {
        try {
          explorer = await fetchExplorer(fenBefore)
          throwIfAborted(signal)
          explorerStopped = shouldStopExplorerAtThreshold(explorer, explorerThreshold)
          if (explorerStopped) session.stopExplorer?.()
        } catch (error) {
          if (error?.name === 'AbortError') throw error
          explorer = null
        }
      }

      const isBookMove = Boolean(explorer?.moves?.some((move) => move.san === san))
      const isFirstBookDeviation = bookPathActive && !isBookMove
      if (!isBookMove) bookPathActive = false

      entry = {
        ply: index + 1,
        moveNumber: Math.floor(index / 2) + 1,
        side: game.turn(),
        moveHistorySan: game.history(),
        fenBefore,
        playedMove: san,
        isBookMove,
        isFirstBookDeviation,
        engine,
        explorer,
      }
      game.move(san)
      entry.fenAfter = game.fen()

      if (typeof analyzePlayedPosition === 'function') {
        const playedEngine = await analyzePlayedPosition(game.fen())
        throwIfAborted(signal)
        entry = classifyAnalysisEntries([{
          ...entry,
          playedEngine,
          ...evaluationFields(engine, playedEngine, { isCheckmate: game.isCheckmate() }),
        }])[0]
      }

      session.set(cacheKey, entry)
    } else if (entry.explorer && shouldStopExplorerAtThreshold(entry.explorer, explorerThreshold)) {
      explorerStopped = true
      session.stopExplorer?.()
    }

    results.push(entry)
    if (game.history().length === index) game.move(san)
    onEntry?.(entry, [...results])
    onProgress?.({ current: index + 1, total: moves.length })
  }

  return results
}

export function buildAnalysisProgress({ total = 0, current = 0 } = {}) {
  if (!total) return 0
  return Math.min(100, Math.max(0, (current / total) * 100))
}

export function summarizeAnalysis(entries = []) {
  return entries.reduce((summary, entry) => {
    summary.total += 1
    summary.evalSum += entry?.evalCp ?? 0
    if (entry?.mate != null) summary.mateCount += 1
    return summary
  }, { total: 0, evalSum: 0, mateCount: 0 })
}

export function buildAnalysisSummary(entries = []) {
  const bySide = {
    white: Object.fromEntries(CLASSIFICATION_ORDER.map((key) => [key, 0])),
    black: Object.fromEntries(CLASSIFICATION_ORDER.map((key) => [key, 0])),
  }

  for (const entry of entries) {
    const side = entry.side === 'b' ? 'black' : 'white'
    if (Object.hasOwn(bySide[side], entry.classification)) {
      bySide[side][entry.classification] += 1
    }
  }

  return {
    bySide,
    categories: CLASSIFICATION_ORDER.map((key) => ({
      key,
      white: bySide.white[key],
      black: bySide.black[key],
    })),
    rows: entries.map((entry) => ({
      ...entry,
      label: `${entry.moveNumber ?? Math.ceil((entry.ply ?? 0) / 2)}.${entry.side === 'b' ? '..' : ''} ${entry.playedMove ?? ''}`.trim(),
    })),
  }
}
