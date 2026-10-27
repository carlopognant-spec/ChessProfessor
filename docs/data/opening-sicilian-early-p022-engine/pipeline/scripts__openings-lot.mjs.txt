import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {execFileSync} from 'node:child_process'
import {ROOT,resolve,json,encode,hash,hashes,fileHash,exists,write,frozen,loadLot,validateLot,coverageIndex,runtime} from './openings/common.mjs'
import {buildArtifacts,summarize,reportMarkdown} from './openings/artifacts.mjs'
import {createOpeningSession,runFrozenOpeningJobs} from './opening-bounded-engine.mjs'

export const PIPELINE_INPUTS=['scripts/openings-lot.mjs',
  'scripts/openings/common.mjs','scripts/openings/artifacts.mjs','scripts/opening-bounded-engine.mjs','scripts/opening-expansion-engine.mjs']
export function options(args){
  const out={command:'status',lot:undefined,check:false,projection:false}
  if(args[0]&&!args[0].startsWith('--'))out.command=args.shift()
  while(args.length){const a=args.shift()
    if(a==='--lot'){out.lot=args.shift();assert(out.lot,'Missing lot')}
    else if(a==='--check')out.check=true
    else if(a==='--projection')out.projection=true
    else throw Error(`Unknown argument: ${a}`)
  }
  assert(['status','resume','verify','prepare','collect','build','report','inventories'].includes(out.command),'Unknown command')
  assert(!out.projection||out.command==='report','--projection is only valid for report')
  assert(!out.check||['build','report','inventories'].includes(out.command),'--check is only valid for build/report/inventories')
  return out
}
export async function expectedManifest(ctx){
  const toolingSources=await Promise.all(PIPELINE_INPUTS.slice(0,3).map(async source=>({source,
    snapshot:ctx.plan.plannedFiles.engineDirectory+'/pipeline/'+source.replaceAll('/','__')+'.txt',sha256:await fileHash(source)})))
  const inputHashes={...await hashes([ctx.config.plan,ctx.config.design,...PIPELINE_INPUTS.slice(3)]),
    ...Object.fromEntries(toolingSources.map(r=>[r.snapshot,r.sha256]))}
  return {schema:2,lot:ctx.plan.lot,inputHashes,engineSha256:ctx.plan.enginePlan.sha256,
    toolingSources,policy:ctx.plan.enginePlan,jobs:ctx.jobs}
}
async function ledgerStatus(ctx){
  const dir=ctx.plan.plannedFiles.engineDirectory
  if(!await exists(dir+'/manifest.json'))return {prepared:false,requests:0,completedJobs:0,interruptedOrFailedJobs:[]}
  const manifest=await json(dir+'/manifest.json'),signature=hash(encode(manifest)),completed=[],blocked=[]
  await (await import('./openings/common.mjs')).verifyHashes(manifest.inputHashes)
  assert.deepEqual(manifest.jobs,ctx.jobs);assert.deepEqual(manifest.policy,ctx.plan.enginePlan)
  const names=await exists(dir+'/attempts')?await fs.readdir(resolve(dir+'/attempts')):[]
  const requests=names.filter(n=>n.endsWith('.request.json'))
  for(let i=0;i<ctx.jobs.length;i++){
    const file=`${dir}/results/${i+1}.json`,job=ctx.jobs[i]
    if(await exists(file)){
      const r=await json(file);assert.equal(r.signature,signature);assert.equal(r.jobId,job.id)
      if(r.status==='complete')completed.push(job.id);else blocked.push(job.id)
    }else for(const name of requests)if((await json(dir+'/attempts/'+name)).jobId===job.id){blocked.push(job.id);break}
  }
  return {prepared:true,signature,requests:requests.length,completedJobs:completed.length,lockPresent:await exists(dir+'/running.lock'),
    pendingJobs:ctx.jobs.filter(j=>!completed.includes(j.id)&&!blocked.includes(j.id)).map(j=>j.id),interruptedOrFailedJobs:blocked}
}
async function safeOutputs(ctx,outputs,check){
  for(const file of Object.keys(outputs)){
    resolve(file);assert(!ctx.plan.preserveFiles[file],`Protected output: ${file}`)
    assert(!ctx.config.historical||check,'Historical lots are read-only')
  }
  // Every gate and every target is checked before writing the first output.
  for(const [file,text] of Object.entries(outputs)){
    if(check)assert.equal(await fs.readFile(resolve(file),'utf8'),text,`Generated artifact differs: ${file}`)
    else await write(file,text)
  }
}
export async function executeLot(opt){
  const started=Date.now(),ctx=await validateLot(await loadLot(opt.lot))
  const inputHashes=await hashes([...PIPELINE_INPUTS,ctx.config.plan,ctx.config.design,
    'src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js','src/lib/openingCurriculum.js',
    'scripts/report-opening-coverage.mjs','scripts/report-opening-commentary.mjs',...Object.keys(ctx.plan.preserveFiles)])
  const fingerprint=hash(encode({inputHashes,config:ctx.config})),stateFile=`.cache/opening-pipeline/${ctx.id}/state.json`
  const prior=await exists(stateFile)?await json(stateFile):null
  const state=prior?.fingerprint===fingerprint?prior:{schema:1,lot:ctx.plan.lot,fingerprint,inputHashes,steps:{}}
  let result
  try{
    if(['status','resume'].includes(opt.command)){
      const ledger=await ledgerStatus(ctx),{courses}=await runtime()
      const installed=ctx.plan.courses.every(spec=>courses.some(c=>c.id===spec.id&&JSON.stringify(c.moves)===JSON.stringify(spec.moves)))
      const next=ledger.lockPresent?'review-engine-lock':ledger.interruptedOrFailedJobs.length?'review-interrupted-engine-job':!ledger.prepared?'prepare':
        ledger.completedJobs<ctx.jobs.length?'collect':!installed?'build-and-integrate':'report'
      result={lot:ctx.plan.lot,readOnly:true,fingerprint,previousCheckpointReusable:prior?.fingerprint===fingerprint,
        installed,engine:ledger,next,model:ctx.config.implementationModel,
        command:next==='prepare'||next==='collect'?`node scripts/openings-lot.mjs ${next} --lot ${ctx.id}`:null,
        note:'Status never launches engine, tests or publication. Completed outputs are revalidated by build --check.'}
    }else if(opt.command==='verify'){
      const baseline=coverageIndex(ctx.design.baseline.courses,ctx.scope)
      const projected=coverageIndex([...ctx.design.baseline.courses,...ctx.plan.courses],ctx.scope)
      assert.deepEqual(baseline.coverage,ctx.plan.baseline.coverage);assert.deepEqual(projected.coverage,ctx.design.coverage.projected)
      result={status:'PASS',lot:ctx.plan.lot,courses:ctx.plan.courses.length,preservedFiles:Object.keys(ctx.plan.preserveFiles).length,
        exerciseReplies:ctx.exercises.reduce((n,e)=>n+e.legalImmediateReplies,0),jobs:ctx.jobs.length,
        baseline:baseline.coverage,projection:projected.coverage,engineSearchesExecuted:0}
    }else if(['prepare','collect'].includes(opt.command)){
      assert(!ctx.config.historical,'Historical ledger is read-only')
      const manifest=await expectedManifest(ctx),dir=ctx.plan.plannedFiles.engineDirectory
      if(opt.command==='prepare'){
        if(await exists(dir+'/manifest.json'))assert.deepEqual(await json(dir+'/manifest.json'),manifest,'Prepared inputs changed: no automatic replacement')
        for(const row of manifest.toolingSources){
          const text=await fs.readFile(resolve(row.source),'utf8')
          assert.equal(hash(text),row.sha256)
          await fs.mkdir(resolve(dir+'/pipeline'),{recursive:true})
          try{await fs.writeFile(resolve(row.snapshot),text,{flag:'wx'})}
          catch(e){if(e.code!=='EEXIST')throw e;assert.equal(await fs.readFile(resolve(row.snapshot),'utf8'),text)}
        }
        await frozen(dir+'/manifest.json',manifest)
        result={status:'prepared-offline',jobs:ctx.jobs.length,signature:hash(encode(manifest)),engineSearchesExecuted:0}
      }else{
        assert(await exists(dir+'/manifest.json'),'Run prepare before collect')
        assert.deepEqual(await json(dir+'/manifest.json'),manifest,'Prepared inputs changed: no automatic replacement')
        const r=await runFrozenOpeningJobs({directory:resolve(dir),manifest,
          createSession:()=>createOpeningSession(resolve(ctx.plan.enginePlan.executable),ctx.plan.enginePlan)})
        result={status:'collected',signature:r.signature,goCommands:r.goCommands,nodesRequested:r.nodesRequested}
      }
    }else if(opt.command==='build'){
      const b=await buildArtifacts(ctx);await safeOutputs(ctx,b.outputs,opt.check)
      result={status:'PASS',mode:opt.check?'check':'write',courses:b.courses.length,exercises:b.entries.length,
        comparisons:b.proof.continuationChecks.length,goCommands:b.proof.goCommands,nodesActual:b.proof.nodesActual}
    }else if(opt.command==='inventories'){
      const reports=['scripts/report-opening-coverage.mjs','scripts/report-opening-commentary.mjs'].map(file=>{
        const output=execFileSync(process.execPath,[resolve(file),...(opt.check?['--check']:[])],{cwd:ROOT,encoding:'utf8'})
        return {file,result:JSON.parse(output)}
      })
      result={status:'PASS',mode:opt.check?'check':'write',reports,engineSearchesExecuted:0}
    }else if(opt.command==='report'){
      const report=await summarize(ctx,{projection:opt.projection})
      const stem=`docs/data/opening-pipeline/${ctx.id}-${opt.projection?'projection':'result'}`
      const outputs={[stem+'.json']:encode(report),[stem+'.md']:reportMarkdown(report)}
      if(!opt.projection){outputs[ctx.plan.plannedFiles.result]=encode(report);outputs[ctx.plan.plannedFiles.resultDocument]=reportMarkdown(report)}
      await safeOutputs(ctx,outputs,opt.check)
      result=report
    }
    if(!['status','resume'].includes(opt.command)){
      state.steps[opt.command]={status:'passed',mode:opt.check?'check':'write',projection:opt.projection,
        completedAt:new Date().toISOString(),elapsedMs:Date.now()-started,result}
      await write(stateFile,state)
    }
    return result
  }catch(e){
    state.steps[opt.command]={status:'failed',at:new Date().toISOString(),error:e.message}
    await write(stateFile,state);throw e
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.chdir(ROOT)
  try{console.log(encode(await executeLot(options(process.argv.slice(2)))))}
  catch(e){console.error(e.stack);process.exitCode=1}
}
