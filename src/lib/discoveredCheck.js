import {Chess} from 'chess.js'
const uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
export function newDiscoveredChecks(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),move=play(after,entry.playedUci)
  if(before.isCheck()||move.captured||move.promotion||!['b','r','q'].includes(move.piece)
   ||after.fen()!==entry.fenAfter||after.isCheck()||after.isGameOver())return null
  const fields=after.fen().split(' ');fields[1]=move.color;fields[3]='-'
  const own=new Chess(fields.join(' ')),old=new Map(before.moves({verbose:true}).map(m=>[uci(m),m])),checks=[]
  for(const candidate of own.moves({verbose:true})){
   if(candidate.from===move.to||!old.has(uci(candidate))||old.get(uci(candidate)).san.includes('+')||old.get(uci(candidate)).san.endsWith('#'))continue
   const b=new Chess(own.fen());b.move(candidate.san)
   if(!b.isCheck())continue
   const king=b.board().flat().find(p=>p&&p.color!==move.color&&p.type==='k')
   if(king&&b.attackers(king.square,move.color).includes(move.to))checks.push({uci:uci(candidate),san:candidate.san})
  }
  return checks.length?{kind:'new-discovered-check-options',checkingPiece:move.to,checks,
   proofScope:'legal-discovered-checks-if-the-preparation-is-unanswered',proofAgainstEveryDefense:false}:null
 }catch{return null}
}
