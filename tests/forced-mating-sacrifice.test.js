import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {formatSpecialAssessment} from '../src/lib/specialClassification.js'
const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const sample=(id,ply,cohort='old')=>structuredClone(cases.find(c=>c.id===id&&c.cohort===cohort).entries.slice(ply-3,ply))
const historical='game-1-chigorin-steinitz-1892'
const evaluate=input=>reclassifyReviewedMoves(input).at(-1)

describe('a new checking sacrifice with forced acceptance and a verified mating PV',()=>{
 it('migrates Rxf5+ from Best to Brilliant and explains the exact scope of its evidence',()=>{
  const input=sample(historical,61),before=JSON.stringify(input),e=evaluate(input)
  expect(e).toMatchObject({playedMove:'Rxf5+',classification:'brilliant',specialAssessment:{version:'counterfactual-v24'}})
  const proof=e.specialAssessment.brilliant.offers[0].forcedMatingAcceptance
  expect(proof).toMatchObject({acceptanceUci:'d7f5',legalReplies:1,mateDistance:-6,proofAgainstEveryDefense:false})
  const b=new Chess(e.fenAfter)
  expect(b.isCheck()).toBe(true)
  expect(b.moves()).toEqual(['Qxf5'])
  for(const u of proof.pv)b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
  expect(b.isCheckmate()).toBe(true)
  expect(proof.pv).toHaveLength(2*Math.abs(proof.mateDistance))
  expect(formatSpecialAssessment(e)).toContain('unica risposta legale')
  expect(JSON.stringify(input)).toBe(before)
  expect(evaluate(reclassifyReviewedMoves(input))).toEqual(e)
 })
 it.each(['truncated','distance','bounded'])('rejects %s mating evidence',failure=>{
  const input=sample(historical,61),packet=input.at(-1).playedEngine
  const rows=new Set([packet,...packet.lines,...(packet.specialLines??[])])
  for(const row of rows){
   if(failure==='truncated'&&row.pv)row.pv=row.pv.slice(0,-2)
   if(failure==='distance'&&row.mate!=null)row.mate=-7
   if(failure==='bounded')row.bound=true
  }
  expect(evaluate(input).classification).not.toBe('brilliant')
 })
 it.each([53,55])('keeps a persistent knight offer outside this family at ply %s',ply=>{
  const e=evaluate(sample(historical,ply))
  expect(e.classification).not.toBe('brilliant')
  expect(e.specialAssessment.brilliant.reason).toBe(ply===53?'missing-acceptance-analysis':'persistent-offer')
 })
 it.each(['initial','refined'])('preserves the false Bxc4 protection in the %s profile',cohort=>{
  const e=evaluate(sample('185262315732',53,cohort))
  expect(e.classification).not.toBe('brilliant')
  expect(e.specialAssessment.brilliant.reason).toBe('winning-alternative-without-new-sacrifice')
 })
})
