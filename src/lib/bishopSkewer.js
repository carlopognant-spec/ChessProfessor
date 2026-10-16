import {Chess} from 'chess.js'
const value={p:1,n:3,b:3,r:5,q:9,k:0},uci=m=>m.from+m.to+(m.promotion??'')
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*value[p.type],0)
function rookRays(b,square,side){
 const result=[],file=square.charCodeAt(0)-97,rank=Number(square[1])-1
 for(const[dx,dy]of [[1,1],[1,-1],[-1,1],[-1,-1]]){
  const rooks=[]
  for(let x=file+dx,y=rank+dy;x>=0&&x<8&&y>=0&&y<8;x+=dx,y+=dy){
   const at=String.fromCharCode(97+x)+(y+1),p=b.get(at);if(!p)continue
   if(p.color!==side&&p.type==='r'){rooks.push(at);if(rooks.length===2){result.push(rooks);break}}
   else break
  }
 }
 return result
}
export function newBishopRookSkewer(entry){
 try{
  const before=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),move=play(after,entry.playedUci)
  if(before.isCheck()||after.isCheck()||after.isGameOver()||move.piece!=='b'||move.captured||move.promotion||after.fen()!==entry.fenAfter)return null
  const rays=rookRays(after,move.to,move.color),old=rookRays(before,move.from,move.color)
  const created=rays.filter(r=>!old.some(o=>o.join(',')===r.join(',')))
  return created.length?{kind:'new-bishop-skewer-of-rooks',square:move.to,color:move.color,targets:created}:null
 }catch{return null}
}
export function proveBishopSkewerGain(entry,{maxOwnMoves=2,maxNodes=100000}={}){
 const skewer=newBishopRookSkewer(entry);if(!skewer)return{status:'not-applicable',nodes:0}
 const side=skewer.color,baseline=material(new Chess(entry.fenBefore),side),b=new Chess(entry.fenAfter),memo=new Map()
 let nodes=0,exhausted=false
 const key=(left,square)=>b.fen().split(' ').slice(0,5).join(' ')+'|'+left+'|'+square
 function stable(){
  const gain=material(b,side)-baseline;if(gain<value.p)return null
  const replies=b.moves({verbose:true});if(!replies.length)return null
  let minimum=gain
  for(const m of replies){if(m.san.endsWith('#'))return null;b.move(m.san);minimum=Math.min(minimum,material(b,side)-baseline);b.undo();if(minimum<value.p)return null}
  return{kind:'material-gain-stable-after-immediate-replies',minimumGain:minimum,replies:replies.map(uci)}
 }
 function visit(left,square){
  if(++nodes>maxNodes){exhausted=true;return null}
  if(b.isCheckmate())return b.turn()===side?null:{kind:'attacking-side-checkmate',minimumGain:material(b,side)-baseline}
  if(b.isGameOver())return null
  const k=key(left,square);if(memo.has(k))return memo.get(k)
  const moves=b.moves({verbose:true})
  if(b.turn()!==side){
   const proof=stable();if(proof){memo.set(k,proof);return proof}
   if(!left)return null
   const branches=[]
   moves.sort((a,c)=>Number(c.san.includes('+'))-Number(a.san.includes('+'))+(value[c.captured]??0)-(value[a.captured]??0))
   for(const m of moves){b.move(m.san);const p=visit(left,m.captured==='b'&&m.to===square?null:square);b.undo();if(!p){memo.set(k,null);return null}branches.push({uci:uci(m),next:p})}
   const p={kind:'all-legal-opponent-moves',branches};memo.set(k,p);return p
  }
  if(!left)return null
  const inCheck=b.isCheck()
  moves.sort((a,c)=>(value[c.captured]??0)-(value[a.captured]??0)||Number(c.piece==='k')-Number(a.piece==='k')||uci(a).localeCompare(uci(c)))
  for(const m of moves){
   const tracked=m.from===square&&m.piece==='b',nextSquare=tracked?m.to:square
   b.move(m.san)
   const forcing=inCheck||m.captured||m.san.includes('+')||m.san.endsWith('#')||tracked&&rookRays(b,m.to,side).length
   const p=forcing?visit(left-1,nextSquare):null;b.undo()
   if(p){const result={kind:'chosen-legal-forcing-move',uci:uci(m),next:p};memo.set(k,result);return result}
   if(exhausted)break
  }
  memo.set(k,null);return null
 }
 const proof=visit(maxOwnMoves,skewer.square)
 return{status:proof?'proved':exhausted?'budget-exhausted':'not-proved',nodes,maxOwnMoves,maxNodes,skewer,baseline,
  proofScope:'bounded-forcing-material-gain-or-mate-with-all-legal-opponent-replies',proofAgainstEveryDefense:false,...(proof?{proof}:{})}
}
export function verifyBishopSkewerGain(entry,result){
 try{
  const skewer=newBishopRookSkewer(entry)
  if(!skewer||result.status!=='proved'||result.maxOwnMoves!==2||JSON.stringify(skewer)!==JSON.stringify(result.skewer))return false
  const side=skewer.color,baseline=material(new Chess(entry.fenBefore),side),b=new Chess(entry.fenAfter),path=new Set()
  if(result.baseline!==baseline)return false
  let nodes=0
  const equalMoves=(a,c)=>JSON.stringify([...a].sort())===JSON.stringify([...c].sort())
  function verify(node,left){
   if(!node||path.has(node)||++nodes>100000)return false
   path.add(node)
   try{
    if(node.kind==='attacking-side-checkmate')return b.isCheckmate()&&b.turn()!==side&&node.minimumGain===material(b,side)-baseline
    if(b.isGameOver())return false
    const legal=b.moves({verbose:true})
    if(node.kind==='material-gain-stable-after-immediate-replies'){
     if(b.turn()===side||!equalMoves(node.replies,legal.map(uci)))return false
     let minimum=material(b,side)-baseline
     for(const m of legal){if(m.san.endsWith('#'))return false;b.move(m.san);minimum=Math.min(minimum,material(b,side)-baseline);b.undo()}
     return minimum>=value.p&&node.minimumGain===minimum
    }
    if(node.kind==='all-legal-opponent-moves'){
     if(b.turn()===side||!Array.isArray(node.branches)||!equalMoves(node.branches.map(r=>r.uci),legal.map(uci)))return false
     for(const branch of node.branches){play(b,branch.uci);const valid=verify(branch.next,left);b.undo();if(!valid)return false}
     return true
    }
    if(node.kind==='chosen-legal-forcing-move'){
     if(b.turn()!==side||left<1)return false
     play(b,node.uci);const valid=verify(node.next,left-1);b.undo();return valid
    }
    return false
   }finally{path.delete(node)}
  }
  return verify(result.proof,2)
 }catch{return false}
}
