import {Chess} from 'chess.js'
const uci=m=>m.from+m.to+(m.promotion??'')
function play(b,u){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u??''))throw Error('Invalid move');return b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})}
export function checkingAttackerCapture(entry,previous){
 try{
  if(!previous||previous.ply!==entry.ply-1||previous.fenAfter!==entry.fenBefore)return null
  const before=new Chess(entry.fenBefore)
  if(!before.isCheck()||before.moves().length<2)return null
  const prior=new Chess(previous.fenBefore),old=play(prior,previous.playedUci)
  if(prior.fen()!==entry.fenBefore||old.promotion)return null
  const move=play(new Chess(entry.fenBefore),entry.playedUci)
  if(move.piece==='k'||!['n','b','r','q'].includes(move.captured)||move.to!==old.to||move.captured!==old.piece)return null
  const king=before.board().flat().find(p=>p?.type==='k'&&p.color===before.turn())
  if(!king||!before.attackers(king.square,old.color).includes(move.to))return null
  const after=new Chess(entry.fenBefore);play(after,entry.playedUci)
  if(after.fen()!==entry.fenAfter)return null
  return{kind:'checking-attacker-capture',captured:move.captured,square:move.to,priorMove:old.san,
    proofScope:'legal-capture-of-checking-attacker',proofAgainstEveryDefense:false}
 }catch{return null}
}
export function checkingMajorFork(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),m=play(after,entry.playedUci)
  if(after.fen()!==entry.fenAfter||!after.isCheck()||after.isCheckmate())return null
  const king=after.board().flat().find(p=>p?.type==='k'&&p.color===after.turn())
  if(!king||!after.attackers(king.square,m.color).includes(m.to))return null
  const already=before.moves({verbose:true}).filter(x=>x.from===m.from&&x.captured).map(x=>x.to)
  const targets=after.board().flat().filter(p=>p&&p.color!==m.color&&['r','q'].includes(p.type)
    &&after.attackers(p.square,m.color).includes(m.to)&&!already.includes(p.square))
  if(!targets.length)return null
  const replies=after.moves({verbose:true})
  for(const target of targets){const verified=[]
   for(const reply of replies){
    const b=new Chess(after.fen());b.move(reply.san)
    const mover=b.get(m.to),destination=reply.from===target.square?reply.to:target.square
    if(mover?.color!==m.color||mover.type!==(m.promotion??m.piece)){verified.length=0;break}
    const capture=b.moves({verbose:true}).find(c=>c.from===m.to&&c.to===destination&&c.captured===target.type)
    if(!capture){verified.length=0;break}
    b.move(capture.san)
    if(b.moves({verbose:true}).some(r=>r.to===destination&&r.captured)){verified.length=0;break}
    verified.push({reply:uci(reply),capture:uci(capture)})
   }
   if(verified.length===replies.length&&verified.length)return{kind:'checking-major-fork',target:target.square,type:target.type,
    replies:verified,proofScope:'all-legal-immediate-check-responses',proofAgainstEveryDefense:false}
  }
  return null
 }catch{return null}
}
