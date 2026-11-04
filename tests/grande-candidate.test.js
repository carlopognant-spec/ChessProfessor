import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { classifyGrandeCandidate, reclassifyGrandeCandidate, GRANDE_CANDIDATE_VERSION } from '../src/lib/grandeCandidate.js'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { classifySpecialMove } from '../src/lib/analysisSpecialClassification.js'
import { readFileSync } from 'node:fs'

const cohorts = JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json', import.meta.url))).cases
const sequence = (id, ply) => structuredClone(cohorts.find(c => c.id === id && c.cohort !== 'refined').entries.slice(ply - 3, ply))
const line = (uci, cp, multipv) => ({ pv: [uci], evalCp: cp, mate: null, multipv, depth: 15 })

// Synthetic scores isolate candidate gates; the fork itself is checked on the real board.
function example(uci = 'b5c7') {
  const fenBefore = 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'
  const board = new Chess(fenBefore), move = board.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) })
  const root = [line('e1f1', 200, 1), line(uci, 190, 2)]
  const child = board.moves({ verbose: true }).slice(0, 2).map((m, i) => line(m.from + m.to, -190 - i * 10, i + 1))
  const engine = (fen, lines) => ({ fen, bestmove: lines[0].pv[0], lines,
    specialLines: structuredClone(lines), analysisMetadata: { multiPv: 2 } })
  return { fenBefore, fenAfter: board.fen(), playedUci: uci, playedMove: move.san,
    engine: engine(fenBefore, root), playedEngine: engine(board.fen(), child) }
}

describe('isolated Grande evidence candidate', () => {
  it('accepts a near-PV1 legal checking fork without changing any numerical score', () => {
    const input = example(), numeric = classifyReviewedMove(input), before = JSON.stringify(input)
    const result = classifyGrandeCandidate(numeric)
    expect(numeric.classification).toBe('excellent')
    expect(result).toMatchObject({ classification: 'great', bestEval: 200, playedEval: 190,
      candidateAssessment: { version: GRANDE_CANDIDATE_VERSION, reason: 'near-optimal-verified-tactic',
        proof: { kind: 'checking-major-fork', target: 'a8', proofAgainstEveryDefense: false } } })
    expect(result.specialAssessment).toEqual(classifySpecialMove(numeric).specialAssessment)
    expect(JSON.stringify(input)).toBe(before)
  })

  it('does not promote a near-PV1 quiet move without a tactical certificate', () => {
    expect(classifyGrandeCandidate(classifyReviewedMove(example('b5c3')))).toMatchObject({
      classification: 'excellent', candidateAssessment: { reason: 'no-additional-tactical-proof' } })
  })

  it('does not treat a single principal variation as a completed alternatives comparison', () => {
    const input = example()
    for (const engine of [input.engine, input.playedEngine]) {
      engine.analysisMetadata.multiPv = 1
      engine.specialLines = engine.specialLines.slice(0, 1)
    }
    expect(classifyGrandeCandidate(classifyReviewedMove(input)).classification).not.toBe('great')
  })

  it('preserves the legal near-optimal fork when colors and coordinates are mirrored', () => {
    const input = example(), flip = square => String.fromCharCode(104 - (square.charCodeAt(0) - 97)) + (9 - Number(square[1]))
    const move = uci => flip(uci.slice(0, 2)) + flip(uci.slice(2, 4)) + (uci[4] ?? '')
    function fen(source) {
      const before = new Chess(source), after = new Chess()
      after.clear()
      for (const piece of before.board().flat().filter(Boolean)) after.put({ type: piece.type, color: piece.color === 'w' ? 'b' : 'w' }, flip(piece.square))
      const fields = after.fen().split(' ')
      fields[1] = before.turn() === 'w' ? 'b' : 'w'
      fields[2] = '-'; fields[3] = '-'; fields[4] = before.fen().split(' ')[4]; fields[5] = before.fen().split(' ')[5]
      return fields.join(' ')
    }
    input.fenBefore = fen(input.fenBefore)
    input.playedUci = move(input.playedUci)
    const board = new Chess(input.fenBefore)
    input.playedMove = board.move({ from: input.playedUci.slice(0, 2), to: input.playedUci.slice(2, 4) }).san
    input.fenAfter = board.fen()
    for (const [engine, position] of [[input.engine, input.fenBefore], [input.playedEngine, input.fenAfter]]) {
      engine.fen = position; engine.bestmove = move(engine.bestmove)
      for (const lines of [engine.lines, engine.specialLines]) for (const line of lines) line.pv = line.pv.map(move)
    }
    expect(classifyGrandeCandidate(classifyReviewedMove(input))).toMatchObject({ classification: 'great',
      candidateAssessment: { proof: { kind: 'checking-major-fork', target: 'h1' } } })
  })

  it.each(['bound', 'raw-bound', 'missing', 'truncated', 'depth', 'position', 'restricted', 'child-conflict'])('abstains on %s evidence', failure => {
    const input = example()
    if (failure === 'bound') input.engine.specialLines[1].lowerbound = true
    if (failure === 'raw-bound') input.playedEngine.specialLines[0].raw = 'score cp -190 upperbound'
    if (failure === 'missing') delete input.engine.specialLines
    if (failure === 'truncated') input.engine.specialLines.pop()
    if (failure === 'depth') input.engine.specialLines[1].depth++
    if (failure === 'position') input.playedEngine.fen = input.fenBefore
    if (failure === 'restricted') input.engine.analysisMetadata.searchMoves = [input.playedUci]
    if (failure === 'child-conflict') input.playedEngine.specialLines.forEach(l => { l.evalCp -= 1000 })
    const result = classifyGrandeCandidate(classifyReviewedMove(input))
    expect(result.classification).not.toBe('great')
    expect(result.candidateAssessment.status).not.toBe('supported')
  })

  it('uses completed scores even when later partial lines disagree', () => {
    const input = example()
    input.engine.lines = [line('e1f1', 900, 1), line('b5c7', 850, 2)]
    input.playedEngine.lines = input.playedEngine.lines.map(l => ({ ...l, depth: 16, evalCp: -850 }))
    const result = classifyGrandeCandidate(classifyReviewedMove(input))
    expect(result).toMatchObject({ classification: 'great', playedEval: 190,
      candidateAssessment: { provenance: { rootDepth: 15, childDepth: 15 } } })
  })

  it('preserves the verified checking-major-fork positive', () => {
    const [own, previous, entry] = sequence('185230271130', 39)
    const result = classifyGrandeCandidate(classifyReviewedMove(entry), classifyReviewedMove(previous), classifyReviewedMove(own))
    expect(result.classification).toBe('great')
    expect(result.candidateAssessment.status).toBe('supported')
  })

  it('reports the loss of the existing Rxd6 positive instead of blessing a blanket capture rule', () => {
    const [own, previous, entry] = sequence('184316820266', 34)
    const result = classifyGrandeCandidate(classifyReviewedMove(entry), classifyReviewedMove(previous), classifyReviewedMove(own))
    expect(result.candidateAssessment.publishedClassification).toBe('great')
    expect(result.classification).toBe('best')
    expect(result.candidateAssessment.status).not.toBe('supported')
  })

  it('requires extra proof for an ordinary checker capture even with coherent opponent-error evidence', () => {
    const board = new Chess('6k1/4q3/8/8/4N3/8/8/7K w - - 0 1')
    const previous = { fenBefore: board.fen(), playedUci: 'e4f6', playedMove: board.move('Nf6+').san, ply: 1 }
    previous.fenAfter = board.fen()
    const entry = { fenBefore: board.fen(), playedUci: 'e7f6', playedMove: board.move('Qxf6').san, ply: 2 }
    entry.fenAfter = board.fen()
    const engine = (fen, lines) => ({ ...lines[0], fen, bestmove: lines[0].pv[0], lines,
      specialLines: structuredClone(lines), analysisMetadata: { multiPv: 2 } })
    previous.engine = engine(previous.fenBefore, [line('e4c3', -200, 1), line('e4f6', -400, 2)])
    entry.engine = previous.playedEngine = engine(entry.fenBefore, [line('e7f6', 400, 1), line('g8h8', 0, 2)])
    entry.playedEngine = engine(entry.fenAfter, [line('h1g1', -400, 1), line('h1g2', -410, 2)])
    const result = classifyGrandeCandidate(classifyReviewedMove(entry), classifyReviewedMove(previous))
    expect(result.candidateAssessment.publishedClassification).toBe('great')
    expect(result).toMatchObject({ classification: 'best', candidateAssessment: {
      reason: 'checking-capture-needs-additional-proof', provenance: { previousComparison: 'completed-snapshot' } } })
  })

  it.each([['personal-05', 27], ['personal-06', 31], ['game-2-saintamant-staunton-1843', 82]])('retains validated supplemental tactical evidence for %s', (id, ply) => {
    const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)))
    const packets = new Map()
    for (const folder of ['native-wdl-evidence-v1', 'special-completion-evidence-v1']) {
      for (const record of read(`agent-output/${folder}/collection.json`).records) {
        const packet = read(record.path)
        if (!packets.has(packet.fen)) packets.set(packet.fen, packet.engine)
      }
    }
    const input = sequence(id, ply), entry = input[2]
    entry.nativeDecisionProof = { version: 'native-winning-proof-v1', root: packets.get(entry.fenBefore),
      child: packets.get(entry.fenAfter), alternatives: [] }
    const before = JSON.stringify(input)
    const result = reclassifyGrandeCandidate(input)[2]
    expect(result).toMatchObject({ classification: 'great', candidateAssessment: { status: 'supported',
      provenance: { evidenceProfile: 'validated-supplemental-pair' } } })
    expect(JSON.stringify(input)).toBe(before)
  })

  it.each(['book', 'brilliant', 'missed', 'mistake', 'forced', 'unclassified'])('leaves %s outside candidate scope', classification => {
    const input = { classification }
    expect(classifyGrandeCandidate(input, null, null, null, input).classification).toBe(classification)
  })
})
