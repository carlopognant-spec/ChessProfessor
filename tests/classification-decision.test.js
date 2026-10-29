import { describe, expect, it } from 'vitest'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { createClassificationPolicy } from '../src/lib/classificationPolicy.js'
import { annotateClassification, annotateClassifications, explainClassification, replayNumericalDecision } from '../src/lib/classificationDecision.js'

const policy = createClassificationPolicy()
function example(classification = 'best', dropPct = 0, extra = {}, activePolicy = policy) {
  const bestProbability = .5, playedProbability = .5 - dropPct / 100
  return { classification, numericalClassification: classification, bestEval: 0,
    playedEval: activePolicy.scoreModel.cpScale * Math.log(playedProbability / (1 - playedProbability)),
    bestMate: null, playedMate: null, bestProbability, playedProbability, dropPct, isEngineBest: true, isBookMove: false,
    moveFacts: { forced: false, legalMoves: 20 }, evaluationSource: 'root-pv',
    evaluationEvidence: { version: activePolicy.reviewVersion, source: 'completed-snapshot', status: 'coherent' },
    engine: { analysisMetadata: createAnalysisMetadata() }, playedEngine: { analysisMetadata: createAnalysisMetadata() }, ...extra }
}
const trace = entry => annotateClassification(entry).classificationDecision

describe('recorded classification decisions', () => {
  it('detaches and freezes serializable decision data without mutating or freezing the input', () => {
    const entry = example(), before = structuredClone(entry), recorded = annotateClassification(entry)
    expect(entry).toEqual(before)
    expect(Object.isFrozen(entry)).toBe(false)
    expect(Object.isFrozen(entry.engine.analysisMetadata)).toBe(false)
    expect(Object.isFrozen(recorded.classificationDecision.policy.thresholds)).toBe(true)
    expect(JSON.parse(JSON.stringify(recorded.classificationDecision))).toEqual(recorded.classificationDecision)
    entry.engine.analysisMetadata.budget.value = 7
    expect(recorded.classificationDecision.engineProfiles.root.budget.value).not.toBe(7)
    expect(recorded.classificationOrigin).toBeUndefined()
  })

  it('retains one first original snapshot across repeated migrations without guessing a legacy policy', () => {
    const old = { classification: 'good' }, current = example('mistake', 15)
    const first = annotateClassification(current, old)
    expect(first.classificationOrigin).toEqual({ schemaVersion: 0, classification: 'good', policy: null })
    const twice = annotateClassification(first, annotateClassification(example('blunder', 30)))
    expect(twice).toEqual(first)
    expect(twice.classificationOrigin.classificationDecision).toBeUndefined()
    const known = annotateClassification(example())
    expect(annotateClassification(current, known).classificationOrigin).toEqual(known.classificationDecision)
    expect(explainClassification(first)).toContain('non ha criteri registrati')
    expect(explainClassification(first)).toContain('ricostruzione corrente')
  })

  it('preserves a detached immutable position and history in the first original decision', () => {
    const entry = example(), history = { initialFen: 'initial-fen', moves: ['e2e4'] }
    entry.fenBefore = 'before-fen'; entry.fenAfter = 'after-fen'; entry.engine.history = history
    const recorded = annotateClassification(entry), position = recorded.classificationDecision.position
    expect(position).toEqual({ fenBefore: 'before-fen', fenAfter: 'after-fen', history })
    expect(Object.isFrozen(position)).toBe(true)
    expect(Object.isFrozen(position.history.moves)).toBe(true)
    expect(Object.isFrozen(history.moves)).toBe(false)
    history.moves.push('e7e5'); entry.fenBefore = 'changed-fen'
    expect(position.history.moves).toEqual(['e2e4'])
    expect(position.fenBefore).toBe('before-fen')
    const updated = annotateClassification(example('good', 4), recorded)
    expect(updated.classificationOrigin.position).toEqual(position)
    expect(updated.classificationDecision.position).toEqual({ fenBefore: null, fenAfter: null, history: null })
  })

  it('records history mode, engine profiles, book identity and additional rule reasons', () => {
    const base = example(), history = { initialFen: 'recorded-fen', moves: [] }
    expect(trace(base).evidence.historyMode).toBe('fen-only')
    expect(trace({ ...base, engine: { ...base.engine, history }, playedEngine: { ...base.playedEngine, history } }).evidence.historyMode).toBe('game-history')
    expect(trace({ ...base, engine: { history } }).evidence.historyMode).toBe('unknown')
    const result = trace({ ...base, openingBookMetadata: { version: 'book-test' }, missedOpportunityReason: 'verified-mate-not-retained',
      specialAssessment: { version: 'special-test', grande: { reason: 'critical-defense' } } })
    expect(result.openingBookMetadata).toEqual({ version: 'book-test' })
    expect(result.reasons).toMatchObject({ missed: 'verified-mate-not-retained', great: 'critical-defense', specialPolicy: 'special-test' })
    expect(result.engineProfiles.root).toEqual(createAnalysisMetadata())
    const collection = annotateClassifications([base, base])
    expect(collection.map(e => e.classificationDecision.policy)).toEqual([policy, policy])
    expect(collection.every(e => !Object.hasOwn(e, 'classificationOrigin'))).toBe(true)
  })

  it.each([['best', 0], ['excellent', 2], ['good', 4], ['inaccuracy', 7], ['mistake', 15], ['blunder', 30]])
  ('replays and explains the %s numerical band', (classification, drop) => {
    const entry = annotateClassification(example(classification, drop))
    expect(replayNumericalDecision(entry.classificationDecision)).toEqual({ status: 'reproduced', classification })
    const explanation = explainClassification(entry)
    expect(explanation).toContain('punti percentuali')
    expect(explanation).toContain('indice')
    expect(explanation).toContain('non è una probabilità calibrata')
  })

  it('replays captured thresholds and scale instead of using current settings', () => {
    const oldPolicy = structuredClone(policy)
    oldPolicy.thresholds.good = 9; oldPolicy.scoreModel.cpScale = 800
    const entry = example('good', 7, {}, oldPolicy)
    const decision = annotateClassification(entry, undefined, oldPolicy).classificationDecision
    expect(replayNumericalDecision(decision)).toEqual({ status: 'reproduced', classification: 'good' })
    expect(replayNumericalDecision({ ...decision, policy })).toMatchObject({ status: 'mismatch' })
    expect(explainClassification({ ...entry, classificationDecision: decision })).toContain('fino a 9')
  })

  it('records and replays the different-primary downgrade and verified equal-score promotion', () => {
    const entry = example('excellent', 0, { isEngineBest: false })
    expect(trace(entry).rule).toBe('different-primary-choice')
    expect(replayNumericalDecision(trace(entry))).toMatchObject({ status: 'reproduced', classification: 'excellent' })
    expect(explainClassification(entry)).toContain('differisce dalla prima scelta')
    expect(explainClassification(entry)).toMatch(/^Ottima:/)
    const tied = { ...entry, classification: 'best', numericalClassification: 'best',
      evaluationEvidence: { ...entry.evaluationEvidence, equivalentBest: { kind: 'equal-cp' } } }
    expect(replayNumericalDecision(trace(tied))).toMatchObject({ status: 'reproduced', classification: 'best' })
    expect(explainClassification(tied)).toContain('valutazione pari')
    expect(explainClassification(tied)).toContain('da Ottima a Migliore')
    const mateTie = { ...tied, bestEval: null, playedEval: null, bestMate: 3, playedMate: 3, bestProbability: 1, playedProbability: 1,
      evaluationEvidence: { ...tied.evaluationEvidence, equivalentBest: { kind: 'equal-mate' } } }
    expect(replayNumericalDecision(trace(mateTie))).toMatchObject({ status: 'reproduced', classification: 'best' })
  })

  it.each([
    ['forced', { moveFacts: { forced: true, legalMoves: 1 } }, 'una sola mossa legale'],
    ['book', { isBookMove: true }, 'flag archiviato'],
  ])('replays and explains the %s override separately from its numerical category', (classification, extra, text) => {
    const entry = annotateClassification(example('mistake', 15, { ...extra, classification }))
    expect(replayNumericalDecision(entry.classificationDecision)).toEqual({ status: 'reproduced', classification })
    expect(explainClassification(entry)).toContain(text)
  })

  it('does not reproduce a forced override contradicted by the recorded legal move count', () => {
    const decision = structuredClone(trace(example()))
    decision.classification = 'forced'; decision.inputs.forced = true
    expect(decision.inputs.legalMoves).toBe(20)
    expect(replayNumericalDecision(decision)).toEqual({ status: 'mismatch', classification: 'best' })
    const displayed = { ...example(), classification: 'forced', classificationDecision: decision }
    expect(explainClassification(displayed)).toContain('criterio non verificato')
    expect(explainClassification(displayed)).not.toContain('c’era una sola mossa legale')
    decision.inputs.legalMoves = null
    expect(replayNumericalDecision(decision).status).not.toBe('reproduced')
    expect(explainClassification(displayed)).toContain('criterio non verificato')
  })

  it('supports missing scores and delivered mate without manufacturing a score', () => {
    const unavailable = example('unclassified', 0, { bestEval: null, playedEval: null, bestProbability: null, playedProbability: null, dropPct: null })
    expect(replayNumericalDecision(trace(unavailable))).toMatchObject({ status: 'reproduced', classification: 'unclassified' })
    expect(explainClassification(unavailable)).toContain('dati disponibili non bastano')
    const mate = example('best', 0, { bestEval: null, playedEval: null, playedMate: 0, bestProbability: 1, playedProbability: 1, isEngineBest: false })
    expect(replayNumericalDecision(trace(mate))).toMatchObject({ status: 'reproduced', classification: 'best' })
    expect(explainClassification(mate)).toContain('scacco matto dato')
  })

  it.each(['version', 'numericalVersion', 'reviewVersion'])('declines an unknown recorded %s', key => {
    const decision = structuredClone(trace(example())); decision.policy[key] = 'future-version'
    expect(replayNumericalDecision(decision)).toEqual({ status: 'unsupported' })
  })

  it('declines unknown score models, invalid scales and invalid recorded bands', () => {
    for (const change of [p => { p.scoreModel.id = 'future-score-model' }, p => { p.scoreModel.cpScale = 0 },
      p => { p.thresholds.good = p.thresholds.excellent - 1 }]) {
      const decision = structuredClone(trace(example())); change(decision.policy)
      expect(replayNumericalDecision(decision)).toEqual({ status: 'unsupported' })
    }
  })

  it('detects changed recorded labels, scores and numerical categories', () => {
    const decision = structuredClone(trace(example('good', 4)))
    expect(replayNumericalDecision({ ...decision, classification: 'blunder' }).status).toBe('mismatch')
    expect(replayNumericalDecision({ ...decision, numericalClassification: 'blunder' }).status).toBe('mismatch')
    decision.inputs.playedProbability = .1
    expect(replayNumericalDecision(decision).status).toBe('mismatch')
  })

  it.each(['missed', 'great', 'brilliant'])('explains %s but declines to replay additional historical rules', classification => {
    const entry = example('best', 0, { classification })
    expect(replayNumericalDecision(trace(entry))).toEqual({ status: 'unsupported' })
    expect(explainClassification(entry)).toContain('regola')
  })

  it('reuses human explanations for missed opportunities and special decisions without exposing reason codes', () => {
    const missed = example('best', 0, { classification: 'missed', missedOpportunityReason: 'verified-mate-not-retained',
      missedOpportunity: { kind: 'forced-mate', mateIn: 2, alternative: { san: ['Qh7+', 'Kf8', 'Qh8#'] } } })
    expect(explainClassification(missed)).toContain('Matto in 2 non mantenuto')
    expect(explainClassification(missed)).not.toContain('verified-mate-not-retained')
    const great = example('best', 0, { classification: 'great', specialAssessment: { grande: {
      status: 'supported', reason: 'critical-native-advantage-choice' }, brilliant: { status: 'rejected' } } })
    expect(explainClassification(great)).toContain('solo questa scelta conserva un vantaggio relativo')
    expect(explainClassification(great)).not.toContain('critical-native-advantage-choice')
    const incomplete = { ...great, specialAssessment: { grande: { status: 'supported', reason: 'critical-defense' } } }
    expect(explainClassification(incomplete)).toContain('dettagli della verifica non sono disponibili')
    expect(trace(great).reasons.great).toBe('critical-native-advantage-choice')
  })

  it('distinguishes an unknown archived book flag from a recorded book revision', () => {
    const legacy = example('best', 0, { classification: 'book', isBookMove: true })
    expect(explainClassification(legacy)).toContain('origine del repertorio non registrata')
    expect(explainClassification(legacy)).toContain('non verifica l’appartenenza')
    const known = { ...legacy, openingBookMetadata: { source: 'opening-test', revision: 'book-42' } }
    expect(explainClassification(known)).toContain('revisione registrata book-42')
    expect(explainClassification(known)).not.toContain('flag archiviato')
  })

  it('explains the visible label when a stored special decision is hidden, without mutating its trace', () => {
    const special = annotateClassification(example('best', 0, { classification: 'great' }))
    const displayed = { ...special, classification: 'best' }, before = structuredClone(special)
    expect(explainClassification(displayed)).toMatch(/^Migliore:/)
    expect(explainClassification(displayed)).not.toContain('criterio speciale')
    expect(special).toEqual(before)
    expect(special.classificationDecision.classification).toBe('great')
  })

  it('builds an ephemeral explanation when an incomplete legacy trace lacks inputs', () => {
    const entry = example('good', 4, { classificationDecision: { schemaVersion: 0, classification: 'good' } })
    expect(explainClassification(entry)).toMatch(/^Buona:/)
    expect(entry.classificationDecision).toEqual({ schemaVersion: 0, classification: 'good' })
  })

  it('reconstructs an ephemeral explanation for invalid saved policy shapes without changing the saved trace', () => {
    for (const invalidPolicy of [{}, { thresholds: null }, { thresholds: {} }, { thresholds: { ...policy.thresholds, best: '1' } }]) {
      const entry = annotateClassification(example('excellent', 0, { isEngineBest: false }))
      const decision = { ...entry.classificationDecision, policy: invalidPolicy }
      const displayed = { ...entry, classificationDecision: decision }, before = structuredClone(displayed)
      expect(explainClassification(displayed)).toMatch(/^Ottima:/)
      expect(explainClassification(displayed)).not.toContain('undefined')
      expect(displayed).toEqual(before)
    }
  })
})
