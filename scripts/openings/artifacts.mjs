// Offline publication gate. No engine searches are performed by this builder.
import fs from 'node:fs/promises'
import {json,resolve,hash,encode,runtime,coverageIndex} from './common.mjs'
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {parseOpeningSearch} from '../opening-bounded-engine.mjs'

// References preserve the original signatures and raw UCI transcripts. No result is
// relabelled as a newly executed search, and only one level of provenance is allowed.
export async function verifyReusedJob(reference,job,policy){
  const {directory,jobIndex,manifestSha256}=reference
  assert.equal(reference.jobId,job.id,'Reuse target job differs')
  assert(Number.isInteger(jobIndex)&&jobIndex>0,'Invalid source job index')
  const manifestFile=directory+'/manifest.json',manifest=await json(manifestFile)
  assert.equal(hash(await fs.readFile(resolve(manifestFile))),manifestSha256,'Source manifest changed')
  const signature=hash(encode(manifest)),sourceJob=manifest.jobs[jobIndex-1]
  assert(sourceJob,'Missing source job');assert.equal(sourceJob.fen,job.fen,'Reuse FEN differs')
  assert.deepEqual(sourceJob.roots,job.roots,'Reuse roots differ')
  const budgetKeys=new Set(['primaryJobs','maximumGoCommands','maximumRequestedNodes','publicationPolicy'])
  const searchPolicy=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!budgetKeys.has(key)))
  assert.deepEqual(searchPolicy(manifest.policy),searchPolicy(policy),'Reuse policy differs')
  assert.equal(manifest.engineSha256,policy.sha256,'Reuse engine differs')
  assert.equal(hash(await fs.readFile(resolve(policy.executable))),policy.sha256,'Engine binary changed')
  for(const [file,sha] of Object.entries(manifest.inputHashes))
    assert.equal(hash(await fs.readFile(resolve(file))),sha,`Source input changed: ${file}`)
  const resultFile=`${directory}/results/${jobIndex}.json`,saved=await json(resultFile)
  assert(!saved.reusedFrom,'Nested evidence reuse is not supported')
  assert.equal(saved.signature,signature);assert.equal(saved.jobId,sourceJob.id);assert.equal(saved.status,'complete')
  assert(saved.attemptIds.length>=1&&saved.attemptIds.length<=2)
  const names=(await fs.readdir(resolve(directory+'/attempts'))).filter(n=>n.endsWith('.request.json')).sort()
  assert(names.length<=manifest.policy.maximumGoCommands,'Source go budget exceeded')
  assert(names.length*manifest.policy.nodesPerGo<=manifest.policy.maximumRequestedNodes,'Source node budget exceeded')
  const actualIds=[]
  for(const name of names){const request=await json(directory+'/attempts/'+name)
    assert.equal(request.signature,signature)
    if(request.jobId===sourceJob.id)actualIds.push(name.slice(0,-'.request.json'.length))}
  assert.deepEqual(actualIds,saved.attemptIds,'Source attempts differ')
  const inputFiles=[manifestFile,resultFile,...Object.keys(manifest.inputHashes)],attempts=[]
  for(const number of saved.attemptIds){
    const base=`${directory}/attempts/${number}`,request=await json(base+'.request.json'),response=await json(base+'.response.json')
    inputFiles.push(base+'.request.json',base+'.response.json')
    assert.equal(request.signature,signature);assert.equal(response.signature,signature)
    assert.equal(request.jobId,sourceJob.id);assert.equal(response.jobId,sourceJob.id);assert.equal(response.status,'complete')
    assert.equal(request.fen,sourceJob.fen);assert.equal(request.nodesRequested,policy.nodesPerGo)
    assert.equal(request.command,`go nodes ${request.nodesRequested}${request.roots.length?' searchmoves '+request.roots.join(' '):''}`)
    assert.equal(response.nodesActual,Math.max(0,...response.lines.map(line=>Number(line.match(/\bnodes (\d+)/)?.[1]??0))))
    attempts.push({number,request,response})
  }
  const first=attempts[0],last=attempts.at(-1)
  assert.equal(first.request.kind,'primary');assert.deepEqual(first.request.roots,job.roots)
  const primary=parseOpeningSearch(first.response.lines,job.roots)
  if(attempts.length===2){
    assert(primary.needsConfirmation);assert.equal(last.request.kind,'confirmation')
    assert.deepEqual(last.request.roots,[primary.bestmove])
  }else assert(!primary.needsConfirmation)
  const parsed=parseOpeningSearch(last.response.lines,last.request.roots)
  assert(!parsed.needsConfirmation);assert.deepEqual(saved.result,{...parsed,attempt:last.number})
  assert(Number.isFinite(parsed.cp)&&parsed.mate===null,'Mate scores require design review')
  const board=new Chess(job.fen)
  for(const uci of parsed.pv)board.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
  assert.equal(parsed.pv[0],parsed.bestmove)
  if(job.expectedAnswer){const b=new Chess(job.fen);assert.equal(b.move({from:parsed.bestmove.slice(0,2),to:parsed.bestmove.slice(2,4),promotion:parsed.bestmove[4]}).san,job.expectedAnswer)}
  return {result:saved.result,parsed,attempts,inputFiles,sourceSignature:signature,sourceJobId:sourceJob.id}
}

export async function buildArtifacts(ctx){
const {plan,config,design}=ctx,planFile=config.plan
const read=json,directory=plan.plannedFiles.engineDirectory,manifest=await read(directory+'/manifest.json')
const original=await read('docs/data/opening-taxonomy-baseline.json')
const signature=hash(JSON.stringify(manifest,null,2)+'\n')
assert.deepEqual(manifest.policy,plan.enginePlan)
assert.equal(hash(await fs.readFile(resolve(plan.enginePlan.executable))),plan.enginePlan.sha256)
for(const [file,sha] of Object.entries({...original.hashes,...plan.preserveFiles,...manifest.inputHashes}))
  assert.equal(hash(await fs.readFile(resolve(file))),sha,file)
assert.equal(hash(await fs.readFile(resolve(planFile))),design.inputHashes[planFile])
assert.deepEqual(manifest.jobs,design.engineJobs);assert.equal(manifest.jobs.length,plan.enginePlan.primaryJobs)
assert.deepEqual(manifest.reuseEngineJobs??[],plan.reuseEngineJobs??[])
const results=new Map(),attempts=[],reused=[]
const requests=(await fs.readdir(resolve(directory+'/attempts'))).filter(name=>name.endsWith('.request.json')).sort()
assert(requests.length<=plan.enginePlan.maximumGoCommands)
assert(requests.length*plan.enginePlan.nodesPerGo<=plan.enginePlan.maximumRequestedNodes)
for(const file of requests){
  const number=file.match(/^(\d+)\.request\.json$/)?.[1],request=await read(directory+'/attempts/'+file)
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
  const reference=(manifest.reuseEngineJobs??[]).find(r=>r.jobId===job.id)
  if(reference){
    assert.deepEqual(saved.reusedFrom,reference)
    assert(!attempts.some(row=>row.request.jobId===job.id),'Reused job was also searched')
    const source=await verifyReusedJob(reference,job,plan.enginePlan)
    assert.deepEqual(saved.result,source.result);assert.deepEqual(saved.attemptIds,[])
    reused.push({jobId:job.id,...reference,sourceSignature:source.sourceSignature,sourceJobId:source.sourceJobId,
      goCommands:source.attempts.length,nodesRequested:source.attempts.length*plan.enginePlan.nodesPerGo,
      nodesActual:source.attempts.reduce((n,a)=>n+a.response.nodesActual,0)})
    results.set(job.id,source.parsed);continue
  }
  assert(!saved.reusedFrom,'Unplanned evidence reuse')
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
  const id=spec.id.slice(spec.id.indexOf(':')+1),ex=spec.exercise
  const sourceRecord=spec.sourceRecords.at(-1),primaryIsEco=sourceRecord.id.startsWith('eco:')
  const source=primaryIsEco?catalog.entries.find(row=>row.id===sourceRecord.id.slice(4)):scope.records.find(row=>row.id===sourceRecord.id)
  assert(source,'Primary source missing')
  assert.deepEqual(Array.isArray(source.moves)?source.moves:source.moves.split(' '),spec.moves.slice(0,spec.provenance.documentedPlies))
  for(const s of spec.sourceRecords){
    const record=scope.records.find(r=>r.id===s.id),b=replay(spec.moves.slice(0,s.plies))
    assert.equal(record.moves,b.history().join(' '));assert.equal(record.groupId,s.positionId)
    assert.equal(b.fen().split(' ').slice(0,4).join(' '),scope.positions.find(p=>p.id===s.positionId).position)
  }
  assert.equal(spec.moves.length,spec.provenance.documentedPlies+spec.provenance.authoredContinuationPlies)
  assert.equal(spec.provenance.generatedPlies,0);assert(!replay(spec.moves).isGameOver())
  assert.deepEqual(spec.authoredMoves.map(m=>m.index),Array.from({length:spec.provenance.authoredContinuationPlies},(_,i)=>spec.provenance.documentedPlies+i))
  for(const authored of spec.authoredMoves){
    assert.equal(spec.moves[authored.index],authored.san)
    const authoredBoard=replay(spec.moves.slice(0,authored.index)),move=authoredBoard.move(authored.san)
    assert.equal(move.from+move.to+(move.promotion??''),authored.uci)
    const controlId=id+':continuation-control:'+authored.index,selectedId=id+':authored:'+authored.index
    const control=get(controlId),selected=get(selectedId)
    const controlJob=manifest.jobs.find(j=>j.id===controlId),selectedJob=manifest.jobs.find(j=>j.id===selectedId)
    assert.equal(controlJob.fen,selectedJob.fen)
    assert.equal(controlJob.fen,replay(spec.moves.slice(0,authored.index)).fen())
    assert.equal(controlJob.courseId,spec.id);assert.equal(selectedJob.courseId,spec.id)
    assert.equal(controlJob.authoredIndex,authored.index);assert.equal(selectedJob.authoredIndex,authored.index)
    assert.deepEqual(controlJob.roots,[]);assert.deepEqual(selectedJob.roots,[authored.uci])
    assert.equal(selected.bestmove,authored.uci)
    const difference=control.cp-selected.cp,loss=Math.max(0,difference)
    assert(loss<=plan.enginePlan.maximumAuthoredMoveLossCp,`Authored continuation rejected: ${spec.id}`)
    continuationChecks.push({courseId:spec.id,authoredIndex:authored.index,san:authored.san,controlId,selectedId,fen:controlJob.fen,
      control,selected,signedCpDifference:difference,acceptanceLoss:loss})
  }
  const course={id:spec.id,family:spec.family,title:spec.title,moves:spec.moves,variant:true,roadmapLot:plan.lot,
    contrast:spec.contrast,whitePlan:spec.whitePlan,blackPlan:spec.blackPlan,endpointReason:spec.endpointReason,
    sourceDisclosure:spec.sourceDisclosure,editorialLine:spec.moves.join(' '),editorialNotes:spec.editorialNotes,
    provenance:{...spec.provenance,...(spec.authoredMoves.length?{continuationStatus:'bounded-engine-checked'}:{}),
      source:primaryIsEco?plan.source.url:plan.source.lichess.source,
      revision:primaryIsEco?plan.source.revision:plan.source.lichess.revision,sourceCatalogSha256:plan.source.catalogSha256,
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
assert.equal(courses.length,plan.courses.length);assert.equal(continuationChecks.length,plan.courses.reduce((n,c)=>n+c.authoredMoves.length,0));assert.equal(evidence.length,plan.courses.length)
const proof={schema:1,lot:plan.lot,policy,engineSignature:signature,goCommands:attempts.length,
  nodesRequested:attempts.length*policy.nodes,nodesActual:attempts.reduce((n,row)=>n+row.response.nodesActual,0),
  ...(reused.length?{reusedJobs:reused.length,reusedEvidence:reused,nodesReused:reused.reduce((n,r)=>n+r.nodesActual,0)}:{}),
  continuationChecks,evidence,uncovered:[]}
const outputs={
  [plan.plannedFiles.courseModule]:'// Fixed source sequences with separately checked authored continuations.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,entries:courses},null,2)+'\n',
  [plan.plannedFiles.practicalModule]:'// Constructed deviations checked by this lot\'s frozen engine ledger.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,policy,entries,uncovered:[]},null,2)+'\n',
  [plan.plannedFiles.practicalVerification]:JSON.stringify(proof,null,2)+'\n',
}
return {outputs,proof,courses,entries,manifest}
}

export async function summarize(ctx,{projection=false}={}){
  const {plan,design}=ctx,{courses,practical,openingWrittenContext}=await runtime()
  const baseline=coverageIndex(design.baseline.courses,ctx.scope)
  assert.deepEqual(baseline.coverage,plan.baseline.coverage)
  const projected=coverageIndex([...design.baseline.courses,...plan.courses],ctx.scope)
  assert.deepEqual(projected.coverage,design.coverage.projected)
  const before=new Map(baseline.states.map(r=>[r.id,r.state]))
  const newlyReached=projected.states.filter(r=>before.get(r.id)==='absent'&&r.state!=='absent')
  assert.deepEqual(newlyReached.map(r=>r.id).sort(),design.coverage.newlyReached.map(r=>r.id).sort())
  const expectedIds=new Set([...design.baseline.courses,...plan.courses].map(c=>c.id))
  const installed=plan.courses.every(spec=>courses.some(c=>c.id===spec.id&&JSON.stringify(c.moves)===JSON.stringify(spec.moves)))
  let proof=null
  if(!projection){
    assert(installed,'Courses not integrated: use report --projection')
    assert.deepEqual(new Set(courses.map(c=>c.id)),expectedIds,'Runtime has unexpected courses')
    const built=await buildArtifacts(ctx);proof=built.proof
    for(const [file,text] of Object.entries(built.outputs))assert.equal(await fs.readFile(resolve(file),'utf8'),text,`Generated artifact differs: ${file}`)
    assert.deepEqual(coverageIndex(courses,ctx.scope).coverage,projected.coverage)
    for(const item of built.entries)assert.deepEqual(practical.entries.find(e=>e.id===item.id),item)
    assert.equal(practical.entries.length,expectedIds.size)
  }
  const commentary={explainedHalfMoves:0,pairs:0,writtenPairs:0,fullyWrittenCourses:0}
  for(const c of courses){let written=0;const pairs=Math.ceil(c.moves.length/2)
    for(let i=0;i<c.moves.length;i+=2)if(openingWrittenContext(c,i).debriefOrigin==='written')written++
    commentary.explainedHalfMoves+=c.moves.length;commentary.pairs+=pairs;commentary.writtenPairs+=written
    if(written===pairs)commentary.fullyWrittenCourses++
  }
  return {schema:2,lot:plan.lot,status:projection?'projection-not-publication':'implemented-offline-verified',
    baselineCourses:plan.baseline.courseCount,currentCourses:courses.length,currentExercises:practical.entries.length,
    plannedCourses:plan.courses.length,projectedCourses:expectedIds.size,installed,
    sourcePositions:ctx.scope.positions.length,coverage:projection?coverageIndex(courses,ctx.scope).coverage:projected.coverage,
    projectedCoverage:projected.coverage,newlyReached,
    newExactPositions:newlyReached.filter(r=>r.state==='exact').length,
    newTransposedPositions:newlyReached.filter(r=>r.state==='transposition-only').length,
    documentedPlies:plan.courses.reduce((n,c)=>n+c.provenance.documentedPlies,0),
    authoredPlies:plan.courses.reduce((n,c)=>n+c.provenance.authoredContinuationPlies,0),
    currentCommentary:commentary,engine:proof?{signature:proof.engineSignature,goCommands:proof.goCommands,
      nodesRequested:proof.nodesRequested,nodesActual:proof.nodesActual,
      ...(proof.reusedJobs?{reusedJobs:proof.reusedJobs,nodesReused:proof.nodesReused}:{})}:null,
    engineEvidenceStatus:proof?'verified-offline':'not-checked-by-this-report',
    preservedFiles:Object.keys(plan.preserveFiles).length,nextDesign:plan.nextDesign,
    limitations:['Source-position coverage is not complete theory or evidence of learned skill.',
      'Projection is never counted as installed content. Engine requests require explicit collect.',
      'Test and browser outcomes belong to the QA record, not inferred from generated files.']}
}

export function reportMarkdown(r){
  return [`# ${r.lot}: rapporto automatico`,'',`Stato: **${r.status}**.`,
    '',`Corsi installati: ${r.currentCourses}; esercizi: ${r.currentExercises}. Corsi previsti dopo il lotto: ${r.projectedCourses}.`,
    '', '| Copertura | Attuale | Proiezione |','| --- | ---: | ---: |',
    ...['exact','transposition-only','absent'].map(k=>`| ${k} | ${r.coverage[k]} | ${r.projectedCoverage[k]} |`),
    '',`Posizioni nuove previste: ${r.newExactPositions} esatte e ${r.newTransposedPositions} solo trasposte.`,
    `Semimosse del lotto: ${r.documentedPlies} documentate e ${r.authoredPlies} didattiche.`,
    `File congelati verificati: ${r.preservedFiles}. Stato prove motore: ${r.engineEvidenceStatus}.`,
    '',`Commenti attuali: ${r.currentCommentary.writtenPairs}/${r.currentCommentary.pairs} coppie con nota scritta.`,
    '',...r.limitations.map(x=>'- '+x),''].join('\n')
}
