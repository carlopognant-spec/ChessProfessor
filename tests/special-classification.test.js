import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { classifySpecialMove, reclassifySpecialMoves, formatSpecialAssessment, displaySpecialMoves } from '../src/lib/specialClassification.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { compare } from '../scripts/qa/compare.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'

const fen = 'rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2NBPN2/PPP2PPP/R1BQ1RK1 w - - 0 1'
const line = (multipv, evalCp, pv) => ({ multipv, evalCp, mate: null, depth: 15, pv })
function sequence(initial, sans) {
  const game = new Chess(initial)
  return sans.map(san => { const move = game.move(san); return `${move.from}${move.to}${move.promotion ?? ''}` })
}
function sample({ best = 100, alternative = 50, child = -100, sacrifice = false } = {}) {
  const sans = sacrifice ? ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5', 'Re8', 'Qxf7+', 'Kh8', 'Qxe8+', 'Nxe8', 'Nf7+', 'Kg8', 'Ng5', 'Nf6']
    : ['e4', 'dxe4', 'Nxe4']
  const pv = sequence(fen, sans), game = new Chess(fen), move = game.move(sans[0])
  const first = line(1, best, pv), second = line(2, alternative, sequence(fen, [sacrifice ? 'e4' : 'a3']))
  const children = [line(1, child, pv.slice(1))]
  if (sacrifice) children.push(line(2, child, sequence(game.fen(), ['Nxh7', 'Kh1', 'Kh8'])))
  return { classification: 'best', playedMove: move.san, ply: 1, moveHistorySan: [], side: 'w',
    fenBefore: fen, fenAfter: game.fen(), playedUci: pv[0], isEngineBest: true,
    bestProbability: calculateWinProbability(best), playedProbability: calculateWinProbability(-child),
    engine: { ...first, lines: [first, second] }, playedEngine: { ...children[0], lines: children } }
}

describe('counterfactual special categories', () => {
  it('keeps an ordinary best move and recognizes a critical defense with scoped evidence', () => {
    expect(classifySpecialMove(sample()).classification).toBe('best')
    const result = classifySpecialMove(sample({ best: 0, alternative: -400, child: 0 }))
    expect(result.classification).toBe('great')
    expect(result.baseClassification).toBe('best')
    expect(result.specialAssessment.grande.reason).toBe('critical-defense')
    expect(result.specialAssessment.coverage.allLegal).toBe(false)
    expect(formatSpecialAssessment(result)).toContain('alternative analizzate')
  })

  it('does not label two favorable choices as Grande merely because a tactic exists', () => {
    expect(classifySpecialMove(sample({ best: 950, alternative: 720, child: -950 })).classification).toBe('best')
    expect(classifySpecialMove(sample({ best: 650, alternative: 0, child: -650 })).classification).toBe('great')
  })

  it('does not elevate a forced or terminal move', () => {
    const game = new Chess('7k/8/5KQ1/8/8/8/8/8 w - - 0 1'), before = game.fen()
    game.move('Qg7#')
    const result = classifySpecialMove({ classification: 'best', playedMate: 0, playedUci: 'g6g7', fenBefore: before, fenAfter: game.fen() })
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.events).toEqual([])
  })

  it('abstains on duplicates, mixed depths, bounds, illegal PVs and missing child scores', () => {
    for (const change of [
      entry => { entry.engine.lines[1].pv[0] = entry.playedUci },
      entry => { entry.engine.lines[1].depth = 14 },
      entry => { entry.engine.lines[0].bound = true },
      entry => { entry.engine.lines[1].pv.push('a1a8') },
      entry => { entry.playedEngine = null },
      entry => { entry.engine.specialLines = [] },
      entry => { entry.engine.analysisMetadata = { multiPv: 5 } },
    ]) {
      const entry = sample({ best: 0, alternative: -400, child: 0 }); change(entry)
      const result = classifySpecialMove(entry)
      expect(result.classification).toBe('best')
      expect(result.specialAssessment.grande.status).toBe('insufficient')
    }
  })

  it('requires root and independent child agreement', () => {
    const result = classifySpecialMove(sample({ best: 600, alternative: 0, child: 400 }))
    expect(result.classification).toBe('best')
    expect(result.specialAssessment.grande.reason).toBe('missing-or-conflicting-played-score')
  })

  it('recognizes a compensated piece offer with a resolved legal continuation', () => {
    const result = classifySpecialMove(sample({ sacrifice: true }))
    expect(result.classification).toBe('brilliant')
    expect(result.specialAssessment.brilliant.offers[0].delta).toBe(-2)
    expect(formatSpecialAssessment(result)).toContain('Kxh7')
  })

  it('does not call an already available winning nonsacrifice Geniale', () => {
    const result = classifySpecialMove(sample({ sacrifice: true, best: 550, alternative: 500, child: -550 }))
    expect(result.classification).not.toBe('brilliant')
    expect(result.specialAssessment.brilliant.reason).toBe('winning-alternative-without-new-sacrifice')
  })

  it('keeps unresolved or unscored acceptance as a candidate, not Geniale', () => {
    const entry = sample({ sacrifice: true })
    entry.playedEngine.lines[0].pv = entry.playedEngine.lines[0].pv.slice(0, 2)
    expect(classifySpecialMove(entry).specialAssessment.brilliant.status).toBe('candidate')
    entry.playedEngine.lines = []
    expect(classifySpecialMove(entry).classification).not.toBe('brilliant')
  })

  it('reclassifies its own saved labels without mutation and clears unsupported stale evidence', () => {
    const entry = sample({ best: 0, alternative: -400, child: 0 }), original = JSON.stringify(entry)
    const first = reclassifySpecialMoves([entry])
    expect(first[0].classification).toBe('great')
    expect(reclassifySpecialMoves(first)).toEqual(first)
    expect(JSON.stringify(entry)).toBe(original)
    expect(reclassifySpecialMoves([{ ...first[0], engine: null }])[0].classification).toBe('best')
  })

  it('keeps experimental labels opt-in without deleting their evidence or changing a miss', () => {
    const special = classifySpecialMove(sample({ best: 0, alternative: -400, child: 0 }))
    const displayed = displaySpecialMoves([special])
    expect(displayed[0].classification).toBe('best')
    expect(displayed[0].specialAssessment).toBe(special.specialAssessment)
    expect(displaySpecialMoves([special], true)[0].classification).toBe('great')
    expect(displaySpecialMoves([{ classification: 'missed' }])[0].classification).toBe('missed')
  })

  it.each(['w', 'b'])('recognizes a new winning opportunity without a numerical opponent-error gate for %s', side => {
    const game = new Chess()
    if (side === 'w') game.move('e4')
    const priorFen = game.fen(), previousSan = side === 'w' ? 'e5' : 'f3'
    const previousMove = game.move(previousSan), before = game.fen()
    const played = game.move('d4'.replace('4', side === 'w' ? '4' : '5'))
    const primaryPv = side === 'w' ? ['g1f3', 'b8c6'] : ['e7e5', 'd2d4']
    const secondaryPv = side === 'w' ? ['b1c3'] : ['b8c6']
    const childPv = new Chess(game.fen()).moves({ verbose: true }).slice(0, 1).map(move => `${move.from}${move.to}`)
    const root = line(1, 650, primaryPv), secondary = line(2, 0, secondaryPv), child = line(1, 0, childPv)
    const entry = { classification: 'blunder', fenBefore: before, fenAfter: game.fen(),
      playedUci: `${played.from}${played.to}`, bestProbability: calculateWinProbability(650), playedProbability: 0.5,
      engine: { ...root, lines: [root, secondary] }, playedEngine: { ...child, lines: [child] } }
    const previous = { classification: 'good', fenBefore: priorFen, fenAfter: before, playedMove: previousSan,
      playedUci: `${previousMove.from}${previousMove.to}`, engine: { ...line(1, 0, [`${previousMove.from}${previousMove.to}`]) } }
    expect(classifySpecialMove(entry, previous).classification).toBe('missed')
    expect(classifySpecialMove(entry, previous).missedOpportunityReason).toBe('counterfactual-winning-opportunity')
    expect(classifySpecialMove(entry, { ...previous, fenAfter: new Chess().fen() }).classification).toBe('blunder')
  })

  it('does not call a numerical mistake a missed win when only a defensive improvement exists', () => {
    const entry = sample({ best: 0, alternative: -400, child: 400 })
    entry.classification = 'blunder'; entry.playedUci = entry.engine.lines[1].pv[0]
    const game = new Chess(entry.fenBefore); game.move('a3'); entry.fenAfter = game.fen()
    entry.playedEngine = { ...line(1, 400, ['d6h2']), lines: [line(1, 400, ['d6h2'])] }
    const result = classifySpecialMove(entry)
    expect(result.classification).toBe('blunder')
    expect(result.specialAssessment.events.some(event => event.kind === 'missed-defense')).toBe(true)
    expect(formatSpecialAssessment(result)).toContain('Difesa mancata')
  })

  it('uses identical classification in live analysis and current QA', async () => {
    const entry = sample({ best: 0, alternative: -400, child: 0 })
    const [live] = await analyzeGame({ baseFen: entry.fenBefore, moves: [entry.playedMove], openingBook: createOpeningBook(),
      analyzePosition: async () => entry.engine, analyzePlayedPosition: async () => entry.playedEngine })
    expect(live.classification).toBe('great')
    const report = compare({ annotations: [{ ply: 1, san: entry.playedMove, category: 'Grande' }] },
      { entries: [{ ...entry, san: entry.playedMove, uci: entry.playedUci }] })
    expect(report.rows[0].actual).toBe('Grande')
    expect(report.included).toBe(1)
    expect(report.exactPct).toBe(100)
  })
})

describe('completed MultiPV evidence', () => {
  const raw = (rank, depth, root, extra = '') => `info depth ${depth} multipv ${rank} score cp ${100 - rank} ${extra} pv ${root}`
  it('retains a complete previous iteration when the next one stops midway', () => {
    const tracker = createMultiPvEvidence(2)
    tracker.accept(raw(1, 10, 'e2e4')); tracker.accept(raw(2, 10, 'd2d4'))
    tracker.accept(raw(1, 11, 'e2e4'))
    expect(tracker.finish('e2e4').map(line => line.depth)).toEqual([10, 10])
    expect(tracker.finish('g1f3')).toEqual([])
  })
  it('rejects duplicate roots, bounds, and mixed depths', () => {
    for (const second of [raw(2, 10, 'e2e4'), raw(2, 11, 'd2d4'), raw(2, 10, 'd2d4', 'lowerbound')]) {
      const tracker = createMultiPvEvidence(2)
      tracker.accept(raw(1, 10, 'e2e4')); tracker.accept(second)
      expect(tracker.finish('e2e4')).toEqual([])
    }
  })
})
