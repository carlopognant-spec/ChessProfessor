import { describe, expect, it, vi } from 'vitest'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { Chess } from 'chess.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const BOOK_PATH = ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6']
const DEVIATING_PATH = ['e4', 'e5', 'Nc3', 'Nc6', 'Nf3', 'Nf6']
const NO_BOOK = createOpeningBook()

function transpositionBook() {
  const game = new Chess()
  return createOpeningBook(BOOK_PATH.map(san => {
    game.move(san)
    return game.fen()
  }))
}

function transpositionExplorer() {
  const positions = new Map()
  for (const moves of [BOOK_PATH, DEVIATING_PATH]) {
    const game = new Chess()
    for (const [index, san] of moves.entries()) {
      const fen = game.fen()
      const data = positions.get(fen) ?? { white: 1000, draws: 0, black: 0, moves: [] }
      if (!(index === 2 && san === 'Nc3') && !data.moves.some(move => move.san === san)) {
        data.moves.push({ san, white: 20, draws: 0, black: 0 })
      }
      positions.set(fen, data)
      game.move(san)
    }
  }
  return vi.fn(async (fen) => positions.get(fen))
}

describe('automatic game analysis', () => {
  it('uses known theory independently of Explorer move counts', async () => {
    const analyzePosition = async () => ({ evalCp: 0, mate: null, pv: [] })
    const analyze = (san, white) => analyzeGame({
      moves: [san],
      openingBook: transpositionBook(),
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
      fetchExplorer: async () => ({
        white: 100000, draws: 0, black: 0,
        moves: [{ san, white, draws: 0, black: 0 }],
      }),
    })
    const [rare] = await analyze('e4', 1)
    const [frequentUnknown] = await analyze('d4', 100000)
    expect(rare.isBookMove).toBe(true)
    expect(rare.isFirstBookDeviation).toBe(false)
    expect(rare.classification).toBe('book')
    expect(frequentUnknown.isBookMove).toBe(false)
    expect(frequentUnknown.isFirstBookDeviation).toBe(true)
    expect(frequentUnknown.classification).toBe('best')
  })

  it('never returns to book after a deviation even through a known transposition', async () => {
    const entries = await analyzeGame({
      moves: DEVIATING_PATH,
      openingBook: transpositionBook(),
      analyzePosition: async () => ({ evalCp: 0, mate: null, pv: [] }),
      fetchExplorer: transpositionExplorer(),
    })
    expect(entries.map(entry => entry.isBookMove)).toEqual([true, true, false, false, false, false])
    expect(entries.map(entry => entry.isFirstBookDeviation)).toEqual([false, false, true, false, false, false])
    expect(entries[5].explorer.moves.some(move => move.san === 'Nf6')).toBe(true)
  })

  it('recalculates book flags and classification on cache hits for either game path', async () => {
    for (const paths of [[BOOK_PATH, DEVIATING_PATH], [DEVIATING_PATH, BOOK_PATH]]) {
      const session = createGameAnalysisSession()
      const analyzePosition = vi.fn(async () => ({ evalCp: 0, mate: null, pv: [] }))
      const analyzePlayedPosition = vi.fn(async () => ({ evalCp: 0, mate: null, pv: [] }))
      const fetchExplorer = transpositionExplorer()
      const openingBook = transpositionBook()
      const analyze = (moves) => analyzeGame({ moves, openingBook, session, analyzePosition, analyzePlayedPosition, fetchExplorer })
      const first = await analyze(paths[0])
      const second = await analyze(paths[1])
      const repeatedFirst = await analyze(paths[0])
      const book = paths[0] === BOOK_PATH ? first : second
      const deviating = paths[0] === DEVIATING_PATH ? first : second

      expect(book[5].fenBefore).toBe(deviating[5].fenBefore)
      expect(book[5].engine).toBe(deviating[5].engine)
      expect(book[5].playedEngine).toBe(deviating[5].playedEngine)
      expect(book[5].isBookMove).toBe(true)
      expect(book[5].classification).toBe('book')
      expect(deviating[5].isBookMove).toBe(false)
      expect(deviating[5].isFirstBookDeviation).toBe(false)
      expect(deviating[5].classification).toBe('best')
      expect(deviating[5].moveHistorySan).toEqual(DEVIATING_PATH.slice(0, 5))
      expect(book[5].moveHistorySan).toEqual(BOOK_PATH.slice(0, 5))
      expect(repeatedFirst).toEqual(first)
      expect(analyzePosition).toHaveBeenCalledTimes(9)
      expect(analyzePlayedPosition).toHaveBeenCalledTimes(9)
      expect(fetchExplorer).toHaveBeenCalledTimes(9)
    }
  })

  it('caches distinct played moves from the same FEN with their own evaluations', async () => {
    const session = createGameAnalysisSession()
    const analyzePosition = vi.fn(async () => ({ evalCp: 40, mate: null, pv: ['e2e4'] }))
    const analyzePlayedPosition = vi.fn(async (fen) => ({
      evalCp: fen.includes('4P3') ? -40 : 400,
      mate: null,
      pv: [],
    }))
    const analyze = (san) => analyzeGame({ moves: [san], openingBook: NO_BOOK, analyzePosition, analyzePlayedPosition, session })

    const [e4] = await analyze('e4')
    const [d4] = await analyze('d4')
    const [cachedE4] = await analyze('e4')
    const [cachedD4] = await analyze('d4')

    expect(e4.fenBefore).toBe(START_FEN)
    expect(d4.fenBefore).toBe(START_FEN)
    expect(e4.playedMove).toBe('e4')
    expect(d4.playedMove).toBe('d4')
    expect(e4.fenAfter).not.toBe(d4.fenAfter)
    expect(e4.playedEngine.evalCp).toBe(-40)
    expect(d4.playedEngine.evalCp).toBe(400)
    expect(e4.playedEval).toBe(40)
    expect(d4.playedEval).toBe(-400)
    expect(e4.classification).toBe('best')
    expect(d4.classification).toBe('blunder')
    expect(cachedE4).toEqual(e4)
    expect(cachedD4).toEqual(d4)
    expect(session.size()).toBe(2)
    expect(analyzePosition).toHaveBeenCalledTimes(2)
    expect(analyzePlayedPosition).toHaveBeenCalledTimes(2)
  })

  it('analyzes each position, reuses cached results, and stops Explorer below threshold', async () => {
    const analyzePosition = vi.fn(async (fen) => ({ evalCp: fen === START_FEN ? 12 : 24, mate: null, pv: [] }))
    const fetchExplorer = vi.fn(async (fen) => (
      fen === START_FEN
        ? { white: 20, draws: 5, black: 10 }
        : { white: 2, draws: 1, black: 1 }
    ))
    const session = createGameAnalysisSession()

    const first = await analyzeGame({
      moves: ['e4', 'e5'],
      analyzePosition,
      fetchExplorer,
      session,
      explorerThreshold: 15,
    })
    const second = await analyzeGame({
      moves: ['e4', 'e5'],
      analyzePosition,
      fetchExplorer,
      session,
      explorerThreshold: 15,
    })

    expect(first).toHaveLength(2)
    expect(fetchExplorer).toHaveBeenCalledTimes(2)
    expect(analyzePosition).toHaveBeenCalledTimes(2)
    expect(second).toEqual(first)
  })

  it('stops cleanly when cancellation is requested', async () => {
    const controller = new AbortController()
    const analyzePosition = vi.fn(async () => {
      controller.abort()
      return { evalCp: 0, mate: null, pv: [] }
    })

    await expect(analyzeGame({
      moves: ['e4', 'e5'],
      analyzePosition,
      signal: controller.signal,
    })).rejects.toMatchObject({ name: 'AbortError' })
    expect(analyzePosition).toHaveBeenCalledTimes(1)
  })

  it('keeps Explorer stopped for later positions in the same session', async () => {
    const fetchExplorer = vi.fn(async () => ({ white: 1, draws: 0, black: 1 }))
    const analyzePosition = vi.fn(async () => ({ evalCp: 0, mate: null, pv: [] }))
    const session = createGameAnalysisSession()

    await analyzeGame({
      moves: ['e4', 'e5'],
      analyzePosition,
      fetchExplorer,
      session,
      explorerThreshold: 15,
    })
    await analyzeGame({
      moves: ['e4', 'e5', 'Nf3'],
      analyzePosition,
      fetchExplorer,
      session,
      explorerThreshold: 15,
    })

    expect(fetchExplorer).toHaveBeenCalledTimes(1)
  })

  it('keeps Stockfish analysis when Explorer is unavailable', async () => {
    const entries = await analyzeGame({
      moves: ['e4'],
      analyzePosition: async () => ({ evalCp: 20, mate: null, pv: ['e2e4'], lines: [] }),
      fetchExplorer: async () => { throw new Error('401 Unauthorized') },
    })

    expect(entries).toHaveLength(1)
    expect(entries[0].engine.evalCp).toBe(20)
    expect(entries[0].explorer).toBeNull()
  })

  it('evaluates the played position and attaches its classification', async () => {
    const analyzePosition = vi.fn(async (fen) => (
      fen === START_FEN
        ? { evalCp: 40, mate: null, pv: ['e2e4'] }
        : { evalCp: -20, mate: null, pv: [] }
    ))

    const [entry] = await analyzeGame({
      moves: ['e4'],
      openingBook: NO_BOOK,
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
    })

    expect(analyzePosition).toHaveBeenCalledTimes(2)
    expect(entry.bestEval).toBe(40)
    expect(entry.playedEval).toBe(20)
    expect(entry.evalDelta).toBe(-20)
    expect(entry.classification).toBe('excellent')
    expect(entry.dropPct).toBeGreaterThan(1)
    expect(entry.dropPct).toBeLessThan(3)
  })

  it('inverts played mate with the same mover perspective used for played eval', async () => {
    const analyzePosition = vi.fn(async (fen) => (
      fen === START_FEN
        ? { evalCp: null, mate: 3, pv: ['mate-in-3'] }
        : { evalCp: null, mate: -5, pv: ['mate-in-5'] }
    ))

    const [entry] = await analyzeGame({
      moves: ['e4'],
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
    })

    expect(entry.bestMate).toBe(3)
    expect(entry.playedMate).toBe(5)
  })

  it('treats the final mating move as mate given even when the engine returns no score', async () => {
    const session = createGameAnalysisSession()
    const analyzePosition = vi.fn(async (fen) => {
      if (fen === START_FEN) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' b KQkq - 0 1')) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' b KQkq - 0 2')) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' w KQkq - 0 2')) return { evalCp: 0, mate: null, pv: [] }
      return { evalCp: null, mate: null, pv: [] }
    })

    const entries = await analyzeGame({
      moves: ['f3', 'e5', 'g4', 'Qh4#'],
      session,
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
    })

    const lastEntry = entries[3]

    expect(lastEntry.playedMate).toBe(0)
    expect(lastEntry.dropPct).toBe(0)
    expect(lastEntry.classification).toBe('best')
    expect(lastEntry.classification).not.toBe('mistake')
    expect(lastEntry.classification).not.toBe('blunder')

    const cachedEntries = await analyzeGame({
      moves: ['f3', 'e5', 'g4', 'Qh4#'],
      session,
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
    })
    expect(cachedEntries.at(-1)).toEqual(lastEntry)
    expect(cachedEntries.at(-1).isBookMove).toBe(false)
  })
})
