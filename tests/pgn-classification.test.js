import { describe, expect, it } from 'vitest'
import { createAnalysisCache } from '../src/lib/analysisCache.js'
import { parsePgnMoves } from '../src/lib/pgn.js'
import { classifyMove } from '../src/lib/classification.js'

describe('PGN parser', () => {
  it('parses a standard move list into SAN moves', () => {
    const moves = parsePgnMoves('1. e4 e5 2. Nf3 Nc6')
    expect(moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  })

  it('ignores comments and whitespace noise', () => {
    const moves = parsePgnMoves('1. e4 {opening} e5 2. Nf3  Nc6')
    expect(moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  })
})

describe('move classification', () => {
  it('follows the complete ordered classification ladder', () => {
    expect(classifyMove({ evalDelta: 0, isBookMove: true })).toBe('book')
    expect(classifyMove({ evalDelta: 500 })).toBe('brilliant')
    expect(classifyMove({ evalDelta: 300 })).toBe('great')
    expect(classifyMove({ evalDelta: 180 })).toBe('best')
    expect(classifyMove({ evalDelta: 90 })).toBe('excellent')
    expect(classifyMove({ evalDelta: 30 })).toBe('good')
    expect(classifyMove({ evalDelta: -10 })).toBe('inaccuracy')
    expect(classifyMove({ evalDelta: -80 })).toBe('inaccuracy')
    expect(classifyMove({ evalDelta: -200 })).toBe('mistake')
    expect(classifyMove({ evalDelta: -400 })).toBe('blunder')
  })

  it('marks a missed opportunity only after an opponent error', () => {
    expect(classifyMove({ evalDelta: -500 })).toBe('blunder')
    expect(classifyMove({
      evalDelta: 0,
      previousOpponentError: true,
      missedOpportunity: true,
    })).toBe('missed')
  })
})

describe('analysis cache', () => {
  it('stores and reuses value by fen key', () => {
    const cache = createAnalysisCache()

    cache.set('fen-key', { value: 42 })

    expect(cache.get('fen-key')).toEqual({ value: 42 })
    expect(cache.get('missing')).toBeNull()
  })
})
