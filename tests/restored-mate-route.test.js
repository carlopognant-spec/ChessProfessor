import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {restoredMateRoute} from '../src/lib/restoredMateRoute.js'
const {cases}=JSON.parse(readFileSync(new URL('../agent-output/special-completion-v1/cohorts.json',import.meta.url)))
const sample=(id,ply)=>structuredClone(cases.find(c=>c.id===id&&c.cohort==='old').entries.slice(ply-3,ply))
const trio=()=>sample('personal-01',49)
describe('causal restoration of a previously available mating route',()=>{
 it('proves the earlier mate, the actual interposition, its safe removal and the same mate route',()=>{
  const [own,previous,e]=trio(),proof=restoredMateRoute(e,previous,own)
  expect(proof).toMatchObject({attacker:'q',previousMate:{uci:'e5g7'},interposition:{uci:'f7f6'},removal:{uci:'e5f6'},restoredMate:{uci:'f6g7'},proofAgainstEveryDefense:false})
 })
 it('uses the same legal proof when colors and board coordinates are reversed',()=>{
  const rows=trio(),mirror=s=>String.fromCharCode(104-(s.charCodeAt(0)-97))+(9-Number(s[1]))
  const board=new Chess();board.clear()
  for(const p of new Chess(rows[0].fenBefore).board().flat().filter(Boolean))board.put({type:p.type,color:p.color==='w'?'b':'w'},mirror(p.square))
  const fields=board.fen().split(' ');fields[1]='b';fields[2]='-';fields[3]='-'
  const b=new Chess(fields.join(' ')),mirrored=rows.map((e,i)=>{
   const fenBefore=b.fen(),u=mirror(e.playedUci.slice(0,2))+mirror(e.playedUci.slice(2,4))+(e.playedUci[4]??'')
   b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
   return{ply:i+1,playedUci:u,fenBefore,fenAfter:b.fen()}
  })
  expect(restoredMateRoute(mirrored[2],mirrored[1],mirrored[0])).toMatchObject({attacker:'q',proofAgainstEveryDefense:false})
 })
 it.each(['missing','chain','current-fen','previous-fen','own-move'])('refuses %s history',kind=>{
  const [own,previous,e]=trio()
  if(kind==='missing')return expect(restoredMateRoute(e,previous,null)).toBeNull()
  if(kind==='chain')previous.ply--
  if(kind==='current-fen')e.fenAfter=e.fenBefore
  if(kind==='previous-fen')previous.fenAfter=own.fenBefore
  if(kind==='own-move')own.playedUci='a1a8'
  expect(restoredMateRoute(e,previous,own)).toBeNull()
 })
 it.each([['personal-01',45],['game-1-chigorin-steinitz-1892',25],['game-1-chigorin-steinitz-1892',39],['game-2-saintamant-staunton-1843',80]])('does not describe the new winning decision in %s/%s',(id,ply)=>{
  const [own,previous,e]=sample(id,ply);expect(restoredMateRoute(e,previous,own)).toBeNull()
 })
})
