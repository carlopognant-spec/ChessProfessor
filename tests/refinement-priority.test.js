import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildRefinementPlan, REFINEMENT_POLICY } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const archived = JSON.parse(readFileSync(new URL('../agent-output/new-references-200k-v1/game-184316820266.json', import.meta.url)))

describe('refinement gives pending evidence priority over chronology', () => {
  it('reaches a late sacrifice despite more than twelve earlier uncertain comparisons', () => {
    const initial = reclassifyReviewedMoves(structuredClone(archived.liveEntries))
    const target = initial.find(e => e.playedMove === 'Qxe5')
    expect(target.specialAssessment.brilliant).toMatchObject({ status: 'candidate', reason: 'missing-acceptance-analysis' })
    const entries = initial.map(e => e === target ? e : { ...e, classification: 'good', isBookMove: false,
      playedMate: null, dropPct: 0, specialAssessment: null,
      evaluationEvidence: { status: e.ply <= 20 ? 'independent' : 'coherent' } })
    const preserved = JSON.stringify(entries), plan = buildRefinementPlan(entries)
    expect(plan.selectedPlies[0]).toBe(target.ply)
    expect(plan.selectedPlies).toHaveLength(12)
    expect(plan.selection[0]).toMatchObject({ ply: target.ply, reason: 'unconfirmed-sacrifice', priority: 0 })
    expect(plan.sacrifices).toContainEqual(expect.objectContaining({ ply: target.ply, captureUci: 'f8f7' }))
    expect(plan.positions.length).toBeLessThanOrEqual(24)
    expect(plan.sacrifices.length).toBeLessThanOrEqual(4)
    expect(plan.extraSearches).toBeLessThanOrEqual(8)
    expect(plan.nodes).toBe(1000000)
    expect(plan.selectionVersion).toBe('evidence-priority-v2')
    expect(JSON.stringify(entries)).toBe(preserved)
    expect(entries[target.ply - 1].classification).toBe(target.classification)
    expect(buildRefinementPlan(entries)).toEqual(plan)
  })

  it('prioritizes special evidence and conflicting estimates with chronological ties', () => {
    const entries = structuredClone(archived.liveEntries).map(e => ({ ...e, classification: 'good', isBookMove: false,
      playedMate: null, dropPct: 15, specialAssessment: null, evaluationEvidence: { status: 'coherent' } }))
    for (const ply of [5, 6, 7, 8, 9, 10]) entries[ply - 1].evaluationEvidence.status = 'independent'
    entries[12].evaluationEvidence.status = 'unavailable'
    entries[13].evaluationEvidence.status = 'conflicting'
    entries[14].specialAssessment = { grande: { status: 'candidate' } }
    entries[15].specialAssessment = { brilliant: { status: 'candidate', reason: 'unconfirmed' } }
    entries[3].dropPct = 4.5
    const plan = buildRefinementPlan(entries)
    expect(plan.selectedPlies).toEqual([16, 15, 13, 14, 5, 6, 7, 8, 9, 10, 4])
    expect(plan.selection.map(row => row.priority)).toEqual([1, 2, 3, 3, 4, 4, 4, 4, 4, 4, 5])
    expect(REFINEMENT_POLICY.maxMoves).toBe(12)
  })

  it('keeps book, forced and delivered mate outside the ranking even with a candidate flag', () => {
    const entries = structuredClone(archived.liveEntries).map(e => ({ ...e, classification: 'good', isBookMove: false,
      playedMate: null, dropPct: 15, specialAssessment: null, evaluationEvidence: { status: 'coherent' } }))
    for (const ply of [4, 5, 6]) entries[ply - 1].specialAssessment = { brilliant: { status: 'candidate' } }
    entries[3].isBookMove = true
    entries[4].classification = 'forced'
    entries[5].playedMate = 0
    expect(buildRefinementPlan(entries).selectedPlies).toEqual([])
  })
})
