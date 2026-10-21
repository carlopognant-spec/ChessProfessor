import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {spawn} from 'node:child_process'
import {createInterface} from 'node:readline'
import {matchingOpeningInfo} from './opening-expansion-engine.mjs'

const hash=value=>createHash('sha256').update(value).digest('hex')
const encode=value=>JSON.stringify(value,null,2)+'\n'
const exists=async file=>fs.access(file).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error})
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
async function frozen(file,value){
  const text=encode(value)
  try{await fs.writeFile(file,text,{flag:'wx'})}
  catch(error){if(error.code!=='EEXIST')throw error;assert.equal(await fs.readFile(file,'utf8'),text,`Frozen file differs: ${file}`)}
}

export function parseOpeningSearch(lines,roots=[]){
  const bestmove=lines.findLast(line=>line.startsWith('bestmove '))?.split(' ')[1]
  assert(bestmove&&bestmove!=='(none)','Missing bestmove')
  if(roots.length)assert(roots.includes(bestmove),'Restricted root violated')
  const info=matchingOpeningInfo(lines,bestmove)
  if(!info)return {bestmove,needsConfirmation:true}
  const score=info.match(/ score (cp|mate) (-?\d+)/)
  assert(score,'Missing full score')
  const result={bestmove,searchmoves:roots,depth:Number(info.match(/depth (\d+)/)?.[1]),
    nodes:Number(info.match(/ nodes (\d+)/)?.[1]),cp:score[1]==='cp'?Number(score[2]):null,
    mate:score[1]==='mate'?Number(score[2]):null,pv:info.split(' pv ')[1].trim().split(/\s+/)}
  assert(result.depth>0&&result.nodes>0)
  return result
}

export async function createOpeningSession(executable,policy){
  const child=spawn(executable,[],{windowsHide:true,stdio:['pipe','pipe','pipe']})
  const reader=createInterface({input:child.stdout})
  let pending=null,failure=null
  const fail=error=>{failure=error;if(pending){clearTimeout(pending.timer);pending.reject(error);pending=null}}
  reader.on('line',line=>{if(pending){pending.lines.push(line);if(pending.until(line)){
    const current=pending;pending=null;clearTimeout(current.timer);current.resolve(current.lines)
  }}})
  child.on('error',fail);child.on('exit',code=>fail(Error(`Opening engine exited: ${code}`)))
  child.stderr.on('data',()=>{})
  function command(text,until){
    if(failure)return Promise.reject(failure)
    assert(!pending,'Concurrent UCI request')
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{fail(Error('Opening engine timeout'));child.kill()},policy.timeoutPerCommandMs)
      pending={resolve,reject,timer,lines:[],until};child.stdin.write(text+'\n')
    })
  }
  const close=()=>{if(pending)fail(Error('Opening engine closed'));reader.close();child.stdin.end('quit\n');child.kill()}
  try{
    const hello=await command('uci',line=>line==='uciok')
    const name=hello.find(line=>line.startsWith('id name '))?.slice(8)
    assert(/^Stockfish 16(?:\s|$)/.test(name??''),'Unexpected engine')
    await command(`setoption name Threads value ${policy.threads}\nsetoption name Hash value ${policy.hashMb}\nsetoption name MultiPV value ${policy.multiPV}\nisready`,line=>line==='readyok')
    return {name,close,async go(fen,nodes,roots){
      await command('ucinewgame\nsetoption name Clear Hash\nisready',line=>line==='readyok')
      return command(`position fen ${fen}\ngo nodes ${nodes}${roots.length?' searchmoves '+roots.join(' '):''}`,line=>line.startsWith('bestmove '))
    }}
  }catch(error){close();throw error}
}

// Append-only ledger: a persisted request consumes one go slot even on a crash.
export async function runFrozenOpeningJobs({directory,manifest,createSession}){
  await fs.mkdir(directory,{recursive:true})
  const lock=path.join(directory,'running.lock'),handle=await fs.open(lock,'wx')
  let engine
  try{
    await frozen(path.join(directory,'manifest.json'),manifest)
    const signature=hash(encode(manifest)),policy=manifest.policy
    const attemptsDirectory=path.join(directory,'attempts'),resultsDirectory=path.join(directory,'results')
    await fs.mkdir(attemptsDirectory,{recursive:true});await fs.mkdir(resultsDirectory,{recursive:true})
    const requests=(await fs.readdir(attemptsDirectory)).filter(name=>name.endsWith('.request.json')).sort()
    let consumed=requests.length
    assert(consumed<=policy.maximumGoCommands)
    for(const name of requests)assert.equal((await read(path.join(attemptsDirectory,name))).signature,signature)
    const results=[]
    for(let index=0;index<manifest.jobs.length;index++){
      const job=manifest.jobs[index],resultFile=path.join(resultsDirectory,`${index+1}.json`)
      if(await exists(resultFile)){
        const saved=await read(resultFile);assert.equal(saved.signature,signature);assert.equal(saved.jobId,job.id)
        assert.equal(saved.status,'complete','Previously failed job cannot be automatically retried')
        results.push(saved);continue
      }
      for(const name of requests)assert.notEqual((await read(path.join(attemptsDirectory,name))).jobId,job.id,'Interrupted job cannot be automatically retried')
      engine??=await createSession()
      async function search(roots,kind){
        assert(consumed<policy.maximumGoCommands,'Go budget exhausted')
        assert((consumed+1)*policy.nodesPerGo<=policy.maximumRequestedNodes,'Node budget exhausted')
        const number=String(++consumed).padStart(2,'0'),base=path.join(attemptsDirectory,number)
        const request={signature,jobId:job.id,kind,engine:engine.name,fen:job.fen,roots,
          nodesRequested:policy.nodesPerGo,command:`go nodes ${policy.nodesPerGo}${roots.length?' searchmoves '+roots.join(' '):''}`}
        await frozen(base+'.request.json',request)
        try{
          const lines=await engine.go(job.fen,policy.nodesPerGo,roots)
          const nodesActual=Math.max(0,...lines.map(line=>Number(line.match(/\bnodes (\d+)/)?.[1]??0)))
          await frozen(base+'.response.json',{signature,jobId:job.id,status:'complete',nodesActual,lines})
          return {...parseOpeningSearch(lines,roots),attempt:number}
        }catch(error){
          await frozen(base+'.failure.json',{signature,jobId:job.id,status:'failed',reason:error.message})
          throw error
        }
      }
      let result=await search(job.roots,'primary')
      const attemptIds=[result.attempt]
      if(result.needsConfirmation){
        result=await search([result.bestmove],'confirmation');attemptIds.push(result.attempt)
        assert(!result.needsConfirmation,'Confirmation did not produce a full matching PV')
      }
      const saved={signature,jobId:job.id,status:'complete',attemptIds,result}
      await frozen(resultFile,saved);results.push(saved)
    }
    return {signature,results,goCommands:consumed,nodesRequested:consumed*policy.nodesPerGo}
  }finally{engine?.close();await handle.close();await fs.unlink(lock)}
}
