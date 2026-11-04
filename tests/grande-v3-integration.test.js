import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { analyzeGame, createGameAnalysisSession } from '../src/lib/gameAnalysis.js'
import { reclassifyAnalysisMoves, reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { displaySpecialMoves, formatSpecialAssessment } from '../src/lib/analysisSpecialClassification.js'
import { explainClassification } from '../src/lib/classificationDecision.js'
import { prepareLegacyPracticeEntries } from '../src/lib/reviewPractice.js'

const { cases } = JSON.parse(readFileSync(new URL('./fixtures/grande-v3-regressions.json', import.meta.url)))
const check = entry => {
  expect(entry.classificationDecision.classification).toBe(entry.classification)
  expect(entry.classificationDecision.candidateAssessment).toEqual(entry.candidateAssessment)
  expect(entry.candidateAssessment.classification).toBe(entry.classification)
  expect(entry.classificationDecision.policy.grandeVersion).toBe('grande-evidence-candidate-v3')
}

describe('v3 in the application pipeline', () => {
  it.each(cases)('streamed and archived $san use the same final policy without new searches', async ({ entries, expected, san }) => {
    const source = structuredClone(entries), before = JSON.stringify(source), session = createGameAnalysisSession()
    for (const entry of source) session.set(`analysis:${entry.fenBefore}:${entry.playedMove}`, entry)
    const search = vi.fn(() => { throw Error('No search needed: cached evidence') }), emitted = []
    const live = await analyzeGame({ baseFen: source[0].fenBefore, moves: source.map(e => e.playedMove), session,
      openingBook: { hasPosition: () => false }, analyzePosition: search, analyzePlayedPosition: search,
      onEntry: (entry, all) => { check(entry); emitted.push(all) } })
    expect(live.at(-1).classification).toBe(expected)
    expect(live.every(e => !e.classificationOrigin)).toBe(true)
    const archived = reclassifyAnalysisMoves(source)
    expect(archived.at(-1).classification).toBe(expected)
    expect(archived.map(e => e.candidateAssessment)).toEqual(live.map(e => e.candidateAssessment))
    for (const entry of archived) check(entry)
    expect(emitted.at(-1)).toEqual(live)
    expect(search).not.toHaveBeenCalled()
    expect(JSON.stringify(source)).toBe(before)
    expect(reclassifyAnalysisMoves(archived)).toEqual(archived)
    expect(formatSpecialAssessment(archived.at(-1))).toBe('')
    expect(archived.at(-1).specialAssessment.grande.status).not.toBe('supported')
    if (san === 'Nf5') expect(archived.at(-1).candidateAssessment.motif.sufficientForGrande).toBe(false)
    else expect(explainClassification(archived.at(-1))).toMatch(/^Migliore:/)
    expect(prepareLegacyPracticeEntries(archived).at(-1).practiceCandidateClassification).toBeNull()
  })

  it('preserves the old label as origin when opening a downgraded archive', () => {
    const input = structuredClone(cases.find(c => c.san === 'Qg6').entries)
    input[2].classification = 'great'
    const current = reclassifyAnalysisMoves(input)
    expect(current[2].classification).toBe('best')
    expect(current[2].classificationOrigin).toMatchObject({ classification: 'great', policy: null })
    expect(input[2].classification).toBe('great')
    expect(reclassifyAnalysisMoves(current)[2].classificationOrigin).toEqual(current[2].classificationOrigin)
  })

  it('hiding a special label updates metadata and explanation without changing stored entries', () => {
    const old = reclassifyReviewedMoves(structuredClone(cases.find(c => c.san === 'Qg6').entries))
    expect(old[2].classification).toBe('great')
    const before = JSON.stringify(old), displayed = displaySpecialMoves(old, false)
    expect(displayed[2].classification).toBe('best')
    expect(displayed[2].classificationDecision.classification).toBe('best')
    expect(displayed[2].specialAssessment.grande.status).not.toBe('supported')
    expect(formatSpecialAssessment(displayed[2])).toBe('')
    expect(explainClassification(displayed[2])).toMatch(/^Migliore:/)
    expect(JSON.stringify(old)).toBe(before)
    expect(displaySpecialMoves(old, true)).toBe(old)
  })

  it('keeps non-Grande categories and numerical fields from the published stage', () => {
    const input = structuredClone(cases.flatMap(c => c.entries))
    // Separate three-move contexts; the classifier must not reinterpret disconnected games.
    for (let i = 0; i < input.length; i += 3) {
      const entries = input.slice(i, i + 3), published = reclassifyReviewedMoves(entries), active = reclassifyAnalysisMoves(entries)
      for (const [j, entry] of active.entries()) {
        if (!['best', 'excellent', 'great'].includes(published[j].classification)) {
          expect(entry.classification).toBe(published[j].classification)
          expect(entry.specialAssessment).toEqual(published[j].specialAssessment)
        }
        for (const key of ['bestEval', 'playedEval', 'dropPct', 'engine', 'playedEngine']) expect(entry[key]).toEqual(published[j][key])
      }
    }
  })
})
