import { expect, it } from 'vitest'
import { loadOpeningBook } from '../src/lib/openingBook.js'
import { loadAnalysisBook } from '../src/lib/analysisBookMetadata.js'
import data from '../src/data/openingPositions.json'

it('attaches recorded repertoire identity only to the analysis view without changing the original book', async () => {
  const original = await loadOpeningBook(), before = { ...original }
  const analysis = await loadAnalysisBook(), { positions, ...metadata } = data
  expect(analysis.metadata).toEqual(metadata)
  expect(analysis.hasPosition(positions[0])).toBe(true)
  expect(analysis.hasPosition).toBe(original.hasPosition)
  expect(original).toEqual(before)
  expect(original).not.toHaveProperty('metadata')
})

it('reuses the analysis promise and loaded repertoire rather than rebuilding or fetching the positions', async () => {
  const first = loadAnalysisBook(), second = loadAnalysisBook()
  expect(second).toBe(first)
  expect(await second).toBe(await first)
})
