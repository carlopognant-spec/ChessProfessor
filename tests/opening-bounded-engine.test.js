import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {describe,it,expect} from 'vitest'
import {parseOpeningSearch,runFrozenOpeningJobs} from '../scripts/opening-bounded-engine.mjs'

const policy={maximumGoCommands:2,nodesPerGo:200000,maximumRequestedNodes:400000}
const job={id:'sample',fen:'frozen-position',roots:[]}
const lines=(move='e2e4')=>[`info depth 10 score cp 25 nodes 200100 pv ${move} e7e5`,`bestmove ${move}`]
async function temporary(run){
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'opening-ledger-'))
  try{await run(directory)}finally{
    expect(path.dirname(path.resolve(directory))).toBe(path.resolve(os.tmpdir()))
    expect(path.basename(directory).startsWith('opening-ledger-')).toBe(true)
    await fs.rm(directory,{recursive:true,force:true})
  }
}
describe('bounded opening searches and crash-safe reuse',()=>{
  it('keeps the score attached to bestmove and rejects a bound as confirmation',()=>{
    expect(parseOpeningSearch([...lines(),'info depth 11 score cp 90 nodes 200200 pv d2d4'])).toMatchObject({bestmove:'e2e4',cp:25})
    expect(parseOpeningSearch(['info depth 10 score cp 25 lowerbound nodes 100 pv e2e4','bestmove e2e4'])).toMatchObject({needsConfirmation:true})
  })
  it('records confirmation separately and reuses both results without launching an engine',async()=>temporary(async directory=>{
    let calls=0
    const manifest={policy,jobs:[job]}
    const createSession=async()=>({name:'fake',close(){},async go(fen,nodes,roots){calls++;return roots.length?lines():['info depth 9 score cp 20 nodes 200000 pv d2d4','bestmove e2e4']}})
    const result=await runFrozenOpeningJobs({directory,manifest,createSession})
    expect(result.goCommands).toBe(2);expect(result.nodesRequested).toBe(400000)
    expect(result.results[0].attemptIds).toEqual(['01','02'])
    expect(JSON.parse(await fs.readFile(path.join(directory,'attempts/02.request.json'),'utf8')).roots).toEqual(['e2e4'])
    await runFrozenOpeningJobs({directory,manifest,createSession:()=>{throw Error('Must reuse')}})
    expect(calls).toBe(2)
    await expect(runFrozenOpeningJobs({directory,manifest:{...manifest,jobs:[{...job,fen:'changed'}]},createSession})).rejects.toThrow('Frozen file differs')
  }))
  it('consumes failed attempts and refuses a silent retry after interruption',async()=>temporary(async directory=>{
    let calls=0;const manifest={policy,jobs:[job]}
    const createSession=async()=>({name:'fake',close(){},async go(){calls++;throw Error('timeout')}})
    await expect(runFrozenOpeningJobs({directory,manifest,createSession})).rejects.toThrow('timeout')
    expect(JSON.parse(await fs.readFile(path.join(directory,'attempts/01.failure.json'),'utf8')).status).toBe('failed')
    await expect(runFrozenOpeningJobs({directory,manifest,createSession})).rejects.toThrow('Interrupted job')
    expect(calls).toBe(1)
  }))
  it('stops before issuing a go beyond the frozen total budget',async()=>temporary(async directory=>{
    let calls=0
    const createSession=async()=>({name:'fake',close(){},async go(){calls++;return lines()}})
    const manifest={policy:{...policy,maximumGoCommands:1,maximumRequestedNodes:200000},jobs:[job,{...job,id:'second'}]}
    await expect(runFrozenOpeningJobs({directory,manifest,createSession})).rejects.toThrow('Go budget exhausted')
    expect(calls).toBe(1)
    expect((await fs.readdir(path.join(directory,'attempts'))).filter(file=>file.endsWith('.request.json'))).toHaveLength(1)
  }))
})
