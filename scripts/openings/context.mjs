// Small, verified views over the existing artifacts. Historical reports stay intact.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {json,runtime,coverageIndex,resolve,hash,hashes,encode,write,fileHash,exists} from './common.mjs'
import {executeLot} from '../openings-lot.mjs'

export const BRIEF_JSON='docs/data/opening-pipeline/current.json'
export const BRIEF_MD='docs/OPENING-NOW.md'
export function page(rows,{offset=0,limit=5}={}){
  assert(Number.isInteger(offset)&&offset>=0,'Invalid offset')
  assert(Number.isInteger(limit)&&limit>0&&limit<=50,'Limit must be 1..50')
  return {total:rows.length,offset,limit,more:offset+limit<rows.length,items:rows.slice(offset,offset+limit)}
}
export async function history(){
  const rows=[]
  for(const name of (await fs.readdir(resolve('docs/data'))).sort()){
    if(!/^opening-.*-p022-result\.json$/.test(name))continue
    const file='docs/data/'+name,r=await json(file)
    rows.push({lot:r.lot,status:r.status,courses:r.currentCourses??r.courseCount??null,
      file,sha256:await fileHash(file),evidence:'historical-as-recorded; not a current QA certificate'})
  }
  return rows
}
export async function makeBrief(lot){
  // Existing status validates baseline, source records, exercises, hashes and ledger.
  const status=await executeLot({command:'status',lot}),registry=await json('docs/data/opening-pipeline/lots.json')
  const id=lot??registry.activeLot,config=registry.lots[id],plan=await json(config.plan)
  const {courses,practical}=await runtime(),scope=await json('docs/data/opening-scope-audit.json')
  const actual=coverageIndex(courses,scope).coverage
  const design=await json(config.design),projection=coverageIndex([...design.baseline.courses,...plan.courses],scope).coverage
  assert.deepEqual(projection,plan.expectedCoverage,'Projection differs from source coverage')
  const files=['docs/data/opening-pipeline/lots.json',config.plan,config.design,
    'scripts/openings-workflow.mjs','scripts/openings/context.mjs','scripts/openings/planning.mjs',
    'src/components/OpeningLibrary.jsx']
  for(const file of ['.codex/config.toml','.codex/agents/luna.toml','.codex/agents/astra.toml','.codex/agents/astra-high.toml'])
    if(await exists(file))files.push(file)
  for(const dir of ['src/data','src/lib'])for(const name of await fs.readdir(resolve(dir)))
    if(/^opening.*\.(?:js|json)$/.test(name))files.push(dir+'/'+name)
  const ledger=plan.plannedFiles.engineDirectory
  async function walk(dir){for(const entry of await fs.readdir(resolve(dir),{withFileTypes:true})){
    assert(!entry.isSymbolicLink(),'Symlink in evidence directory')
    const file=dir+'/'+entry.name;if(entry.isDirectory())await walk(file);else files.push(file)
  }}
  if(await exists(ledger))await walk(ledger)
  const sourceHash=hash(encode({inputs:await hashes(files),validatedLotFingerprint:status.fingerprint}))
  return {schema:1,status:'current-state-verified; application QA not executed by brief',sourceHash,
    activeLot:id,lot:plan.lot,installed:status.installed,
    current:{courses:courses.length,exercises:practical.entries.length,sourcePositions:scope.positions.length,coverage:actual},
    planned:{courses:plan.courses.length,projectedCourses:plan.baseline.courseCount+plan.courses.length,
      coverage:projection,authoredMoves:plan.courses.reduce((n,c)=>n+c.authoredMoves.length,0)},
    engine:{prepared:status.engine.prepared,requests:status.engine.requests,completedJobs:status.engine.completedJobs,
      plannedJobs:plan.enginePlan.primaryJobs,maximumGoCommands:plan.enginePlan.maximumGoCommands,
      lockPresent:status.engine.lockPresent??false,interruptedOrFailedJobs:status.engine.interruptedOrFailedJobs},
    next:status.installed?'validate-implementation-and-QA':status.next,
    implementationModel:config.implementationModel,modelPolicy:'AGENTS.md and .codex/config.toml override historical lot model recommendations',preservedFiles:Object.keys(plan.preserveFiles).length,
    references:{plan:config.plan,design:config.design,guide:config.designDocument,historyCommand:'node scripts/openings-workflow.mjs history'},
    limits:'Projection is not installed content. Historical QA is not current QA. Collect requires an explicit authorized command.'}
}
export function briefMarkdown(b){
  return `# Stato operativo generato\n\nRigenerare con \`node scripts/openings-workflow.mjs brief --write\`; verificare con \`brief --check\`. Non modificare a mano.\n\n`+
    `Lotto **${b.lot}**. App: **${b.current.courses} corsi / ${b.current.exercises} esercizi**. `+
    `Copertura: ${b.current.coverage.exact} esatte, ${b.current.coverage['transposition-only']} trasposte, ${b.current.coverage.absent} assenti.\n\n`+
    `Previsti ${b.planned.courses} corsi; proiezione ${b.planned.projectedCourses} totali. Installati: ${b.installed}. `+
    `Motore: ${b.engine.requests} richieste persistite, ${b.engine.completedJobs}/${b.engine.plannedJobs} job completati.\n\n`+
    `Prossima azione: **${b.next}**. Indicazione storica del lotto: **${b.implementationModel}**. Per il routing attuale usare [AGENTS.md](../AGENTS.md) e [.codex/config.toml](../.codex/config.toml).\n\n`+
    `Verificati baseline, fonti e ${b.preservedFiles} file protetti. Questo riepilogo non esegue test applicativi o ricerche motore.\n\n`+
    `[Piano](${b.references.plan.replace(/^docs\//,'')}) · [Prova](${b.references.design.replace(/^docs\//,'')}) · `+
    `[Istruzioni](${b.references.guide.replace(/^docs\//,'')}) · [Stato JSON](data/opening-pipeline/current.json)\n\n`+
    `Per lo storico usare \`${b.references.historyCommand}\`: i rapporti originali restano le prove complete. `+
    `Leggere solo il corso, record, posizione o errore pertinente con \`inspect\` / \`sources\`.\n\nFirma sorgenti: \`${b.sourceHash}\`.\n`
}
export async function saveBrief(b,{check=false}={}){
  const outputs={[BRIEF_JSON]:encode(b),[BRIEF_MD]:briefMarkdown(b)}
  for(const [file,text] of Object.entries(outputs)){
    if(check)assert.equal(await fs.readFile(resolve(file),'utf8'),text,`Stale generated brief: ${file}; run brief --write`)
    else await write(file,text)
  }
  return {status:'PASS',mode:check?'check':'write',files:Object.keys(outputs),characters:encode(b).length}
}
export function sourceRows(scope,prefix){
  assert(typeof prefix==='string'&&prefix.trim(),'A SAN prefix is required')
  const normalized=prefix.trim().split(/\s+/).join(' ')
  return scope.records.filter(r=>r.moves===normalized||r.moves.startsWith(normalized+' '))
}
export async function inspect({course,position,record,section='summary',lot,offset,limit}={}){
  assert([course,position,record].filter(Boolean).length===1,'Choose exactly one course, position or record')
  assert(['summary','notes','exercise','source'].includes(section),'Unknown section')
  const scope=await json('docs/data/opening-scope-audit.json')
  if(record){const r=scope.records.find(r=>r.id===record);assert(r,'Unknown record');return r}
  if(position){const p=scope.positions.find(p=>p.id===position);assert(p,'Unknown position')
    return {id:p.id,name:p.name,position:p.position,records:page(scope.records.filter(r=>r.groupId===position),{offset,limit})}}
  const registry=await json('docs/data/opening-pipeline/lots.json'),config=registry.lots[lot??registry.activeLot]
  assert(config,'Unknown lot');const plan=await json(config.plan),{courses,practical}=await runtime()
  const candidate=plan.courses.find(c=>c.id===course),installed=courses.find(c=>c.id===course),c=candidate??installed
  assert(c,'Unknown course')
  const origin=candidate?'active-plan; check installed separately':'runtime'
  if(section==='notes')return {id:course,origin,notes:page(Object.entries(c.editorialNotes??{}).map(([index,text])=>({index:Number(index),text})),{offset,limit})}
  if(section==='exercise')return {id:course,origin,exercise:c.exercise??practical.entries.find(e=>e.courseId===course)??null}
  if(section==='source')return {id:course,origin,references:page(c.sourceRecords??c.provenance?.sourceRecords??[],{offset,limit})}
  return {id:c.id,title:c.title,origin,installed:!!installed,moves:c.moves,provenance:c.provenance??null,
    notePairs:Object.keys(c.editorialNotes??{}).length,sections:['notes','exercise','source']}
}
