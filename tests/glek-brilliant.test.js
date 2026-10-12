import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { displaySpecialMoves } from '../src/lib/specialClassification.js'

// Raw, budgeted engine evidence for the position supplied in Carlo's screenshots.
// No platform label, rating or preclassified result is passed to the detectors.
const searches = Array.from({ length: 5 }, (_, i) => JSON.parse(readFileSync(
  new URL(`../agent-output/glek-nxe4-v1/search-${i}.json`, import.meta.url))))
function entries() {
  return ['Nf6', 'g3', 'Nxe4', 'Nxe4'].map((san, i) => {
    const game = new Chess(searches[i].fen), move = game.move(san)
    expect(game.fen()).toBe(searches[i + 1].fen)
    return { ply: i + 6, side: searches[i].fen.split(' ')[1], playedMove: move.san,
      playedUci: `${move.from}${move.to}${move.promotion ?? ''}`, isBookMove: i < 2,
      fenBefore: searches[i].fen, fenAfter: game.fen(),
      engine: searches[i].engine, playedEngine: searches[i + 1].engine }
  })
}

describe('near-best knight sacrifice in the Glek opening', () => {
  it('distinguishes the best move Bc5 from the near-best played Nxe4', () => {
    const result = classifyReviewedMove(entries()[2])
    expect(result).toMatchObject({ bestUci: 'f8c5', playedUci: 'f6e4', isEngineBest: false,
      classification: 'excellent', bestEval: 18, playedEval: -20,
      evaluationEvidence: { source: 'completed-snapshot', status: 'coherent' } })
    expect(result.dropPct).toBeGreaterThan(2)
    expect(result.dropPct).toBeLessThan(3)
  })

  it('keeps the sacrifice provisional until the acceptance position corroborates compensation', () => {
    const input = entries(), original = JSON.stringify(input)
    const partial = reclassifyReviewedMoves(input.slice(0, 3))[2]
    expect(partial).toMatchObject({ classification: 'excellent', specialAssessment: {
      brilliant: { status: 'candidate', reason: 'unresolved-tactical-sequence' } } })
    const full = reclassifyReviewedMoves(input)
    expect(full[2]).toMatchObject({ classification: 'brilliant', baseClassification: 'excellent', isEngineBest: false,
      specialAssessment: { brilliant: { status: 'supported', reason: 'compensated-new-offer' } } })
    const offer = full[2].specialAssessment.brilliant.offers[0]
    expect(offer).toMatchObject({ uci: 'c3e4', delta: -2, corroboration: { proofAgainstEveryDefense: false } })
    expect(offer.continuation.slice(0, 4).map(e => e.san)).toEqual(['Nxe4', 'd5', 'Nc3', 'd4'])
    expect(displaySpecialMoves(full, false)[2].classification).toBe('excellent')
    expect(reclassifyReviewedMoves(full)).toEqual(full)
    expect(JSON.stringify(input)).toBe(original)
  })
})
