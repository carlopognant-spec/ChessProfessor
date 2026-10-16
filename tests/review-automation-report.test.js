import { describe, it, expect } from 'vitest'
import { compareReviewRows, renderReviewReport } from '../scripts/qa/review-report.mjs'

const row = (ply, actual, expected = 'Grande', cohort = 'old') => ({ cohort, game: 'test', ply, san: 'Nc3', actual, expected })
describe('offline review acceptance and report', () => {
  it('counts unique moves without double-counting initial observations', () => {
    const base = [row(1, 'Migliore'), row(1, 'Migliore', 'Grande', 'initial')]
    const r = compareReviewRows(base, [row(1, 'Grande'), row(1, 'Grande', 'Grande', 'initial')])
    expect(r).toMatchObject({ passed: true, observations: 2, uniqueMoves: 1, specials: [{ category: 'Grande', expected: 1, correct: 1, false: 0 }, { category: 'Geniale', expected: 0, correct: 0, false: 0 }] })
    expect(r.improvements).toHaveLength(2)
  })
  it('rejects a correct special changed to another special, even if totals balance', () => {
    const r = compareReviewRows([row(1, 'Grande'), row(2, 'Migliore', 'Geniale')], [row(1, 'Geniale'), row(2, 'Geniale', 'Geniale')])
    expect(r.passed).toBe(false)
    expect(r.regressions).toHaveLength(1)
    expect(r.falsePositives).toHaveLength(1)
  })
  it('rejects changes in numerical values and regression of ordinary labels', () => {
    const r = compareReviewRows([row(1, 'Buona', 'Buona')], [{ ...row(1, 'Ottima', 'Buona'), numericUnchanged: false }])
    expect(r.passed).toBe(false)
    expect(r.numericChanges).toHaveLength(1)
    expect(r.regressions).toHaveLength(1)
  })
  it('rejects a new false special even in the initial duplicate profile', () => {
    const base = [row(1, 'Buona', 'Ottima', 'initial'), row(1, 'Ottima', 'Ottima', 'refined')]
    const r = compareReviewRows(base, [row(1, 'Grande', 'Ottima', 'initial'), row(1, 'Ottima', 'Ottima', 'refined')])
    expect(r.passed).toBe(false)
    expect(r.regressions).toHaveLength(0)
    expect(r.falsePositives).toHaveLength(1)
  })
  it('rejects missing, duplicate or changed references', () => {
    const base = [row(1, 'Grande'), row(2, 'Grande')]
    expect(() => compareReviewRows(base, [row(1, 'Grande')])).toThrow()
    expect(() => compareReviewRows(base, [row(1, 'Grande'), row(1, 'Grande')])).toThrow()
    expect(() => compareReviewRows(base, [row(1, 'Grande'), row(2, 'Grande', 'Buona')])).toThrow()
  })
  it('does not present unresolved references as an automatic failure or independent validation', () => {
    const r = compareReviewRows([row(1, 'Migliore')], [row(1, 'Migliore')])
    expect(r.passed).toBe(true)
    expect(r.unresolved).toHaveLength(1)
    const text = renderReviewReport({ result: r })
    expect(text).toContain('nessuna validazione indipendente')
    expect(text).toContain('Nuove ricerche motore: 0')
    expect(text).toContain('non ricorda la fonte')
  })
})
