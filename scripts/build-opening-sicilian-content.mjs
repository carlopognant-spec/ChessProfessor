// Offline publication gate for the frozen P02.2-SIC-01 inputs; no engine process.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {parseOpeningSearch} from './opening-bounded-engine.mjs'

assert(process.argv.slice(2).every(arg=>arg==='--check'))
const check=process.argv.includes('--check'),hash=value=>createHash('sha256').update(value).digest('hex')
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
const planFile='docs/data/opening-sicilian-p022-plan.json',plan=await read(planFile)
const directory='docs/data/opening-sicilian-p022-engine',manifest=await read(directory+'/manifest.json')
const signature=hash(JSON.stringify(manifest,null,2)+'\n')
assert.deepEqual(manifest.policy,plan.enginePlan)
assert.equal(hash(await fs.readFile(plan.enginePlan.executable)),plan.enginePlan.sha256)
for(const [file,sha]of Object.entries(manifest.inputHashes))assert.equal(hash(await fs.readFile(file)),sha,file)
for(const [file,sha]of Object.entries(plan.preserveFiles))assert.equal(hash(await fs.readFile(file)),sha,file)
assert.equal(hash(await fs.readFile('src/data/openingCatalog.json')),plan.sourceCatalogSha256)
const catalog=await read('src/data/openingCatalog.json')
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
  threads:1,hashMb:32,minimumCpChange:200,minimumImmediateMaterial:2,kind:'constructed-deviation-v1'}
const courseEntries=[],practicalEntries=[],evidence=[]
const material=(board,side)=>board.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
for(const spec of plan.courses){
  const b=new Chess();b.loadPgn(spec.sourcePgn)
  const source=catalog.entries.find(row=>row.id===spec.sourceId),moves=b.history()
  assert.deepEqual(moves,source.moves);assert.equal(moves.length,spec.sourcePlies);assert(!b.isGameOver())
  const course={id:spec.id,family:spec.family,title:spec.title,moves,variant:true,roadmapLot:plan.lot,
    contrast:spec.contrast,whitePlan:spec.whitePlan,blackPlan:spec.blackPlan,endpointReason:spec.endpointReason,
    editorialLine:moves.join(' '),editorialNotes:spec.editorialNotes,
    provenance:{kind:'documented-line',source:catalog.source,revision:catalog.revision,sourceCatalogSha256:plan.sourceCatalogSha256,
      sourceId:source.id,sourceName:source.name,sourceEco:source.eco,rootPositionId:spec.rootPositionId,
      documentedPlies:moves.length,generatedPlies:0}}
  courseEntries.push(course)
  const ex=spec.exercise,baseline=results.get(ex.id+':baseline'),search=results.get(ex.id+':deviation')
  assert(search.cp+baseline.cp>=policy.minimumCpChange)
  const board=new Chess();moves.slice(0,ex.beforeIndex).forEach(san=>board.move(san))
  const before=board.fen(),initial=material(board,ex.exerciseSide)
  assert.equal(before,manifest.jobs.find(job=>job.id===ex.id+':baseline').fen)
  board.move(ex.mistake)
  const after=board.fen();assert.equal(after,manifest.jobs.find(job=>job.id===ex.id+':deviation').fen)
  assert.deepEqual(board.moves({verbose:true}).filter(move=>move.captured==='q').map(move=>move.san),[ex.answer])
  board.move(ex.answer)
  const answerFen=board.fen(),replyRows=[]
  let minimum=material(board,ex.exerciseSide)-initial
  for(const reply of board.moves({verbose:true})){
    board.move(reply);assert(!board.isCheckmate());const gain=material(board,ex.exerciseSide)-initial
    minimum=Math.min(minimum,gain);replyRows.push({san:reply.san,fen:board.fen(),materialGain:gain});board.undo()
  }
  assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain);assert.equal(replyRows.length,ex.expectedLegalImmediateReplies)
  const preventionBoard=new Chess(before),uci=baseline.bestmove
  const prevention=preventionBoard.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}).san
  const itemSignature=hash(JSON.stringify({id:course.id,moves,policy,engineSignature:signature,planSha256:manifest.inputHashes[planFile]}))
  const item={id:ex.id,courseId:course.id,family:course.family,title:course.title+': la donna esposta',
    moves:board.history(),startIndex:ex.beforeIndex+1,exerciseSide:ex.exerciseSide,variant:true,practice:true,signature:itemSignature,
    kind:ex.kind,objective:ex.objective,
    contrast:'Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.',
    whitePlan:course.whitePlan,blackPlan:course.blackPlan,
    prevention:`Prima della deviazione, ${prevention} è una possibilità proposta dal controllo. Non è l'unica difesa valida: confrontala con la scelta del corso.`,
    explanation:ex.explanation}
  practicalEntries.push(item)
  evidence.push({id:item.id,signature:itemSignature,before,mistake:ex.mistake,after,answer:ex.answer,answerFen,
    baseline,search,minimumImmediateMaterialGain:minimum,legalImmediateReplies:replyRows.length,replies:replyRows,
    engineSignature:signature,objective:'Immediate queen capture; no claim of a unique winning move'})
}
const outputs={
  'src/data/openingRoadmapCourses.js':'// Documented source lines; no engine-generated course moves.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,entries:courseEntries},null,2)+'\n',
  'src/data/openingRoadmapPracticalCases.js':'// Frozen constructed deviations verified separately from the historic corpus.\nexport default '+JSON.stringify({schema:1,lot:plan.lot,policy,entries:practicalEntries,uncovered:[]},null,2)+'\n',
  'docs/data/opening-sicilian-p022-practical-verification.json':JSON.stringify({schema:1,lot:plan.lot,policy,
    engineSignature:signature,goCommands:attempts.length,nodesRequested:attempts.length*policy.nodes,
    nodesActual:attempts.reduce((n,row)=>n+row.response.nodesActual,0),evidence,uncovered:[]},null,2)+'\n'}
for(const [file,text]of Object.entries(outputs)){
  if(check)assert.equal(await fs.readFile(file,'utf8'),text,`Generated artifact differs: ${file}`)
  else await fs.writeFile(file,text)
}
console.log(JSON.stringify({mode:check?'check':'write',courses:courseEntries.length,exercises:practicalEntries.length,
  goCommands:attempts.length,nodesRequested:attempts.length*policy.nodes,nodesActual:attempts.reduce((n,row)=>n+row.response.nodesActual,0),
  cpChanges:evidence.map(row=>({id:row.id,change:row.search.cp+row.baseline.cp})),status:'PASS'},null,2))
