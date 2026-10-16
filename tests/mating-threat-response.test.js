import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {newMatingThreat} from '../src/lib/matingThreat.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {formatSpecialAssessment} from '../src/lib/specialClassification.js'
const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const sample=(id,ply)=>structuredClone(cases.find(c=>c.id===id&&c.cohort!=='refined').entries.slice(ply-3,ply))
const historical='game-1-chigorin-steinitz-1892'
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})

describe('causal creation of a mating threat after an inaccuracy',()=>{
 it('recognizes Qh5 and preserves the original numerical evidence and archive input',()=>{
  const input=sample(historical,45),before=JSON.stringify(input),e=reclassifyReviewedMoves(input).at(-1)
  expect(e).toMatchObject({playedMove:'Qh5',classification:'great',numericalClassification:'best',
   specialAssessment:{version:'counterfactual-v24',grande:{reason:'new-mating-threat-after-inaccuracy',previousNumericalClassification:'inaccuracy'}}})
  const tactic=e.specialAssessment.grande.tactic
  expect(tactic.moves).toContainEqual({uci:'e5g4',san:'Ng4#'})
  expect(tactic.proofAgainstEveryDefense).toBe(false)
  expect(formatSpecialAssessment(e)).toContain('Ng4#')
  expect(formatSpecialAssessment(e)).toContain('non implica matto contro ogni difesa')
  expect(e.dropPct).toBe(input.at(-1).dropPct)
  expect(JSON.stringify(input)).toBe(before)
  expect(reclassifyReviewedMoves(reclassifyReviewedMoves(input))).toEqual(reclassifyReviewedMoves(input))
 })
 it('does not call options restored after an incoming check a newly created threat',()=>{
  const input=sample('184316820266',62),e=input.at(-1)
  expect(e.playedMove).toBe('Kb6')
  expect(new Chess(e.fenBefore).isCheck()).toBe(true)
  expect(newMatingThreat(e)).toBeNull()
  expect(reclassifyReviewedMoves(input).at(-1).classification).toBe('best')
 })
 it('supports either color with the same legal mating-threat calculation',()=>{
  const e=sample(historical,45).at(-1),before=new Chess(e.fenBefore),b=new Chess()
  b.clear()
  const flip=s=>'abcdefgh'[7-'abcdefgh'.indexOf(s[0])]+(9-Number(s[1]))
  for(const p of before.board().flat().filter(Boolean))b.put({type:p.type,color:p.color==='w'?'b':'w'},flip(p.square))
  const fields=b.fen().split(' ');fields[1]='b';const fenBefore=fields.join(' '),after=new Chess(fenBefore)
  const playedUci=flip(e.playedUci.slice(0,2))+flip(e.playedUci.slice(2,4));play(after,playedUci)
  const proof=newMatingThreat({fenBefore,fenAfter:after.fen(),playedUci})
  expect(proof?.moves.length).toBeGreaterThan(0)
  const next=after.fen().split(' ');next[1]='b';next[3]='-'
  for(const m of proof.moves){const threat=new Chess(next.join(' '));play(threat,m.uci);expect(threat.isCheckmate()).toBe(true)}
 })
 it('does not invent a new threat when a mate was already legal before the move',()=>{
  const fenBefore='7k/8/5KQ1/8/8/8/P7/8 w - - 0 1',b=new Chess(fenBefore)
  expect(b.moves().some(m=>m.endsWith('#'))).toBe(true)
  play(b,'a2a3')
  expect(newMatingThreat({fenBefore,fenAfter:b.fen(),playedUci:'a2a3'})).toBeNull()
 })
 it('requires a real matching position and excludes an immediate checking capture',()=>{
  const e=sample(historical,45).at(-1)
  expect(newMatingThreat({...e,fenAfter:e.fenBefore})).toBeNull()
  expect(newMatingThreat(sample('185230271130',39).at(-1))).toBeNull()
 })
})
