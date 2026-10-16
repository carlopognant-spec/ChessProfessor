import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {queenEvasionWinningMajor,newQueenEvasionWinningMajor,quietCheckingForkPickup} from '../src/lib/queenEvasion.js'
import {newBishopRookSkewer,proveBishopSkewerGain,verifyBishopSkewerGain} from '../src/lib/bishopSkewer.js'
import {knightPawnEvasionExploitingQueenPin} from '../src/lib/knightPinEvasion.js'
const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const sequence=(id,ply,cohort='old')=>structuredClone(cases.find(c=>c.id===id&&c.cohort===cohort).entries.slice(ply-3,ply))
const bishop=()=>sequence('game-2-saintamant-staunton-1843',82)[2]
const knight=()=>sequence('personal-06',31)[2]
function mirrorSequence(rows){
 const flip=s=>String.fromCharCode(104-(s.charCodeAt(0)-97))+(9-Number(s[1])),source=new Chess(rows[0].fenBefore),board=new Chess()
 board.clear();for(const p of source.board().flat().filter(Boolean))board.put({type:p.type,color:p.color==='w'?'b':'w'},flip(p.square))
 const fields=board.fen().split(' ');fields[1]=source.turn()==='w'?'b':'w';fields[2]='-';fields[3]='-';fields[4]=source.fen().split(' ')[4]
 const b=new Chess(fields.join(' '))
 return rows.map((e,i)=>{const fenBefore=b.fen(),u=flip(e.playedUci.slice(0,2))+flip(e.playedUci.slice(2,4))+(e.playedUci[4]??'');b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]});return{ply:i+1,fenBefore,playedUci:u,fenAfter:b.fen()}})
}
describe('legal major-piece tactical prototypes',()=>{
 it('proves a queen evasion by a unique safe major capture, without using score or game id',()=>{
  const [own,previous,e]=sequence('personal-05',27),proof=newQueenEvasionWinningMajor(e,previous,own)
  expect(proof).toMatchObject({kind:'queen-evasion-with-unique-major-gain',capture:'r',minimumAfterReply:5,threats:[{uci:'f2e4',piece:'n'}]})
  const b=new Chess(e.fenAfter);expect(new Set(proof.replies)).toEqual(new Set(b.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??''))))
 })
 it('distinguishes Qxh8 from a fresh rescue because Qxf6+ already forked the unchanged rook',()=>{
  const [own,previous,e]=sequence('185230271130',41,'initial')
  expect(queenEvasionWinningMajor(e)).toBeTruthy()
  expect(quietCheckingForkPickup(e,previous,own)).toMatchObject({initiatingMove:'Qxf6+',reply:'Qe7',target:'h8'})
  expect(newQueenEvasionWinningMajor(e,previous,own)).toBeNull()
 })
 it.each(['missing','own-move','reply-move','own-fen','reply-fen'])('refuses %s history instead of treating a failed replay as novelty',kind=>{
  const [own,previous,e]=sequence('personal-05',27)
  if(kind==='missing')return expect(newQueenEvasionWinningMajor(e,previous,null)).toBeNull()
  if(kind==='own-move')own.playedUci='a1a8'
  if(kind==='reply-move')previous.playedUci='a1a8'
  if(kind==='own-fen')own.fenAfter=own.fenBefore
  if(kind==='reply-fen')previous.fenAfter=previous.fenBefore
  expect(newQueenEvasionWinningMajor(e,previous,own)).toBeNull()
 })
 it('independently replays every opponent branch of the two-move skewer strategy, including Qxc4+',()=>{
  const e=bishop(),p=proveBishopSkewerGain(e)
  expect(p).toMatchObject({status:'proved',maxOwnMoves:2,proofAgainstEveryDefense:false,skewer:{targets:[['e2','d1']]}})
  expect(verifyBishopSkewerGain(e,p)).toBe(true)
  const legal=new Chess(e.fenAfter).moves({verbose:true})
  expect(legal.some(m=>m.from==='g2'&&m.to==='f3')).toBe(false) // g-pawn is pinned to its king.
  expect(p.proof.branches.some(b=>b.uci==='c3c4')).toBe(true)
 })
 it.each(['missing-defense','illegal-defense','illegal-choice','wrong-baseline','too-deep'])('rejects a %s strategy certificate',kind=>{
  const e=bishop(),p=structuredClone(proveBishopSkewerGain(e))
  if(kind==='missing-defense')p.proof.branches.pop()
  if(kind==='illegal-defense')p.proof.branches[0].uci='a1a8'
  if(kind==='illegal-choice')p.proof.branches[0].next.uci='a1a8'
  if(kind==='wrong-baseline')p.baseline++
  if(kind==='too-deep')p.maxOwnMoves++
  expect(verifyBishopSkewerGain(e,p)).toBe(false)
 })
 it('does not certify an exhausted proof search',()=>{
  const e=bishop(),p=proveBishopSkewerGain(e,{maxNodes:1})
  expect(p.status).toBe('budget-exhausted');expect(verifyBishopSkewerGain(e,p)).toBe(false)
 })
 it('proves why every immediate capture of the rescued Nd5 loses material on the pinned queen',()=>{
  const p=knightPawnEvasionExploitingQueenPin(knight())
  expect(p).toMatchObject({pawnThreats:['b4c3'],pin:{pinner:'h4',knight:'f6',queen:'d8'},captures:[{capture:'f6d5',queenCapture:'h4d8',minimumAfterReply:3}],proofAgainstEveryDefense:false})
 })
 it.each(['queen','bishop','knight'])('preserves the %s proof with mirrored coordinates and swapped colors',kind=>{
  if(kind==='queen'){
   const [own,previous,e]=mirrorSequence(sequence('personal-05',27));expect(newQueenEvasionWinningMajor(e,previous,own)).toBeTruthy()
  }else if(kind==='bishop'){
   const e=mirrorSequence(sequence('game-2-saintamant-staunton-1843',82))[2],p=proveBishopSkewerGain(e)
   expect(p.status).toBe('proved');expect(verifyBishopSkewerGain(e,p)).toBe(true)
  }else expect(knightPawnEvasionExploitingQueenPin(mirrorSequence(sequence('personal-06',31))[2])).toBeTruthy()
 })
 it('refuses mismatched after-positions in every family',()=>{
  const [own,previous,e]=sequence('personal-05',27)
  expect(newQueenEvasionWinningMajor({...e,fenAfter:e.fenBefore},previous,own)).toBeNull()
  const b=bishop();expect(newBishopRookSkewer({...b,fenAfter:b.fenBefore})).toBeNull()
  const n=knight();expect(knightPawnEvasionExploitingQueenPin({...n,fenAfter:n.fenBefore})).toBeNull()
 })
})
