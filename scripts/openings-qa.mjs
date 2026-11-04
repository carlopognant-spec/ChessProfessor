import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {spawn,execFileSync} from 'node:child_process'
import {pathToFileURL} from 'node:url'
import {ROOT,resolve,encode,hash,hashes,exists,json,write} from './openings/common.mjs'

const test=(files=[])=>({id:'tests',command:'npm',args:['test','--','--config','scripts/qa-no-env-test.config.js','--cache','false',...files]})
const toolingTests=['tests/openings-pipeline.test.js','tests/openings-workflow.test.js']
const full=()=>[test(),{id:'build',command:'npm',args:['run','build','--','--config','scripts/qa-no-env-build.config.js']},
  {id:'browser',command:'npx',args:['playwright','test','--config','scripts/qa-opening-browser.config.js','--grep','roadmap Sicilian']}]

export function selectChecks(changed,{forceFull=false,lot=null,verifiedAggregations=[]}={}){
  assert(changed.every(f=>typeof f==='string'&&f.length))
  const tooling=f=>/^scripts\/(openings(?:-|\/))/.test(f)||toolingTests.includes(f)||
    ['scripts/report-opening-coverage.mjs','scripts/report-opening-commentary.mjs'].includes(f)
  const docs=f=>(/^docs\//.test(f)&&/\.(?:md|json)$/.test(f))||f==='AGENTS.md'||/^\.agents\/skills\/[^/]+\/SKILL\.md$/.test(f)
  const data=f=>/^src\/data\/opening\w+(?:Courses|PracticalCases)\.js$/.test(f)||verifiedAggregations.includes(f)||
    /^tests\/opening-.*\.test\.js$/.test(f)&&lot?.qa?.tests?.includes(f)
  let mode,reason,steps
  if(forceFull||!changed.length||changed.some(f=>!tooling(f)&&!docs(f)&&!data(f))){
    mode='full';reason='Explicit full check, unknown path, or common runtime change';steps=full()
  }else if(changed.some(data)){
    // Data-only additions still exercise every route and the real UI. No quadratic new case matrix.
    mode='content';reason='Opening data changed; require lot-specific tests and browser selection'
    if(!lot?.qa?.tests?.length||!lot?.qa?.browserGrep){mode='full';reason='No reviewed lot QA selection: conservative full fallback';steps=full()}
    else steps=[test([...toolingTests,'tests/opening-variants.test.js','tests/opening-expansion.test.js',...lot.qa.tests]),
      {id:'build',command:'npm',args:['run','build','--','--config','scripts/qa-no-env-build.config.js']},
      {id:'browser',command:'npx',args:['playwright','test','--config','scripts/qa-opening-browser.config.js','--grep',lot.qa.browserGrep]}]
  }else if(changed.every(docs)){
    mode='documents';reason='Only documentation or specifications changed';steps=[
      {id:'preflight',command:'node',args:['scripts/openings-lot.mjs','verify']},
      {id:'documents',command:'node',args:['scripts/openings-docs.mjs',...changed]}]
  }else{
    mode='tooling';reason='Only pipeline tooling/specifications changed'
    steps=[test(toolingTests),{id:'preflight',command:'node',args:['scripts/openings-lot.mjs','verify']},
      {id:'legacy-parity',command:'node',args:['scripts/openings-lot.mjs','build','--lot','sic-05','--check']},
      {id:'inventories',command:'node',args:['scripts/openings-lot.mjs','inventories','--check']},
      {id:'documents',command:'node',args:['scripts/openings-docs.mjs',
        ...new Set(['docs/OPENING-PIPELINE.md','docs/ROADMAP-E-PROMPT-OPERATIVI.md','docs/data/opening-pipeline/lots.json',...changed.filter(docs)])]}]
  }
  return {schema:1,mode,reason,changed:[...changed].sort(),steps,
    fullMilestonePolicy:'Run --full for runtime/navigation changes, unknown files, family completion, and before delivery commit or publication.'}
}
export function changedFiles(){
  const read=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean).map(f=>f.replaceAll('\\','/'))
  return [...new Set([...read(['diff','--name-only','-z','HEAD']),...read(['ls-files','--others','--exclude-standard','-z'])])].sort()
}
export async function verifyAggregationEdits(config){
  const design=await json(config.design),verified=[]
  for(const rule of config.qa?.aggregationEdits??[]){
    let text=await fs.readFile(resolve(rule.file),'utf8'),valid=true
    for(const line of rule.importLines){
      const variants=[line+'\r\n',line+'\n'],found=variants.find(v=>text.includes(v))
      if(!found||text.split(found).length!==2){valid=false;break}
      text=text.replace(found,'')
    }
    if(!valid)continue
    for(const token of rule.tokens){if(text.split(token).length!==2){valid=false;break}text=text.replace(token,'')}
    if(valid&&hash(text)===design.inputHashes[rule.file])verified.push(rule.file)
  }
  return verified
}
export async function fingerprintFiles({documents=false}={}){
  const files=['package.json','package-lock.json','vitest.config.js','playwright.config.js']
  for(const file of ['.codex/config.toml','.codex/agents/luna.toml','.codex/agents/astra.toml','.codex/agents/astra-high.toml'])
    if(await exists(file))files.push(file)
  async function visit(dir){for(const e of await fs.readdir(resolve(dir),{withFileTypes:true})){
    if(e.name.startsWith('.')||e.name==='node_modules'||e.isSymbolicLink())continue
    const file=dir+'/'+e.name
    if(e.isDirectory())await visit(file)
    else if(/\.(?:js|jsx|mjs|json|md|ts|css|html|exe|tsv|txt)$/i.test(e.name))files.push(file)
  }}
  for(const dir of ['src','tests','scripts','docs/data/opening-pipeline'])await visit(dir)
  const registry=await json('docs/data/opening-pipeline/lots.json')
  for(const config of Object.values(registry.lots)){
    const plan=await json(config.plan)
    files.push(config.plan,config.design,...Object.keys(plan.preserveFiles))
    if(await exists(plan.plannedFiles.engineDirectory))await visit(plan.plannedFiles.engineDirectory)
    for(const file of [plan.plannedFiles.practicalVerification,plan.plannedFiles.result])if(await exists(file))files.push(file)
  }
  files.push('opening-library.spec.js')
  if(documents){
    async function markdown(dir){for(const e of await fs.readdir(resolve(dir),{withFileTypes:true})){
      if(e.name.startsWith('.')||e.isSymbolicLink())continue
      const file=dir+'/'+e.name
      if(e.isDirectory())await markdown(file);else if(e.name.endsWith('.md'))files.push(file)
    }}
    await markdown('docs')
    if(await exists('AGENTS.md'))files.push('AGENTS.md')
    if(await exists('.agents/skills'))await markdown('.agents/skills')
  }
  const found=[];for(const f of files)if(await exists(f))found.push(f)
  return [...new Set(found)].sort()
}
export const qaIdentity=(plan,inputHashes)=>hash(encode({plan,inputHashes}))
export async function runChecks(plan,{reuse=true}={}){
  const inputOptions={documents:plan.steps.some(s=>s.id==='documents')}
  const inputHashes=await hashes(await fingerprintFiles(inputOptions))
  const fingerprint=qaIdentity(plan,inputHashes),directory=`.cache/opening-pipeline/qa/${fingerprint}`
  const stateFile=directory+'/result.json'
  const state=await exists(stateFile)?await json(stateFile):{schema:1,fingerprint,inputHashes,plan,steps:{}}
  assert.equal(state.fingerprint,fingerprint)
  for(const step of plan.steps){
    if(reuse&&state.steps[step.id]?.status==='passed'&&await exists(state.steps[step.id].log)){
      console.log(`REUSE ${step.id}: verified identical input fingerprint`);continue
    }
    const log=`${directory}/${step.id}.log`,started=Date.now()
    state.steps[step.id]={status:'running',startedAt:new Date().toISOString(),log,command:step}
    await write(stateFile,state);await write(log,'')
    console.log(`RUN ${step.id}: ${step.command} ${step.args.join(' ')}`)
    const exitCode=await runCommand(step,log)
    // Refuse a green checkpoint if files changed while the command was running.
    const after=await hashes(await fingerprintFiles(inputOptions))
    const unchanged=encode(inputHashes)===encode(after)
    state.steps[step.id]={...state.steps[step.id],status:exitCode===0&&unchanged?'passed':'failed',exitCode,
      inputsUnchanged:unchanged,elapsedMs:Date.now()-started,finishedAt:new Date().toISOString()}
    await write(stateFile,state)
    if(exitCode!==0||!unchanged){console.error((await fs.readFile(resolve(log),'utf8')).slice(-8000));throw Error(`QA ${step.id} failed; see ${log}`)}
    console.log(`PASS ${step.id}: ${state.steps[step.id].elapsedMs} ms`)
  }
  state.status='passed';await write(stateFile,state)
  return {status:'PASS',mode:plan.mode,fingerprint,record:stateFile,steps:state.steps}
}
async function runCommand(step,log){
  assert(['npm','npx','node'].includes(step.command))
  let command,args
  if(step.command==='node'){command=process.execPath;args=step.args}
  else {
    // Invoke the installed npm CLI through Node: no shell interpolation on Windows.
    const npmPath=process.env.npm_execpath
    const prefix=path.dirname(process.execPath)
    const cli=npmPath&&path.basename(npmPath).startsWith('npm')?path.join(path.dirname(npmPath),step.command+'-cli.js'):
      path.join(prefix,'node_modules/npm/bin',step.command+'-cli.js')
    assert(await fs.access(cli).then(()=>true,()=>false),'npm/npx CLI not found beside Node')
    command=process.execPath;args=[cli,...step.args]
  }
  const handle=await fs.open(resolve(log),'a')
  try{return await new Promise((done,reject)=>{
    const child=spawn(command,args,{cwd:ROOT,windowsHide:true,stdio:['ignore',handle.fd,handle.fd]})
    child.once('error',reject);child.once('exit',code=>done(code??1))
  })}finally{await handle.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.chdir(ROOT)
  try{
    const args=process.argv.slice(2),changed=[];let run=false,forceFull=false,reuse=true,lotId
    while(args.length){const a=args.shift();if(a==='--run')run=true;else if(a==='--full')forceFull=true;else if(a==='--no-reuse')reuse=false;
      else if(a==='--changed'){assert(args[0]&&!args[0].startsWith('--'));changed.push(args.shift())}
      else if(a==='--lot')lotId=args.shift();else throw Error('Unknown argument '+a)}
    const registry=await json('docs/data/opening-pipeline/lots.json'),lot=registry.lots[lotId??registry.activeLot]
    assert(lot,'Unknown lot')
    const plan=selectChecks(changed.length?changed:changedFiles(),{forceFull,lot,verifiedAggregations:await verifyAggregationEdits(lot)})
    console.log(encode(run?await runChecks(plan,{reuse}):plan))
  }catch(e){console.error(e.stack);process.exitCode=1}
}
