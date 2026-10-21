// Offline publication gate. No engine searches are performed by this builder.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {parseOpeningSearch} from './opening-bounded-engine.mjs'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=v=>createHash('sha256').update(v).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planFile='docs/data/opening-chekhover-p022-plan.json',plan=await read(planFile)
const directory=plan.plannedFiles.engineDirectory,manifest=await read(directory+'/manifest.json')
const design=await read('docs/data/opening-chekhover-p022-design-verification.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
const signature=hash(JSON.stringify(manifest,null,2)+'\n')
assert.deepEqual(manifest.policy,plan.enginePlan)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles,...manifest.inputHashes}))
  assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile(planFile)),design.inputHashes[planFile])
assert.deepEqual(manifest.jobs,design.engineJobs);assert.equal(manifest.jobs.length,9)
const results=new Map(),attempts=[]
const requests=(await fs.readdir(directory+'/attempts')).filter(name=>name.endsWith('.request.json')).sort()
assert(requests.length<=plan.enginePlan.maximumGoCommands)
assert(requests.length*plan.enginePlan.nodesPerGo<=plan.enginePlan.maximumRequestedNodes)
for(const file of requests){
  const number=file.slice(0,2),request=await read(directory+'/attempts/'+file)
  const response=await read(`${directory}/attempts/${number}.response.json`)
  assert.equal(request.signature,signature);assert.equal(response.signature,signature)
  assert.equal(response.jobId,request.jobId);assert.equal(response.status,'complete')
  assert.equal(response.nodesActual,Math.max(0,...response.lines.map(line=>Number(line.match(/\bnodes (\d+)/)?.[1]??0))))
  assert.equal(request.nodesRequested,plan.enginePlan.nodesPerGo)
  const job=manifest.jobs.find(row=>row.id===request.jobId)
  assert(job);assert.equal(request.fen,job.fen)
  assert.equal(request.command,`go nodes ${request.nodesRequested}${request.roots.length?' searchmoves '+request.roots.join(' '):''}`)
  attempts.push({number,request,response})
}
for(let index=0;index<manifest.jobs.length;index++){
  const job=manifest.jobs[index],saved=await read(`${directory}/results/${index+1}.json`)
  assert.equal(saved.signature,signature);assert.equal(saved.jobId,job.id);assert.equal(saved.status,'complete')
  const associated=attempts.filter(row=>row.request.jobId===job.id)
  assert(associated.length>=1&&associated.length<=2)
  assert.deepEqual(associated.map(row=>row.number),saved.attemptIds)
  assert.equal(associated[0].request.kind,'primary');assert.deepEqual(associated[0].request.roots,job.roots)
  const primary=parseOpeningSearch(associated[0].response.lines,job.roots)
  if(associated.length===2){
    assert(primary.needsConfirmation);assert.equal(associated[1].request.kind,'confirmation')
    assert.deepEqual(associated[1].request.roots,[primary.bestmove])
  }else assert(!primary.needsConfirmation)
  const last=associated.at(-1),parsed=parseOpeningSearch(last.response.lines,last.request.roots)
  assert(!parsed.needsConfirmation);assert.deepEqual(saved.result,{...parsed,attempt:last.number})
  assert(Number.isFinite(parsed.cp)&&parsed.mate===null,'Mate scores require design review')
  const pv=new Chess(job.fen)
  for(const uci of parsed.pv)pv.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
  assert.equal(parsed.pv[0],parsed.bestmove)
  if(job.expectedAnswer){const b=new Chess(job.fen);assert.equal(b.move({from:parsed.bestmove.slice(0,2),to:parsed.bestmove.slice(2,4),promotion:parsed.bestmove[4]}).san,job.expectedAnswer)}
  results.set(job.id,parsed)
}
const catalog=await read('src/data/openingCatalog.json'),scope=await read('docs/data/opening-scope-audit.json')
const policy={engine:plan.enginePlan.engine,engineHash:plan.enginePlan.sha256,nodes:plan.enginePlan.nodesPerGo,
  threads:plan.enginePlan.threads,hashMb:plan.enginePlan.hashMb,minimumCpChange:plan.enginePlan.minimumExerciseSwingCp,
  minimumImmediateMaterial:plan.enginePlan.minimumImmediateMaterial,kind:'constructed-deviation-v1'}
const get=id=>{const result=results.get(id);assert(result,`Missing job ${id}`);return result}
const replay=moves=>{const b=new Chess();for(const san of moves)assert.equal(b.move(san).san,san);return b}
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
const courses=[],entries=[],evidence=[],continuationChecks=[]
for(const spec of plan.courses){
  const id=spec.id.slice('sicilian:'.length),ex=spec.exercise
  const sourceRecord=spec.sourceRecords.at(-1),source=catalog.entries.find(row=>row.id===sourceRecord.id.slice(4))
  assert.deepEqual(source.moves,spec.moves.slice(0,spec.provenance.documentedPlies))
  for(const s of spec.sourceRecords){
    const record=scope.records.find(r=>r.id===s.id),b=replay(spec.moves.slice(0,s.plies))
    assert.equal(record.moves,b.history().join(' '));assert.equal(record.groupId,s.positionId)
    assert.equal(b.fen().split(' ').slice(0,4).join(' '),scope.positions.find(p=>p.id===s.positionId).position)
  }
  assert.equal(spec.moves.length,spec.provenance.documentedPlies+spec.provenance.authoredContinuationPlies)
  assert.equal(spec.provenance.generatedPlies,0);assert(!replay(spec.moves).isGameOver())
  if(spec.authoredMove){
    const controlId=id+':continuation-control',selectedId=id+':authored'
    const control=get(controlId),selected=get(selectedId)
    const controlJob=manifest.jobs.find(j=>j.id===controlId),selectedJob=manifest.jobs.find(j=>j.id===selectedId)
    assert.equal(controlJob.fen,selectedJob.fen)
    assert.equal(controlJob.fen,replay(spec.moves.slice(0,spec.authoredMove.index)).fen())
    assert.deepEqual(selectedJob.roots,[spec.authoredMove.uci])
    const difference=control.cp-selected.cp,loss=Math.max(0,difference)
    assert(loss<=plan.enginePlan.maximumAuthoredMoveLossCp,`Authored continuation rejected: ${spec.id}`)
    continuationChecks.push({courseId:spec.id,san:spec.authoredMove.san,controlId,selectedId,fen:controlJob.fen,
      control,selected,signedCpDifference:difference,acceptanceLoss:loss})
  }
  const course={id:spec.id,family:spec.family,title:spec.title,moves:spec.moves,variant:true,roadmapLot:plan.lot,
    contrast:spec.contrast,whitePlan:spec.whitePlan,blackPlan:spec.blackPlan,endpointReason:spec.endpointReason,
    sourceDisclosure:spec.sourceDisclosure,editorialLine:spec.moves.join(' '),editorialNotes:spec.editorialNotes,
    provenance:{...spec.provenance,...(spec.authoredMove?{continuationStatus:'bounded-engine-checked'}:{}),
      source:plan.source.url,revision:plan.source.revision,sourceCatalogSha256:plan.source.catalogSha256,
      sourceId:source.id,sourceName:source.name,sourceEco:source.eco,sourceRecords:spec.sourceRecords,
      rootPositionId:spec.sourceRecords[0].positionId,engineSignature:signature}}
  assert(ex.beforeIndex<=course.moves.length)
  const board=replay(course.moves.slice(0,ex.beforeIndex)),before=board.fen(),initial=material(board,ex.exerciseSide)
  const designEx=design.exercises.find(row=>row.id===ex.id)
  assert.equal(before,designEx.before);assert.notEqual(board.turn(),ex.exerciseSide)
  board.move(ex.mistake);const after=board.fen();assert.equal(after,designEx.after)
  assert.equal(board.turn(),ex.exerciseSide)
  assert.deepEqual(board.moves({verbose:true}).filter(move=>move.captured===ex.capturedType).map(move=>move.san),[ex.answer])
  assert.equal(board.move(ex.answer).captured,ex.capturedType)
  const answerFen=board.fen(),replies=[]
  let minimum=material(board,ex.exerciseSide)-initial
  for(const san of board.moves()){
    board.move(san);assert(!board.isGameOver())
    const materialGain=material(board,ex.exerciseSide)-initial
    minimum=Math.min(minimum,materialGain);replies.push({san,fen:board.fen(),materialGain});board.undo()
  }
  assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain);assert(minimum>=policy.minimumImmediateMaterial)
  assert.equal(replies.length,ex.expectedLegalImmediateReplies);assert.deepEqual(replies,designEx.replies)
  const baselineJob=manifest.jobs.find(j=>j.fen===before&&j.uses.includes('exercise-baseline'))
  const searchJob=manifest.jobs.find(j=>j.fen===after&&j.uses.includes('exercise-answer'))
  assert(baselineJob&&searchJob)
  const baseline=get(baselineJob.id),search=get(searchJob.id),cpChange=search.cp+baseline.cp
  assert(cpChange>=policy.minimumCpChange,`Exercise rejected: ${ex.id}`)
  const uci=baseline.bestmove,prevention=new Chess(before).move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}).san
  const itemSignature=hash(JSON.stringify({id:course.id,moves:course.moves,policy,engineSignature:signature,
    planSha256:manifest.inputHashes[planFile]}))
  const item={id:ex.id,courseId:course.id,family:course.family,title:course.title+': '+ex.title,
    moves:board.history(),startIndex:ex.beforeIndex+1,exerciseSide:ex.exerciseSide,variant:true,practice:true,
    signature:itemSignature,kind:policy.kind,objective:ex.objective,
    contrast:'Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.',
    whitePlan:course.whitePlan,blackPlan:course.blackPlan,
    prevention:`Prima della deviazione, ${prevention} è una possibilità proposta dal controllo. Confrontala con la scelta del corso: il controllo non dimostra che sia l’unica mossa valida.`,
    explanation:ex.explanation}
  courses.push(course);entries.push(item)
  evidence.push({id:item.id,signature:itemSignature,before,mistake:ex.mistake,after,answer:ex.answer,answerFen,
    capturedType:ex.capturedType,baselineJobId:baselineJob.id,searchJobId:searchJob.id,baseline,search,cpChange,
    minimumImmediateMaterialGain:minimum,legalImmediateReplies:replies.length,replies,engineSignature:signature,
    objective:'Immediate capture of the declared target type; no unique-winning-move or full-game claim'})
}
assert.equal(courses.length,3);assert.equal(continuationChecks.length,2);assert.equal(evidence.length,3)
const proof={schema:1,lot:plan.lot,policy,engineSignature:signature,goCommands:attempts.length,
  nodesRequested:attempts.length*policy.nodes,nodesActual:attempts.reduce((n,row)=>n+row.response.nodesActual,0),
  continuationChecks,evidence,uncovered:[]}
const outputs={
  [plan.plannedFiles.courseModule]:'// Fixed source sequences with separately checked authored continuations.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,entries:courses},null,2)+'\n',
  [plan.plannedFiles.practicalModule]:'// Constructed deviations checked by this lot\'s frozen engine ledger.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,policy,entries,uncovered:[]},null,2)+'\n',
  [plan.plannedFiles.practicalVerification]:JSON.stringify(proof,null,2)+'\n',
}
// All gates above must pass before any of the publication files are written.
for(const [file,text] of Object.entries(outputs)){
  if(check)assert.equal(await fs.readFile(file,'utf8'),text,`Generated artifact differs: ${file}`)
  else await fs.writeFile(file,text)
}
console.log(JSON.stringify({mode:check?'check':'write',status:'PASS',courses:3,practicalCases:3,goCommands:proof.goCommands,
  nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
  continuation:continuationChecks.map(c=>({courseId:c.courseId,signedCpDifference:c.signedCpDifference,acceptanceLoss:c.acceptanceLoss})),
  exercises:evidence.map(e=>({id:e.id,cpChange:e.cpChange,legalImmediateReplies:e.legalImmediateReplies,minimumImmediateMaterialGain:e.minimumImmediateMaterialGain}))},null,2))
