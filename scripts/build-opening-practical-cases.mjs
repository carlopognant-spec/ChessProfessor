import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import previous from '../src/data/openingPracticalCases.js'
import {startOpeningEngine} from './opening-expansion-engine.mjs'

const executable='tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe'
const engineHash=createHash('sha256').update(await fs.readFile(executable)).digest('hex')
const engine=await startOpeningEngine(executable)
const value={p:1,n:3,b:3,r:5,q:9,k:0},uci=move=>move.from+move.to+(move.promotion??'')
const material=(board,side)=>board.board().flat().filter(Boolean).reduce((sum,piece)=>sum+(piece.color===side?1:-1)*value[piece.type],0)
const entries=[],evidence=[],uncovered=[]
const policy={engine:engine.name,engineHash,nodes:200000,threads:1,hashMb:32,minimumCpChange:200,minimumImmediateMaterial:2,kind:'constructed-deviation-v1'}
const analyses=new Map()
async function analyze(fen){
  if(!analyses.has(fen))analyses.set(fen,await engine.analyze(fen,policy.nodes))
  return analyses.get(fen)
}
let oldEvidence=[]
try{oldEvidence=JSON.parse(await fs.readFile('docs/data/opening-practical-verification.json','utf8')).evidence}catch(error){if(error.code!=='ENOENT')throw error}
async function save(){
  await fs.mkdir('docs/data',{recursive:true})
  const methods={'constructed-deviation-v1':'Material gain verified after every legal immediate opponent reply'}
  await fs.writeFile('src/data/openingPracticalCases.js','// Constructed legal deviations, not frequency claims or historical games.\nexport default '+JSON.stringify({schema:1,policy,methods,entries,uncovered},null,2)+'\n')
  await fs.writeFile('docs/data/opening-practical-verification.json',JSON.stringify({schema:1,policy,evidence,uncovered},null,2)+'\n')
}
try{
  for(const course of ALL_OPENING_JOURNEYS){
    const signature=createHash('sha256').update(JSON.stringify({id:course.id,moves:course.moves,policy})).digest('hex')
    const old=previous.entries.find(item=>item.signature===signature),proof=old&&oldEvidence.find(item=>item.id===old.id)
    if(old&&proof){entries.push(old);evidence.push(proof);continue}
    let found=false
    const start=Math.min(Math.max(course.expansion?.sourceSeedPlies??8,6),20)
    for(let index=start;index<Math.min(course.moves.length-1,28)&&!found;index++){
      const board=new Chess();course.moves.slice(0,index).forEach(san=>board.move(san))
      const before=board.fen(),student=board.turn()==='w'?'b':'w',initial=material(board,student)
      const candidates=[]
      for(const mistake of board.moves({verbose:true})){
        if(value[mistake.captured]>=3)continue
        board.move(mistake)
        const captures=board.moves({verbose:true}).filter(reply=>value[reply.captured]>=3)
        if(captures.length){
          const ignored=captures.filter(reply=>reply.to!==mistake.to)
          candidates.push({mistake,priority:(ignored.length?0:20)+(mistake.piece==='q'?10:0)+Math.min(...captures.map(reply=>value[reply.captured]))})
        }
        board.undo()
      }
      if(!candidates.length)continue
      const baseline=await analyze(before)
      if(baseline.cp===null)continue
      for(const {mistake} of candidates.sort((a,b)=>a.priority-b.priority).slice(0,12)){
        board.move(mistake)
        const after=board.fen(),search=await analyze(after)
        if(search.cp===null||search.cp+baseline.cp<policy.minimumCpChange){board.undo();continue}
        const answer=board.move({from:search.bestmove.slice(0,2),to:search.bestmove.slice(2,4),promotion:search.bestmove[4]})
        if(value[answer.captured]<3||!answer.captured){board.undo();board.undo();continue}
        const answerFen=board.fen()
        let minimum=material(board,student)-initial
        for(const reply of board.moves({verbose:true})){
          board.move(reply);minimum=Math.min(minimum,board.isCheckmate()?-Infinity:material(board,student)-initial);board.undo()
        }
        if(minimum<policy.minimumImmediateMaterial){board.undo();board.undo();continue}
        const prevention=new Chess(before).move({from:baseline.bestmove.slice(0,2),to:baseline.bestmove.slice(2,4),promotion:baseline.bestmove[4]}).san
        const name={n:'cavallo',b:'alfiere',r:'torre',q:'donna'}[answer.captured]
        const item={id:`practice:${course.id}`,family:course.family,courseId:course.id,title:`${course.title}: una minaccia trascurata`,
          moves:board.history(),startIndex:index+1,exerciseSide:student,variant:true,practice:true,signature,
          contrast:'Una deviazione costruita per allenare il riconoscimento dei bersagli. Non è presentata come un errore frequente o una partita storica.',
          whitePlan:course.whitePlan,blackPlan:course.blackPlan,
          prevention:`Prima della deviazione, ${prevention} è la risposta proposta dall’analisi di controllo. Confrontala con ${mistake.san}: quali bersagli restano protetti?`,
          explanation:`La risposta sfrutta ${name==='alfiere'?'l’alfiere':name==='donna'?'la donna':`il ${name}`} esposto in ${answer.to}. Prima di scegliere un piano, controlla catture, scacchi e difese dei pezzi.`,
          kind:policy.kind}
        entries.push(item);evidence.push({id:item.id,signature,before,mistake:mistake.san,after,answer:answer.san,answerFen,
          baseline,search,minimumImmediateMaterialGain:minimum,legalImmediateReplies:board.moves().length})
        found=true;break
      }
    }
    if(!found)uncovered.push(course.id)
    if((entries.length+uncovered.length)%10===0){await save();console.log(`${entries.length} practical cases; ${uncovered.length} uncovered; checkpoint saved`)}
  }
  await save();console.log(JSON.stringify({cases:entries.length,uncovered,policy},null,2))
}finally{engine.close()}
