import {readFileSync} from 'node:fs'
import {indexedDB} from 'fake-indexeddb'
import {webcrypto} from 'node:crypto'
import {describe,it,expect,vi} from 'vitest'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {buildRefinementPlan,refineGameEntries,selectRefinementView} from '../src/lib/analysisRefinement.js'
import {grandeProofFor,GRANDE_PROOF_POLICY} from '../src/lib/grandeProofs.js'
import {createGameArchive} from '../src/lib/gameArchive.js'
import {formatSpecialAssessment,displaySpecialMoves} from '../src/lib/specialClassification.js'
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)))
const data=json('../agent-output/special-completion-v1/cohorts.json').cases.find(c=>c.id==='185230271130'&&c.cohort==='refined')
const records=json('../agent-output/special-completion-evidence-v1/collection.json').records
const packetFor=fen=>json('../'+records.find(r=>r.fen===fen).path).engine
const root=packetFor(data.entries[15].fenBefore),child=packetFor(data.entries[15].fenAfter)
const proof=()=>({version:GRANDE_PROOF_POLICY.version,root:structuredClone(root),child:structuredClone(child)})
const base=reclassifyReviewedMoves(data.entries.slice(13,17))
const mini=()=>structuredClone(base).map((e,i)=>({...e,ply:i+1}))
const numeric=es=>es.map(e=>[e.bestEval,e.bestMate,e.playedEval,e.playedMate,e.bestProbability,e.playedProbability,e.dropPct])

describe('separate proof of an equilibrium recovery',()=>{
 it('confirms Nxe4 without propagating scores into f4 or Qd3, and keeps both profiles',async()=>{
  const entries=mini(),initial=JSON.stringify(entries),before=selectRefinementView(entries,true),ordinary=buildRefinementPlan(entries)
  const plan=buildRefinementPlan(entries,{grandeOnly:true})
  expect(plan).toMatchObject({scope:GRANDE_PROOF_POLICY.scope,selectedPlies:[3],positions:[child.fen],extraSearches:0})
  const search=vi.fn(async(fen,nodes,multiPv)=>{
   expect([fen,nodes,multiPv]).toEqual([child.fen,1000000,5]);return structuredClone(child)
  })
  const result=await refineGameEntries({entries,plan,analyzePosition:search}),after=selectRefinementView(result.entries,true)
  expect(after[2]).toMatchObject({playedMove:'Nxe4',classification:'great',specialAssessment:{grande:{reason:'equilibrium-recovery',decisionProof:{numericalProfileUnchanged:true}}}})
  expect(after[3]).toMatchObject({playedMove:'Qd3',classification:'mistake'})
  expect(after.flatMap((e,i)=>e.classification!==before[i].classification?[e.ply]:[])).toEqual([3])
  expect(numeric(after)).toEqual(numeric(before))
  expect(result.entries.map(e=>[e.engine,e.playedEngine])).toEqual(entries.map(e=>[e.engine,e.playedEngine]))
  expect(selectRefinementView(result.entries,false)[2].classification).toBe('best')
  expect(displaySpecialMoves(after,false)[2].classification).toBe('best')
  expect(formatSpecialAssessment(after[2])).toContain('verifica separata')
  expect(buildRefinementPlan(result.entries)).toEqual(ordinary)
  expect(buildRefinementPlan(result.entries,{grandeOnly:true}).selectedPlies).toEqual([])
  expect(search).toHaveBeenCalledTimes(1);expect(JSON.stringify(entries)).toBe(initial)
 })
 it.each(['position','restricted','budget','overshoot','bounded','mixed-depth','duplicate','illegal-pv'])('rejects %s evidence without changing the numerical profile',kind=>{
  const entries=mini(),p=proof()
  if(kind==='position')p.child.fen=entries[1].fenBefore
  if(kind==='restricted')p.root.analysisMetadata.searchMoves=[entries[2].playedUci]
  if(kind==='budget')p.child.analysisMetadata.budget.value=2000000
  if(kind==='overshoot')p.child.actualNodes=1005001
  if(kind==='bounded')p.child.specialLines[0].upperbound=true
  if(kind==='mixed-depth')p.root.specialLines[1].depth--
  if(kind==='duplicate')p.root.specialLines[1].pv=p.root.specialLines[0].pv
  if(kind==='illegal-pv')p.child.specialLines[0].pv=['a1a8']
  entries[2].grandeDecisionProof=p
  expect(reclassifyReviewedMoves(entries)[2].classification).toBe('best')
  expect(numeric(reclassifyReviewedMoves(entries))).toEqual(numeric(reclassifyReviewedMoves(mini())))
 })
 it('does not trust a legal proof with an unfavorable child evaluation',()=>{
  const entries=mini(),p=proof()
  // Valid packet shape is not proof of compensation; all scored child roots favor the opponent.
  for(const row of [p.child,...p.child.lines,...p.child.specialLines]){row.evalCp=1000;row.mate=null}
  entries[2].grandeDecisionProof=p
  expect(grandeProofFor(entries[2],p)?.child).not.toBeNull()
  expect(reclassifyReviewedMoves(entries)[2].classification).toBe('best')
 })
 it('keeps reusable root evidence on cancellation and resumes only the missing child',async()=>{
  const entries=mini(),controller=new AbortController(),published=[]
  const plan=buildRefinementPlan(entries,{grandeOnly:true})
  await expect(refineGameEntries({entries,plan,signal:controller.signal,onEntries:e=>published.push(e),
   analyzePosition:async()=>{controller.abort();return child}})).rejects.toMatchObject({name:'AbortError'})
  const partial=published.at(-1)
  expect(grandeProofFor(partial[2])).toMatchObject({root:expect.any(Object),child:null})
  expect(selectRefinementView(partial,true)[2].classification).toBe('best')
  const next=buildRefinementPlan(partial,{grandeOnly:true})
  expect(next.positions).toEqual([child.fen])
  const result=await refineGameEntries({entries:partial,plan:next,analyzePosition:async()=>child})
  expect(selectRefinementView(result.entries,true)[2].classification).toBe('great')
 })
 it('rejects a forged plan before any search',async()=>{
  const entries=mini(),plan={...buildRefinementPlan(entries,{grandeOnly:true}),actualNodeCap:9000000},search=vi.fn()
  await expect(refineGameEntries({entries,plan,analyzePosition:search})).rejects.toThrow('Piano di approfondimento non valido')
  expect(search).not.toHaveBeenCalled()
 })
 it('preserves complete proofs when resaving an older or partially completed archive',async()=>{
  const pgn=readFileSync(new URL('../Partite/Confermate/chesscom-185230271130/partita.pgn',import.meta.url),'utf8')
  const archive=createGameArchive({indexedDB,crypto:webcrypto,databaseName:'grande-proof-resave-test'})
  const entries=structuredClone(data.canonical)
  entries[15].refinement={...entries[15].refinement,grandeProof:proof()}
  const {record}=await archive.save({pgn,analysisEntries:entries})
  await archive.save({pgn,analysisEntries:structuredClone(data.canonical)})
  const partial=structuredClone(data.canonical)
  partial[15].refinement={...partial[15].refinement,grandeProof:{...proof(),child:null}}
  await archive.save({pgn,analysisEntries:partial})
  const reopened=await archive.get(record.id)
  expect(grandeProofFor(reopened.analysisEntries[15])).toMatchObject({root:expect.any(Object),child:expect.any(Object)})
  expect(selectRefinementView(reclassifyReviewedMoves(reopened.analysisEntries),true)[15].classification).toBe('great')
  expect(reopened.analysisEntries.map(e=>e.engine)).toEqual(data.canonical.map(e=>e.engine))
  await archive.close()
 })
})
