import { describe, expect, it, vi } from 'vitest'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('automatic game analysis', () => {
  it('caches distinct played moves from the same FEN with their own evaluations', async () => {
    const session = createGameAnalysisSession()
    const analyzePosition = vi.fn(async () => ({ evalCp: 40, mate: null, pv: ['e2e4'] }))
    const analyzePlayedPosition = vi.fn(async (fen) => ({
      evalCp: fen.includes('4P3') ? -40 : 400,
      mate: null,
      pv: [],
    }))
    const analyze = (san) => analyzeGame({ moves: [san], analyzePosition, analyzePlayedPosition, session })

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
    const analyzePosition = vi.fn(async (fen) => {
      if (fen === START_FEN) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' b KQkq - 0 1')) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' b KQkq - 0 2')) return { evalCp: 0, mate: null, pv: [] }
      if (fen.includes(' w KQkq - 0 2')) return { evalCp: 0, mate: null, pv: [] }
      return { evalCp: null, mate: null, pv: [] }
    })

    const entries = await analyzeGame({
      moves: ['f3', 'e5', 'g4', 'Qh4#'],
      analyzePosition,
      analyzePlayedPosition: analyzePosition,
    })

    const lastEntry = entries[3]

    expect(lastEntry.playedMate).toBe(0)
    expect(lastEntry.dropPct).toBe(0)
    expect(lastEntry.classification).toBe('best')
    expect(lastEntry.classification).not.toBe('mistake')
    expect(lastEntry.classification).not.toBe('blunder')
  })
})
