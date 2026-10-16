import {readFileSync} from 'node:fs'
import {describe,it,expect,vi} from 'vitest'
import {buildRefinementPlan,refineGameEntries,selectRefinementView,grandeVerificationReason,REFINEMENT_POLICY} from '../src/lib/analysisRefinement.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)))
const stored=json('../agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json')
const records=json('../agent-output/special-completion-evidence-v1/collection.json').records
const packetFor=fen=>json('../'+records.find(r=>r.fen===fen).path)
const example={classification:'great',bestMate:null,playedMate:null,specialAssessment:{grande:{evidenceKind:'empirical-family'}}}
describe('explicit verification of empirical Grandi',()=>{
 it('selects empirical evidence without treating a mating continuation as unproved',()=>{
  expect(grandeVerificationReason(example)).toBe('empirical-special')
  expect(grandeVerificationReason({...example,bestMate:2})).toBeNull()
  expect(grandeVerificationReason({...example,specialAssessment:{grande:{reason:'critical-defense'}}})).toBeNull()
 })
 it.each([{isBookMove:true},{classification:'book'},{classification:'forced'},{playedMate:0},{classification:'best'}])('protects ineligible moves %j',fields=>{
  expect(grandeVerificationReason({...example,...fields})).toBeNull()
 })
 it('skips Bc4 already excluded by the deferred-response evidence and preserves the other decisions',async()=>{
  const entries=reclassifyReviewedMoves(structuredClone(stored.entries)),before=JSON.stringify(entries)
  const view=selectRefinementView(entries,true)
  expect(view[20].classification).toBe('best')
  expect(view[47].classification).toBe('excellent')
  const ordinary=buildRefinementPlan(entries),plan=buildRefinementPlan(entries,{grandeOnly:true})
  expect(plan).toMatchObject({scope:'grande-evidence-v1',selectionVersion:'grande-verification-v1',selectedPlies:[],positions:[]})
  expect(REFINEMENT_POLICY.selectionVersion).toBe('evidence-priority-v2')
  const search=vi.fn()
  const result=await refineGameEntries({entries,plan,analyzePosition:search})
  const after=selectRefinementView(result.entries,true)
  expect(after[20].classification).toBe('best')
  expect(after[47].classification).toBe('excellent')
  expect(after[40].classification).toBe('brilliant')
  expect(after).toEqual(view)
  expect(search).not.toHaveBeenCalled()
  expect(JSON.stringify(entries)).toBe(before)
  expect(buildRefinementPlan(entries)).toEqual(ordinary)
  expect(result.entries.map(e=>e.engine)).toEqual(entries.map(e=>e.engine))
  const next=buildRefinementPlan(result.entries,{grandeOnly:true})
  expect(next.selectedPlies).toEqual([])
 })
 it('completes the missing child comparison of d5 and stops requesting it',async()=>{
  const entries=reclassifyReviewedMoves(json('../agent-output/new-references-200k-v1/game-185230000668.json').liveEntries)
  const root=packetFor(entries[6].fenBefore),child=packetFor(entries[6].fenAfter)
  entries[6].refinement={version:REFINEMENT_POLICY.version,engine:root.engine,playedEngine:null,selected:true}
  const before=JSON.stringify(entries),ordinary=buildRefinementPlan(entries)
  expect(selectRefinementView(entries,true)[6].classification).toBe('great')
  const plan=buildRefinementPlan(entries,{grandeOnly:true})
  expect(plan).toMatchObject({selectedPlies:[7],positions:[child.fen],extraSearches:0})
  const search=vi.fn(async(fen,nodes,multiPv)=>{
   expect([fen,nodes,multiPv]).toEqual([child.fen,1000000,5]);return structuredClone(child.engine)
  })
  const result=await refineGameEntries({entries,plan,analyzePosition:search})
  expect(selectRefinementView(result.entries,true)[6].classification).toBe('great')
  expect(search).toHaveBeenCalledTimes(1)
  expect(buildRefinementPlan(result.entries,{grandeOnly:true}).selectedPlies).toEqual([])
  expect(JSON.stringify(entries)).toBe(before)
  expect(result.entries.map(e=>e.engine)).toEqual(entries.map(e=>e.engine))
  expect(buildRefinementPlan(entries)).toEqual(ordinary)
 })
 it('rejects a forged verification budget before requesting a search',async()=>{
  const entries=reclassifyReviewedMoves(structuredClone(stored.entries))
  const plan={...buildRefinementPlan(entries,{grandeOnly:true}),nodes:2000000}
  const search=vi.fn()
  await expect(refineGameEntries({entries,plan,analyzePosition:search})).rejects.toThrow('Piano di approfondimento non valido')
  expect(search).not.toHaveBeenCalled()
 })
})
