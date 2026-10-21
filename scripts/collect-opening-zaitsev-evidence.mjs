import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {createOpeningSession,runFrozenOpeningJobs} from './opening-bounded-engine.mjs'

assert(process.argv.slice(2).every(arg=>arg==='--prepare'))
const prepare=process.argv.includes('--prepare')
const hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planFile='docs/data/opening-zaitsev-p022-plan.json'
const designFile='docs/data/opening-zaitsev-p022-design-verification.json'
const plan=await read(planFile),design=await read(designFile)
assert.equal(design.inputHashes[planFile],hash(await fs.readFile(planFile)))
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
for(const [file,sha]of Object.entries(plan.preserveFiles))assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(design.engineJobs.length,5)
assert.equal(new Set(design.engineJobs.map(row=>row.id)).size,5)
assert.deepEqual(design.engineJobs[0].uses,['continuation-white-control','exercise-baseline'])
assert.equal(design.engineJobs[0].fen,design.exercise.before)
assert.equal(design.engineJobs[4].fen,design.exercise.after)
for(const job of design.engineJobs){
  const board=new Chess(job.fen)
  const legal=board.moves({verbose:true}).map(move=>move.from+move.to+(move.promotion??''))
  for(const root of job.roots)assert(legal.includes(root))
}
const inputHashes={}
for(const file of [planFile,designFile,'scripts/collect-opening-zaitsev-evidence.mjs',
  'scripts/opening-bounded-engine.mjs','scripts/opening-expansion-engine.mjs'])inputHashes[file]=hash(await fs.readFile(file))
const manifest={schema:1,lot:plan.lot,inputHashes,engineSha256:plan.enginePlan.sha256,
  policy:plan.enginePlan,jobs:design.engineJobs}
const directory=plan.plannedFiles.engineDirectory
if(prepare){
  await fs.mkdir(directory,{recursive:true})
  const file=directory+'/manifest.json',text=JSON.stringify(manifest,null,2)+'\n'
  try{await fs.writeFile(file,text,{flag:'wx'})}
  catch(error){if(error.code!=='EEXIST')throw error;assert.equal(await fs.readFile(file,'utf8'),text)}
  console.log(JSON.stringify({status:'prepared-offline',jobs:5,primaryRequestedNodes:5*plan.enginePlan.nodesPerGo,
    maximumGoCommands:plan.enginePlan.maximumGoCommands,maximumRequestedNodes:plan.enginePlan.maximumRequestedNodes,
    engineSearchesExecuted:0,signature:hash(text)},null,2))
}else{
  const result=await runFrozenOpeningJobs({directory,manifest,
    createSession:()=>createOpeningSession(plan.enginePlan.executable,plan.enginePlan)})
  console.log(JSON.stringify({signature:result.signature,goCommands:result.goCommands,nodesRequested:result.nodesRequested,
    jobs:result.results.map(row=>({id:row.jobId,attempts:row.attemptIds,...row.result}))},null,2))
}
