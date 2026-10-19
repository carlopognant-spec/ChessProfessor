import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {OPENING_EXPANSION_PLAN} from '../src/lib/openingExpansionPlan.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'
import {startOpeningEngine} from './opening-expansion-engine.mjs'

const target='src/data/openingExpansion.js'
const sourceText=await fs.readFile('src/data/openingCatalog.json','utf8'),catalog=JSON.parse(sourceText)
const existing=ALL_OPENING_JOURNEYS.filter(course=>!course.expansion)
const executable='tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe'
const engineHash=createHash('sha256').update(await fs.readFile(executable)).digest('hex')
const sourceHash=createHash('sha256').update(sourceText).digest('hex')
const key=board=>board.fen().split(' ').slice(0,4).join(' ')
const boardOf=moves=>{const board=new Chess();for(const san of moves)board.move(san);return board}
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const previous=(await import('../src/data/openingExpansion.js')).default
let previousEvidence=previous.evidence??[]
try{previousEvidence=JSON.parse(await fs.readFile('docs/data/opening-expansion-verification.json','utf8')).evidence}catch(error){if(error.code!=='ENOENT')throw error}
const entries=[],evidence=[],families=[...new Set(OPENING_EXPANSION_PLAN.map(row=>row.family))]
const engine=await startOpeningEngine(executable)
const policy={engine:engine.name,engineHash,threads:1,hashMb:32,nodesPerMove:200000,clearHash:true,targetPlies:32,
  sourceExtension:'prefer-documented-continuation-up-to-24-plies',repetitionPolicy:'exclude-immediate-draw-when-alternatives-exist'}
async function save(){
  const source={url:catalog.source,revision:catalog.revision,sha256:sourceHash,license:catalog.license}
  const payload={schema:1,source,policy,entries}
  await fs.mkdir('docs/data',{recursive:true})
  await fs.writeFile('docs/data/opening-expansion-verification.json',JSON.stringify({schema:1,source,policy,evidence},null,2)+'\n')
  await fs.writeFile(target,'// Generated offline. Named source prefix + explicitly separate model continuation.\nexport default '+JSON.stringify(payload,null,2)+'\n')
}
try{
  for(const family of families){
    const planned=OPENING_EXPANSION_PLAN.filter(row=>row.family===family)
    for(const row of planned){
      if(existing.some(course=>course.id===row.id))continue
      const ready=previous.entries?.find(course=>course.id===row.id&&course.expansion.signature===hash({row,sourceId:course.expansion.sourceId,sourceHash,policy}))
      const readyEvidence=ready&&previousEvidence.find(item=>item.id===row.id)
      if(ready&&readyEvidence){boardOf(ready.moves);entries.push(ready);evidence.push(readyEvidence);continue}
      const board=new Chess();board.loadPgn(row.pgn)
      const seed=board.history(),documented=new Chess();documented.loadPgn(row.sourcePgn)
      const published=documented.history()
      if(!published.every((san,i)=>seed[i]===san))throw Error(`Invalid documentary boundary: ${row.id}`)
      let source=catalog.entries.find(entry=>published.every((san,i)=>entry.moves[i]===san)),transposition=false
      if(!source){
        const sourcePosition=key(documented)
        source=catalog.entries.find(entry=>entry.moves.length===published.length&&key(boardOf(entry.moves))===sourcePosition)
        transposition=Boolean(source)
      }
      if(!source)throw Error(`No named source binding: ${row.id}`)
      // Prefer an actual published continuation to inventing a theoretical tail.
      // The source position may have been reached through a transposition.
      const rootSource=source,rootPrefix=rootSource.moves.slice(0,published.length)
      if(seed.length===published.length){
        const candidates=catalog.entries.filter(entry=>entry.moves.length>published.length&&entry.moves.length<=24&&rootPrefix.every((san,i)=>entry.moves[i]===san))
          .sort((a,b)=>b.moves.length-a.moves.length||Number(/main line|classical/i.test(b.name))-Number(/main line|classical/i.test(a.name)))
        for(const candidate of candidates.slice(0,4)){
          const endpoint=boardOf([...seed,...candidate.moves.slice(published.length)])
          if(endpoint.isGameOver())continue
          const check=await engine.analyze(endpoint.fen(),policy.nodesPerMove)
          if(check.cp===null||Math.abs(check.cp)>350)continue
          source=candidate
          for(const san of candidate.moves.slice(published.length))board.move(san)
          break
        }
      }
      const documentedPlies=source===rootSource?published.length:source.moves.length
      const modelStart=board.history().length
      const signature=hash({row,sourceId:source.id,sourceHash,policy})
      const cached=previous.entries?.find(course=>course.id===row.id&&course.expansion.signature===signature)
      const cachedEvidence=previousEvidence.find(item=>item.id===row.id)
      if(cached&&cachedEvidence){
        boardOf(cached.moves)
        entries.push(cached);evidence.push(cachedEvidence);continue
      }
      const checks=[]
      while(board.history().length<policy.targetPlies){
        if(board.isGameOver())throw Error(`Terminal model before middlegame: ${row.id}`)
        const before=board.fen()
        let result=await engine.analyze(before,policy.nodesPerMove)
        let move=board.move({from:result.bestmove.slice(0,2),to:result.bestmove.slice(2,4),promotion:result.bestmove[4]})
        if(board.isDraw()){
          board.undo()
          const allowed=board.moves({verbose:true}).filter(candidate=>{
            board.move(candidate);const draw=board.isDraw();board.undo();return !draw
          }).map(candidate=>candidate.from+candidate.to+(candidate.promotion??''))
          if(!allowed.length)throw Error(`No nonterminal model continuation: ${row.id}`)
          result=await engine.analyze(before,policy.nodesPerMove,allowed)
          move=board.move({from:result.bestmove.slice(0,2),to:result.bestmove.slice(2,4),promotion:result.bestmove[4]})
        }
        checks.push({index:board.history().length-1,before,san:move.san,...result})
      }
      if(board.isGameOver())throw Error(`Terminal model endpoint: ${row.id}`)
      const course={id:row.id,family,title:row.title,moves:board.history(),contrast:row.focus,
        whitePlan:row.whitePlan,blackPlan:row.blackPlan,variant:true,
        expansion:{signature,sourceId:source.id,sourceName:source.name,sourceEco:source.eco,publishedPlies:published.length,
          seedPlies:modelStart,sourceSeedPlies:published.length,transposition,kind:'documented-prefix-and-model'},
        editorialNotes:{[Math.floor((seed.length-1)/2)*2]:row.focus}}
      if([...existing,...entries].some(other=>other.family===family&&other.moves.join(' ')===course.moves.join(' ')))throw Error(`Duplicate course: ${row.id}`)
      course.expansion.publishedPlies=documentedPlies
      entries.push(course);evidence.push({id:row.id,sourcePosition:key(boardOf(course.moves.slice(0,documentedPlies))),endpoint:board.fen(),checks})
    }
    await save()
    console.log(`${family}: ${entries.filter(course=>course.family===family).length} new courses; checkpoint saved`)
  }
  if(families.length!==37)throw Error('Expansion does not cover all 37 families')
  console.log(JSON.stringify({newCourses:entries.length,totalCourses:existing.length+entries.length,families:families.length,policy},null,2))
}finally{engine.close()}
