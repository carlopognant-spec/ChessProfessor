import {Chess} from 'chess.js'

const names={p:'pedone',n:'cavallo',b:'alfiere',r:'torre',q:'donna',k:'re'}
const noun=type=>type==='b'?'l’alfiere':type==='r'||type==='q'?`la ${names[type]}`:`il ${names[type]}`
const indirect=type=>type==='b'?'all’alfiere':type==='r'||type==='q'?`alla ${names[type]}`:`al ${names[type]}`
const capital=text=>text[0].toUpperCase()+text.slice(1)
const join=items=>items.length<2?items[0]??'':items.slice(0,-1).join(', ')+' e '+items.at(-1)
const squares=Array.from({length:64},(_,i)=>String.fromCharCode(97+i%8)+(1+Math.floor(i/8)))
const center=['d4','e4','d5','e5','c4','f4','c5','f5']
const pieces=board=>board.board().flat().filter(Boolean)
const controls=(board,from,color)=>squares.filter(square=>board.attackers(square,color).includes(from))
const value={p:1,n:3,b:3,r:5,q:9,k:10}
const priority=piece=>value[piece.type]*10+Number(center.includes(piece.square))
const pawnFiles=(board,color)=>Array.from({length:8},(_,i)=>pieces(board).filter(piece=>piece.type==='p'&&piece.color===color&&piece.square[0]===String.fromCharCode(97+i)).length)
const isolated=(files,index)=>files[index]>0&&!(files[index-1]??0)&&!(files[index+1]??0)

// A newly exposed ray belongs to the piece that actually controls the target,
// not necessarily the piece that just moved. Geometric pressure is not a proof
// that a future capture is legal or profitable (a piece may itself be pinned).
export function uncoveredOpeningAttacks(before,after,color,exclude=[]){
  const result=[]
  for(const target of pieces(after).filter(piece=>piece.color!==color&&piece.type!=='k')){
    const old=new Set(before.attackers(target.square,color))
    for(const from of after.attackers(target.square,color)){
      const attacker=after.get(from),original=before.get(from)
      if(exclude.includes(from)||old.has(from)||original?.color!==color||original.type!==attacker.type)continue
      result.push({from,to:target.square,piece:attacker.type,target:target.type})
    }
  }
  return result.sort((a,b)=>value[b.target]-value[a.target])
}

// Position-specific explanations for a SINGLE played half-move. These are
// measured effects, kept distinct from individually written strategic notes.
export function openingMoveReview(beforeFen,san){
  const before=new Chess(beforeFen),after=new Chess(beforeFen),move=after.move(san)
  const enemy=move.color==='w'?'b':'w',mover=after.get(move.to)
  const oldControl=controls(before,move.from,move.color),newControl=controls(after,move.to,move.color)
  const capture=move.isCapture()||move.isEnPassant()
  const capturedSquare=capture?(move.isEnPassant()?move.to[0]+move.from[1]:move.to):null
  const facts=[]
  const add=(kind,text,detail={})=>facts.push({kind,text,...detail})
  const castled=move.isKingsideCastle()||move.isQueensideCastle()
  let summary
  if(castled){
    const rook=(move.isKingsideCastle()?'f':'d')+(move.color==='w'?'1':'8')
    summary=`L’arrocco porta il re in ${move.to} e la torre in ${rook}.`
    add('castle',summary,{from:move.from,to:move.to,rook})
  }else if(capture){
    summary=`${capital(noun(move.piece))} da ${move.from} cattura ${noun(move.captured)} in ${capturedSquare}${move.isEnPassant()?` en passant e raggiunge ${move.to}`:''}.`
    add('capture',summary,{from:move.from,to:move.to,captured:move.captured,capturedSquare})
  }else{
    summary=`${capital(noun(move.piece))} passa da ${move.from} a ${move.to}.`
  }
  if(move.promotion)add('promotion',`Il pedone viene promosso a ${names[move.promotion]} in ${move.to}.`,{to:move.to,piece:move.promotion})
  if(before.isCheck())add('answered-check',`La mossa risponde allo scacco: il re del ${move.color==='w'?'Bianco':'Nero'} non è più sotto attacco.`)
  if(after.isCheck()){
    const king=pieces(after).find(piece=>piece.color===enemy&&piece.type==='k')
    add('check',after.isCheckmate()?'È scacco matto: non restano risposte legali allo scacco.':'È scacco: l’avversario deve prima rispondere alla minaccia al re.',{to:king.square,from:after.attackers(king.square,move.color)})
  }
  const targets=pieces(after).filter(piece=>piece.color===enemy&&piece.type!=='k'&&newControl.includes(piece.square)).sort((a,b)=>priority(b)-priority(a))
  const fresh=targets.filter(piece=>!oldControl.includes(piece.square))
  if(fresh.length)add('attack',`Da ${move.to} ${noun(mover.type)} mette pressione ${join(fresh.slice(0,2).map(piece=>`${indirect(piece.type)} in ${piece.square}`))}.`,{from:move.to,targets:fresh.map(piece=>piece.square)})
  const discovered=uncoveredOpeningAttacks(before,after,move.color,[move.to])
  if(discovered.length){
    const first=discovered[0],same=discovered.filter(attack=>attack.from===first.from).slice(0,2)
    add('uncovered-attack',`Si libera anche la linea ${join(same.map(attack=>`${attack.from}–${attack.to}`))}: ${noun(first.piece)} in ${first.from} ora mette pressione ${join(same.map(attack=>`${indirect(attack.target)} in ${attack.to}`))}.`,{attacks:discovered})
  }
  const supports=pieces(after).filter(piece=>piece.color===move.color&&piece.square!==move.to&&newControl.includes(piece.square)&&!oldControl.includes(piece.square)&&before.attackers(piece.square,enemy).length).sort((a,b)=>priority(b)-priority(a))
  if(supports.length)add('defense',`Aggiunge un sostegno ${join(supports.slice(0,2).map(piece=>`${indirect(piece.type)} in ${piece.square}`))}, già sotto pressione avversaria.`,{from:move.to,targets:supports.map(piece=>piece.square)})
  const gained=center.filter(square=>newControl.includes(square)&&!oldControl.includes(square))
  if(gained.length&&!fresh.length&&!supports.length)add('central-control',`${capital(noun(mover.type))} aggiunge controllo su ${join(gained.slice(0,2))}.`,{from:move.to,targets:gained})
  const threatenedBefore=before.attackers(move.from,enemy),threatenedAfter=after.attackers(move.to,enemy)
  if(threatenedBefore.length&&!castled)add('relocation',threatenedAfter.length?`Lascia ${move.from}, ma in ${move.to} resta sulla linea di pressione avversaria.`:`Si sottrae alla pressione su ${move.from}; la nuova casa ${move.to} non è controllata da pezzi avversari.`,{from:move.from,to:move.to,attackersBefore:threatenedBefore,attackersAfter:threatenedAfter})
  for(const color of ['w','b']){
    const old=pawnFiles(before,color),next=pawnFiles(after,color),owner=color==='w'?'Bianco':'Nero'
    for(let i=0;i<8;i++){
      const file=String.fromCharCode(97+i)
      if(next[i]>=2&&old[i]<2)add('doubled-pawns',`Il ${owner} ha ora pedoni doppiati sulla colonna ${file}.`,{color,file})
      if(old[i]>=2&&next[i]===1)add('undoubled-pawns',`Al ${owner} resta un solo pedone sulla colonna ${file}: qui i pedoni non sono più doppiati.`,{color,file})
      if(isolated(next,i)&&!isolated(old,i))add('isolated-pawn',`${next[i]===1?'Il pedone':'I pedoni'} del ${owner} sulla colonna ${file} ${next[i]===1?'non ha':'non hanno'} pedoni amici sulle colonne vicine.`,{color,file})
      if(isolated(old,i)&&next[i]>0&&!isolated(next,i))add('isolation-resolved',`Il pedone del ${owner} sulla colonna ${file} ha ora un pedone amico su una colonna vicina: non è più isolato.`,{color,file})
    }
  }
  const whiteBefore=pawnFiles(before,'w'),blackBefore=pawnFiles(before,'b'),whiteAfter=pawnFiles(after,'w'),blackAfter=pawnFiles(after,'b')
  for(let i=0;i<8;i++){
    const file=String.fromCharCode(97+i),oldTotal=whiteBefore[i]+blackBefore[i],total=whiteAfter[i]+blackAfter[i]
    if(oldTotal&&total===0)add('open-file',`La colonna ${file} è ora aperta: non vi sono più pedoni di nessun colore.`,{file})
    else if(total>0){
      for(const color of ['w','b']){
        const old=color==='w'?whiteBefore:blackBefore,next=color==='w'?whiteAfter:blackAfter
        if(old[i]>0&&next[i]===0)add('semi-open-file',`La colonna ${file} diventa semiaperta per il ${color==='w'?'Bianco':'Nero'}: restano soltanto pedoni avversari.`,{color,file})
      }
    }
  }
  if(mover.type==='r'&&!castled){
    const file=move.to[0],i=file.charCodeAt(0)-97,own=move.color==='w'?whiteAfter:blackAfter,other=move.color==='w'?blackAfter:whiteAfter
    if(!own[i])add('rook-file',`La torre entra sulla colonna ${file}, ${other[i]?'semiaperta per il proprio colore':'aperta'}.`,{from:move.to,file,open:!other[i]})
    else add('rook-file',`Sulla colonna ${file} resta un pedone amico: la torre dovrà coordinarsi con la sua avanzata o con un cambio.`,{from:move.to,file,blocked:true})
  }
  if(move.piece==='p'){
    const released=[]
    for(const piece of pieces(after).filter(piece=>piece.color===move.color&&['b','q'].includes(piece.type))){
      const oldPiece=before.get(piece.square)
      if(oldPiece?.type!==piece.type||oldPiece.color!==piece.color)continue
      const was=controls(before,piece.square,piece.color),now=controls(after,piece.square,piece.color)
      const access=now.filter(square=>!was.includes(square)&&!after.get(square))
      if(access.length>=2)released.push({from:piece.square,piece:piece.type,targets:access})
    }
    if(released.length){
      const first=released.sort((a,b)=>Number(b.piece==='b')-Number(a.piece==='b'))[0]
      add('released-line',`Il movimento del pedone libera ${first.piece==='b'?'una diagonale':'una linea'} per ${noun(first.piece)} in ${first.from}, verso ${join(first.targets.slice(0,2))}.`,first)
    }
  }
  const oldRights=before.fen().split(' ')[2],rights=after.fen().split(' ')[2],ownRights=move.color==='w'?/[KQ]/:/[kq]/
  if(!castled&&ownRights.test(oldRights)&&!ownRights.test(rights))add('castling-rights',`Dopo questa mossa il re del ${move.color==='w'?'Bianco':'Nero'} non potrà più arroccare.`)
  if(!facts.length){
    const useful=newControl.filter(square=>!after.get(square)).sort((a,b)=>Math.abs(Number(a[1])-4.5)-Math.abs(Number(b[1])-4.5)).slice(0,2)
    if(useful.length)add('piece-control',`Da ${move.to} ${noun(mover.type)} controlla ${join(useful)}.`,{from:move.to,targets:useful})
    else{
      const friends=pieces(after).filter(piece=>piece.color===move.color&&piece.square!==move.to&&newControl.includes(piece.square)).slice(0,2)
      if(friends.length)add('piece-support',`Da ${move.to} ${noun(mover.type)} sostiene ${join(friends.map(piece=>`${noun(piece.type)} in ${piece.square}`))}.`,{from:move.to,targets:friends.map(piece=>piece.square)})
    }
  }
  const order=['answered-check','check','promotion','uncovered-attack','attack','defense','isolation-resolved','isolated-pawn','doubled-pawns','undoubled-pawns','open-file','semi-open-file','rook-file','central-control','released-line','relocation','castling-rights','piece-control','piece-support']
  const details=facts.filter(fact=>!['capture','castle'].includes(fact.kind)).sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)).slice(0,2)
  return {san:move.san,color:move.color,from:move.from,to:move.to,piece:mover.type,capturedSquare,
    before:before.fen(),after:after.fen(),summary,details,facts,check:after.isCheck()}
}

// The learner's move is followed only by the response that was actually played.
// In particular, Black's response is the NEXT White move, not the previous one.
export function openingTurnReview(moves,index,side){
  const board=new Chess();moves.slice(0,index).forEach(san=>board.move(san))
  if(!moves[index]||board.turn()!==side)throw Error('Invalid opening review turn')
  const played=openingMoveReview(board.fen(),moves[index])
  const reply=moves[index+1]?openingMoveReview(played.after,moves[index+1]):null
  return {index,side,played,reply,after:reply?.after??played.after}
}
