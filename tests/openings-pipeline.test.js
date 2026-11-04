import fs from 'node:fs/promises'
import {describe,it,expect,beforeAll,afterAll} from 'vitest'
import {loadLot,validateLot,exerciseEvidence,engineJobs,coverageIndex,replay,positionKey,
  resolve,write,fileHash,verifyHashes,hash,encode} from '../scripts/openings/common.mjs'
import {buildArtifacts,summarize,reportMarkdown} from '../scripts/openings/artifacts.mjs'
import {rankGroups} from '../scripts/openings-backlog.mjs'
import {selectChecks,qaIdentity,verifyAggregationEdits} from '../scripts/openings-qa.mjs'
import {checkDocuments} from '../scripts/openings-docs.mjs'
import {options,expectedManifest,executeLot} from '../scripts/openings-lot.mjs'

let legacy,current
const scratch=`.cache/opening-pipeline-tests/${process.pid}`
beforeAll(async()=>{
  legacy=await validateLot(await loadLot('sic-05'))
  current=await validateLot(await loadLot('sic-06'))
},30000)
afterAll(async()=>{
  // The fixed scratch target is confined by resolve(); never delete workspace inputs.
  await fs.rm(resolve(scratch),{recursive:true,force:true})
})

describe('shared opening pipeline',()=>{
  it('reconstructs all three SIC-05 artifacts byte for byte without engine execution',async()=>{
    const built=await buildArtifacts(legacy)
    expect(Object.keys(built.outputs)).toHaveLength(3)
    for(const [file,text] of Object.entries(built.outputs))expect(text,file).toBe(await fs.readFile(resolve(file),'utf8'))
    expect(built.proof.goCommands).toBe(8);expect(built.proof.continuationChecks).toHaveLength(3)
  },30000)
  it('derives twelve SIC-06 jobs from three exercises and four authored choices',()=>{
    expect(current.jobs).toEqual(current.design.engineJobs)
    expect(current.exercises.map(e=>e.legalImmediateReplies)).toEqual([31,40,42])
    expect(current.jobs.filter(j=>j.uses.includes('continuation-control'))).toHaveLength(4)
    expect(current.jobs.filter(j=>j.uses.includes('exercise-baseline'))).toHaveLength(3)
    expect(current.jobs.filter(j=>j.uses.includes('exercise-baseline')&&j.uses.includes('continuation-control'))).toHaveLength(2)
  })
  it('rejects illegal answers, false material expectations and missing authored indices',()=>{
    let spec=structuredClone(current.plan.courses[0]);spec.exercise.answer='a3'
    expect(()=>exerciseEvidence(spec,2)).toThrow()
    spec=structuredClone(current.plan.courses[1]);spec.exercise.expectedMinimumImmediateMaterialGain=3
    expect(()=>exerciseEvidence(spec,2)).toThrow()
    const plan=structuredClone(current.plan);plan.courses[1].authoredMoves.shift()
    expect(()=>engineJobs(plan,current.exercises)).toThrow()
  })
  it('uses first-four-field identity for coverage but retains distinct full engine FENs',()=>{
    const moves=current.plan.courses[1].moves,other='e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6'.split(' ')
    expect(positionKey(replay(moves))).toBe(positionKey(replay(other)))
    expect(replay(moves).fen()).not.toBe(replay(other).fen())
    const scope={records:[{id:'canonical',moves:other.join(' ')}],positions:[{id:'p',position:positionKey(replay(other)),recordIds:['canonical']}]}
    expect(coverageIndex([{moves}],scope).coverage).toEqual({exact:0,'transposition-only':1,absent:0})
    expect(coverageIndex([{moves},{moves:other}],scope).coverage).toEqual({exact:1,'transposition-only':0,absent:0})
  })
  it('reports the additional transposition without presenting projection as publication',async()=>{
    const r=await summarize(current,{projection:true})
    expect(r.baselineCourses).toBe(290);expect(r.projectedCourses).toBe(293)
    expect(r.status).toBe('projection-not-publication');expect(r.engine).toBeNull()
    expect(r.projectedCoverage).toEqual({exact:1956,'transposition-only':202,absent:10164})
    expect([r.newExactPositions,r.newTransposedPositions]).toEqual([4,1])
    expect(reportMarkdown(r)).toContain('projection-not-publication')
    const uninstalled={...current,plan:structuredClone(current.plan)}
    uninstalled.plan.courses[0].id='pipeline-test:uninstalled'
    await expect(summarize(uninstalled)).rejects.toThrow('not integrated')
  },30000)
  it('keeps collection explicit and rejects unknown CLI arguments',()=>{
    expect(options([]).command).toBe('status')
    expect(options(['verify']).command).toBe('verify')
    expect(()=>options(['verify','--engine'])).toThrow()
    expect(()=>options(['collect','--check'])).toThrow()
    expect(()=>options(['build','--projection'])).toThrow()
  })
  it('binds immutable tooling copies without freezing the whole future lot registry',async()=>{
    const m=await expectedManifest(current)
    expect(m.toolingSources).toHaveLength(3)
    expect(m.inputHashes).not.toHaveProperty('docs/data/opening-pipeline/lots.json')
    for(const row of m.toolingSources){
      expect(m.inputHashes[row.snapshot]).toBe(row.sha256)
      expect(hash(await fs.readFile(resolve(row.source)))).toBe(row.sha256)
    }
    expect(m.jobs).toHaveLength(12)
  })
  it('keeps status read-only and prevents preparation of a historical ledger',async()=>{
    const attempts=current.plan.plannedFiles.engineDirectory+'/attempts'
    const before=await fs.readdir(resolve(attempts)).catch(e=>{if(e.code==='ENOENT')return [];throw e})
    const status=await executeLot({command:'status',lot:'sic-06'})
    expect(status.readOnly).toBe(true)
    expect(status.engine.requests).toBe(before.filter(f=>f.endsWith('.request.json')).length)
    await expect(executeLot({command:'prepare',lot:'sic-05'})).rejects.toThrow('Historical ledger is read-only')
  },30000)
  it('rejects changed input hashes without refreshing the baseline',async()=>{
    const file=scratch+'/frozen.txt';await write(file,'before')
    const expected={[file]:await fileHash(file)};await verifyHashes(expected)
    await write(file,'after');await expect(verifyHashes(expected)).rejects.toThrow('Input changed')
  })
  it('excludes environment files and paths outside the workspace',()=>{
    for(const f of ['.env','src/.env.local','../outside.json'])expect(()=>resolve(f)).toThrow()
    expect(resolve('docs/data/opening-pipeline/lots.json')).toContain('opening-pipeline')
  })
  it('ranks marginal unique positions without counting alias overlap twice',()=>{
    const records=[
      {id:'a1',groupId:'p1',applicationFamily:'f',moves:'e4 e5 Nf3'},
      {id:'a2',groupId:'p2',applicationFamily:'f',moves:'e4 e5 Nc3'},
      {id:'b1',groupId:'p1',applicationFamily:'f',moves:'e4 c5 Nf3'},
      {id:'b2',groupId:'p3',applicationFamily:'f',moves:'e4 c5 Nc3'}]
    const index={states:['p1','p2','p3'].map(id=>({id,state:'absent'})),orders:new Set(['e4'])}
    const r=rankGroups({records},index,{limit:2})
    expect(r.additionalUniquePositions).toBe(3)
    expect(r.candidates.map(c=>c.additionalUniquePositions)).toEqual([2,1])
    expect(r.candidates.reduce((n,c)=>n+c.sourcePositions,0)).toBe(4)
  })
  it('selects focused tooling checks and falls back to full for unknown/runtime paths',()=>{
    expect(selectChecks(['scripts/openings/common.mjs']).mode).toBe('tooling')
    expect(selectChecks(['docs/OPENING-PIPELINE.md']).mode).toBe('documents')
    for(const p of ['src/lib/openingCurriculum.js','new-unknown-file.js','package.json'])expect(selectChecks([p]).mode).toBe('full')
    expect(selectChecks(['src/data/openingExampleCourses.js']).mode).toBe('full')
    expect(selectChecks(['scripts/openings/common.mjs'],{forceFull:true}).steps.map(s=>s.id)).toEqual(['tests','build','browser'])
  })
  it('invalidates cached QA for changed inputs or command selection',()=>{
    const p=selectChecks(['scripts/openings/common.mjs']),a=qaIdentity(p,{'src/a.js':'one'})
    expect(a).toBe(qaIdentity(p,{'src/a.js':'one'}))
    expect(a).not.toBe(qaIdentity(p,{'src/a.js':'two'}))
    expect(a).not.toBe(qaIdentity({...p,steps:[]},{'src/a.js':'one'}))
  })
  it('allows focused data QA only when reversing imports restores the exact baseline',async()=>{
    const active=await loadLot()
    const files=await verifyAggregationEdits(active.config)
    expect(files.sort()).toEqual(['src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js'].sort())
    expect(selectChecks(files,{lot:active.config,verifiedAggregations:files}).mode).toBe('content')
    expect(selectChecks(files,{lot:active.config}).mode).toBe('full')
  })
  it('checks UTF-8, JSON syntax and real local links',async()=>{
    await write(scratch+'/target.json',encode({ok:true}))
    await write(scratch+'/valid.md','[dati](target.json)\n')
    expect((await checkDocuments([scratch+'/valid.md',scratch+'/target.json'])).localLinks).toBe(1)
    await write(scratch+'/invalid.md','[dati](missing.json)\n')
    await expect(checkDocuments([scratch+'/invalid.md'])).rejects.toThrow('Missing local link')
    await fs.writeFile(resolve(scratch+'/bad.md'),Buffer.from([0xc3,0x28]))
    await expect(checkDocuments([scratch+'/bad.md'])).rejects.toThrow()
  })
})
