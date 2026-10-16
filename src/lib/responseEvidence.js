// A necessary forcing event for the empirical response family; never a promotion by itself.
import {Chess} from 'chess.js'
const values={p:1,n:3,b:3,r:5,q:9,k:0}
const uci=m=>m.from+m.to+(m.promotion??'')
function moverBoard(board,side){
  if(board.turn()===side)return new Chess(board.fen())
  const fields=board.fen().split(' ');fields[1]=side;fields[3]='-'
  return new Chess(fields.join(' '))
}
export function assessForcingResponse(entry,roots){
  if(roots.status!=='available'||!roots.coherent||roots.coverage.source!=='completed-snapshot'
    ||roots.lines[0]?.uci!==entry.playedUci||!Number.isInteger(entry.engine?.analysisMetadata?.multiPv)
    ||entry.engine.analysisMetadata.multiPv<2||entry.engine.analysisMetadata.searchMoves
    ||roots.raw.length!==Math.min(entry.engine.analysisMetadata.multiPv,roots.coverage.legal)
    ||roots.raw.some(l=>l.bound||l.lowerbound||l.upperbound))return{applicable:false}
  return legalForcingConsequence(entry)
}
export function legalForcingConsequence(entry){
  try{
    const before=new Chess(entry.fenBefore),side=before.turn(),after=new Chess(entry.fenBefore)
    const played=after.move({from:entry.playedUci.slice(0,2),to:entry.playedUci.slice(2,4),promotion:entry.playedUci[4]})
    if(after.fen()!==entry.fenAfter)return{applicable:false}
    if(after.isCheck())return{applicable:true,kind:'check'}
    const own=moverBoard(after,side),moves=own.moves({verbose:true})
    // chess.js marks checkmate in the SAN of these already legal moves.
    const mating=moves.find(m=>m.san.endsWith('#'))
    if(mating)return{applicable:true,kind:'mate-threat',move:uci(mating)}
    const prior=before.moves({verbose:true}).filter(m=>m.captured)
    for(const m of moves.filter(m=>m.captured)){
      const originalFrom=m.from===played.to?played.from:m.from
      if(prior.some(p=>p.from===originalFrom&&p.to===m.to&&p.captured===m.captured))continue
      const taken=new Chess(own.fen());taken.move(m.san)
      const recapture=taken.moves({verbose:true}).some(reply=>reply.to===m.to&&reply.captured)
      if(values[m.captured]>values[m.piece]||!recapture)return{applicable:true,kind:'new-material-threat',move:uci(m),target:m.to}
    }
    return{applicable:true,kind:'no-forcing-event'}
  }catch{return{applicable:false}}
}
