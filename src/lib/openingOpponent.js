import {Chess} from 'chess.js'

const center=['d4','e4','d5','e5','c4','f4','c5','f5']
const squares=Array.from({length:64},(_,i)=>String.fromCharCode(97+i%8)+(1+Math.floor(i/8)))
const names={p:'pedone',n:'cavallo',b:'alfiere',r:'torre',q:'donna',k:'re'}
const noun=type=>type==='b'?'l’alfiere':type==='q'||type==='r'?`la ${names[type]}`:`il ${names[type]}`
const capital=text=>text[0].toUpperCase()+text.slice(1)
const controls=(board,from,color)=>squares.filter(square=>board.attackers(square,color).includes(from))
const list=items=>items.length<2?items[0]:items.slice(0,-1).join(', ')+' e '+items.at(-1)
const value={p:1,n:3,b:3,r:5,q:9,k:10}

// Describe geometry and visible changes, not an inferred intention, a material
// gain, or the legality of a future capture by a possibly pinned piece.
export function openingOpponent(beforeFen,san,responseSan){
  const before=new Chess(beforeFen),current=new Chess(beforeFen),move=current.move(san)
  // chess.js flags en passant separately from an ordinary capture.
  const capture=move.isCapture()||move.isEnPassant()
  const capturedSquare=capture?(move.isEnPassant()?move.to[0]+move.from[1]:move.to):null
  const player=current.turn(),piece=current.get(move.to)
  const controlledSquares=controls(current,move.to,move.color)
  const centralSquares=center.filter(square=>controlledSquares.includes(square))
  const attackedPieces=current.board().flat().filter(p=>p?.color===player&&p.type!=='k'&&controlledSquares.includes(p.square))
    .sort((a,b)=>value[b.type]-value[a.type]||Number(center.includes(b.square))-Number(center.includes(a.square)))
  const defendedPieces=current.board().flat().filter(p=>p?.color===move.color&&p.square!==move.to&&controlledSquares.includes(p.square))
  const defended=defendedPieces.filter(p=>center.includes(p.square)).slice(0,1)
  const empty=centralSquares.filter(square=>!current.get(square)).slice(0,2)
  const arrowTargets=[]
  const point=(targets,kind)=>targets.forEach(square=>arrowTargets.push({from:move.to,to:square,kind}))
  const clauses=[]
  if(empty.length){clauses.push(`controlla ${list(empty)}`);point(empty,'control')}
  if(attackedPieces.length){clauses.push(`attacca ${list(attackedPieces.slice(0,2).map(p=>`${noun(p.type)} in ${p.square}`))}`);point(attackedPieces.slice(0,2).map(p=>p.square),'attack')}
  if(defended.length){clauses.push(`sostiene ${list(defended.map(p=>`${noun(p.type)} in ${p.square}`))}`);point(defended.map(p=>p.square),'defense')}
  if(!clauses.length){
    const occupied=defendedPieces.slice(0,1)
    const free=controlledSquares.filter(square=>!current.get(square)).slice(0,2)
    if(free.length){clauses.push(`controlla ${list(free)}`);point(free,'control')}
    if(occupied.length){clauses.push(`sostiene ${noun(occupied[0].type)} in ${occupied[0].square}`);point([occupied[0].square],'defense')}
  }
  const color=move.color==='w'?'Bianco':'Nero'
  let text=`Il ${color} ha giocato ${move.san}.`
  if(move.isKingsideCastle()||move.isQueensideCastle()){
    arrowTargets.length=0
    const rank=move.color==='w'?'1':'8',rookSquare=(move.isKingsideCastle()?'f':'d')+rank
    text=`Il ${color} ha arroccato ${move.isKingsideCastle()?'corto':'lungo'}: il re è in ${move.to} e la torre è entrata in ${rookSquare}.`
  }else{
    if(capture){
      text+=` Ha catturato ${noun(move.captured)} in ${capturedSquare}${move.isEnPassant()?' en passant':''}.`
    }
    if(move.promotion)text+=` Il pedone è stato promosso a ${names[move.promotion]} in ${move.to}.`
    if(clauses.length)text+=` ${capital(noun(piece.type))} in ${move.to} ${list(clauses)}.`
  }
  if(current.isCheck()){
    text+=' Il tuo re è sotto scacco: devi prima rispondere a questa minaccia.'
    const king=current.board().flat().find(p=>p?.color===player&&p.type==='k')
    for(const from of current.attackers(king.square,move.color))arrowTargets.push({from,to:king.square,kind:'attack'})
  }

  let question=null,relatedSquares=[]
  if(responseSan){
    const responseBoard=new Chess(current.fen()),response=responseBoard.move(responseSan)
    const oldControl=controls(current,response.from,player),newControl=controls(responseBoard,response.to,player)
    relatedSquares=centralSquares.filter(square=>newControl.includes(square)&&!oldControl.includes(square)).slice(0,2)
    if(current.isCheck())question='Come rispondi allo scacco mantenendo i pezzi coordinati?'
    else if(!responseBoard.isCheck()&&relatedSquares.length){
      const support=relatedSquares.filter(square=>current.get(square)?.color===player)
      const contest=relatedSquares.filter(square=>!support.includes(square))
      if(support.length&&contest.length)question=`Come sostieni ${list(support)} e contendi ${list(contest)}?`
      else if(support.length)question=`Come rinforzi ${list(support)} contro questa pressione?`
      else question=`Come contendi ${list(contest)} al controllo avversario?`
    }
  }
  return {san:move.san,color:move.color,from:move.from,to:move.to,piece:piece.type,
    controlledSquares,centralSquares,attackedPieces,defendedPieces,relatedSquares,arrowTargets,
    captured:move.captured??null,capturedSquare,
    check:current.isCheck(),question,text,before:before.fen(),after:current.fen()}
}
