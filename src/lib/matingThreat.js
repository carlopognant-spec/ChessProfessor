import {Chess} from 'chess.js'
const uci=m=>m.from+m.to+(m.promotion??'')
export function newMatingThreat(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),side=before.turn()
  const move=after.move({from:entry.playedUci.slice(0,2),to:entry.playedUci.slice(2,4),promotion:entry.playedUci[4]})
  if(move.captured||after.fen()!==entry.fenAfter||after.isCheck()||after.isGameOver())return null
  // An incoming check suppresses other legal moves; do not call their restoration a new attack.
  if(before.isCheck())return null
  if(before.moves({verbose:true}).some(m=>m.san.endsWith('#')))return null
  const fields=after.fen().split(' ');fields[1]=side;fields[3]='-'
  const own=new Chess(fields.join(' ')),mates=own.moves({verbose:true}).filter(m=>m.san.endsWith('#'))
  if(!mates.length)return null
  for(const m of mates){const b=new Chess(own.fen());b.move(m.san);if(!b.isCheckmate())return null}
  return {kind:'new-mate-in-one-threat',moves:mates.map(m=>({uci:uci(m),san:m.san})),
   proofScope:'legal-mates-if-the-threat-is-unanswered',proofAgainstEveryDefense:false}
 }catch{return null}
}
