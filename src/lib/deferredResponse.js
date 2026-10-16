import{Chess}from'chess.js'
import{SPECIAL_POLICY}from'./specialPolicy.js'
const uci=m=>m.from+m.to+(m.promotion??'')
const values={p:1,n:3,b:3,r:5,q:9,k:0}
const king=(b,color)=>b.board().flat().find(p=>p?.type==='k'&&p.color===color)?.square
function play(b,u){if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(u??''))throw Error('Invalid UCI');return b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})}
export function deferredForcingResponse(entry,roots,forcing){
 if(!forcing?.applicable||!['check','new-material-threat'].includes(forcing.kind)
  ||roots.status!=='available'||!roots.coherent||roots.coverage.source!=='completed-snapshot'
  ||roots.raw[0]?.mate!=null||entry.engine?.mate!=null
  ||entry.engine?.analysisMetadata?.searchMoves||roots.lines[0]?.uci!==entry.playedUci)return null
 try{
  const original=new Chess(entry.fenBefore),after=new Chess(entry.fenBefore),played=play(after,entry.playedUci)
  if(after.fen()!==entry.fenAfter)return null
  const target=forcing.target?after.get(forcing.target):null,enemy=after.turn(),checkedSquare=king(after,enemy)
  const requested=entry.engine?.analysisMetadata?.multiPv
  if(!Number.isSafeInteger(requested)||requested<2||roots.raw.length!==Math.min(requested,roots.coverage.legal)
   ||roots.raw.some(l=>l.bound||l.lowerbound||l.upperbound))return null
  for(const[index,line]of roots.lines.entries()){
   if(!index||line.score<SPECIAL_POLICY.good||roots.raw[index].mate!=null)continue
   const b=new Chess(original.fen()),continuation=[]
   for(const[position,event]of line.events.entries()){
    const from=event.uci.slice(0,2),to=event.uci.slice(2,4)
    if(position%2===0&&event.uci===entry.playedUci){
     if(position<2)break
     const mover=b.get(played.from)
     if(mover?.type!==played.piece||mover.color!==played.color)break
     continuation.push(play(b,event.uci).san)
     let matches=forcing.kind==='check'&&b.isCheck()&&king(b,enemy)===checkedSquare
     if(forcing.kind==='new-material-threat'&&!b.isCheck()&&target){
      const remaining=b.get(forcing.target),fields=b.fen().split(' ');fields[1]=played.color;fields[3]='-'
      if(remaining?.type===target.type&&remaining.color===target.color){
       const own=new Chess(fields.join(' ')),capture=own.moves({verbose:true}).find(m=>uci(m)===forcing.move&&m.captured===target.type)
       if(capture){own.move(capture.san);const recapture=own.moves({verbose:true}).some(m=>m.to===capture.to&&m.captured)
        matches=values[capture.captured]>values[capture.piece]||!recapture}
      }
     }
     if(matches)return{kind:'deferred-forcing-response',motif:forcing.kind,alternativeUci:line.uci,alternativeIndex:line.score,
      depth:line.depth,deferredPly:position+1,continuation,coverage:roots.coverage,proofAgainstEveryDefense:false}
     break
    }
    // The original piece must really be waiting, not moved back or replaced.
    if(from===played.from||to===played.from&&b.get(to)?.color===played.color)break
    continuation.push(play(b,event.uci).san)
   }
  }
  return null
 }catch{return null}
}
