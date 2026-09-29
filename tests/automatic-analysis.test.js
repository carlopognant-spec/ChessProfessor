import { describe, expect, it, vi } from 'vitest'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('automatic game analysis', () => {
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
    expect(entry.classification).toBe('inaccuracy')
  })
})
