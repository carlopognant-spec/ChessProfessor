import {beforeAll,describe,it,expect} from 'vitest'
import {json,fileHash} from '../scripts/openings/common.mjs'
import {verifyReusedJob} from '../scripts/openings/artifacts.mjs'
import {expectedManifest} from '../scripts/openings-lot.mjs'

let plan,manifest,reference,job
beforeAll(async()=>{
  plan=await json('docs/data/opening-taimanov-be2-p022-plan.json')
  const directory=plan.plannedFiles.engineDirectory
  manifest=await json(directory+'/manifest.json');job=manifest.jobs[0]
  reference={jobId:job.id,directory,jobIndex:1,manifestSha256:await fileHash(directory+'/manifest.json')}
})

describe('explicit reuse of frozen opening evidence',()=>{
  it('replays the original transcript without changing its provenance or executing an engine',async()=>{
    const result=await verifyReusedJob(reference,job,plan.enginePlan)
    const saved=await json(reference.directory+'/results/1.json')
    expect(result.result).toEqual(saved.result)
    expect(result.sourceSignature).toBe(saved.signature)
    expect(result.sourceJobId).toBe(job.id)
    expect(result.inputFiles).toContain(reference.directory+'/attempts/01.response.json')
    expect(result.attempts).toHaveLength(1)
  })
  it('rejects changed full FEN counters, roots and target identity',async()=>{
    const fen=job.fen.split(' ');fen[4]=String(Number(fen[4])+1)
    await expect(verifyReusedJob(reference,{...job,fen:fen.join(' ')},plan.enginePlan)).rejects.toThrow('Reuse FEN differs')
    await expect(verifyReusedJob(reference,{...job,roots:['e1g1']},plan.enginePlan)).rejects.toThrow('Reuse roots differ')
    await expect(verifyReusedJob({...reference,jobId:'other'},job,plan.enginePlan)).rejects.toThrow('Reuse target job differs')
  })
  it('rejects a changed engine search policy, manifest signature or expected SAN answer',async()=>{
    await expect(verifyReusedJob(reference,job,{...plan.enginePlan,nodesPerGo:100000})).rejects.toThrow('Reuse policy differs')
    await expect(verifyReusedJob({...reference,manifestSha256:'wrong'},job,plan.enginePlan)).rejects.toThrow('Source manifest changed')
    await expect(verifyReusedJob(reference,{...job,expectedAnswer:'O-O'},plan.enginePlan)).rejects.toThrow()
  })
  it('allows a smaller new-search budget while binding all source evidence into the new manifest',async()=>{
    const policy={...plan.enginePlan,maximumGoCommands:72,maximumRequestedNodes:14400000}
    const result=await verifyReusedJob(reference,job,policy)
    expect(result.parsed.cp).toBe(242)
    const revised={...plan,enginePlan:policy,reuseEngineJobs:[reference],
      plannedFiles:{...plan.plannedFiles,engineDirectory:'.cache/opening-evidence-reuse-test'}}
    const m=await expectedManifest({plan:revised,jobs:manifest.jobs,
      config:{plan:'docs/data/opening-taimanov-be2-p022-plan.json',design:'docs/data/opening-taimanov-be2-p022-design-verification.json'}})
    expect(m.reuseEngineJobs).toEqual([reference])
    expect(m.inputHashes[reference.directory+'/manifest.json']).toBe(reference.manifestSha256)
    expect(m.inputHashes).toHaveProperty(reference.directory+'/results/1.json')
    expect(m.inputHashes).toHaveProperty(reference.directory+'/attempts/01.request.json')
  })
})
