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
  it('follows the ordered dropPct ladder', () => {
    expect(classifyMove({ dropPct: 0, isBookMove: true })).toBe('book')
    expect(classifyMove({ dropPct: 0.2 })).toBe('best')
    expect(classifyMove({ dropPct: 2 })).toBe('excellent')
    expect(classifyMove({ dropPct: 4 })).toBe('good')
    expect(classifyMove({ dropPct: 8 })).toBe('inaccuracy')
    expect(classifyMove({ dropPct: 15 })).toBe('mistake')
    expect(classifyMove({ dropPct: 40 })).toBe('blunder')
  })

  it('rejects legacy cp inputs without an explicit dropPct', () => {
    expect(() => classifyMove({ evalDelta: 500 })).toThrow('dropPct must be a finite number')
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
