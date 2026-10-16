import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { classifyReviewedMove } from '../src/lib/reviewEvaluation.js'
import { classifyMoveOpportunity, formatMoveOpportunity } from '../src/lib/moveOpportunities.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { independentPriorSupports } from '../src/lib/opportunityProofs.js'

const load = id => JSON.parse(readFileSync(new URL(`../agent-output/refinement-quality-priority-v2/priority-game-${id}-round-2.json`, import.meta.url)))
const games = { intermediate: load('184316820266'), mate: load('185262315732') }
function pair(kind) {
  const end = kind === 'intermediate' ? 15 : 57
  return structuredClone(games[kind].view.slice(end - 2, end)).map(classifyReviewedMove)
}

describe('winning opportunity with a verified independent prior comparison', () => {
  it('recognizes d5 without changing scores, mutating the archive or requiring a different threshold', () => {
    const [previous, entry] = pair('intermediate'), snapshot = JSON.stringify([previous, entry])
    expect(previous.evaluationEvidence.status).toBe('independent')
    expect(independentPriorSupports(previous, entry)).toBe(true)
    const result = classifyMoveOpportunity(entry, previous)
    expect(result).toMatchObject({ classification: 'missed', bestEval: entry.bestEval, playedEval: entry.playedEval,
      missedOpportunity: { policyVersion: 'opportunity-evidence-v3', alternative: { san: expect.arrayContaining(['Nd5']) },
        evidence: { source: 'completed-snapshot', previousSource: 'independent-position' } } })
    expect(JSON.stringify([previous, entry])).toBe(snapshot)
    expect(classifyMoveOpportunity(result, previous)).toEqual(result)
  })

  it.each([
    ['missing previous snapshot', (p) => { delete p.engine.specialLines }],
    ['incomplete previous snapshot', (p) => { p.engine.specialLines.pop() }],
    ['bounded previous snapshot', (p) => { p.engine.specialLines[0].lowerbound = true }],
    ['changed primary move', (p) => { p.engine.lines[0].pv = p.engine.specialLines[1].pv }],
    ['disagreeing child', (p) => { p.playedEngine.lines[0].evalCp = -900 }],
    ['child from another FEN', (p,e) => { p.playedEngine.fen = e.fenAfter }],
    ['illegal child line', (p) => { p.playedEngine.lines[0].pv = ['a1a8'] }],
    ['incomplete current comparison', (p,e) => { e.engine.specialLines.pop() }],
  ])('does not promote an opportunity with %s', (_, change) => {
    const [previous, entry] = pair('intermediate'); change(previous, entry)
    expect(classifyMoveOpportunity(entry, previous).classification).not.toBe('missed')
  })
})

describe('lost mate stored in the previous root-move variation', () => {
  it('reuses the complete legal continuation when the current root reports CP', () => {
    const [previous, entry] = pair('mate'), original = JSON.stringify([previous, entry])
    expect(entry.bestMate).toBeNull()
    const result = classifyMoveOpportunity(entry, previous)
    expect(result).toMatchObject({ classification: 'missed',
      missedOpportunityReason: 'verified-stored-mating-continuation',
      missedOpportunity: { kind: 'forced-mate', mateIn: 7, previousPly: 56,
        matingLine: { san: expect.arrayContaining(['Rxg6+', 'Rc8#']) } } })
    expect(result.bestEval).toBe(entry.bestEval)
    expect(result.missedOpportunity.matingLine.uci).toHaveLength(13)
    expect(formatMoveOpportunity(result.missedOpportunity)).toContain('Matto in 7')
    expect(classifyMoveOpportunity(result, previous)).toEqual(result)
    expect(JSON.stringify([previous, entry])).toBe(original)
  })

  it.each([
    ['legacy previous search', p => { delete p.engine.specialLines }],
    ['bounded mating line', p => { p.engine.specialLines.find(l => l.pv[0] === p.playedUci).bound = true }],
    ['truncated mating line', p => { p.engine.specialLines.find(l => l.pv[0] === p.playedUci).pv.pop() }],
    ['false mate distance', p => { p.engine.specialLines.find(l => l.pv[0] === p.playedUci).mate-- }],
    ['illegal mating continuation', p => { p.engine.specialLines.find(l => l.pv[0] === p.playedUci).pv[3] = 'a1a8' }],
    ['broken adjacent position', (p,e) => { p.fenAfter = e.fenAfter }],
    ['child without a score', (p,e) => { e.playedEngine.lines[0].evalCp = null }],
    ['child from another position', (p,e) => { e.playedEngine.fen = p.fenBefore }],
    ['bounded child', (p,e) => { e.playedEngine.lines[0].upperbound = true }],
    ['retained mate in another child snapshot', (p,e) => { e.playedEngine.specialLines[0].mate = -3 }],
  ])('does not declare a lost mate with %s', (_, change) => {
    const [previous, entry] = pair('mate'); change(previous, entry)
    expect(classifyMoveOpportunity(entry, previous).classification).not.toBe('missed')
  })

  it('protects the actual primary move Bxc4 despite an earlier different mating variation', () => {
    const [previous, entry] = structuredClone(games.mate.view.slice(51,53)).map(classifyReviewedMove)
    expect(entry.playedMove).toBe('Bxc4')
    expect(entry.isEngineBest).toBe(true)
    expect(classifyMoveOpportunity(entry, previous).classification).toBe('best')
  })

  it('migrates a v12 pair and keeps both the original material sacrifice assessment and idempotence', () => {
    const entries = pair('mate').map(e => ({ ...e, specialAssessment: { version: 'counterfactual-v12' } }))
    const original = JSON.stringify(entries), result = reclassifyReviewedMoves(entries)
    expect(result[1]).toMatchObject({ classification: 'missed', specialAssessment: { version: 'counterfactual-v24' } })
    expect(reclassifyReviewedMoves(result)).toEqual(result)
    expect(JSON.stringify(entries)).toBe(original)
  })
})
