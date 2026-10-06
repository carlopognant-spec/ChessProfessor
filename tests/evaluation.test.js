import { describe, expect, it } from 'vitest'
import {
  calculateWinProbability,
  formatMateLabel,
  normalizeEvalToWhite,
} from '../src/lib/evaluation.js'

describe('evaluation helpers', () => {
  it('normalizes centipawn values from the white perspective', () => {
    expect(normalizeEvalToWhite(120)).toBe(120)
    expect(normalizeEvalToWhite(-120)).toBe(-120)
    expect(normalizeEvalToWhite(120, 'black')).toBe(-120)
    expect(normalizeEvalToWhite(-120, 'black')).toBe(120)
  })

  it('keeps win probability in the [0, 1] range and keeps the sign consistent', () => {
    expect(calculateWinProbability(0)).toBeCloseTo(0.5, 5)
    expect(calculateWinProbability(200)).toBeGreaterThan(0.5)
    expect(calculateWinProbability(-200)).toBeLessThan(0.5)
    expect(calculateWinProbability(200)).toBeGreaterThan(calculateWinProbability(0))
    expect(calculateWinProbability(-200)).toBeLessThan(calculateWinProbability(0))
  })

  it('formats mate scores as explicit labels', () => {
    expect(formatMateLabel(3)).toBe('M3')
    expect(formatMateLabel(-3)).toBe('M3')
    expect(formatMateLabel(1)).toBe('M1')
  })

  it('distinguishes large advantages and preserves symmetry for both players', () => {
    const values = [1000, 2000, 4000].map(cp => calculateWinProbability(cp))
    expect(values[0]).toBeLessThan(values[1])
    expect(values[1]).toBeLessThan(values[2])
    for (const cp of [1000, 2000, 4000]) {
      expect(calculateWinProbability(-cp)).toBeCloseTo(1 - calculateWinProbability(cp), 12)
      expect(calculateWinProbability(cp, 'black')).toBe(calculateWinProbability(-cp))
    }
  })
})
