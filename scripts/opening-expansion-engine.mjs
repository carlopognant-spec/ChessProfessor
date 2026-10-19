import {spawn} from 'node:child_process'
import {createInterface} from 'node:readline'

export const matchingOpeningInfo=(lines,bestmove)=>lines.filter(line=>line.startsWith('info depth ')&&line.includes(' pv ')
  &&!/lowerbound|upperbound/.test(line)&&line.split(' pv ')[1].trim().split(/\s+/)[0]===bestmove).at(-1)

export async function startOpeningEngine(executable){
  const child=spawn(executable,[],{windowsHide:true,stdio:['pipe','pipe','pipe']})
  let pending=null,failure=null
  const reader=createInterface({input:child.stdout})
  reader.on('line',line=>{
    if(!pending)return
    pending.lines.push(line)
    if(pending.until(line)){const current=pending;pending=null;clearTimeout(current.timer);current.resolve(current.lines)}
  })
  function fail(error){failure=error;if(pending){clearTimeout(pending.timer);pending.reject(error);pending=null}}
  child.on('error',fail)
  child.on('exit',code=>fail(Error(`Opening engine exited: ${code}`)))
  // Do not print environment or process stderr; expose a bounded task error.
  child.stderr.on('data',()=>{})
  function command(text,until){
    if(failure)return Promise.reject(failure)
    if(pending)return Promise.reject(Error('Concurrent UCI request'))
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{fail(Error('Opening engine timeout'));child.kill()},30000)
      pending={until,lines:[],resolve,reject,timer}
      child.stdin.write(text+'\n')
    })
  }
  const uci=await command('uci',line=>line==='uciok')
  const name=uci.find(line=>line.startsWith('id name '))?.slice(8)
  if(!/^Stockfish 16(?:\s|$)/.test(name??'')){child.kill();throw Error(`Expected native Stockfish 16; got ${name}`)}
  await command('setoption name Threads value 1\nsetoption name Hash value 32\nsetoption name MultiPV value 1\nisready',line=>line==='readyok')
  return {
    name,
    async analyze(fen,nodes=50000,searchmoves=[]){
      await command('ucinewgame\nsetoption name Clear Hash\nisready',line=>line==='readyok')
      const lines=await command(`position fen ${fen}\ngo nodes ${nodes}${searchmoves.length?' searchmoves '+searchmoves.join(' '):''}`,line=>line.startsWith('bestmove '))
      const bestmove=lines.at(-1).split(' ')[1]
      const info=matchingOpeningInfo(lines,bestmove)
      if(!info&&bestmove&&bestmove!=='(none)'&&!(searchmoves.length===1&&searchmoves[0]===bestmove)){
        const confirmed=await this.analyze(fen,nodes,[bestmove])
        return {...confirmed,selection:'confirmation-of-interrupted-search-bestmove'}
      }
      if(!info||!bestmove||bestmove==='(none)')throw Error('Missing full opening engine result')
      const score=info.match(/ score (cp|mate) (-?\d+)/)
      if(!score)throw Error('Missing engine score')
      if(searchmoves.length&&!searchmoves.includes(bestmove))throw Error('Engine violated restricted roots')
      return {bestmove,searchmoves,depth:Number(info.match(/depth (\d+)/)[1]),nodes:Number(info.match(/ nodes (\d+)/)?.[1]??0),
        cp:score[1]==='cp'?Number(score[2]):null,mate:score[1]==='mate'?Number(score[2]):null,
        pv:info.split(' pv ')[1].trim().split(/\s+/)}
    },
    close(){reader.close();child.stdin.end('quit\n');child.kill()},
  }
}
