import { describe, expect, it } from 'vitest'
import {
  buildCriticalContext,
  shouldUseCriticalLlm,
} from '../src/lib/llm/criticalContext.js'

describe('critical LLM context', () => {
  it('allows only critical categories or the first book deviation', () => {
    expect(shouldUseCriticalLlm({ classification: 'good' })).toBe(false)
    expect(shouldUseCriticalLlm({ classification: 'mistake' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'blunder' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'missed' })).toBe(true)
    expect(shouldUseCriticalLlm({ isFirstBookDeviation: true })).toBe(true)
  })

  it('builds context from verified engine, opening, and move facts', () => {
    const context = buildCriticalContext({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      question: 'Perché?',
      moveHistorySan: ['e4'],
      analysisEntry: {
        classification: 'mistake',
        bestEval: 80,
        playedEval: -120,
        evalDelta: -200,
        playedMove: 'e5',
        pv: ['e7e5'],
      },
      opening: { eco: 'C20', name: 'Partita di gioco aperto' },
    })

    expect(context).toEqual(expect.objectContaining({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      question: 'Perché?',
      classification: 'mistake',
      evalDelta: -200,
      bestEval: 80,
      playedEval: -120,
    }))
  })
})
