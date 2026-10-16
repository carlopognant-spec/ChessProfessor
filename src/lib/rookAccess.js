import {Chess} from 'chess.js'
const uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
export function newRookKingFileAccess(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),move=play(after,entry.playedUci)
  if(move.piece!=='r'||move.captured||before.isCheck()||after.isCheck()||after.isGameOver()||after.fen()!==entry.fenAfter)return null
  const king=before.board().flat().find(p=>p&&p.type==='k'&&p.color!==move.color)
  if(!king||king.square[0]===move.from[0])return null
  const lateral=m=>m.to[0]===king.square[0]&&m.to[1]===m.from[1]
  if(before.moves({verbose:true}).some(m=>m.from===move.from&&lateral(m)))return null
  const fields=after.fen().split(' ');fields[1]=move.color;fields[3]='-'
  const own=new Chess(fields.join(' ')),routes=own.moves({verbose:true}).filter(m=>m.from===move.to&&lateral(m)).map(uci)
  return routes.length?{kind:'new-rook-access-to-king-file',from:move.from,square:move.to,color:move.color,king:king.square,routes}:null
 }catch{return null}
}
export function verifiedRookAttackParticipation(entry,access,pv){
 try{
  if(!access||!Array.isArray(pv)||pv.length<3||pv.length>256)return null
  const b=new Chess(entry.fenAfter);let square=access.square,route=null
  for(const [i,u]of pv.entries()){
   const m=play(b,u)
   if(m.color!==access.color&&m.to===square&&m.captured==='r')return null
   if(m.color!==access.color||m.from!==square||m.piece!=='r')continue
   if(!route&&access.routes.includes(u))route={uci:u,ply:i+1}
   square=m.to
   const king=b.board().flat().find(p=>p&&p.type==='k'&&p.color!==access.color)
   if(route&&king&&b.isCheck()&&b.attackers(king.square,access.color).includes(square))return{
    ...access,kind:'rook-activation-in-compensated-attack',route,checkingMove:{uci:u,san:m.san,ply:i+1},
    proofScope:'new-legal-access-and-rook-participation-in-scored-acceptance-pv',proofAgainstEveryDefense:false}
  }
  return null
 }catch{return null}
}
