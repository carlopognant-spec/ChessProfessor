import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {ROOT,json,resolve,runtime,hash,encode,write,exists,fileHash} from './openings/common.mjs'
import {makeBrief,saveBrief,history,inspect,page,sourceRows} from './openings/context.mjs'
import {draftRoutes,analyzePlan} from './openings/planning.mjs'
import {executeLot} from './openings-lot.mjs'

const commands=['brief','history','sources','inspect','draft','assess','run','details']
export function options(argv){
  const args=[...argv],o={command:args[0]&&!args[0].startsWith('--')?args.shift():'brief',offset:0,limit:5}
  assert(commands.includes(o.command),'Unknown command: '+o.command)
  const names={'--lot':'lot','--prefix':'prefix','--course':'course','--position':'position','--record':'record',
    '--section':'section','--plan':'plan','--step':'step','--file':'file','--limit':'limit','--offset':'offset'}
  while(args.length){const arg=args.shift()
    if(['--write','--check','--projection'].includes(arg))o[arg.slice(2)]=true
    else {assert(names[arg],'Unknown option: '+arg);assert(args[0]&&!args[0].startsWith('--'),'Missing value: '+arg);o[names[arg]]=args.shift()}
  }
  o.limit=Number(o.limit);o.offset=Number(o.offset);page([],{limit:o.limit,offset:o.offset})
  const allowed={brief:['lot','write','check'],history:[],sources:['prefix'],inspect:['lot','course','position','record','section'],
    draft:['prefix'],assess:['plan'],run:['lot','step','check','projection'],details:['file']}[o.command]
  for(const key of Object.keys(o))assert(['command','offset','limit',...allowed].includes(key),'Option not valid for '+o.command+': '+key)
  assert(!(o.write&&o.check),'Choose write or check')
  if(o.command==='run'){
    assert(['verify','prepare','collect','build','report','inventories'].includes(o.step),'Explicit --step required')
    assert(!o.check||['build','report','inventories'].includes(o.step),'Invalid --check')
    assert(!o.projection||o.step==='report','Projection requires report')
  }
  return o
}
async function persist(kind,value){
  const file=`.cache/opening-pipeline/workflow/${kind}-${hash(encode(value))}.json`
  if(!await exists(file))await write(file,value)
  return file
}
export async function execute(o){
  if(o.command==='brief'){
    const b=await makeBrief(o.lot)
    if(o.write||o.check)return {...await saveBrief(b,{check:o.check}),lot:b.lot,next:b.next}
    return b
  }
  if(o.command==='history')return {status:'historical-index; not current QA',...page(await history(),o)}
  if(o.command==='sources'){
    const scope=await json('docs/data/opening-scope-audit.json'),rows=sourceRows(scope,o.prefix)
    return {prefix:o.prefix,sourcePositions:new Set(rows.map(r=>r.groupId)).size,
      ...page(rows.map(({id,eco,name,moves,groupId})=>({id,eco,name,moves,positionId:groupId})),o)}
  }
  if(o.command==='inspect')return inspect(o)
  if(o.command==='draft'){
    const scope=await json('docs/data/opening-scope-audit.json'),{courses}=await runtime()
    const draft=draftRoutes(scope,courses,o.prefix)
    draft.inputHashes={'docs/data/opening-scope-audit.json':await fileHash('docs/data/opening-scope-audit.json')}
    draft.baselineDigest=hash(JSON.stringify(courses.map(({id,family,title,moves})=>({id,family,title,moves}))))
    return {status:draft.status,records:draft.records,sourcePositions:draft.sourcePositions,absentPositions:draft.absentPositions,
      leafOrders:draft.leafOrders,emptyCheckpoints:draft.emptyCheckpoints.length,
      routes:page(draft.routes.map(({id,moves,activeTurns})=>({id,plies:moves.length,activeTurns})),o),
      evidence:await persist('draft',draft),engineSearchesExecuted:0}
  }
  if(o.command==='assess'){
    assert(o.plan&&o.plan.startsWith('docs/data/')&&o.plan.endsWith('.json'),'Use a plan JSON under docs/data/')
    const plan=await json(o.plan),scope=await json('docs/data/opening-scope-audit.json'),{courses}=await runtime()
    const ids=new Set(plan.courses.map(c=>c.id)),baseline=courses.filter(c=>!ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    if(plan.baseline?.courseDigest)assert.equal(hash(JSON.stringify(baseline)),plan.baseline.courseDigest,'Baseline changed')
    const result=analyzePlan(plan,baseline,scope)
    result.inputHashes={[o.plan]:await fileHash(o.plan),'docs/data/opening-scope-audit.json':await fileHash('docs/data/opening-scope-audit.json')}
    result.baselineDigest=hash(JSON.stringify(baseline))
    return {status:result.status,...result.summary,evidence:await persist('assessment',result),limits:result.limits}
  }
  if(o.command==='run'){
    const result=await executeLot({command:o.step,lot:o.lot,check:o.check??false,projection:o.projection??false})
    const fields=['status','lot','mode','courses','exercises','preservedFiles','exerciseReplies','jobs','baseline','projection',
      'comparisons','goCommands','nodesRequested','nodesActual','currentCourses','currentExercises','installed','projectedCourses',
      'newExactPositions','newTransposedPositions','coverage','projectedCoverage','engineSearchesExecuted']
    return {...Object.fromEntries(fields.filter(k=>k in result).map(k=>[k,result[k]])),evidence:await persist(o.step,result)}
  }
  if(o.command==='details'){
    assert(o.file?.startsWith('.cache/opening-pipeline/workflow/')&&o.file.endsWith('.json'),'Only workflow artifacts are supported')
    const text=await fs.readFile(resolve(o.file),'utf8'),lines=text.split('\n')
    return {file:o.file,...page(lines.map((text,i)=>({line:i+1,text:text.slice(0,1200),clipped:text.length>1200})),o)}
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.chdir(ROOT)
  try{console.log(encode(await execute(options(process.argv.slice(2)))))}
  catch(e){const evidence=await persist('error',{status:'failed',error:e.message,stack:e.stack})
    console.error(encode({status:'failed',error:e.message.slice(0,700),evidence}));process.exitCode=1}
}
