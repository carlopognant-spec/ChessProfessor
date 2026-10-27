import {pathToFileURL} from 'node:url'
import assert from 'node:assert/strict'
import {ROOT,json,runtime,coverageIndex,encode,write,fileHash} from './openings/common.mjs'

// Groups start at the first order not present in the playable tree. Positions shared
// by several orders are counted once; the ranking never claims teaching quality.
export function rankGroups(scope,current,{limit=12,family=null}={}){
  const states=new Map(current.states.map(r=>[r.id,r.state])),groups=new Map()
  for(const record of scope.records){
    if(states.get(record.groupId)!=='absent'||(family&&record.applicationFamily!==family))continue
    const moves=record.moves.split(' '),prefix=[]
    let missing=null
    for(const san of moves){prefix.push(san);if(!current.orders.has(prefix.join(' '))){missing=prefix.join(' ');break}}
    if(!missing)continue
    const key=record.applicationFamily+'|'+missing
    if(!groups.has(key))groups.set(key,{family:record.applicationFamily,prefix:missing,
      existingPrefixPlies:prefix.length-1,positions:new Set(),records:[],maxSourcePlies:0})
    const g=groups.get(key);g.positions.add(record.groupId);g.records.push(record.id);g.maxSourcePlies=Math.max(g.maxSourcePlies,moves.length)
  }
  const selected=new Set(),remaining=[...groups.values()],ranked=[]
  while(remaining.length&&ranked.length<limit){
    remaining.sort((a,b)=>{
      const gain=g=>[...g.positions].filter(id=>!selected.has(id)).length
      return gain(b)-gain(a)||b.existingPrefixPlies-a.existingPrefixPlies||a.prefix.localeCompare(b.prefix)||a.family.localeCompare(b.family)
    })
    const g=remaining.shift(),marginal=[...g.positions].filter(id=>!selected.has(id))
    if(!marginal.length)continue
    marginal.forEach(id=>selected.add(id))
    ranked.push({rank:ranked.length+1,family:g.family,prefix:g.prefix,existingPrefixPlies:g.existingPrefixPlies,
      sourcePositions:g.positions.size,additionalUniquePositions:marginal.length,positionIds:[...g.positions].sort(),
      sourceRecordCount:g.records.length,sourceRecordExamples:g.records.slice(0,4),maxSourcePlies:g.maxSourcePlies,
      review:'Candidate group only: review dependencies, content size and didactic value before selecting routes.'})
  }
  return {candidates:ranked,additionalUniquePositions:selected.size,candidateGroups:groups.size}
}
export async function backlog({limit=12,family=null,save=false}={}){
  const scope=await json('docs/data/opening-scope-audit.json'),{courses}=await runtime(),index=coverageIndex(courses,scope)
  const report={schema:1,status:'candidates-not-approved',scopeHash:await fileHash('docs/data/opening-scope-audit.json'),
    courses:courses.length,coverage:index.coverage,family,...rankGroups(scope,index,{limit,family}),
    criteria:['Unique absent source positions, with overlap removed after each selection.',
      'Then longest already-playable prefix, then deterministic move-order sorting.',
      'No frequency, engine quality, review effort or learning benefit inferred from this ranking.']}
  if(save)await write('docs/data/opening-pipeline/backlog.json',report)
  return report
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.chdir(ROOT)
  try{
    const args=process.argv.slice(2),opt={}
    while(args.length){const a=args.shift();if(a==='--family')opt.family=args.shift();else if(a==='--limit')opt.limit=Number(args.shift());else if(a==='--write')opt.save=true;else throw Error('Unknown argument '+a)}
    assert(opt.limit===undefined||Number.isInteger(opt.limit)&&opt.limit>0&&opt.limit<=100)
    const report=await backlog(opt)
    console.log(encode({...report,candidates:report.candidates.map(({positionIds,...row})=>row)}))
  }catch(e){console.error(e.stack);process.exitCode=1}
}
