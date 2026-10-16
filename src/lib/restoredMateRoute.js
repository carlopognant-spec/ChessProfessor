import {Chess} from 'chess.js'
const uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
const ownTurn=(b,side)=>{const f=b.fen().split(' ');f[1]=side;f[3]='-';return new Chess(f.join(' '))}
function between(from,to,square){
 const a=[from.charCodeAt(0),Number(from[1])],b=[to.charCodeAt(0),Number(to[1])],x=[square.charCodeAt(0),Number(square[1])]
 const dx=b[0]-a[0],dy=b[1]-a[1]
 if(dx&&dy&&Math.abs(dx)!==Math.abs(dy))return false
 const length=Math.max(Math.abs(dx),Math.abs(dy))
 return Array.from({length:Math.max(0,length-1)},(_,i)=>i+1).some(i=>a[0]+Math.sign(dx)*i===x[0]&&a[1]+Math.sign(dy)*i===x[1])
}
// An ordinary continuation: safely remove the opponent's just-interposed piece
// and restore the same previously legal mate route with the same attacker.
// This describes only the actual legal sequence, never all unplayed defenses.
export function restoredMateRoute(entry,previous,previousOwn){
 try{
  if(!previousOwn||!previous||previousOwn.ply!==entry.ply-2||previous.ply!==entry.ply-1
   ||previousOwn.fenAfter!==previous.fenBefore||previous.fenAfter!==entry.fenBefore)return null
  const older=new Chess(previousOwn.fenBefore);play(older,previousOwn.playedUci)
  if(older.fen()!==previousOwn.fenAfter||older.isCheck())return null
  const opponent=new Chess(previous.fenBefore),blocker=play(opponent,previous.playedUci)
  if(opponent.fen()!==entry.fenBefore||opponent.isCheck()||blocker.captured||blocker.promotion)return null
  const after=new Chess(entry.fenBefore),move=play(after,entry.playedUci)
  if(after.fen()!==entry.fenAfter||after.isCheck()||move.promotion||!move.captured
   ||move.to!==blocker.to||move.captured!==blocker.piece)return null
  if(after.moves({verbose:true}).some(m=>m.to===move.to&&m.captured))return null
  const now=ownTurn(after,move.color),earlier=ownTurn(older,move.color)
  const oldPiece=earlier.get(move.from)
  if(oldPiece?.color!==move.color||oldPiece.type!==move.piece)return null
  const currentMates=now.moves({verbose:true}).filter(m=>m.from===move.to&&m.san.endsWith('#'))
  const oldMates=earlier.moves({verbose:true}).filter(m=>m.from===move.from&&m.san.endsWith('#'))
  for(const current of currentMates)for(const old of oldMates){
   if(old.to!==current.to||old.promotion!==current.promotion||!between(old.from,old.to,blocker.to))continue
   return {kind:'restored-mate-route-after-interposition',attacker:move.piece,
    previousMate:{uci:uci(old),san:old.san},interposition:{uci:uci(blocker),san:blocker.san},
    removal:{uci:uci(move),san:move.san},restoredMate:{uci:uci(current),san:current.san},
    proofScope:'actual-legal-restoration-of-previous-own-mating-route',proofAgainstEveryDefense:false}
  }
  return null
 }catch{return null}
}
