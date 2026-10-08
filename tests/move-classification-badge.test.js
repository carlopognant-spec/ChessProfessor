import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MoveClassificationBadge from '../src/components/MoveClassificationBadge.jsx'
import { getReviewSquareStyles } from '../src/lib/moveReviewPresentation.js'

describe('move classification badge', () => {
  it.each([
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O', 'g1', 'e1'],
    ['7k/P7/8/8/8/8/8/7K w - - 0 1', 'a8=Q+', 'a8', 'a7'],
    ['7k/8/8/3pP3/8/8/8/7K w - d6 0 1', 'exd6', 'd6', 'e5'],
  ])('places the badge on the moved piece for %s / %s', (fenBefore, playedMove, square, origin) => {
    const markup = renderToStaticMarkup(React.createElement(MoveClassificationBadge, { entry: { fenBefore, playedMove, classification: 'best' } }))
    expect(markup).toContain(`data-move-square="${square}"`)
    expect(markup).toContain(`aria-label="${playedMove}: Migliore"`)
    expect(Object.keys(getReviewSquareStyles({ fenBefore, playedMove, classification: 'best' }))).toEqual([origin, square])
  })
})
