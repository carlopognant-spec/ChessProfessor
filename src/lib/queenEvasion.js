import {Chess} from 'chess.js'
const value={p:1,n:3,b:3,r:5,q:9,k:0},uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*value[p.type],0)
function stableMajorGain(before,move,side,baseline){
 const b=new Chess(before.fen());b.move(move.san)
 if(b.isGameOver())return null
 const gain=material(b,side)-baseline,replies=b.moves({verbose:true});let minimum=gain
 for(const reply of replies){
  if(reply.san.endsWith('#'))return null
  b.move(reply.san);minimum=Math.min(minimum,material(b,side)-baseline);b.undo()
 }
 return minimum>=value.r-value.b?{uci:uci(move),gain,minimumAfterReply:minimum,replies:replies.map(uci)}:null
}
export function queenEvasionWinningMajor(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),side=before.turn(),move=play(after,entry.playedUci)
  if(before.isCheck()||move.piece!=='q'||!['r','q'].includes(move.captured)||move.promotion||after.fen()!==entry.fenAfter)return null
  const f=before.fen().split(' ');f[1]=side==='w'?'b':'w';f[3]='-'
  const attackers=new Chess(f.join(' ')).moves({verbose:true}).filter(m=>m.to===move.from&&m.captured==='q')
  if(!attackers.length||attackers.some(m=>m.from===move.to))return null
  const baseline=material(before,side),gains=before.moves({verbose:true}).filter(m=>['r','q'].includes(m.captured))
   .flatMap(m=>{const proof=stableMajorGain(before,m,side,baseline);return proof?[proof]:[]})
  if(gains.length!==1||gains[0].uci!==entry.playedUci)return null
  return{kind:'queen-evasion-with-unique-major-gain',queenFrom:move.from,queenTo:move.to,
   threats:attackers.map(m=>({uci:uci(m),piece:m.piece})),capture:move.captured,...gains[0],
   proofScope:'legal-queen-threat-and-unique-major-capture-gain-after-every-immediate-reply',proofAgainstEveryDefense:false}
 }catch{return null}
}
// A quiet pickup after one's own checking fork is a realization of that
// earlier decision. The opponent may have answered by interposing rather
// than moving the king; the checking queen and target must retain identity.
export function quietCheckingForkPickup(entry,previous,previousOwn){
 try{
  if(!previous||!previousOwn||previous.ply!==entry.ply-1||previousOwn.ply!==entry.ply-2
   ||previousOwn.fenAfter!==previous.fenBefore||previous.fenAfter!==entry.fenBefore)return null
  const older=new Chess(previousOwn.fenBefore),first=play(older,previousOwn.playedUci)
  if(older.fen()!==previousOwn.fenAfter||!older.isCheck()||first.piece!=='q'||first.promotion)return null
  const opponent=new Chess(previous.fenBefore),reply=play(opponent,previous.playedUci)
  if(opponent.fen()!==entry.fenBefore)return null
  const after=new Chess(entry.fenBefore),move=play(after,entry.playedUci)
  if(after.fen()!==entry.fenAfter||after.isCheck()||move.from!==first.to||move.piece!==first.piece||move.promotion||!['r','q'].includes(move.captured))return null
  const target=older.get(move.to),king=older.board().flat().find(p=>p?.type==='k'&&p.color===reply.color)
  if(target?.type!==move.captured||target.color!==reply.color||!king
   ||!older.attackers(king.square,first.color).includes(first.to)||!older.attackers(move.to,first.color).includes(first.to))return null
  return{kind:'quiet-checking-queen-fork-realization',initiatingMove:first.san,reply:reply.san,target:move.to,
   proofScope:'same-checking-queen-captures-unchanged-already-forked-major-after-legal-check-evasion',proofAgainstEveryDefense:false}
 }catch{return null}
}
export function newQueenEvasionWinningMajor(entry,previous,previousOwn){
 if(!previousOwn||!previous||previousOwn.fenAfter!==previous.fenBefore||previous.fenAfter!==entry.fenBefore
  ||previousOwn.ply!==entry.ply-2||previous.ply!==entry.ply-1)return null
 try{
  for(const e of[previousOwn,previous]){const b=new Chess(e.fenBefore);play(b,e.playedUci);if(b.fen()!==e.fenAfter)return null}
 }catch{return null}
 const proof=queenEvasionWinningMajor(entry)
 return proof&&!quietCheckingForkPickup(entry,previous,previousOwn)?proof:null
}
