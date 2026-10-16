import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {checkingAttackerCapture,checkingMajorFork} from '../src/lib/tacticalEvidence.js'
import {deferredForcingResponse} from '../src/lib/deferredResponse.js'
import {calculateWinProbability} from '../src/lib/evaluation.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {formatSpecialAssessment} from '../src/lib/specialClassification.js'

const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const pair=(id,ply)=>structuredClone(cases.find(c=>c.id===id&&c.cohort!=='refined').entries.slice(ply-2,ply))
function moveEntry(fen,uci){
 const board=new Chess(fen),m=board.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
 return {fenBefore:fen,fenAfter:board.fen(),playedUci:uci,playedMove:m.san}
}
function rootsFor(entry){
 const raw=structuredClone(entry.engine.specialLines),legal=new Chess(entry.fenBefore).moves().length
 return {status:'available',coherent:true,raw,coverage:{source:'completed-snapshot',legal},
  lines:raw.map(l=>{const b=new Chess(entry.fenBefore);return {uci:l.pv[0],score:calculateWinProbability(l.evalCp),depth:l.depth,
   events:l.pv.map(uci=>{const m=b.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});return {uci,san:m.san}})}})}
}

describe('verified tactical Grande families',()=>{
 it.each([['184316820266',34,'Rxd6'],['personal-02',31,'Rxf2']])('recognizes the checking attacker captured in %s/%s',(id,ply,san)=>{
  const input=pair(id,ply),before=JSON.stringify(input),e=reclassifyReviewedMoves(input)[1]
  expect(e).toMatchObject({playedMove:san,classification:'great',specialAssessment:{grande:{
   reason:'active-checking-attacker-capture',tactic:{proofAgainstEveryDefense:false}}}})
  expect(formatSpecialAssessment(e)).toContain('scacco')
  expect(JSON.stringify(input)).toBe(before)
 })
 it('does not promote a normal king recapture or accept a disconnected previous move',()=>{
  const [previous,e]=pair('185230000668',26)
  expect(e.playedMove).toBe('Kxd7')
  expect(checkingAttackerCapture(e,previous)).toBeNull()
  const [p,r]=pair('184316820266',34)
  expect(checkingAttackerCapture(r,{...p,ply:p.ply-2})).toBeNull()
  expect(checkingAttackerCapture({...r,fenAfter:r.fenBefore},p)).toBeNull()
 })
 it('verifies Qxf6+ against every legal immediate reply, without asserting a complete winning tree',()=>{
  const e=reclassifyReviewedMoves(pair('185230271130',39))[1],proof=e.specialAssessment.grande.tactic
  expect(e.classification).toBe('great')
  expect(proof).toMatchObject({target:'h8',type:'r',proofAgainstEveryDefense:false})
  const replies=new Chess(e.fenAfter).moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??''))
  expect(proof.replies.map(r=>r.reply).sort()).toEqual(replies.sort())
  expect(formatSpecialAssessment(e)).toContain('ogni risposta legale immediata')
 })
 it('requires the fork to survive a capture of the attacker and an immediate recapture of the prize',()=>{
  const valid=moveEntry('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1','b5c7')
  expect(checkingMajorFork(valid)).toMatchObject({target:'a8'})
  expect(checkingMajorFork(moveEntry('rb2k3/8/8/1N6/8/8/8/4K3 w - - 0 1','b5c7'))).toBeNull()
  expect(checkingMajorFork(moveEntry('r3k3/r7/8/1N6/8/8/8/4K3 w - - 0 1','b5c7'))).toBeNull()
  expect(checkingMajorFork({...valid,fenAfter:valid.fenBefore})).toBeNull()
 })
})

describe('a forcing response that can wait in a favorable alternative',()=>{
 it.each([['185262315732',37,'check'],['184316820266',21,'new-material-threat']])('excludes the false Grande in %s/%s',(id,ply,motif)=>{
  const input=pair(id,ply),e=reclassifyReviewedMoves(input)[1],proof=e.specialAssessment.grande.deferred
  expect(e.classification).toBe('best')
  expect(proof).toMatchObject({motif,proofAgainstEveryDefense:false})
  expect(proof.deferredPly).toBeGreaterThan(1)
  expect(proof.continuation.at(-1)).toBe(e.playedMove)
  expect(formatSpecialAssessment(e)).toContain(proof.continuation[0])
 })
 it.each(['bounded','restricted','incomplete','mixed-depth','unfavorable','no-delayed-move'])('requires usable evidence: %s',failure=>{
  const e=pair('185262315732',37)[1],roots=rootsFor(e),forcing={applicable:true,kind:'check'}
  expect(deferredForcingResponse(e,roots,forcing)).not.toBeNull()
  if(failure==='bounded')roots.raw[0].upperbound=true
  if(failure==='restricted')e.engine.analysisMetadata.searchMoves=[e.playedUci]
  if(failure==='incomplete')roots.raw.pop()
  if(failure==='mixed-depth')roots.coherent=false
  if(failure==='unfavorable')roots.lines.slice(1).forEach(l=>{l.score=0.1})
  if(failure==='no-delayed-move')roots.lines.slice(1).forEach(l=>{l.events=l.events.slice(0,2)})
  expect(deferredForcingResponse(e,roots,forcing)).toBeNull()
 })
})
