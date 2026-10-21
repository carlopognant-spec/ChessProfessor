import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {createOpeningSession,runFrozenOpeningJobs} from './opening-bounded-engine.mjs'

assert.equal(process.argv.length,2,'This frozen lot accepts no overrides')
const hash=value=>createHash('sha256').update(value).digest('hex')
const planFile='docs/data/opening-sicilian-p022-plan.json',designFile='docs/data/opening-sicilian-p022-design-verification.json'
const plan=JSON.parse(await fs.readFile(planFile,'utf8')),design=JSON.parse(await fs.readFile(designFile,'utf8'))
assert.equal(design.inputHashes[planFile],hash(await fs.readFile(planFile)))
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
assert.equal(design.engineJobs.length,4)
const inputHashes={}
for(const file of [planFile,designFile,'scripts/collect-opening-sicilian-evidence.mjs',
  'scripts/opening-bounded-engine.mjs','scripts/opening-expansion-engine.mjs'])inputHashes[file]=hash(await fs.readFile(file))
const manifest={schema:1,lot:plan.lot,inputHashes,engineSha256:plan.enginePlan.sha256,
  policy:plan.enginePlan,jobs:design.engineJobs}
const result=await runFrozenOpeningJobs({directory:'docs/data/opening-sicilian-p022-engine',manifest,
  createSession:()=>createOpeningSession(plan.enginePlan.executable,plan.enginePlan)})
console.log(JSON.stringify({signature:result.signature,goCommands:result.goCommands,nodesRequested:result.nodesRequested,
  jobs:result.results.map(row=>({id:row.jobId,attempts:row.attemptIds,...row.result}))},null,2))
