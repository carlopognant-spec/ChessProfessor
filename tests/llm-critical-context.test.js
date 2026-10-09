import { describe, expect, it } from 'vitest'
import {
  buildCriticalContext,
  shouldUseCriticalLlm,
} from '../src/lib/llm/criticalContext.js'
import { buildUserMessage } from '../src/lib/llm/systemPrompt.js'

describe('critical LLM context', () => {
  it('drops scores, PV and category from an entry for a different displayed FEN', () => {
    const context = buildCriticalContext({ fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1', analysisEntry: {
      fenAfter: '4k3/8/8/8/8/8/8/4K3 b - - 0 1', classification: 'blunder', bestEval: 900, pv: ['e8e7'],
    } })
    expect(context.classification).toBeNull()
    expect(context.bestEval).toBeNull()
    expect(context.pv).toEqual([])
  })
  it('includes mate data and comparison in the message actually sent to the model', () => {
    const message = buildUserMessage({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      question: 'Perché?', moveHistorySan: [],
      criticalContext: { bestMate: -6, playedMate: -3, mateComparison: { outcome: 'losing', change: 'accelerated', source: 'independent-position' }, missedOpportunity: { previousMove: 'f3', alternative: { san: ['Nc6', 'e4'] } } },
    })
    expect(message).toContain('Matto migliore (prospettiva di chi muove): -6')
    expect(message).toContain('Matto mossa giocata (prospettiva di chi muove): -3')
    expect(message).toContain('"source":"independent-position"')
    expect(message).toContain('"previousMove":"f3"')
    expect(message).toContain('"san":["Nc6","e4"]')
  })
  it('allows only critical categories or the first book deviation', () => {
    expect(shouldUseCriticalLlm({ classification: 'good' })).toBe(false)
    expect(shouldUseCriticalLlm({ classification: 'mistake' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'blunder' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'missed' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'great' })).toBe(true)
    expect(shouldUseCriticalLlm({ classification: 'brilliant' })).toBe(true)
    expect(shouldUseCriticalLlm({ isFirstBookDeviation: true })).toBe(true)
  })

  it('builds context from verified engine, opening, and move facts', () => {
    const context = buildCriticalContext({
      fen: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
      question: 'Perché?',
      moveHistorySan: ['e4'],
      analysisEntry: {
        fenAfter: '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
        classification: 'mistake',
        bestEval: 80,
        playedEval: -120,
        bestMate: -6,
        playedMate: -3,
        mateComparison: { outcome: 'losing', change: 'accelerated' },
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
      bestMate: -6,
      playedMate: -3,
      mateComparison: { outcome: 'losing', change: 'accelerated' },
    }))
  })
})
