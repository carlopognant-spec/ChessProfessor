import { it, expect } from 'vitest'
import { parsePersonal } from '../scripts/qa/personal-import.js'
import { compare, summarizeReports } from '../scripts/qa/compare.js'

it('imports multiword categories and logs typo normalization', () => {
  const result = parsePersonal('1. f3 e5 2. g4 Qh4# *', '1. f3 erroe e5 migliroe\n2. g4 errore grave Qh4# migliore', 'test')
  expect(result.fixture.annotations.map(a => a.category)).toEqual(['Errore', 'Migliore', 'Errore grave', 'Migliore'])
  expect(result.corrections).toHaveLength(2)
})
it('keeps unannotated data separate and rejects partial or mismatched input', () => {
  const pgn = '1. f3 e5 2. g4 Qh4# *'
  expect(parsePersonal(pgn, '1. f3 e5\n2. g4 Qh4#', 'test').fixture.role).toBe('holdout-unannotated')
  expect(() => parsePersonal(pgn, '1. f3 errore e5\n2. g4 Qh4#', 'test')).toThrow('parziali')
  expect(() => parsePersonal(pgn, '1. e4 e5\n2. g4 Qh4#', 'test')).toThrow('SAN')
  expect(() => parsePersonal(pgn, '1. f3 errore e5 sconosciuta\n2. g4 errore Qh4# migliore', 'test')).toThrow('sconosciuta')
})
it('counts forced labels separately and excludes them from accuracy', () => {
  const fixture = parsePersonal('1. e4 e5 *', '1. e4 migliore e5 forzata', 'test').fixture
  const score = { evalCp: 0, mate: null, lines: [] }
  const report = compare(fixture, { entries: [{ san: 'e4', engine: score, playedEngine: score }, { san: 'e5', engine: score, playedEngine: score }] })
  expect(report.included).toBe(1)
  expect(report.exactPct).toBe(100)
  expect(report.expectedCounts.Forzata).toBe(1)
  expect(report.exclusions.forced).toBe(1)
  const summary = summarizeReports([report, { ...report, sanity: true }])
  expect(summary.total).toBe(2)
  expect(summary.included).toBe(1)
  expect(summary.categories.Forzata).toEqual({ total: 1, included: 0, exact: 0 })
  expect(summary.exactPct).toBe(100)
})
