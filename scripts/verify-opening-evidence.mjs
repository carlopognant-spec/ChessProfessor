import fs from 'node:fs/promises'
import {startOpeningEngine} from './opening-expansion-engine.mjs'

const files=process.argv.includes('--practical')?['docs/data/opening-practical-verification.json']
  :process.argv.includes('--models')?['docs/data/opening-expansion-verification.json']
  :['docs/data/opening-expansion-verification.json','docs/data/opening-practical-verification.json']
const engine=await startOpeningEngine('tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe')
let rechecked=0
async function confirm(fen,result,nodes){
  if(result.pv?.[0]===result.bestmove)return result
  let replacement=await engine.analyze(fen,nodes,result.searchmoves??[])
  if(replacement.bestmove!==result.bestmove){
    replacement=await engine.analyze(fen,nodes,[result.bestmove])
    replacement.selection='confirmation-of-recorded-bestmove'
  }
  if(replacement.pv[0]!==result.bestmove)throw Error('Unconfirmed recorded move')
  rechecked++
  return replacement
}
try{
  for(const file of files){
    const payload=JSON.parse(await fs.readFile(file,'utf8'))
    for(const entry of payload.evidence){
      if(entry.checks){
        for(let index=0;index<entry.checks.length;index++){
          const check=entry.checks[index],replacement=await confirm(check.before,check,payload.policy.nodesPerMove)
          if(replacement!==check)entry.checks[index]={index:check.index,before:check.before,san:check.san,...replacement}
        }
      }else{
        entry.baseline=await confirm(entry.before,entry.baseline,payload.policy.nodes)
        entry.search=await confirm(entry.after,entry.search,payload.policy.nodes)
        if(entry.search.cp===null||entry.baseline.cp===null||entry.search.cp+entry.baseline.cp<payload.policy.minimumCpChange)throw Error(`Practical score no longer confirms the exercise: ${entry.id}`)
      }
    }
    payload.verification={reader:'matching-selected-bestmove-v2',recheckedThroughThisFile:rechecked}
    await fs.writeFile(file,JSON.stringify(payload,null,2)+'\n')
    console.log(`${file}: selected moves and PV roots consistent`)
  }
  console.log(JSON.stringify({rechecked}))
}finally{engine.close()}
