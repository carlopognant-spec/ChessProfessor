import { loadOpeningBook } from './openingBook.js'

let analysisBookPromise

export function loadAnalysisBook() {
  analysisBookPromise ??= Promise.all([loadOpeningBook(), import('../data/openingPositions.json')])
    .then(([book, { default: data }]) => {
      const { positions, ...metadata } = data
      return { ...book, metadata }
    })
  return analysisBookPromise
}
