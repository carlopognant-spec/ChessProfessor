// Offline publication gate for the fixed Zaitsev plan and append-only ledger.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {parseOpeningSearch} from './opening-bounded-engine.mjs'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planFile='docs/data/opening-zaitsev-p022-plan.json',plan=await read(planFile)
const directory='docs/data/opening-zaitsev-p022-engine',manifest=await read(directory+'/manifest.json')
const signature=hash(JSON.stringify(manifest,null,2)+'\n')
assert.deepEqual(manifest.policy,plan.enginePlan)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
for(const [file,sha]of Object.entries(manifest.inputHashes))assert.equal(hash(await fs.readFile(file)),sha,file)
for(const [file,sha]of Object.entries(plan.preserveFiles))assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile('src/data/openingCatalog.json')),plan.sourceCatalogSha256)
const catalog=await read('src/data/openingCatalog.json')
const design=await read('docs/data/opening-zaitsev-p022-design-verification.json')
assert.deepEqual(manifest.jobs,design.engineJobs)
assert.equal(manifest.jobs.length,5)
const results=new Map(),attempts=[]
const requests=(await fs.readdir(directory+'/attempts')).filter(name=>name.endsWith('.request.json')).sort()
assert(requests.length<=plan.enginePlan.maximumGoCommands)
assert(requests.length*plan.enginePlan.nodesPerGo<=plan.enginePlan.maximumRequestedNodes)
for(const file of requests){
  const number=file.slice(0,2),request=await read(directory+'/attempts/'+file)
  const response=await read(`${directory}/attempts/${number}.response.json`)
  assert.equal(request.signature,signature);assert.equal(response.signature,signature)
  assert.equal(response.jobId,request.jobId)
  assert.equal(response.nodesActual,Math.max(0,...response.lines.map(line=>Number(line.match(/\bnodes (\d+)/)?.[1]??0))))
  assert.equal(request.nodesRequested,plan.enginePlan.nodesPerGo);assert.equal(response.status,'complete')
  const job=manifest.jobs.find(row=>row.id===request.jobId)
  assert(job);assert.equal(request.fen,job.fen)
  attempts.push({number,request,response})
}
for(let index=0;index<manifest.jobs.length;index++){
  const job=manifest.jobs[index],saved=await read(`${directory}/results/${index+1}.json`)
  assert.equal(saved.signature,signature);assert.equal(saved.jobId,job.id);assert.equal(saved.status,'complete')
  const associated=attempts.filter(row=>row.request.jobId===job.id)
  assert.equal(associated.length,saved.attemptIds.length)
  assert(associated.length>=1&&associated.length<=2)
  assert.deepEqual(associated.map(row=>row.number),saved.attemptIds)
  assert.equal(associated[0].request.kind,'primary');assert.deepEqual(associated[0].request.roots,job.roots)
  const primary=parseOpeningSearch(associated[0].response.lines,job.roots)
  if(associated.length===2){
    assert(primary.needsConfirmation);assert.equal(associated[1].request.kind,'confirmation')
    assert.deepEqual(associated[1].request.roots,[primary.bestmove])
  }else assert(!primary.needsConfirmation)
  const last=associated.at(-1),parsed=parseOpeningSearch(last.response.lines,last.request.roots)
  assert(!parsed.needsConfirmation)
  assert.deepEqual(saved.result,{...parsed,attempt:last.number})
  assert(Number.isFinite(parsed.cp)&&parsed.mate===null,'Mate scores require separate design')
  const pv=new Chess(job.fen)
  for(const uci of parsed.pv)pv.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
  assert.equal(parsed.pv[0],parsed.bestmove)
  if(job.expectedAnswer){const b=new Chess(job.fen);assert.equal(b.move({from:parsed.bestmove.slice(0,2),to:parsed.bestmove.slice(2,4),promotion:parsed.bestmove[4]}).san,job.expectedAnswer)}
  results.set(job.id,parsed)
}
const policy={engine:plan.enginePlan.engine,engineHash:plan.enginePlan.sha256,nodes:plan.enginePlan.nodesPerGo,
  threads:1,hashMb:32,minimumCpChange:plan.enginePlan.minimumCpChange,
  minimumImmediateMaterial:plan.enginePlan.minimumImmediateMaterial,kind:'constructed-deviation-v1'}
const get=id=>{const result=results.get(id);assert(result,`Missing job ${id}`);return result}
const continuationChecks=[
  {san:'Bxc6',controlId:'zaitsev:root-control',selectedId:'zaitsev:authored-Bxc6'},
  {san:'Qxc6',controlId:'zaitsev:recapture-control',selectedId:'zaitsev:authored-Qxc6'},
].map(row=>{
  const control=get(row.controlId),selected=get(row.selectedId)
  const controlJob=manifest.jobs.find(job=>job.id===row.controlId)
  const selectedJob=manifest.jobs.find(job=>job.id===row.selectedId)
  assert.equal(controlJob.fen,selectedJob.fen)
  const difference=control.cp-selected.cp,loss=Math.max(0,difference)
  assert(loss<=plan.enginePlan.maximumAuthoredMoveCpLoss,`Authored continuation rejected: ${row.san}`)
  return {...row,fen:controlJob.fen,control,selected,signedCpDifference:difference,acceptanceLoss:loss}
})
const editorialFile='docs/data/opening-zaitsev-p022-editorial.json',editorial=await read(editorialFile)
// The archived plan contains ASCII '?' substitutions. Permit character repair
// only: folding every restored non-ASCII character must reproduce that plan.
const asciiFold=value=>value.replace(/[^\x00-\x7f]/g,'?')
for(const [key,value]of Object.entries(editorial.course)){
  if(key==='editorialNotes'){
    assert.deepEqual(Object.keys(value),Object.keys(plan.course.editorialNotes))
    for(const [pair,note]of Object.entries(value))assert.equal(asciiFold(note),plan.course.editorialNotes[pair])
  }else assert.equal(asciiFold(value),plan.course[key])
}
for(const [key,value]of Object.entries(editorial.exercise))assert.equal(asciiFold(value),plan.course.exercise[key])
const spec={...plan.course,...editorial.course,exercise:{...plan.course.exercise,...editorial.exercise}}
const source=catalog.entries.find(row=>row.id===plan.source.catalogId)
assert.deepEqual(source.moves,spec.moves.slice(0,plan.source.documentedPlies))
assert.deepEqual(spec.moves.slice(plan.source.documentedPlies),['Bxc6','Qxc6'])
const endpoint=new Chess();spec.moves.forEach(san=>assert.equal(endpoint.move(san).san,san))
assert(!endpoint.isGameOver())
const course={id:spec.id,family:spec.family,title:spec.title,moves:spec.moves,variant:true,roadmapLot:plan.lot,
  contrast:spec.contrast,whitePlan:spec.whitePlan,blackPlan:spec.blackPlan,endpointReason:spec.endpointReason,
  sourceDisclosure:spec.sourceDisclosure,editorialLine:spec.moves.join(' '),editorialNotes:spec.editorialNotes,
  provenance:{...spec.provenance,continuationStatus:'bounded-engine-checked',source:catalog.source,revision:catalog.revision,
    sourceCatalogSha256:plan.sourceCatalogSha256,sourceId:source.id,sourceName:source.name,sourceEco:source.eco,
    rootPositionId:spec.rootPositionId,engineSignature:signature}}
const ex=spec.exercise,baseline=get('zaitsev:root-control'),search=get('zaitsev:deviation')
assert.equal(search.bestmove,'c6d4')
const cpChange=search.cp+baseline.cp
assert(cpChange>=policy.minimumCpChange)
const board=new Chess();course.moves.slice(0,ex.beforeIndex).forEach(san=>board.move(san))
const material=(b,side)=>b.board().flat().filter(Boolean)
  .reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
const before=board.fen(),initial=material(board,ex.exerciseSide)
assert.equal(before,design.exercise.before)
board.move(ex.mistake)
const after=board.fen();assert.equal(after,design.exercise.after)
assert.deepEqual(board.moves({verbose:true}).filter(move=>move.captured==='q').map(move=>move.san),[ex.answer])
assert.equal(board.move(ex.answer).captured,'q')
const answerFen=board.fen(),replies=[]
let minimum=material(board,ex.exerciseSide)-initial
for(const san of board.moves()){
  board.move(san);assert(!board.isCheckmate())
  const materialGain=material(board,ex.exerciseSide)-initial
  minimum=Math.min(minimum,materialGain);replies.push({san,fen:board.fen(),materialGain});board.undo()
}
assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
assert.equal(replies.length,ex.expectedLegalImmediateReplies)
assert(minimum>=policy.minimumImmediateMaterial)
assert.deepEqual(replies,design.exercise.replies)
const preventionBoard=new Chess(before),uci=baseline.bestmove
const prevention=preventionBoard.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}).san
const itemSignature=hash(JSON.stringify({id:course.id,moves:course.moves,policy,engineSignature:signature,
  planSha256:manifest.inputHashes[planFile]}))
const item={id:ex.id,courseId:course.id,family:course.family,title:course.title+': il ritiro che lascia la donna',
  moves:board.history(),startIndex:ex.beforeIndex+1,exerciseSide:ex.exerciseSide,variant:true,practice:true,signature:itemSignature,
  kind:ex.kind,objective:ex.objective,
  contrast:'Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.',
  whitePlan:course.whitePlan,blackPlan:course.blackPlan,
  prevention:`Prima della deviazione, ${prevention} è una possibilità proposta dal controllo. Non è l'unica difesa valida: confrontala con la scelta del corso.`,
  explanation:ex.explanation}
const proof={schema:1,lot:plan.lot,policy,engineSignature:signature,editorialHash:hash(await fs.readFile(editorialFile)),
  goCommands:attempts.length,nodesRequested:attempts.length*policy.nodes,
  nodesActual:attempts.reduce((n,row)=>n+row.response.nodesActual,0),continuationChecks,
  evidence:[{id:item.id,signature:itemSignature,before,mistake:ex.mistake,after,answer:ex.answer,answerFen,
    baselineJobId:'zaitsev:root-control',baseline,search,cpChange,minimumImmediateMaterialGain:minimum,
    legalImmediateReplies:replies.length,replies,engineSignature:signature,
    objective:'Immediate queen capture; no claim of a unique winning move'}],uncovered:[]}
const outputs={
  [plan.plannedFiles.courseModule]:'// Fixed documented prefix and separately checked authored demonstration.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,entries:[course]},null,2)+'\n',
  [plan.plannedFiles.practicalModule]:'// Constructed deviation checked by its own frozen engine ledger.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,policy,entries:[item],uncovered:[]},null,2)+'\n',
  'docs/data/opening-zaitsev-p022-practical-verification.json':JSON.stringify(proof,null,2)+'\n',
}
for(const [file,text]of Object.entries(outputs)){
  if(check)assert.equal(await fs.readFile(file,'utf8'),text,`Generated artifact differs: ${file}`)
  else await fs.writeFile(file,text)
}
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',courses:1,exercises:1,
  goCommands:proof.goCommands,nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
  continuation:continuationChecks.map(row=>({san:row.san,signedCpDifference:row.signedCpDifference,acceptanceLoss:row.acceptanceLoss})),
  exerciseCpChange:cpChange,legalImmediateReplies:replies.length,minimumImmediateMaterialGain:minimum},null,2))
