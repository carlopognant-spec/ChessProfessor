import {Chess} from 'chess.js'
const value={p:1,n:3,b:3,r:5,q:9,k:0},uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*value[p.type],0)
const ownTurn=(b,side)=>{const f=b.fen().split(' ');f[1]=side;f[3]='-';return new Chess(f.join(' '))}
function queenPins(b,side){
 const result=[]
 for(const p of b.board().flat().filter(p=>p&&p.color===side&&['b','r','q'].includes(p.type))){
  const dirs=p.type==='b'?[[1,1],[1,-1],[-1,1],[-1,-1]]:p.type==='r'?[[1,0],[-1,0],[0,1],[0,-1]]:[[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]
  for(const[dx,dy]of dirs){let knight=null
   for(let x=p.square.charCodeAt(0)-97+dx,y=Number(p.square[1])-1+dy;x>=0&&x<8&&y>=0&&y<8;x+=dx,y+=dy){
    const square=String.fromCharCode(97+x)+(y+1),q=b.get(square);if(!q)continue
    if(q.color===side)break
    if(!knight&&q.type==='n'){knight=square;continue}
    if(knight&&q.type==='q')result.push({pinner:p.square,piece:p.type,knight,queen:square})
    break
   }
  }
 }
 return result
}
function provePost(before,move,side,pins,baseline){
 const after=new Chess(before.fen());after.move(move.san)
 if(after.isCheck()||after.isGameOver())return null
 const oldPins=pins,newPins=queenPins(after,side),own=ownTurn(after,side)
 for(const pin of newPins.filter(p=>oldPins.some(o=>JSON.stringify(o)===JSON.stringify(p)))){
  if(!own.moves({verbose:true}).some(m=>m.from===move.to&&m.to===pin.knight&&m.captured==='n'))continue
  const captures=after.moves({verbose:true}).filter(m=>m.to===move.to&&m.captured==='n')
  if(!captures.some(m=>m.from===pin.knight))continue
  const proofs=[]
  for(const capture of captures){
   const b=new Chess(after.fen());b.move(capture.san)
   const winning=b.moves({verbose:true}).find(m=>m.from===pin.pinner&&m.to===pin.queen&&m.captured==='q')
   if(!winning)break
   b.move(winning.san);if(b.isGameOver())break
   let minimum=material(b,side)-baseline;const replies=b.moves({verbose:true})
   for(const r of replies){if(r.san.endsWith('#')){minimum=-Infinity;break}b.move(r.san);minimum=Math.min(minimum,material(b,side)-baseline);b.undo()}
   if(minimum<value.p)break
   proofs.push({capture:uci(capture),queenCapture:uci(winning),minimumAfterReply:minimum,replies:replies.map(uci)})
  }
  if(proofs.length===captures.length&&proofs.length)return{uci:uci(move),pin,captures:proofs}
 }
 return null
}
export function knightPawnEvasionExploitingQueenPin(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),move=play(after,entry.playedUci),side=move.color
  if(before.isCheck()||move.piece!=='n'||move.captured||move.promotion||after.isCheck()||after.fen()!==entry.fenAfter)return null
  const enemy=ownTurn(before,side==='w'?'b':'w'),threats=enemy.moves({verbose:true}).filter(m=>m.piece==='p'&&m.to===move.from&&m.captured==='n')
  if(!threats.length)return null
  const pins=queenPins(before,side);if(!pins.length)return null
  const baseline=material(before,side),posts=before.moves({verbose:true}).filter(m=>m.from===move.from&&!m.captured&&!m.promotion)
   .flatMap(m=>{const p=provePost(before,m,side,pins,baseline);return p?[p]:[]})
  if(posts.length!==1||posts[0].uci!==entry.playedUci)return null
  return{kind:'unique-knight-pawn-evasion-exploiting-relative-queen-pin',pawnThreats:threats.map(uci),...posts[0],
   proofScope:'legal-pawn-threat-and-unique-quiet-knight-post-with-profitable-queen-capture-after-every-immediate-knight-capture',proofAgainstEveryDefense:false}
 }catch{return null}
}
