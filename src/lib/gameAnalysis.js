import { createAnalysisCache } from './analysisCache.js'
import { ENGINE_CONFIG } from './engineConfig.js'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields, MOVE_CLASSIFICATION } from './classification.js'
import { loadOpeningBook } from './openingBook.js'
import { classifyMissedOpportunity } from './missedOpportunity.js'

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
  baseFen,
  analyzePosition,
  analyzePlayedPosition,
  fetchExplorer,
  session = createGameAnalysisSession(),
  explorerThreshold = ENGINE_CONFIG.explorerThreshold,
  openingBook,
  analysisKey = '',
  signal,
  onProgress,
  onEntry,
} = {}) {
  if (typeof analyzePosition !== 'function') {
    throw new TypeError('analyzePosition deve essere una funzione')
  }

  const game = new Chess(baseFen)
  throwIfAborted(signal)
  const book = openingBook ?? await loadOpeningBook()
  throwIfAborted(signal)
  const results = []
  let explorerStopped = session.isExplorerStopped?.() ?? false
  let bookPathActive = true

  for (const [index, san] of moves.entries()) {
    throwIfAborted(signal)
    const fenBefore = game.fen()
    const moveHistorySan = game.history()
    const side = game.turn()
    const cacheKey = `analysis:${analysisKey ? analysisKey + ':' : ''}${fenBefore}:${san}`
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

      // Cache position/move data only; book flags and history belong to this game.
      entry = {
        fenBefore,
        playedMove: san,
        engine,
        ...(engine.analysisMetadata ? { analysisMetadata: engine.analysisMetadata } : {}),
        explorer,
      }
      game.move(san)
      entry.fenAfter = game.fen()

      if (typeof analyzePlayedPosition === 'function') {
        const playedEngine = await analyzePlayedPosition(game.fen())
        throwIfAborted(signal)
        entry = {
          ...entry,
          playedEngine,
        }
      }

      session.set(cacheKey, entry)
    } else if (entry.explorer && shouldStopExplorerAtThreshold(entry.explorer, explorerThreshold)) {
      explorerStopped = true
      session.stopExplorer?.()
    }

    if (game.history().length === index) game.move(san)
    // Preserve the existing final-mate classification even for named mating traps.
    const isBookMove = bookPathActive && !game.isCheckmate() && book.hasPosition(entry.fenAfter)
    const isFirstBookDeviation = bookPathActive && !isBookMove
    if (!isBookMove) bookPathActive = false
    entry = {
      ...entry,
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      side,
      moveHistorySan,
      isBookMove,
      isFirstBookDeviation,
    }
    if (entry.playedEngine) {
      const move = game.history({ verbose: true }).at(-1)
      entry = classifyAnalysisEntries([{
        ...entry,
        ...moveEvaluationFields(entry.engine, entry.playedEngine, `${move.from}${move.to}${move.promotion ?? ''}`, { isCheckmate: game.isCheckmate() }),
      }])[0]
      entry = classifyMissedOpportunity(entry, results.at(-1))
    }

    results.push(entry)
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
