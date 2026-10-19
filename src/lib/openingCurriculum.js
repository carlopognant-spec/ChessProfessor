// A trie keeps nested alternatives together. An alias is not another route,
// and a shared prefix is replayed only when the learner explicitly restarts.
export const commonPrefix=(a,b)=>{
  let index=0
  while(index<Math.min(a.length,b.length)&&a[index]===b[index])index++
  return index
}
export const prefixKey=moves=>moves.join(' ')

export function curriculumTree(courses){
  const root={prefix:[],children:new Map(),courses:[],ends:[]}
  for(const course of courses){
    let node=root;node.courses.push(course)
    for(const san of course.moves){
      if(!node.children.has(san))node.children.set(san,{prefix:[...node.prefix,san],children:new Map(),courses:[],ends:[]})
      node=node.children.get(san);node.courses.push(course)
    }
    node.ends.push(course)
  }
  return root
}

export function orderedBranches(node,statistics={},main){
  const counts=statistics[prefixKey(node.prefix)]?.counts
  return [...node.children.entries()].sort(([a],[b])=>{
    const preferred=main&&commonPrefix(node.prefix,main.moves)===node.prefix.length?main.moves[node.prefix.length]:null
    if(a===preferred)return -1
    if(b===preferred)return 1
    // No frequency claim when data are absent. Stable authored order is fallback.
    return counts?(counts[b]??0)-(counts[a]??0):0
  }).map(([san,child])=>({san,node:child,course:child.courses[0],count:counts?.[san]??null}))
}

export function curriculumOrder(courses,statistics={}){
  const result=[],main=courses[0]
  function visit(node){
    result.push(...node.ends)
    for(const branch of orderedBranches(node,statistics,main))visit(branch.node)
  }
  visit(curriculumTree(courses))
  return result
}

export function curriculumFork(courses,moves,index){
  let node=curriculumTree(courses)
  for(const san of moves.slice(0,index)){
    node=node.children.get(san)
    if(!node)return null
  }
  return node.children.size>1?node:null
}

export function nextCurriculumRoute(courses,completed,statistics={}){
  const course=curriculumOrder(courses,statistics).find(course=>!completed.includes(course.id))
  if(!course)return null
  return {course,index:curriculumReturnIndex(courses,completed,course)}
}

export const curriculumReturnIndex=(courses,completed,course)=>courses.filter(previous=>completed.includes(previous.id))
  .reduce((best,previous)=>Math.max(best,commonPrefix(previous.moves,course.moves)),0)

const cache=new Map()
let blockedUntil=0
export const OPENING_FREQUENCY_SAMPLE='Lichess · rapid e classical · Elo sotto 1600'

// Statistics rank existing teaching branches; they never define book moves or
// label a legal move as a mistake. Limit queries to forks the learner reaches.
export async function openingFrequencies(fen,{token=import.meta.env?.VITE_LICHESS_TOKEN}={}){
  if(cache.has(fen))return cache.get(fen)
  if(Date.now()<blockedUntil)return {status:'unavailable'}
  const request=(async()=>{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000)
    try{
      const query=new URLSearchParams({variant:'standard',fen,speeds:'rapid,classical',ratings:'0,1000,1200,1400',moves:'40',topGames:'0',recentGames:'0'})
      const response=await fetch(`https://explorer.lichess.org/lichess?${query}`,{signal:controller.signal,
        headers:token?{Authorization:`Bearer ${token}`}:{}})
      if([401,403,429].includes(response.status))blockedUntil=Date.now()+60000
      if(!response.ok)throw Error(`HTTP ${response.status}`)
      const data=await response.json()
      if(!Array.isArray(data.moves))throw Error('Missing move statistics')
      const counts={}
      for(const move of data.moves){
        const values=[move.white,move.draws,move.black]
        if(typeof move.san!=='string'||!values.every(n=>Number.isSafeInteger(n)&&n>=0))continue
        counts[move.san]=values.reduce((a,b)=>a+b,0)
      }
      const total=[data.white,data.draws,data.black].reduce((sum,n)=>sum+(Number.isSafeInteger(n)&&n>=0?n:0),0)
      return total>0?{status:'ready',counts,total,sample:OPENING_FREQUENCY_SAMPLE}:{status:'empty'}
    }catch{return {status:'unavailable'}}
    finally{clearTimeout(timer)}
  })()
  if(cache.size>=100)cache.delete(cache.keys().next().value)
  cache.set(fen,request)
  return request
}
