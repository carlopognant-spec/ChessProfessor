import {Chess} from 'chess.js'
import {OPENING_LESSONS,italianOpeningName,openingFamily} from './openingLessons.js'

export const normalizeOpeningQuery = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const uciOf = m => m.from+m.to+(m.promotion??'')
export function prepareOpeningCatalog(entries){
  return entries.map(e=>{
    const family=openingFamily(e.name,e.eco).id
    return {...e,family,displayName:italianOpeningName(e.name),
    search:normalizeOpeningQuery([e.name,italianOpeningName(e.name),e.eco,...e.aliases,
      OPENING_LESSONS.find(l=>l.id===family)?.title,e.moves.join(' ')].join(' '))}
  })
}
export function linePositions(moves){
  const game=new Chess(),positions=[game.fen()],parsed=[]
  for(const san of moves){const move=game.move(san);parsed.push({san:move.san,uci:uciOf(move),color:move.color,promotion:move.promotion});positions.push(game.fen())}
  return{positions,parsed}
}
export function initialPracticeIndex(moves,side){
  return side==='b'&&moves.length?1:0
}
// An exercise checks the selected line, never the universal quality of a move.
export function practiceMove(moves,index,side,move){
  const {positions,parsed}=linePositions(moves)
  if(index>=moves.length)return{status:'complete',index}
  if(parsed[index].color!==side)return{status:'waiting',index}
  const board=new Chess(positions[index]);let played
  try{played=board.move(move)}catch{return{status:'illegal',index}}
  if(uciOf(played)!==parsed[index].uci)return{status:'different-line',index,expected:parsed[index].san,played:played.san}
  let next=index+1
  if(next<moves.length&&parsed[next].color!==side)next++
  return{status:next===moves.length?'complete':'correct',index:next,reply:parsed[index+1]?.color!==side?parsed[index+1]?.san:null}
}

export const OPENING_PROGRESS_KEY='chessprofessor.openings.v1'
export function validOpeningProgress(raw){
  const favorites=Array.isArray(raw?.favorites)?[...new Set(raw.favorites.filter(v=>typeof v==='string'&&v.length<100))].slice(0,15000):[]
  const sessions=Object.create(null)
  for(const [id,row]of Object.entries(raw?.sessions??{}).slice(0,15000)){
    if(['__proto__','constructor','prototype'].includes(id)||id.length>120||!row||!Number.isSafeInteger(row.completed)||row.completed<0)continue
    sessions[id]={completed:Math.min(row.completed,1000000),clean:Math.max(0,Math.min(Number.isSafeInteger(row.clean)?row.clean:0,row.completed)),lastPlayed:typeof row.lastPlayed==='string'?row.lastPlayed.slice(0,40):''}
  }
  return{version:1,favorites,sessions}
}
export function recordOpeningCompletion(progress,id,clean){
  const current=progress.sessions[id]??{completed:0,clean:0}
  return{...progress,sessions:{...progress.sessions,[id]:{completed:current.completed+1,clean:current.clean+Number(clean),lastPlayed:new Date().toISOString()}}}
}
