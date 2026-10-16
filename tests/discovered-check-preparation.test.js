import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {newDiscoveredChecks} from '../src/lib/discoveredCheck.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {formatSpecialAssessment} from '../src/lib/specialClassification.js'
const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const historical=cases.find(c=>c.id==='game-1-chigorin-steinitz-1892')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
function moveEntry(fen,uci){const b=new Chess(fen);play(b,uci);return{fenBefore:fen,fenAfter:b.fen(),playedUci:uci}}
describe('causal preparation of discovered checks',()=>{
 it('recognizes Re1 without changing its score and proves the formerly nonchecking options',()=>{
  const input=structuredClone(historical.entries.slice(40,43)),before=JSON.stringify(input),e=reclassifyReviewedMoves(input).at(-1)
  expect(e).toMatchObject({playedMove:'Re1',classification:'great',specialAssessment:{version:'counterfactual-v24',grande:{reason:'new-discovered-check-after-opponent-error'}}})
  const proof=e.specialAssessment.grande.tactic
  expect(proof.checkingPiece).toBe('e1');expect(proof.checks.length).toBeGreaterThan(0)
  expect(proof.proofAgainstEveryDefense).toBe(false)
  const fields=e.fenAfter.split(' ');fields[1]='w';fields[3]='-'
  for(const m of proof.checks){
   const original=new Chess(e.fenBefore),attacking=new Chess(fields.join(' '))
   play(original,m.uci);play(attacking,m.uci)
   expect(original.isCheck()).toBe(false);expect(attacking.isCheck()).toBe(true)
   expect(attacking.attackers('e6','w')).toContain('e1')
  }
  expect(formatSpecialAssessment(e)).toContain('scoperta')
  expect(e.dropPct).toBe(input.at(-1).dropPct)
  expect(JSON.stringify(input)).toBe(before)
  expect(reclassifyReviewedMoves(reclassifyReviewedMoves(input))).toEqual(reclassifyReviewedMoves(input))
 })
 it('does not call an already available discovered check new',()=>{
  expect(newDiscoveredChecks(moveEntry('8/8/4k3/4N3/8/8/P7/4R1K1 w - - 0 1','e1e2'))).toBeNull()
 })
 it('rejects a pinned screen which cannot legally uncover the rook',()=>{
  const e=moveEntry('8/8/4k3/r3N2K/8/8/8/5R2 w - - 0 1','f1e1')
  expect(newDiscoveredChecks(e)).toBeNull()
 })
 it('does not infer the motif from a checking capture or a mismatched FEN',()=>{
  const e=historical.entries[42]
  expect(newDiscoveredChecks({...e,fenAfter:e.fenBefore})).toBeNull()
  expect(newDiscoveredChecks(historical.entries[60])).toBeNull()
 })
 it('does not revive the rejected immediate-check response Be7',()=>{
  const c=cases.find(c=>c.id==='185262315732'&&c.cohort==='refined')
  expect(reclassifyReviewedMoves(c.entries.slice(27,30)).at(-1).classification).toBe('best')
 })
})
