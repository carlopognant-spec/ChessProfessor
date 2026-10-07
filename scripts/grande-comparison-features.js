import { Chess } from 'chess.js'
const value = { p:1, n:3, b:3, r:5, q:9, k:0 }
export function materialFor(game,side) { return game.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*value[p.type],0) }
export function moveFacts(fen, san, previousMove = null) {
  const game=new Chess(fen),side=game.turn(),inCheckBefore=game.isCheck(),before=materialFor(game,side)
  const move=game.move(san)
  const targets=game.board().flat().filter(p=>p&&p.color!==side&&game.attackers(p.square,side).includes(move.to)).map(p=>({square:p.square,type:p.type}))
  const majorTargets=targets.filter(p=>p.type!=='p')
  return { move,fenAfter:game.fen(),side,inCheckBefore,check:game.isCheck(),deliveredMate:game.isCheckmate(),capture:Boolean(move.captured),capturedType:move.captured??null,captureRookOrQueen:['r','q'].includes(move.captured),materialChange:materialFor(game,side)-before,
    recapture:Boolean(previousMove?.captured&&previousMove.color!==side&&move.captured&&move.to===previousMove.to),
    geometricDoubleAttack:majorTargets.length>=2,kingAndQueenAttack:majorTargets.some(p=>p.type==='k')&&majorTargets.some(p=>p.type==='q'),targets }
}
export function pvMaterial(fen,pv,side) {
  const game=new Chess(fen),initial=materialFor(game,side),san=[],deltas=[]
  for(const uci of pv??[]) {const move=game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});san.push(move.san);deltas.push(materialFor(game,side)-initial)}
  return {san,deltaAt4Ply:deltas.length>=4?deltas[3]:null,first8MaterialChanges:deltas.slice(0,8),endsInMate:game.isCheckmate()}
}
