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

  it('ignores nested variations while preserving the main line', () => {
    const moves = parsePgnMoves('1. e4 {main} e5 (1... c5 (2. Nf3 d6)) 2. Nf3 Nc6 {end}')
    expect(moves).toEqual(['e4', 'e5', 'Nf3', 'Nc6'])
  })
})

describe('move classification', () => {
  it('follows the complete ordered classification ladder', () => {
    expect(classifyMove({ isBookMove: true })).toBe('book')
    for (const [limit, category, next] of [[1, 'best', 'excellent'], [3, 'excellent', 'good'], [5, 'good', 'inaccuracy'], [10, 'inaccuracy', 'mistake'], [20, 'mistake', 'blunder']]) {
      expect(classifyMove({ dropPct: limit })).toBe(category)
      expect(classifyMove({ dropPct: limit + 0.001 })).toBe(next)
    }
    expect(classifyMove({ dropPct: 0 })).toBe('best')
    expect(classifyMove({ dropPct: -2 })).toBe('best')
    expect(classifyMove({ dropPct: 100 })).toBe('blunder')
    for (const dropPct of [null, undefined, NaN, Infinity]) expect(() => classifyMove({ dropPct })).toThrow('dropPct must be a finite number')
  })

  it('rejects legacy cp inputs without an explicit dropPct', () => {
    expect(() => classifyMove({ evalDelta: 500 })).toThrow('dropPct must be a finite number')
  })

  it('does not manufacture special labels from loss or opponent context', () => {
    expect(classifyMove({ dropPct: 100 })).toBe('blunder')
    expect(classifyMove({
      dropPct: 0,
      previousOpponentError: true,
      missedOpportunity: true,
    })).toBe('best')
  })

  it.todo('marks a missed opportunity only after an opponent error (Point 3)')
  it.todo('re-introduces brilliant and great when Point 4 rules are implemented')
})

describe('analysis cache', () => {
  it('stores and reuses value by fen key', () => {
    const cache = createAnalysisCache()

    cache.set('fen-key', { value: 42 })

    expect(cache.get('fen-key')).toEqual({ value: 42 })
    expect(cache.get('missing')).toBeNull()
  })
})
