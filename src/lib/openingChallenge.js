import {Chess} from 'chess.js'

const names={p:'pedone',n:'cavallo',b:'alfiere',r:'torre',q:'donna',k:'re'}
const squares=Array.from({length:64},(_,i)=>String.fromCharCode(97+i%8)+(1+Math.floor(i/8)))
const central=['d4','e4','d5','e5','c4','f4','c5','f5']
const colorName=color=>color==='w'?'Bianco':'Nero'
const noun=piece=>piece==='b'?'l’alfiere':piece==='q'?'la donna':`il ${names[piece]}`
const capitalize=text=>text[0].toUpperCase()+text.slice(1)
const controlled=(board,from,color)=>squares.filter(s=>board.attackers(s,color).includes(from))

// These are verifiable move effects, not claims that the move is objectively best.
// A question names the goal; the moving piece and destination belong to the help.
export function openingChallenge(before,san){
  const after=new Chess(before.fen()),move=after.move(san),enemy=move.color==='w'?'b':'w'
  const previous=controlled(before,move.from,move.color),next=controlled(after,move.to,move.color)
  const targets=after.board().flat().filter(p=>p?.color===enemy&&p.type!=='k'&&next.includes(p.square))
  const fresh=targets.filter(p=>!previous.includes(p.square))
  const gained=central.filter(s=>next.includes(s)&&!previous.includes(s))
  const escapes=before.attackers(move.from,enemy).length>0
  const friend=after.board().flat().filter(p=>p?.color===move.color&&p.square!==move.to&&next.includes(p.square)&&!previous.includes(p.square))
  const pressured=friend.find(p=>before.attackers(p.square,enemy).length>0)
  let situation,question
  if(move.isKingsideCastle()||move.isQueensideCastle()){
    situation='La preparazione dei pezzi può trasformarsi in una posizione più coordinata.'
    question='Come migliori insieme la sicurezza e il collegamento dei pezzi?'
  }else if(after.isCheck()){
    situation='Il re avversario può essere coinvolto direttamente nella sequenza.'
    question='Come imponi una risposta immediata, mantenendo l’iniziativa?'
  }else if(move.isEnPassant()){
    situation='L’ultima spinta ha creato una possibilità che dura un solo turno.'
    question='Come cambi la struttura prima che questa possibilità scompaia?'
  }else if(move.isCapture()){
    situation=`C’è un contatto concreto con ${noun(move.captured)} avversari${move.captured==='q'?'a':'o'} in ${move.to}.`
    question=move.captured==='p'?'Quale cambio chiarisce la tensione e modifica le linee del centro?':`Come risolvi il confronto in ${move.to}, prima di riprendere il tuo piano?`
  }else if(escapes&&move.piece!=='p'){
    situation='Una minaccia concreta rende necessario riconsiderare il piano.'
    question=gained.length?`Come rispondi conservando presenza su ${gained.slice(0,2).join(' e ')}?`:'Come rispondi alla pressione senza rinunciare all’attività?'
  }else if(fresh.length){
    const target=fresh.sort((a,b)=>({q:9,r:5,b:3,n:3,p:1}[b.type]-{q:9,r:5,b:3,n:3,p:1}[a.type]))[0]
    situation=`${capitalize(noun(target.type))} avversari${target.type==='q'?'a':'o'} in ${target.square} può essere mess${target.type==='q'?'a':'o'} sotto pressione.`
    question=`Come crei una minaccia su ${target.square} continuando a coordinare il tuo gioco?`
  }else if(pressured){
    situation=`Il punto ${pressured.square} richiede sostegno contro la pressione avversaria.`
    question=`Come rinforzi ${pressured.square} senza lasciare i pezzi scollegati?`
  }else if(gained.length){
    situation=`La lotta per ${gained.slice(0,2).join(' e ')} può orientare il seguito.`
    question=`Come aumenti il controllo di ${gained.slice(0,2).join(' e ')} mantenendo un gioco coordinato?`
  }else if(move.piece==='p'){
    const side=move.to[0]<'d'?'di donna':move.to[0]>'e'?'di re':'centrale'
    situation=`La struttura ${side==='centrale'?'centrale':`sul lato ${side}`} può essere adattata ai prossimi movimenti dei pezzi.`
    question=`Come guadagni spazio controllando ${next.slice(0,2).join(' e ')}?`
  }else{
    const useful=next.filter(s=>Math.abs(Number(s[1])-4.5)<2).slice(0,2)
    situation=useful.length?`Le case ${useful.join(' e ')} offrono collegamenti utili per il seguito.`:'Prima di cercare una rottura, serve coordinare meglio i pezzi rimasti.'
    question=useful.length?`Quale manovra crea collegamenti verso ${useful.join(' e ')} e prepara il seguito?`:'Come dai ai pezzi un collegamento più utile con il centro?'
  }
  let effect
  if(move.isKingsideCastle()||move.isQueensideCastle())effect=`Il ${colorName(move.color)} arrocca ${move.isKingsideCastle()?'corto':'lungo'}, portando il re in ${move.to} e la torre sulla colonna ${move.isKingsideCastle()?'f':'d'}.`
  else if(move.isCapture())effect=`${move.san} cambia ${noun(move.captured)} in ${move.to}${move.isEnPassant()?' tramite la presa en passant':''}. Il ${colorName(move.color)} deve ora valutare le linee lasciate da questo cambio.`
  else if(escapes)effect=`${move.san} risponde alla pressione su ${move.from}, conservando ${noun(move.piece)} in una nuova posizione.`
  else if(move.piece==='p')effect=`${move.san} cambia la struttura: il pedone controlla ${next.join(' e ')}.`
  else{
    const home=(move.color==='w'?'1':'8')===move.from[1]
    effect=`${move.san} ${home?'mette in gioco':'riorganizza'} ${noun(move.piece)}${gained.length||fresh.length?'':`, con controllo su ${next.filter(s=>Math.abs(Number(s[1])-4.5)<2).slice(0,2).join(' e ')||'case vicine alla propria posizione'}`}.`
  }
  if(gained.length)effect+=` Aggiunge controllo su ${gained.slice(0,2).join(' e ')}.`
  if(fresh.length)effect+=` Il nuovo attacco riguarda ${fresh.map(p=>p.square).join(', ')}.`
  if(after.isCheck())effect+=' Lo scacco obbliga a una risposta al re.'
  return {situation,question,effect}
}

export function openingPawnChanges(before,after){
  const notes=[]
  for(const color of ['w','b']){
    const oldPawns=before.board().flat().filter(p=>p?.color===color&&p.type==='p')
    const pawns=after.board().flat().filter(p=>p?.color===color&&p.type==='p')
    const isolated=(pawn,list)=>!list.some(other=>Math.abs(other.square.charCodeAt(0)-pawn.square.charCodeAt(0))===1)
    const previous=new Set(oldPawns.filter(p=>isolated(p,oldPawns)).map(p=>p.square))
    const created=pawns.filter(p=>isolated(p,pawns)&&!previous.has(p.square))
    if(created.length)notes.push(`Il ${colorName(color)} ha ora ${created.length===1?'un pedone isolato':'pedoni isolati'} in ${created.map(p=>p.square).join(' e ')}: attività dei pezzi e difesa di quei punti vanno considerate insieme.`)
  }
  return notes.join(' ')
}
