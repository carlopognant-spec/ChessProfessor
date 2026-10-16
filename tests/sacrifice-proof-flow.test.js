import {readFileSync} from 'node:fs'
import {webcrypto} from 'node:crypto'
import {indexedDB} from 'fake-indexeddb'
import {describe,it,expect,vi} from 'vitest'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {buildRefinementPlan,refineGameEntries,selectRefinementView} from '../src/lib/analysisRefinement.js'
import {newRookKingFileAccess,verifiedRookAttackParticipation} from '../src/lib/rookAccess.js'
import {assessImmediateRecoveries} from '../src/lib/sacrificeEvidence.js'
import {sacrificeSearchFor,validatedRecoveryProofs,validSacrificeAttempt,validBoundedSacrificeSearch} from '../src/lib/sacrificeSearches.js'
import {displaySpecialMoves,formatSpecialAssessment} from '../src/lib/specialClassification.js'
import {createGameArchive} from '../src/lib/gameArchive.js'
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)))
const data=json('agent-output/special-completion-v1/cohorts.json').cases.find(c=>c.id==='game-1-chigorin-steinitz-1892')
const collection=json('agent-output/all-sacrifice-proofs-v1/collection.json')
const packets=new Map(collection.records.map(r=>{const p=json(r.path);return[p.fen+'|'+(p.searchMoves?.[0]??'*'),p.engine]}))
const search=async(fen,nodes,multiPv,options={})=>{
 const e=packets.get(fen+'|'+(options.searchMoves?.[0]??'*'));expect(e).toBeTruthy()
 expect(e.analysisMetadata.budget.value).toBe(nodes);expect(e.analysisMetadata.multiPv).toBe(multiPv)
 return structuredClone(e)
}
const mini=()=>reclassifyReviewedMoves(structuredClone(data.entries.slice(50,53)).map((e,i)=>({...e,ply:i+1})))
const numeric=es=>es.map(e=>[e.bestEval,e.bestMate,e.playedEval,e.playedMate,e.bestProbability,e.playedProbability,e.dropPct])
const rawRb3=()=>mini()[2]
function provedRb3(){
 const entries=mini(),plan=buildRefinementPlan(entries,{sacrificeOnly:true})
 const t=plan.sacrifices.find(t=>t.ply===3),get=(fen,u)=>structuredClone(packets.get(fen+'|'+(u??'*')))
 entries[2].refinement={version:plan.version,sacrifices:[{...t,version:'acceptance-search-v1',
  acceptance:get(t.fen,t.captureUci),confirmation:get(t.acceptedFen),
  recoveries:t.recoveries.map(r=>({...r,search:get(t.acceptedFen,r.uci),confirmation:get(r.afterFen)}))}]}
 return entries
}
describe('separate bounded sacrifice proofs',()=>{
 it('remembers an unfinished MultiPV iteration without accepting it as proof or repeating its search',async()=>{
  const corpus=json('agent-output/special-completion-v1/cohorts.json').cases
  const game=corpus.find(c=>c.id==='185230271130'&&c.cohort==='initial')
  const packet=json('agent-output/all-sacrifice-proofs-v1/search-27.json').engine
  expect(validSacrificeAttempt(packet,packet.fen)).toBe(true)
  expect(validBoundedSacrificeSearch(packet,packet.fen)).toBe(false)
  const entries=reclassifyReviewedMoves(game.entries),before=numeric(entries)
  let current=entries,calls=0
  for(let i=0;i<10;i++){
   const plan=buildRefinementPlan(current,{sacrificeOnly:true});if(!plan.queries.length)break
   const result=await refineGameEntries({entries:current,plan,analyzePosition:async(...args)=>{calls++;return search(...args)}})
   current=result.entries
  }
  const attempts=current.flatMap(e=>e.refinement?.sacrificeAttempts??[])
  expect(attempts.filter(a=>a.fen===packet.fen&&a.uci==null)).toHaveLength(1)
  expect(buildRefinementPlan(current,{sacrificeOnly:true}).queries).toEqual([])
  expect(numeric(selectRefinementView(current,true))).toEqual(before)
  expect(calls).toBeGreaterThan(0)
  const pgn=readFileSync(new URL('../Partite/Confermate/chesscom-185230271130/partita.pgn',import.meta.url),'utf8')
  const archive=createGameArchive({indexedDB,crypto:webcrypto,databaseName:'incomplete-sacrifice-attempt'})
  const {record}=await archive.save({pgn,analysisEntries:current})
  await archive.save({pgn,analysisEntries:entries})
  const reopened=await archive.get(record.id);await archive.close()
  expect(reopened.analysisEntries.flatMap(e=>e.refinement?.sacrificeAttempts??[]).some(a=>a.fen===packet.fen)).toBe(true)
  expect(buildRefinementPlan(reclassifyReviewedMoves(reopened.analysisEntries),{sacrificeOnly:true}).queries).toEqual([])
 },120000)
 it('verifies the whole historical request, keeps Nd6+ Great and changes only Rb3 to Brilliant',async()=>{
  const entries=reclassifyReviewedMoves(data.entries),before=selectRefinementView(entries,true),original=JSON.stringify(entries)
  const plan=buildRefinementPlan(entries,{sacrificeOnly:true}),analyze=vi.fn(search)
  expect(plan).toMatchObject({scope:'sacrifice-proof-v1',positions:[],selectedPlies:[31,53],extraSearches:8,actualNodeCap:1640000})
  const result=await refineGameEntries({entries,plan,analyzePosition:analyze}),after=selectRefinementView(result.entries,true)
  expect(after.flatMap((e,i)=>e.classification!==before[i].classification?[e.ply]:[])).toEqual([53])
  expect(after[30].classification).toBe('great');expect(after[52].classification).toBe('brilliant')
  expect(after[52].specialAssessment.brilliant.reason).toBe('compensated-rook-activation')
  expect(formatSpecialAssessment(after[52])).toContain('nuovo accesso')
  expect(numeric(after)).toEqual(numeric(before))
  expect(selectRefinementView(result.entries,false).map(e=>e.classification)).toEqual(entries.map(e=>e.classification))
  expect(displaySpecialMoves(after,false)[52].classification).toBe('excellent')
  expect(buildRefinementPlan(result.entries,{sacrificeOnly:true}).queries).toEqual([])
  expect(analyze).toHaveBeenCalledTimes(8);expect(JSON.stringify(entries)).toBe(original)
 },60000)
 it('retains completed acceptance on interruption and resumes only the material-recovery queries',async()=>{
  const entries=mini(),plan=buildRefinementPlan(entries,{sacrificeOnly:true}),controller=new AbortController()
  let partial
  await expect(refineGameEntries({entries,plan,analyzePosition:search,signal:controller.signal,onEntries:e=>{partial=e},
   onProgress:p=>{if(p.current===2)controller.abort()}})).rejects.toMatchObject({name:'AbortError'})
  expect(selectRefinementView(partial,true)[2].classification).toBe('excellent')
  const next=buildRefinementPlan(partial,{sacrificeOnly:true})
  expect(next.queries.map(q=>q.kind)).toEqual(['recovery','recovery-confirmation'])
  const result=await refineGameEntries({entries:partial,plan:next,analyzePosition:search})
  expect(selectRefinementView(result.entries,true)[2].classification).toBe('brilliant')
 })
 it('rejects a changed plan before searching',async()=>{
  const entries=mini(),plan={...buildRefinementPlan(entries,{sacrificeOnly:true}),actualNodeCap:9999999},analyze=vi.fn()
  await expect(refineGameEntries({entries,plan,analyzePosition:analyze})).rejects.toThrow('Piano di approfondimento non valido')
  expect(analyze).not.toHaveBeenCalled()
 })
 it('rejects a returned search profile different from the requested budget',async()=>{
  const entries=mini(),plan=buildRefinementPlan(entries,{sacrificeOnly:true})
  const analyze=vi.fn(async(...args)=>{
   const engine=await search(...args)
   if(!args[3]?.searchMoves)engine.analysisMetadata.budget.value=1000000
   return engine
  })
  await expect(refineGameEntries({entries,plan,analyzePosition:analyze})).rejects.toThrow('Prova del sacrificio incompatibile')
  expect(analyze).toHaveBeenCalledTimes(2)
 })
 it('proves an actual newly available rook route and follows the same rook in the acceptance PV',()=>{
  const e=rawRb3(),access=newRookKingFileAccess(e),proof=sacrificeSearchFor(provedRb3()[2],'c8h8')
  expect(access).toMatchObject({from:'b1',square:'b3',routes:['b3f3']})
  expect(verifiedRookAttackParticipation(e,access,proof.acceptance.specialLines[0].pv)).toMatchObject({route:{uci:'b3f3'},checkingMove:{uci:'f3f5'},proofAgainstEveryDefense:false})
  expect(verifiedRookAttackParticipation(e,access,['c8h8','f5f6','a1a8'])).toBeNull()
  expect(newRookKingFileAccess({...e,fenAfter:e.fenBefore})).toBeNull()
  expect(newRookKingFileAccess(data.entries[54])).toBeNull()
 })
 it.each(['fen','root','missing','duplicate','budget','overshoot','bound','illegal-pv','favorable-root','favorable-child'])('rejects %s material-recovery proof',kind=>{
  const e=provedRb3()[2],row=sacrificeSearchFor(e,'c8h8'),r=row.recoveries[0]
  if(kind==='fen')r.afterFen=e.fenBefore
  if(kind==='root')r.uci='a1a8'
  if(kind==='missing')r.confirmation=null
  if(kind==='duplicate')row.recoveries.push(structuredClone(r))
  if(kind==='budget')r.search.analysisMetadata.budget.value=300000
  if(kind==='overshoot')r.search.actualNodes=205001
  if(kind==='bound')r.search.specialLines[0].upperbound=true
  if(kind==='illegal-pv')r.search.specialLines[0].pv=['a1a8']
  for(const [failure,engine,value]of [['favorable-root',r.search,1000],['favorable-child',r.confirmation,-1000]])if(kind===failure)
   for(const line of [engine,...engine.lines,...engine.specialLines]){line.evalCp=value;line.mate=null}
  const evidence={forcedRecoveries:[{captureUci:row.captureUci,fen:row.acceptedFen,recoveries:row.recoveries}]}
  expect(assessImmediateRecoveries(evidence,row.captureUci,row.acceptedFen,['h5f5'])).toBeNull()
  // Validation is independent of the desired grade; malformed packets never survive storage projection.
  if(['fen','root','duplicate','budget','overshoot','bound','illegal-pv'].includes(kind))
   expect(validatedRecoveryProofs(row.acceptedFen,row.recoveries).every(x=>!x.search||x.search!==r.search)).toBe(true)
 })
 it('preserves completed recovery proofs when an older or partial archive is saved again',async()=>{
  const cache=json('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/game-1-chigorin-steinitz-1892.json')
  const entries=reclassifyReviewedMoves(data.entries),p=provedRb3()[2]
  entries[52].refinement=p.refinement
  const a=createGameArchive({indexedDB,crypto:webcrypto,databaseName:'sacrifice-recovery-resave'})
  const {record}=await a.save({pgn:cache.pgn,analysisEntries:entries})
  await a.save({pgn:cache.pgn,analysisEntries:data.entries})
  const partial=structuredClone(entries);partial[52].refinement.sacrifices[0].recoveries[0].confirmation=null
  await a.save({pgn:cache.pgn,analysisEntries:partial})
  const reopened=await a.get(record.id)
  expect(sacrificeSearchFor(reopened.analysisEntries[52],'c8h8').recoveries[0].confirmation).toBeTruthy()
  expect(selectRefinementView(reclassifyReviewedMoves(reopened.analysisEntries),true)[52].classification).toBe('brilliant')
  expect(reopened.analysisEntries.map(e=>e.engine)).toEqual(entries.map(e=>e.engine));await a.close()
 },60000)
})
