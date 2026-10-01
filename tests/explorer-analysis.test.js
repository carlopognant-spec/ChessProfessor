import { describe, expect, it, vi } from 'vitest'
import { fetchOpeningExplorer } from '../src/lib/lichessExplorer.js'
import { createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'

describe('lichess explorer contract', () => {
  it('falls back to anonymous requests when no token is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ opening: { eco: 'C00', name: 'French Defense' }, white: 10, black: 10, draws: 1 }),
    })

    const response = await fetchOpeningExplorer('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', {
      token: null,
      fetchImpl: fetchMock,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('https://explorer.lichess.ovh/lichess')
    expect(response.opening.name).toBe('French Defense')
  })

  it('explains that a valid token is required after a 401 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 })

    await expect(fetchOpeningExplorer('startpos', {
      token: null,
      fetchImpl: fetchMock,
    })).rejects.toThrow('VITE_LICHESS_TOKEN')
  })
})

describe('game analysis session', () => {
  it('tracks cached evaluations and exposes the active engine settings', () => {
    const analysis = createGameAnalysisSession()
    const initial = analysis.get('fen-1')

    analysis.set('fen-1', { evalCp: 12, depth: ENGINE_CONFIG.defaultDepth })

    expect(initial).toBeNull()
    expect(analysis.get('fen-1')).toEqual({ evalCp: 12, depth: ENGINE_CONFIG.defaultDepth })
    expect(ENGINE_CONFIG.defaultDepth).toBeGreaterThan(0)
  })
})
