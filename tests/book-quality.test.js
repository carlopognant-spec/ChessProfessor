import { Chess } from 'chess.js'
import { describe, expect, it, vi } from 'vitest'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { loadAnalysisBook } from '../src/lib/analysisBookMetadata.js'
import { applyBookQuality } from '../src/lib/reviewEvaluation.js'
import { reclassifyAnalysisMoves, reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { explainClassification, replayNumericalDecision } from '../src/lib/classificationDecision.js'
import { buildPracticeCandidates } from '../src/lib/reviewPractice.js'
import { resolveMoveReview } from '../src/lib/analysisPresentation.js'

// The g4 scores and mating reply are the observed REA audit comparison; other pairs only complete the replay.
function auditReplay() {
  const game = new Chess(), session = createGameAnalysisSession(), entries = []
  for (const san of ['f3', 'e5', 'g4', 'Qh4#']) {
    const fenBefore = game.fen(), move = game.move(san), fenAfter = game.fen()
    const uci = move.from + move.to
    const line = (fen, pv, score = {}) => ({ fen, depth: 12, multipv: 1, evalCp: 0, mate: null, pv, ...score })
    const root = san === 'g4' ? line(fenBefore, ['b1c3', 'd7d5'], { evalCp: -69 })
      : line(fenBefore, [uci], san === 'Qh4#' ? { evalCp: null, mate: 1 } : {})
    const child = san === 'g4' ? line(fenAfter, ['d8h4'], { evalCp: null, mate: 1 })
      : line(fenAfter, game.moves({ verbose: true }).slice(0, 1).map(m => m.from + m.to), game.isCheckmate() ? { mate: 0, evalCp: null } : {})
    const entry = { fenBefore, fenAfter, playedMove: san, engine: { ...root, lines: [root] }, playedEngine: { ...child, lines: [child] } }
    session.set(`analysis:${fenBefore}:${san}`, entry)
    entries.push(entry)
  }
  return { game, session, entries }
}

describe('book membership and measured errors in application review', () => {
  it('replays the exact g4 audit case consistently in live review, archives, decisions and practice', async () => {
    const { game, session } = auditReplay(), book = await loadAnalysisBook()
    const failSearch = vi.fn(() => { throw Error('Cached audit comparison only') })
    const live = await analyzeGame({ moves: game.history(), session, openingBook: book,
      analyzePosition: failSearch, analyzePlayedPosition: failSearch })
    const g4 = live[2]
    expect(failSearch).not.toHaveBeenCalled()
    expect(book.hasPosition(g4.fenAfter)).toBe(true)
    expect(g4).toMatchObject({ playedMove: 'g4', isBookMove: true, classification: 'blunder',
      numericalClassification: 'blunder', baseClassification: 'blunder', moveFacts: { book: true },
      candidateAssessment: { classification: 'blunder', verdict: 'not-applicable' },
      classificationDecision: { classification: 'blunder', numericalClassification: 'blunder', rule: 'opening-book-error' } })
    expect(g4.openingBookMetadata).toEqual(book.metadata)
    expect(g4.classificationDecision.openingBookMetadata).toEqual(book.metadata)
    expect(replayNumericalDecision(g4.classificationDecision)).toEqual({ status: 'reproduced', classification: 'blunder' })
    expect(explainClassification(g4)).toContain('La presenza nel repertorio non annulla')
    expect(resolveMoveReview(g4.fenAfter, game.history().slice(0, 3), live).bestMove).toBe('b1c3')
    expect(await buildPracticeCandidates({ pgn: game.pgn(), entries: live, side: 'w' })).toEqual([
      expect.objectContaining({ ply: 3, originalSan: 'g4', classification: 'blunder' }),
    ])
    const before = JSON.stringify(live)
    const migrated = reclassifyAnalysisMoves(live)
    expect(migrated[2].classification).toBe('blunder')
    expect(replayNumericalDecision(migrated[2].classificationDecision).status).toBe('reproduced')
    expect(reclassifyAnalysisMoves(migrated)).toEqual(migrated)
    expect(JSON.stringify(live)).toBe(before)
    const frozen = reclassifyReviewedMoves(live)
    expect(frozen[2].classification).toBe('book')
    expect(replayNumericalDecision(frozen[2].classificationDecision)).toEqual({ status: 'reproduced', classification: 'book' })
  })

  it('keeps ordinary book quality, unknown scores and forced moves unchanged', () => {
    for (const classification of ['best', 'excellent', 'good', 'inaccuracy', 'unclassified']) {
      const entry = { classification: 'book', isBookMove: true, numericalClassification: classification }
      expect(applyBookQuality(entry)).toBe(entry)
    }
    const forced = { classification: 'forced', isBookMove: true, numericalClassification: 'blunder' }
    expect(applyBookQuality(forced)).toBe(forced)
    expect(applyBookQuality({ classification: 'book', numericalClassification: 'mistake' }).classification).toBe('mistake')
  })
})
