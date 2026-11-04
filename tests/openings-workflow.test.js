import {beforeAll,describe,it,expect} from 'vitest'
import fs from 'node:fs/promises'
import {json,runtime,hash,encode,exists,resolve} from '../scripts/openings/common.mjs'
import {makeBrief,saveBrief,history,inspect,page,sourceRows} from '../scripts/openings/context.mjs'
import {draftRoutes,analyzePlan,training} from '../scripts/openings/planning.mjs'
import {options,execute} from '../scripts/openings-workflow.mjs'
import {selectChecks,fingerprintFiles} from '../scripts/openings-qa.mjs'

let plan,design,scope,baseline,analysis,engineBefore
async function engineState(){return {prepared:await exists(plan.plannedFiles.engineDirectory+'/manifest.json'),
  requests:(await fs.readdir(resolve(plan.plannedFiles.engineDirectory+'/attempts')).catch(e=>{if(e.code==='ENOENT')return [];throw e})).filter(f=>f.endsWith('.request.json')).sort()}}
beforeAll(async()=>{
  plan=await json('docs/data/opening-taimanov-be2-p022-plan.json')
  design=await json('docs/data/opening-taimanov-be2-p022-design-verification.json')
  scope=await json('docs/data/opening-scope-audit.json');baseline=design.baseline.courses
  analysis=analyzePlan(plan,baseline,scope)
  engineBefore=await engineState()
},30000)
describe('opening workflow with bounded context',()=>{
  it('selects the new tooling tests and fingerprints project instructions for document checks',async()=>{
    const p=selectChecks(['scripts/openings-workflow.mjs','tests/openings-workflow.test.js','AGENTS.md','.agents/skills/opening-workflow/SKILL.md'])
    expect(p.mode).toBe('tooling');expect(p.steps[0].args).toContain('tests/openings-workflow.test.js')
    expect(p.steps.find(s=>s.id==='documents').args).toContain('.agents/skills/opening-workflow/SKILL.md')
    const files=await fingerprintFiles({documents:true})
    expect(files).toContain('AGENTS.md');expect(files).toContain('.agents/skills/opening-workflow/SKILL.md')
  })
  it('reproduces the frozen design jobs, all exercise replies and coverage without engine searches',()=>{
    expect(analysis.engineJobs).toEqual(design.engineJobs)
    expect(analysis.exercises.map(e=>e.replies)).toEqual(design.exercises.map(e=>e.replies))
    expect(analysis.coverage.projected).toEqual(design.coverage.projected)
    expect(analysis.summary).toMatchObject({courses:9,authoredPlies:14,exerciseReplies:341,transitions:90,browserPairs:9,jobs:37,newExactPositions:24,newTransposedPositions:1,engineSearchesExecuted:0})
    expect(analysis.navigation.browserPairs).toEqual(design.navigation.browserPairs)
  })
  it('rejects false provenance, false reply counts and incomplete search budgets',()=>{
    let p=structuredClone(plan);p.courses[0].sourceRecords[0].positionId='missing'
    expect(()=>analyzePlan(p,baseline,scope)).toThrow()
    p=structuredClone(plan);p.courses[0].exercise.expectedLegalImmediateReplies--
    expect(()=>analyzePlan(p,baseline,scope)).toThrow()
    p=structuredClone(plan);p.enginePlan.maximumRequestedNodes--
    expect(()=>analyzePlan(p,baseline,scope)).toThrow()
  },30000)
  it('finds empty learner checkpoints before continuations are authored',()=>{
    const d=draftRoutes(scope,baseline,plan.sourceSubtreePrefixes[0])
    expect([d.records,d.sourcePositions,d.leafOrders]).toEqual([21,20,9])
    expect(d.emptyCheckpoints.length).toBeGreaterThan(0)
    const expected=new Set(plan.courses.map(c=>c.moves.slice(0,c.provenance.documentedPlies).join(' ')))
    expect(new Set(d.routes.map(c=>c.moves.join(' ')))).toEqual(expected)
    expect(d.routes.every(c=>!('exercise' in c))).toBe(true)
    for(const e of d.emptyCheckpoints){const c=d.routes.find(c=>c.id===e.to)
      expect(training(c,e.side,e.index).learnerTurns).toBe(0)}
  })
  it('rejects a terminal Black fork that gives White no turn',()=>{
    const p=structuredClone(plan),c=p.courses[0]
    c.moves=c.moves.slice(0,14);c.provenance.authoredContinuationPlies=0;c.authoredMoves=[]
    expect(()=>analyzePlan(p,baseline,scope)).toThrow(/zero active moves/)
  })
  it('uses exact SAN boundaries and keeps aliases separate from position counts',()=>{
    expect(sourceRows(scope,'e4 c5 Nf')).toHaveLength(0)
    const rows=sourceRows(scope,plan.sourceSubtreePrefixes[0])
    expect(rows.length).toBe(21);expect(new Set(rows.map(r=>r.groupId)).size).toBe(20)
    expect(()=>sourceRows(scope,' ')).toThrow()
  })
  it('pages presentation without restricting the underlying draft or assessment',async()=>{
    const r=await execute(options(['draft','--prefix',plan.sourceSubtreePrefixes[0],'--limit','1']))
    expect(r.routes.items).toHaveLength(1);expect(r.routes.total).toBe(9);expect(r.routes.more).toBe(true)
    const full=await json(r.evidence);expect(full.routes).toHaveLength(9)
    expect(full.emptyCheckpoints.length).toBeGreaterThan(0)
    const {courses}=await runtime()
    expect(full.baselineDigest).toBe(hash(JSON.stringify(courses.map(({id,family,title,moves})=>({id,family,title,moves})))))
    expect(page([1,2,3],{offset:1,limit:1})).toMatchObject({total:3,items:[2],more:true})
  })
  it('shows only the requested course detail and identifies plan versus runtime',async()=>{
    const id=plan.courses[0].id,summary=await inspect({course:id,lot:'sic-07'})
    expect(summary.origin).toContain('active-plan');expect(summary).not.toHaveProperty('editorialNotes')
    const notes=await inspect({course:id,lot:'sic-07',section:'notes',limit:1})
    expect(notes.notes.items).toHaveLength(1);expect(notes.notes.total).toBe(Object.keys(plan.courses[0].editorialNotes).length)
    const source=await inspect({record:plan.courses[0].sourceRecords[0].id})
    expect(source.groupId).toBe(plan.courses[0].sourceRecords[0].positionId)
    await expect(inspect({course:id,record:source.id})).rejects.toThrow('exactly one')
  })
  it('generates a small current brief and refuses a stale saved version',async()=>{
    const b=await makeBrief('sic-07'),{courses}=await runtime()
    expect(b.current.courses).toBe(courses.length);expect(b.planned.projectedCourses).toBe(302)
    expect(b.planned.coverage).toEqual(plan.expectedCoverage)
    expect(b.engine.requests).toBe(engineBefore.requests.length);expect(b.engine.prepared).toBe(engineBefore.prepared)
    expect(encode(b).length).toBeLessThan(4500)
    await expect(saveBrief({...b,sourceHash:'stale'},{check:true})).rejects.toThrow('Stale generated brief')
  },30000)
  it('indexes historical reports without claiming their QA is current',async()=>{
    const rows=await history(),row=rows.find(r=>r.lot==='P02.2-SIC-06')
    expect(row.courses).toBe(293);expect(row.evidence).toContain('not a current QA')
    expect(row.sha256).toHaveLength(64)
    expect(hash(encode(await history()))).toBe(hash(encode(rows)))
  })
  it('keeps engine collection explicit and rejects ambiguous or unsupported flags',()=>{
    expect(options([]).command).toBe('brief')
    for(const args of [['run'],['brief','--step','collect'],['run','--step','collect','--check'],['run','--step','collect','--projection'],['brief','--write','--check'],['history','--limit','10000'],['draft','--offset','-1']])expect(()=>options(args)).toThrow()
  })
  it('limits detail access to workflow artifacts and never prepares an engine from brief',async()=>{
    await expect(execute(options(['details','--file','.env']))).rejects.toThrow('Only workflow')
    await expect(execute(options(['assess','--plan','../outside.json']))).rejects.toThrow('under docs/data')
    expect(await engineState()).toEqual(engineBefore)
  })
})
