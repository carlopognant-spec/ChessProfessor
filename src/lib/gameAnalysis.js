import { ENGINE_CONFIG } from './engineConfig.js'
import { Chess } from 'chess.js'
import { MOVE_CLASSIFICATION } from './classification.js'
import { classifyReviewedMove, applyMoveFacts } from './reviewEvaluation.js'
import { loadOpeningBook } from './openingBook.js'
import { classifySpecialMove, refreshPreviousSacrifice } from './specialClassification.js'

const CLASSIFICATION_ORDER = [
  MOVE_CLASSIFICATION.brilliant,
  MOVE_CLASSIFICATION.great,
  MOVE_CLASSIFICATION.book,
  'forced',
  MOVE_CLASSIFICATION.best,
  MOVE_CLASSIFICATION.excellent,
  MOVE_CLASSIFICATION.good,
  MOVE_CLASSIFICATION.inaccuracy,
  MOVE_CLASSIFICATION.mistake,
  MOVE_CLASSIFICATION.missed,
  MOVE_CLASSIFICATION.blunder,
  MOVE_CLASSIFICATION.unclassified,
]

function throwIfAborted(signal) {
  if (signal?.aborted) {
    const error = new Error('analysis aborted')
    error.name = 'AbortError'
    throw error
  }
}

export function createGameAnalysisSession({ cache = new Map(), maxEntries = ENGINE_CONFIG.maxAnalysisEntries } = {}) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError('maxEntries deve essere un intero positivo')
  }
  // Keys track FIFO eviction only; the cache is the sole owner of values.
  const keys = new Set()
  let explorerStopped = false

  const rememberKey = (key) => {
    if (keys.has(key)) return
    if (keys.size >= maxEntries) {
      const oldestKey = keys.values().next().value
      keys.delete(oldestKey)
      cache.delete(oldestKey)
    }
    keys.add(key)
  }

  const write = (key, value) => {
    rememberKey(key)
    cache.set(key, value)
    return value
  }

  const read = (key) => {
    const cached = cache.get(key)
    if (cached !== null && cached !== undefined) {
      rememberKey(key)
      return cached
    }
    keys.delete(key)
    return null
  }

  return {
    get: read,
    set: write,
    clear() {
      keys.clear()
      cache.clear()
      explorerStopped = false
    },
    size() {
      return keys.size
    },
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
  const history = []
  let explorerStopped = session.isExplorerStopped?.() ?? false
  let bookPathActive = true

  for (const [index, san] of moves.entries()) {
    throwIfAborted(signal)
    const fenBefore = game.fen()
    const moveNumber = Number(fenBefore.split(' ')[5])
    const moveHistorySan = [...history]
    const side = game.turn()
    const cacheKey = `analysis:${analysisKey ? analysisKey + ':' : ''}${fenBefore}:${san}`
    let entry = session.get(cacheKey)
    let move

    if (!entry) {
      const previousEntry = results.at(-1)
      // The UI uses the same search profile before and after each move.
      const reusable = analyzePosition === analyzePlayedPosition
        && previousEntry?.fenAfter === fenBefore && previousEntry.playedEngine
      const engine = reusable || await analyzePosition(fenBefore)
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
      move = game.move(san)
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

    move ??= game.move(san)
    history.push(move.san)
    // Preserve the existing final-mate classification even for named mating traps.
    const isBookMove = bookPathActive && !game.isCheckmate() && book.hasPosition(entry.fenAfter)
    const isFirstBookDeviation = bookPathActive && !isBookMove
    if (!isBookMove) bookPathActive = false
    entry = {
      ...entry,
      ply: index + 1,
      moveNumber,
      side,
      moveHistorySan,
      isBookMove,
      isFirstBookDeviation,
    }
    if (entry.playedEngine) {
      entry = classifyReviewedMove({
        ...entry,
        playedUci: `${move.from}${move.to}${move.promotion ?? ''}`,
      })
      entry = classifySpecialMove(entry, results.at(-1), results.at(-2))
      entry = applyMoveFacts(entry)
    }

    results.push(entry)
    const refreshed = refreshPreviousSacrifice(results)
    if (refreshed !== results) results[results.length - 2] = refreshed[refreshed.length - 2]
    onEntry?.(entry, [...results])
    onProgress?.({ current: index + 1, total: moves.length })
  }

  return results
}

export function buildAnalysisProgress({ total = 0, current = 0 } = {}) {
  if (!total) return 0
  return Math.min(100, Math.max(0, (current / total) * 100))
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
