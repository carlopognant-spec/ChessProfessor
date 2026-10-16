import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { classifyMoveOpportunity, formatMoveOpportunity } from '../src/lib/moveOpportunities.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { preExistingAlternativeOffer } from '../src/lib/sacrificeEvidence.js'
import { Chess } from 'chess.js'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

const refined = JSON.parse(readFileSync(new URL('../agent-output/refinement-quality-priority-v2/priority-game-184316313800-round-2.json', import.meta.url)))
function reviewedPair() {
  return structuredClone(refined.view.slice(17, 19)).map(classifyReviewedMove)
}

describe('winning opportunity from an intermediate advantage', () => {
  it('recognizes the recorded opportunity only with both completed comparisons and child agreement', () => {
    const [previous, entry] = reviewedPair(), original = JSON.stringify([previous, entry])
    expect(entry.playedMove).toBe('Bf4')
    expect(entry.classification).toBe('blunder')
    const result = classifyMoveOpportunity(entry, previous)
    expect(result).toMatchObject({ classification: 'missed', baseClassification: 'blunder',
      missedOpportunityReason: 'verified-intermediate-winning-opportunity',
      missedOpportunity: { policyVersion: 'opportunity-evidence-v2', kind: 'winning-opportunity',
        evidence: { source: 'completed-snapshot', previousSource: 'completed-snapshot' } } })
    expect(result.missedOpportunity.beforeProbability).toBeGreaterThan(0.6)
    expect(result.missedOpportunity.beforeProbability).toBeLessThan(0.75)
    expect(result.missedOpportunity.alternative.san.length).toBeGreaterThanOrEqual(2)
    expect(formatMoveOpportunity(result.missedOpportunity)).toContain(result.missedOpportunity.alternative.san[0])
    expect(JSON.stringify([previous, entry])).toBe(original)
    expect(classifyMoveOpportunity(result, previous)).toEqual(result)
  })

  it.each([
    ['legacy previous comparison', (p, e) => { delete p.engine.specialLines }],
    ['legacy current comparison', (p, e) => { delete e.engine.specialLines }],
    ['incomplete previous snapshot', (p, e) => { p.engine.specialLines.pop() }],
    ['bounded current snapshot', (p, e) => { e.engine.specialLines[0].upperbound = true }],
    ['bounded child', (p, e) => { e.playedEngine.lines[0].lowerbound = true }],
    ['child from another position', (p, e) => { e.playedEngine.fen = p.fenBefore }],
    ['illegal child continuation', (p, e) => { e.playedEngine.lines[0].pv = ['a1a8'] }],
    ['missing child score', (p, e) => { e.playedEngine.lines[0].evalCp = null; e.playedEngine.lines[0].mate = null }],
    ['wrong previous move', (p, e) => { p.playedUci = 'a1a8' }],
    ['incoherent played position', (p, e) => { e.fenAfter = p.fenBefore }],
    ['book context', (p, e) => { p.isBookMove = true }],
    ['delivered mate', (p, e) => { e.playedMate = 0 }],
    ['retained winning mate', (p, e) => { e.playedMate = 3 }],
  ])('does not invent an opportunity with %s', (_, mutate) => {
    const [previous, entry] = reviewedPair()
    mutate(previous, entry)
    expect(classifyMoveOpportunity(entry, previous).classification).not.toBe('missed')
  })

  it('uses the same result during streamed analysis and cache reuse without caching context', async () => {
    const [previous, entry] = reviewedPair(), session = createGameAnalysisSession()
    const packets = new Map([[previous.fenBefore, previous.engine], [entry.fenBefore, entry.engine], [entry.fenAfter, entry.playedEngine]])
    const lookup = async fen => packets.get(fen)
    const options = { moves: [previous.playedMove, entry.playedMove], baseFen: previous.fenBefore,
      openingBook: createOpeningBook(), session, analyzePosition: lookup, analyzePlayedPosition: lookup }
    const first = await analyzeGame(options)
    expect(first[1]).toMatchObject({ classification: 'missed', missedOpportunityReason: 'verified-intermediate-winning-opportunity' })
    expect(await analyzeGame(options)).toEqual(first)
    expect(session.get(`analysis:${entry.fenBefore}:${entry.playedMove}`).missedOpportunity).toBeUndefined()
  })
})

describe('winning alternatives that keep an existing offer', () => {
  it.each([
    ['k7/8/8/8/2p5/1B6/8/K7 w - - 0 1', 'c4b3', 'b3'],
    ['k7/8/1b6/2P5/8/8/8/K7 b - - 0 1', 'c5b6', 'b6'],
  ])('verifies an already legal capture for either color: %s', (fenBefore, uci, square) => {
    expect(preExistingAlternativeOffer({ fenBefore }, { uci, square, type: 'b', movedPiece: false })).toBe(true)
    expect(preExistingAlternativeOffer({ fenBefore }, { uci, square, type: 'b', movedPiece: true })).toBe(false)
    expect(preExistingAlternativeOffer({ fenBefore }, { uci, square, type: 'q', movedPiece: false })).toBe(false)
  })

  it('does not treat a geometrically attacking pinned knight as a legal capture', () => {
    const fenBefore = '4k3/4n3/8/5B2/8/8/8/K3R3 w - - 0 1'
    expect(new Chess(fenBefore).attackers('f5', 'b')).toContain('e7')
    expect(preExistingAlternativeOffer({ fenBefore }, { uci: 'e7f5', square: 'f5', type: 'b', movedPiece: false })).toBe(false)
  })

  it('keeps an offer created by opening a line distinct from an already available capture', () => {
    const fenBefore = 'k4r2/8/5N2/5B2/8/8/8/K7 w - - 0 1', board = new Chess(fenBefore)
    board.move('Nh7')
    expect(board.moves({ verbose: true }).some(m => m.from === 'f8' && m.to === 'f5' && m.captured === 'b')).toBe(true)
    expect(preExistingAlternativeOffer({ fenBefore }, { uci: 'f8f5', square: 'f5', type: 'b', movedPiece: false })).toBe(false)
  })

  it('removes the recorded false brilliant from a v11 archive without forcing the reference category', () => {
    const stored = JSON.parse(readFileSync(new URL('../agent-output/refinement-quality-priority-v2/priority-game-185262315732-round-2.json', import.meta.url)))
    expect(stored.view[52].classification).toBe('brilliant')
    const original = JSON.stringify(stored.entries), view = reclassifyReviewedMoves(stored.view)
    expect(view[52]).toMatchObject({ playedMove: 'Bxc4', classification: 'best',
      specialAssessment: { version: 'counterfactual-v24', brilliant: { status: 'rejected', reason: 'winning-alternative-without-new-sacrifice' } } })
    expect(reclassifyReviewedMoves(view)).toEqual(view)
    expect(JSON.stringify(stored.entries)).toBe(original)
  })
})
