import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {Chess} from 'chess.js'

export const ROOT=fileURLToPath(new URL('../../',import.meta.url))
export const encode=value=>JSON.stringify(value,null,2)+'\n'
export const hash=value=>createHash('sha256').update(value).digest('hex')
export const json=async file=>JSON.parse(await fs.readFile(resolve(file),'utf8'))
export const exists=async file=>fs.access(resolve(file)).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e})
export function resolve(file){
  assert(typeof file==='string'&&file.length,'Missing workspace path')
  const absolute=path.resolve(ROOT,file),relative=path.relative(ROOT,absolute)
  assert(relative&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative),'Path outside workspace')
  assert(!relative.split(/[\\/]/).some(p=>/^\.env(?:\.|$)/i.test(p)),'Environment files are excluded')
  return absolute
}
export const fileHash=async file=>hash(await fs.readFile(resolve(file)))
export async function write(file,value){
  await fs.mkdir(path.dirname(resolve(file)),{recursive:true})
  const text=typeof value==='string'?value:encode(value)
  // Rename within the same directory: a crashed write cannot become a valid checkpoint.
  const temporary=resolve(file)+`.${process.pid}.tmp`
  await fs.writeFile(temporary,text);await fs.rename(temporary,resolve(file))
}
export async function frozen(file,value){
  await fs.mkdir(path.dirname(resolve(file)),{recursive:true})
  const text=encode(value)
  try{await fs.writeFile(resolve(file),text,{flag:'wx'})}
  catch(e){if(e.code!=='EEXIST')throw e;assert.equal(await fs.readFile(resolve(file),'utf8'),text,`Frozen file differs: ${file}`)}
}
export async function hashes(files){
  const out={};for(const f of [...new Set(files)].sort())out[f]=await fileHash(f);return out
}
export async function verifyHashes(expected){
  for(const [f,sha] of Object.entries(expected))assert.equal(await fileHash(f),sha,`Input changed: ${f}`)
}
export const replay=moves=>{const b=new Chess();for(const san of moves)assert.equal(b.move(san).san,san);return b}
export const positionKey=b=>b.fen().split(' ').slice(0,4).join(' ')
export const uci=m=>m.from+m.to+(m.promotion??'')
export const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)

export function exerciseEvidence(spec,minimumRequired){
  const ex=spec.exercise,b=replay(spec.moves.slice(0,ex.beforeIndex)),before=b.fen(),initial=material(b,ex.exerciseSide)
  assert(Number.isInteger(ex.beforeIndex)&&ex.beforeIndex>=0&&ex.beforeIndex<=spec.moves.length)
  assert.notEqual(b.turn(),ex.exerciseSide);assert.notEqual(ex.mistake,spec.moves[ex.beforeIndex])
  assert.equal(b.move(ex.mistake).san,ex.mistake)
  const after=b.fen();assert.equal(b.turn(),ex.exerciseSide)
  const captures=b.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)
  assert.deepEqual(captures,[ex.answer]);assert.equal(b.move(ex.answer).captured,ex.capturedType)
  const answerFen=b.fen(),moves=b.history(),replies=[]
  let minimum=material(b,ex.exerciseSide)-initial
  for(const san of b.moves()){
    b.move(san);assert(!b.isGameOver(),'Immediate terminal position needs design review')
    const materialGain=material(b,ex.exerciseSide)-initial
    minimum=Math.min(minimum,materialGain);replies.push({san,fen:b.fen(),materialGain});b.undo()
  }
  assert.equal(replies.length,ex.expectedLegalImmediateReplies);assert.equal(minimum,ex.expectedMinimumImmediateMaterialGain)
  assert(minimum>=minimumRequired,'Insufficient immediate material')
  return {id:ex.id,before,after,answerFen,moves,capturedType:ex.capturedType,replies,
    legalImmediateReplies:replies.length,minimumImmediateMaterialGain:minimum}
}

export function engineJobs(plan,exercises){
  const jobs=[]
  for(const spec of plan.courses){
    const ex=exercises.find(e=>e.id===spec.exercise.id),id=spec.id.slice(spec.id.indexOf(':')+1)
    const authored=spec.authoredMoves??[]
    assert.deepEqual(authored.map(a=>a.index),Array.from({length:spec.provenance.authoredContinuationPlies},(_,i)=>spec.provenance.documentedPlies+i))
    let shared=false
    for(const a of authored){
      const b=replay(spec.moves.slice(0,a.index)),fen=b.fen()
      assert.equal(spec.moves[a.index],a.san);assert.equal(uci(b.move(a.san)),a.uci)
      const reuse=fen===ex.before;shared ||= reuse
      jobs.push({id:id+':continuation-control:'+a.index,courseId:spec.id,authoredIndex:a.index,fen,roots:[],
        uses:reuse?['continuation-control','exercise-baseline']:['continuation-control']})
      jobs.push({id:id+':authored:'+a.index,courseId:spec.id,authoredIndex:a.index,fen,roots:[a.uci],expectedAnswer:a.san,uses:['authored-comparison']})
    }
    if(!shared)jobs.push({id:id+':exercise-baseline',courseId:spec.id,fen:ex.before,roots:[],uses:['exercise-baseline']})
    jobs.push({id:id+':deviation',courseId:spec.id,fen:ex.after,roots:[],expectedAnswer:spec.exercise.answer,uses:['exercise-answer']})
  }
  assert.equal(new Set(jobs.map(j=>j.id)).size,jobs.length)
  // Sharing within a course is explicit. Cross-course reuse requires a reviewed plan.
  return jobs
}

export async function runtime(){
  const [{ALL_OPENING_JOURNEYS,openingWrittenContext},{default:practical}]=await Promise.all([
    import('../../src/lib/openingJourneys.js'),import('../../src/lib/openingPracticalLibrary.js')])
  return {courses:ALL_OPENING_JOURNEYS,openingWrittenContext,practical}
}

export async function loadLot(id){
  const registry=await json('docs/data/opening-pipeline/lots.json')
  id??=registry.activeLot
  const config=registry.lots[id]
  assert(config,`Unknown lot: ${id}`)
  const plan=await json(config.plan),design=await json(config.design),original=await json('docs/data/opening-taxonomy-baseline.json')
  assert.equal(plan.lot,config.lot);assert.equal(design.lot,plan.lot)
  await verifyHashes({...original.hashes,...plan.preserveFiles})
  assert.equal(await fileHash(config.plan),design.inputHashes[config.plan])
  assert.equal(await fileHash(plan.enginePlan.executable),plan.enginePlan.sha256)
  return {id,config,plan,design,registry}
}

export async function validateLot(ctx){
  const {plan,design}=ctx,{courses,practical}=await runtime()
  const ids=new Set(design.baseline.courses.map(c=>c.id))
  const rows=courses.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
  assert.deepEqual(rows,design.baseline.courses);assert.equal(rows.length,plan.baseline.courseCount)
  assert.equal(hash(JSON.stringify(rows)),plan.baseline.courseDigest)
  const old=practical.entries.filter(c=>ids.has(c.courseId))
  assert.equal(old.length,plan.baseline.practicalCount);assert.equal(hash(JSON.stringify(old)),plan.baseline.practicalDigest)
  assert.equal(new Set(plan.courses.map(c=>c.id)).size,plan.courses.length)
  const scope=await json('docs/data/opening-scope-audit.json'),catalog=await json('src/data/openingCatalog.json')
  const records=new Map(scope.records.map(r=>[r.id,r])),positions=new Map(scope.positions.map(p=>[p.id,p]))
  const exercises=[]
  for(const spec of plan.courses){
    assert(!ids.has(spec.id));assert.equal(spec.exercise.id,'practice:'+spec.id)
    const p=spec.provenance;assert.equal(p.generatedPlies,0)
    assert.equal(spec.moves.length,p.documentedPlies+p.authoredContinuationPlies);assert(!replay(spec.moves).isGameOver())
    assert.equal(spec.sourceRecords.at(-1).plies,p.documentedPlies)
    for(const ref of spec.sourceRecords){
      const r=records.get(ref.id),b=replay(spec.moves.slice(0,ref.plies));assert(r,`Unknown source ${ref.id}`)
      assert.equal(r.moves,b.history().join(' '));assert.equal(r.groupId,ref.positionId)
      assert.equal(positionKey(b),positions.get(ref.positionId)?.position)
      if(ref.id.startsWith('eco:'))assert.deepEqual(catalog.entries.find(c=>c.id===ref.id.slice(4))?.moves,b.history())
    }
    for(const [pair,note] of Object.entries(spec.editorialNotes)){
      assert(Number.isInteger(Number(pair))&&Number(pair)%2===0&&Number(pair)<spec.moves.length&&note.length)
    }
    const ex=exerciseEvidence(spec,plan.enginePlan.minimumImmediateMaterial),saved=design.exercises.find(e=>e.id===ex.id)
    assert(saved);for(const f of ['before','after','answerFen','replies'])assert.deepEqual(ex[f],saved[f])
    exercises.push(ex)
  }
  const jobs=engineJobs(plan,exercises)
  assert.deepEqual(jobs,design.engineJobs);assert.equal(jobs.length,plan.enginePlan.primaryJobs)
  assert.equal(plan.enginePlan.maximumGoCommands,jobs.length*2)
  assert.equal(plan.enginePlan.maximumRequestedNodes,plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo)
  return {...ctx,exercises,jobs,scope,catalog,baselineRows:rows}
}

// A source position can have several orders; exact always takes precedence.
export function coverageIndex(courses,scope){
  const positions=new Set(),orders=new Set(),root=new Map()
  for(const c of courses){let node=root;for(const san of c.moves){if(!node.has(san))node.set(san,new Map());node=node.get(san)}}
  const b=new Chess()
  function visit(node,prefix){for(const [san,children] of node){
    b.move(san);const order=prefix?prefix+' '+san:san
    orders.add(order);positions.add(positionKey(b));visit(children,order);b.undo()
  }}
  visit(root,'')
  const records=new Map(scope.records.map(r=>[r.id,r])),coverage={exact:0,'transposition-only':0,absent:0}
  const states=scope.positions.map(p=>{
    const state=p.recordIds.some(id=>orders.has(records.get(id).moves))?'exact':positions.has(p.position)?'transposition-only':'absent'
    coverage[state]++;return {id:p.id,state}
  })
  return {coverage,states,orders,positions}
}
