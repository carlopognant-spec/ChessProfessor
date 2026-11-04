import { readFileSync } from 'node:fs'
import { Chess } from 'chess.js'
import { describe, it, expect } from 'vitest'
import { classifyGrandeCandidateV2, queenAttackRelativePinMotif } from '../src/lib/grandeCandidateV2.js'
import { classifyGrandeCandidate } from '../src/lib/grandeCandidate.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const read = p => JSON.parse(readFileSync(new URL('../' + p, import.meta.url)))
const cohorts = read('agent-output/special-completion-v1/cohorts.json').cases
function context(id, ply, old = false) {
  const entries = old ? cohorts.find(c => c.id === id && c.cohort === 'old').entries
    : read(`agent-output/new-references-200k-v1/game-${id}.json`).liveEntries
  const rows = reclassifyReviewedMoves(structuredClone(entries.slice(ply - 3, ply)))
  return [rows[2], rows[1], rows[0], null, rows[2]]
}
const nfFen = 'r2qk2r/p2bnpp1/4p2p/2ppP1N1/7Q/2N5/PPP2PPP/2KR3R b kq - 1 13'
function moveEntry(fen, uci) {
  const board = new Chess(fen), move = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) })
  return { fenBefore: fen, playedUci: uci, playedMove: move.san, fenAfter: board.fen() }
}

describe('Grande v2 separates confirmation from inherited labels', () => {
  it('retains a legacy positive without claiming a new confirmation or changing its evidence', () => {
    const args = context('personal-02', 31, true), before = JSON.stringify(args)
    const v1 = classifyGrandeCandidate(...args), result = classifyGrandeCandidateV2(...args, v1)
    expect(v1.classification).toBe('best')
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: {
      verdict: 'inconclusive', inheritance: 'historical', reason: 'inherited-legacy-without-completed-snapshots' } })
    expect(JSON.stringify(args)).toBe(before)
  })

  it.each([['184316820266', 28], ['184316820266', 64], ['185230271130', 25], ['185230000668', 7]])('retains %s/%s with explicit independent-context uncertainty', (id, ply) => {
    const args = context(id, ply), before = JSON.stringify(args)
    const result = classifyGrandeCandidateV2(...args)
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'inconclusive', inheritance: 'context',
      provenance: { previousComparison: { source: 'independent-position', status: 'independent' } } } })
    expect(JSON.stringify(args)).toBe(before)
  })

  it('confirms Rxd6 using all legal check evasions, without requiring an opponent-error score', () => {
    const args = context('184316820266', 34)
    const prior = { ...args[1], engine: null, playedEngine: null }
    const result = classifyGrandeCandidateV2(args[0], prior, args[2], null, args[4])
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'confirmed', inheritance: null,
      reason: 'critical-checking-capture-complete-evasions', provenance: { analyzed: 4, legal: 4 } } })
  })

  it.each([['personal-05', 27], ['personal-06', 31], ['game-2-saintamant-staunton-1843', 82]])('preserves the independently validated supplemental tactic for %s', (id, ply) => {
    const packets = new Map()
    for (const folder of ['native-wdl-evidence-v1', 'special-completion-evidence-v1']) {
      for (const record of read(`agent-output/${folder}/collection.json`).records) {
        const packet = read(record.path)
        if (!packets.has(packet.fen)) packets.set(packet.fen, packet.engine)
      }
    }
    const original = structuredClone(cohorts.find(c => c.id === id && c.cohort === 'old').entries.slice(ply - 3, ply))
    original[2].nativeDecisionProof = { version: 'native-winning-proof-v1', root: packets.get(original[2].fenBefore),
      child: packets.get(original[2].fenAfter), alternatives: [] }
    const rows = reclassifyReviewedMoves(original)
    const result = classifyGrandeCandidateV2(rows[2], rows[1], rows[0], null, rows[2])
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'confirmed', inheritance: null,
      provenance: { evidenceProfile: 'validated-supplemental-pair' } } })
  })

  it.each(['truncated', 'bound', 'aggregate-bound', 'child-bound', 'mixed-depth', 'wrong-fen', 'profile'])('does not confirm or inherit malformed modern evidence: %s', kind => {
    const args = context('184316820266', 34)
    if (kind === 'truncated') args[0].engine.specialLines.pop()
    if (kind === 'bound') args[0].engine.specialLines[0].lowerbound = true
    if (kind === 'aggregate-bound') args[0].engine.lowerbound = true
    if (kind === 'child-bound') args[0].playedEngine.specialLines[0].upperbound = true
    if (kind === 'mixed-depth') args[0].engine.specialLines[1].depth++
    if (kind === 'wrong-fen') args[0].engine.fen = args[0].fenAfter
    if (kind === 'profile') args[0].playedEngine.analysisMetadata.budget.value++
    const result = classifyGrandeCandidateV2(...args)
    expect(result.classification).not.toBe('great')
    expect(result.candidateAssessment).toMatchObject({ verdict: 'inconclusive', inheritance: null })
  })

  it.each(['disconnected', 'bound', 'profile', 'different-snapshot'])('does not inherit unsupported opponent context: %s', kind => {
    const args = context('185230271130', 25)
    // Current and preceding searches share objects in memory; isolate the corruption to the prior record.
    args[1] = structuredClone(args[1])
    if (kind === 'disconnected') args[1].ply--
    if (kind === 'bound') args[1].engine.specialLines[0].lowerbound = true
    if (kind === 'profile') args[1].engine.analysisMetadata.budget.value++
    if (kind === 'different-snapshot') args[1].playedEngine.specialLines[0].evalCp++
    const result = classifyGrandeCandidateV2(...args)
    expect(result.classification).not.toBe('great')
    expect(result.candidateAssessment.inheritance).toBeNull()
  })

  it('does not disguise explicit legacy bounds as missing evidence', () => {
    const args = context('personal-02', 31, true)
    args[0].engine.lowerbound = true
    expect(classifyGrandeCandidateV2(...args)).toMatchObject({ classification: 'best',
      candidateAssessment: { verdict: 'inconclusive', inheritance: null } })
  })

  // Synthetic scores test policy boundaries; these are not engine measurements or benchmark labels.
  it.each(['all-winning', 'near-equivalent', 'limited-multipv'])('does not confirm an ordinary checker capture: %s', kind => {
    const args = context('184316820266', 34), entry = args[0]
    if (kind === 'all-winning' || kind === 'near-equivalent') {
      const cp = kind === 'all-winning' ? [902, 730, 684, 626] : [170, 160, 150, -200]
      entry.engine.specialLines.forEach((line, i) => { line.evalCp = cp[i] })
      entry.playedEngine.specialLines[0].evalCp = -cp[0]
    } else {
      for (const engine of [entry.engine, entry.playedEngine]) {
        engine.specialLines = engine.specialLines.slice(0, 3)
        engine.analysisMetadata.multiPv = 3
      }
    }
    const result = classifyGrandeCandidateV2(...args)
    expect(result.classification).not.toBe('great')
    expect(result.candidateAssessment.verdict).toBe(kind === 'all-winning' ? 'excluded' : 'inconclusive')
    expect(result.candidateAssessment.inheritance).toBeNull()
  })
})

describe('relative queen-pin motif is evidence, not automatic Grande', () => {
  it.each(['e7f5', 'e7g6'])('recognizes the common motif for %s and enumerates actual legal replies', uci => {
    const entry = moveEntry(nfFen, uci), motif = queenAttackRelativePinMotif(entry)
    expect(motif).toMatchObject({ pinner: 'd8', blocker: 'g5', target: 'h4', vacated: 'e7', sufficientForGrande: false,
      forcedQueenWinEstablished: false })
    expect(motif.replies.map(r => r.uci).sort()).toEqual(new Chess(entry.fenAfter).moves({ verbose: true }).map(m => m.from + m.to + (m.promotion ?? '')).sort())
    expect(motif.replies.some(r => r.blockerMoved && r.queenCapture === 'd8h4')).toBe(true)
    expect(motif.replies.some(r => !r.blockerMoved && !r.queenCapture)).toBe(true)
  })

  it('requires the opened relative pin, not merely a knight attack on the queen', () => {
    const board = new Chess(nfFen)
    board.remove('g5')
    expect(queenAttackRelativePinMotif(moveEntry(board.fen(), 'e7f5'))).toBeNull()
  })

  it('rejects a disconnected resulting position', () => {
    const entry = moveEntry(nfFen, 'e7f5')
    expect(queenAttackRelativePinMotif({ ...entry, fenAfter: nfFen })).toBeNull()
  })

  it('recognizes the motif with mirrored coordinates and swapped colors', () => {
    const before = new Chess(nfFen), after = new Chess()
    const flip = s => String.fromCharCode(104 - (s.charCodeAt(0) - 97)) + (9 - Number(s[1]))
    after.clear()
    for (const p of before.board().flat().filter(Boolean)) after.put({ type: p.type, color: p.color === 'w' ? 'b' : 'w' }, flip(p.square))
    const fields = after.fen().split(' ')
    fields[1] = 'w'; fields[2] = '-'; fields[3] = '-'
    const entry = moveEntry(fields.join(' '), flip('e7') + flip('f5'))
    expect(queenAttackRelativePinMotif(entry)).toMatchObject({ pinner: flip('d8'), blocker: flip('g5'), target: flip('h4'), sufficientForGrande: false })
  })
})
