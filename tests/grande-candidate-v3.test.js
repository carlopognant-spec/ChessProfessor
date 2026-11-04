import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { describe, it, expect, vi } from 'vitest'
import { classifyGrandeCandidateV3 } from '../src/lib/grandeCandidateV3.js'
import * as v2 from '../src/lib/grandeCandidateV2.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { createAnalysisMetadata } from '../src/lib/analysisMetadata.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { formatSpecialAssessment } from '../src/lib/analysisSpecialClassification.js'
import { explainClassification } from '../src/lib/classificationDecision.js'
import { prepareLegacyPracticeEntries } from '../src/lib/reviewPractice.js'
import { createGameArchive } from '../src/lib/gameArchive.js'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'

const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)))
const cohorts = read('agent-output/special-completion-v1/cohorts.json').cases
const packets = new Map()
for (const folder of ['native-wdl-evidence-v1', 'special-completion-evidence-v1']) {
  for (const record of read(`agent-output/${folder}/collection.json`).records) {
    const packet = read(record.path)
    if (!packets.has(packet.fen)) packets.set(packet.fen, packet.engine)
  }
}
function context(id, ply, supplemental = false) {
  const original = structuredClone(cohorts.find(c => c.id === id && c.cohort === 'old').entries.slice(ply - 3, ply))
  const rows = reclassifyReviewedMoves(original), entry = rows[2]
  if (supplemental) entry.refinement = { nativeProof: { version: 'native-winning-proof-v1',
    root: packets.get(entry.fenBefore), child: packets.get(entry.fenAfter), alternatives: [] } }
  return [entry, rows[1], rows[0], null, rows[2]]
}

// Synthetic engine scores isolate the admission gate; legal geometry certifies the fork.
function fork() {
  const fen = 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', board = new Chess(fen)
  board.move('Nc7+')
  const line = (uci, cp, multipv) => ({ pv: [uci], evalCp: cp, mate: null, multipv, depth: 15 })
  const engine = (fen, lines) => ({ fen, bestmove: lines[0].pv[0], lines, specialLines: structuredClone(lines),
    analysisMetadata: createAnalysisMetadata({ multiPv: 2 }) })
  return classifyReviewedMove({ fenBefore: fen, fenAfter: board.fen(), playedUci: 'b5c7', playedMove: 'Nc7+',
    engine: engine(fen, [line('e1f1', 200, 1), line('b5c7', 190, 2)]),
    playedEngine: engine(board.fen(), board.moves({ verbose: true }).slice(0, 2).map((m, i) => line(m.from + m.to, -190 - i * 10, i + 1))) })
}

describe('Grande v3 collects evidence before its verdict', () => {
  it('admits an unpublished near-optimal legal tactic and keeps scores unchanged', () => {
    const entry = fork(), before = JSON.stringify(entry), result = classifyGrandeCandidateV3(entry)
    expect(result).toMatchObject({ classification: 'great', bestEval: 200, playedEval: 190,
      candidateAssessment: { verdict: 'confirmed', inheritance: null, proof: { kind: 'checking-major-fork' } } })
    expect(result.candidateAssessment.publishedClassification).not.toBe('great')
    expect(JSON.stringify(entry)).toBe(before)
    expect(result.classificationDecision.classification).toBe('great')
    expect(result.classificationDecision.candidateAssessment).toEqual(result.candidateAssessment)
    expect(result.specialAssessment.grande.status).toBe('supported')
    expect(formatSpecialAssessment(result)).toContain('Certificato tattico')
  })

  it('an observation cannot veto a valid certificate', () => {
    // Inject only the observation to isolate precedence, not a second invented chess position.
    const spy = vi.spyOn(v2, 'queenAttackRelativePinMotif').mockReturnValue({ sufficientForGrande: false })
    try {
      const result = classifyGrandeCandidateV3(fork())
      expect(result.classification).toBe('great')
      expect(result.candidateAssessment.evidence.map(e => e.kind)).toEqual(['tactical-confirmed', 'observed'])
    } finally { spy.mockRestore() }
  })

  it.each([['personal-05', 27], ['personal-06', 31], ['game-2-saintamant-staunton-1843', 82]])(
    'uses archived supplemental tactics without published Grande: %s/%s', (id, ply) => {
      const args = context(id, ply, true), before = JSON.stringify(args)
      expect(args[4].classification).toBe('best')
      const result = classifyGrandeCandidateV3(...args)
      expect(result).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'confirmed', inheritance: null,
        provenance: { source: 'archive-native' } } })
      expect(JSON.stringify(args)).toBe(before)
    })

  it.each([['personal-01', 45], ['game-1-chigorin-steinitz-1892', 25], ['game-1-chigorin-steinitz-1892', 39],
    ['game-2-saintamant-staunton-1843', 56], ['game-2-saintamant-staunton-1843', 80]])(
    'keeps comparative packets separate from a tactical certificate: %s/%s', (id, ply) => {
      const result = classifyGrandeCandidateV3(...context(id, ply, true))
      expect(result.classification).not.toBe('great')
      expect(result.candidateAssessment.evidence.some(e => e.source === 'archive-native' && e.kind === 'comparative')).toBe(true)
      expect(result.candidateAssessment.verdict).toBe('inconclusive')
    })

  it.each([['game-1-chigorin-steinitz-1892', 28], ['game-2-saintamant-staunton-1843', 76]])(
    'does not promote missing evidence: %s/%s', (id, ply) => {
      expect(classifyGrandeCandidateV3(...context(id, ply)).classification).not.toBe('great')
    })

  it.each(['bound', 'profile', 'truncated', 'wrong-fen'])('rejects invalid tactical comparison: %s', kind => {
    const input = fork()
    if (kind === 'bound') input.engine.lowerbound = true
    if (kind === 'profile') input.playedEngine.analysisMetadata.multiPv = 3
    if (kind === 'truncated') input.engine.specialLines.pop()
    if (kind === 'wrong-fen') input.engine.fen = input.fenAfter
    expect(classifyGrandeCandidateV3(input).classification).not.toBe('great')
  })

  it('keeps a legacy label explicitly inherited', () => {
    const result = classifyGrandeCandidateV3(...context('personal-02', 31))
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'inconclusive', inheritance: 'historical' } })
    expect(formatSpecialAssessment(result)).toContain('una nuova conferma tattica')
  })

  it('does not invent supplemental evidence in the ordinary application input', () => {
    for (const [id, ply] of [['personal-05', 27], ['personal-06', 31], ['game-2-saintamant-staunton-1843', 82]]) {
      const result = classifyGrandeCandidateV3(...context(id, ply))
      expect(result.classification).toBe('best')
      expect(result.candidateAssessment.evidence.every(e => e.source === 'ordinary')).toBe(true)
    }
  })

  it('round-trips candidate decisions through the archive without rewriting the source', async () => {
    const input = { ...fork(), ply: 1 }, before = JSON.stringify(input)
    const result = classifyGrandeCandidateV3(input), game = new Chess(input.fenBefore)
    game.move(input.playedMove)
    const archive = createGameArchive({ indexedDB: new IDBFactory(), crypto: webcrypto })
    try {
      const saved = await archive.save({ pgn: game.pgn(), analysisEntries: [result] })
      expect((await archive.get(saved.record.id)).analysisEntries[0]).toEqual(result)
      expect(JSON.stringify(input)).toBe(before)
    } finally { await archive.close() }
  })

  it('downgrade clears supported Grande explanations and remains outside error practice', () => {
    const input = fork(), published = { ...input, classification: 'great', specialAssessment: {
      grande: { status: 'supported', reason: 'active-checking-attacker-capture' }, brilliant: { status: 'rejected' },
      events: [{ status: 'supported', kind: 'active-checking-attacker-capture' }] } }
    input.engine.lowerbound = true
    const result = classifyGrandeCandidateV3(input, null, null, null, published)
    expect(result.classification).not.toBe('great')
    expect(result.specialAssessment.grande.status).toBe('insufficient')
    expect(result.specialAssessment.events).toEqual([])
    expect(result.classificationDecision.classification).toBe(result.classification)
    expect(formatSpecialAssessment(result)).toBe('')
    expect(explainClassification(result)).not.toContain('criterio speciale aggiuntivo')
    expect(prepareLegacyPracticeEntries([result])[0].practiceCandidateClassification).toBeNull()
  })
})
