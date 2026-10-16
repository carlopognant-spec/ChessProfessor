import {readFileSync} from 'node:fs'
import {webcrypto} from 'node:crypto'
import {indexedDB} from 'fake-indexeddb'
import {describe,it,expect,vi} from 'vitest'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {buildRefinementPlan,refineGameEntries,selectRefinementView} from '../src/lib/analysisRefinement.js'
import {nativeProofFor,NATIVE_PROOF_POLICY} from '../src/lib/nativeEvidence.js'
import {displaySpecialMoves,formatSpecialAssessment} from '../src/lib/specialClassification.js'
import {createGameArchive} from '../src/lib/gameArchive.js'
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)))
const {cases}=json('agent-output/special-completion-v1/cohorts.json'),packets=new Map()
for(const collection of ['native-wdl-evidence-v1','native-alternative-evidence-v1'])for(const r of json(`agent-output/${collection}/collection.json`).records){const p=json(r.path);packets.set(p.fen,p.engine)}
for(const r of json('agent-output/special-completion-evidence-v1/collection.json').records){const p=json(r.path);if(!packets.has(p.fen))packets.set(p.fen,p.engine)}
for(const r of json('agent-output/native-edge-study-v1/collection.json').records){const p=json(r.path);packets.set(p.fen,p.engine)}
const game=(id,cohort='old')=>cases.find(c=>c.id===id&&c.cohort===cohort)
const mini=(id,ply,cohort='old')=>reclassifyReviewedMoves(structuredClone(game(id,cohort).entries.slice(ply-3,ply)).map((e,i)=>({...e,ply:i+1})))
const numeric=entries=>entries.map(e=>[e.bestEval,e.bestMate,e.playedEval,e.playedMate,e.bestProbability,e.playedProbability,e.dropPct])
const search=async(fen,nodes,multiPv)=>{expect([nodes,multiPv]).toEqual([1000000,5]);expect(packets.has(fen)).toBe(true);return structuredClone(packets.get(fen))}
async function finish(entries,analyze=search){let current=entries;for(let i=0;i<10;i++){
 const plan=buildRefinementPlan(current,{criticalOnly:true});if(!plan.selectedPlies.length)return current
 current=(await refineGameEntries({entries:current,plan,analyzePosition:analyze})).entries
 }throw Error('Repeated verification')}
describe('separate decisive-choice certificates',()=>{
 it('confirms axb4 only after the pair and all four independent alternatives, preserving both archive views',async()=>{
  const entries=mini('game-2-saintamant-staunton-1843',56),numbers=numeric(entries),analyze=vi.fn(search)
  const first=buildRefinementPlan(entries,{criticalOnly:true})
  expect(first.selectedPlies).toContain(3)
  const paired=(await refineGameEntries({entries,plan:first,analyzePosition:analyze})).entries
  expect(selectRefinementView(paired,true)[2].classification).toBe('best')
  expect(buildRefinementPlan(paired,{criticalOnly:true}).selection).toContainEqual(expect.objectContaining({ply:3,phase:'alternatives'}))
  const completed=await finish(paired,analyze),after=selectRefinementView(completed,true)
  expect(after[2]).toMatchObject({classification:'great',specialAssessment:{version:'counterfactual-v24',grande:{reason:'critical-native-advantage-choice'}}})
  expect(nativeProofFor(completed[2]).alternatives).toHaveLength(4)
  expect(numeric(after)).toEqual(numbers)
  expect(formatSpecialAssessment(after[2])).toContain('vantaggio relativo')
  const stored=structuredClone(completed)
  stored[2].specialAssessment.version='counterfactual-v23'
  expect(reclassifyReviewedMoves(stored)[2].classification).toBe('best')
  const reopened=selectRefinementView(reclassifyReviewedMoves(stored),true)
  expect(reopened[2].classification).toBe('great');expect(numeric(reopened)).toEqual(numbers)
  expect(buildRefinementPlan(stored,{criticalOnly:true}).selectedPlies).not.toContain(3)
 },60000)
 it.each([['personal-05',27,'queen-evasion-with-unique-major-gain'],['personal-06',31,'unique-knight-pawn-evasion-exploiting-relative-queen-pin'],['game-2-saintamant-staunton-1843',82,'verified-bishop-rook-skewer']])('confirms %s from a paired proof and migrates saved v22 evidence without new queries',async(id,ply,kind)=>{
  const entries=mini(id,ply),numbers=numeric(entries),analyze=vi.fn(search)
  expect(entries[2].classification).toBe('best')
  const completed=await finish(entries,analyze),after=selectRefinementView(completed,true)
  expect(after[2]).toMatchObject({classification:'great',specialAssessment:{version:'counterfactual-v24',grande:{reason:'verified-major-piece-tactic',tactic:{kind}}}})
  expect(analyze.mock.calls.filter(([fen])=>[entries[2].fenBefore,entries[2].fenAfter].includes(fen))).toHaveLength(2)
  expect(analyze.mock.calls.length).toBeLessThanOrEqual(4)
  expect(nativeProofFor(completed[2]).alternatives).toEqual([])
  expect(numeric(after)).toEqual(numbers)
  expect(selectRefinementView(completed,false)[2].classification).toBe('best')
  expect(formatSpecialAssessment(after[2])).toBeTruthy()
  const stored=structuredClone(completed)
  stored[2].specialAssessment={...stored[2].specialAssessment,version:'counterfactual-v22'}
  expect(reclassifyReviewedMoves(stored)[2].classification).toBe('best')
  const reopened=selectRefinementView(reclassifyReviewedMoves(stored),true)
  expect(reopened[2].classification).toBe('great')
  expect(numeric(reopened)).toEqual(numbers)
  expect(buildRefinementPlan(stored,{criticalOnly:true}).selectedPlies).not.toContain(3)
 },60000)
 it('checks the pair and then every independent alternative, without changing any numerical field',async()=>{
  const entries=mini('personal-01',45),before=numeric(entries),original=JSON.stringify(entries),analyze=vi.fn(search)
  const first=buildRefinementPlan(entries,{criticalOnly:true})
  expect(first).toMatchObject({scope:NATIVE_PROOF_POLICY.scope,selectedPlies:[3],positions:[entries[2].fenBefore,entries[2].fenAfter],extraSearches:0})
  const paired=(await refineGameEntries({entries,plan:first,analyzePosition:analyze})).entries
  expect(selectRefinementView(paired,true)[2].classification).toBe('best')
  const second=buildRefinementPlan(paired,{criticalOnly:true});expect(second.positions).toHaveLength(4)
  const completed=await finish(paired,analyze),after=selectRefinementView(completed,true)
  expect(after[2]).toMatchObject({classification:'great',specialAssessment:{version:'counterfactual-v24',grande:{reason:'critical-native-winning-choice'}}})
  expect(numeric(after)).toEqual(before);expect(selectRefinementView(completed,false)[2].classification).toBe('best')
  expect(displaySpecialMoves(after,false)[2].classification).toBe('best')
  expect(nativeProofFor(completed[2]).alternatives).toHaveLength(4)
  expect(analyze).toHaveBeenCalledTimes(6);expect(JSON.stringify(entries)).toBe(original)
 },60000)
 it('keeps Nc3 Best when the independently scored Ne5 alternative still wins',async()=>{
  const entries=mini('184316820266',9,'initial'),analyze=vi.fn(search),completed=await finish(entries,analyze)
  expect(selectRefinementView(completed,true)[2].classification).toBe('best')
  expect(buildRefinementPlan(completed,{criticalOnly:true}).selectedPlies).toEqual([])
  expect(analyze).toHaveBeenCalledTimes(6)
 },60000)
 it('preserves completed pair evidence on interruption and resumes only the missing position',async()=>{
  const entries=mini('personal-01',45),controller=new AbortController();let partial
  await expect(refineGameEntries({entries,plan:buildRefinementPlan(entries,{criticalOnly:true}),analyzePosition:search,signal:controller.signal,
   onEntries:e=>{partial=e},onProgress:()=>controller.abort()})).rejects.toMatchObject({name:'AbortError'})
  expect(nativeProofFor(partial[2])).toMatchObject({root:expect.any(Object),child:null})
  expect(buildRefinementPlan(partial,{criticalOnly:true}).positions).toEqual([entries[2].fenAfter])
  expect(selectRefinementView(await finish(partial),true)[2].classification).toBe('great')
 },60000)
 it('reuses complete attempts without requesting an engine when all certificates are already available',async()=>{
  const entries=await finish(mini('personal-01',45)),p=nativeProofFor(entries[2])
  entries[2].refinement.nativeProof={...p,alternatives:[]}
  const plan=buildRefinementPlan(entries,{criticalOnly:true}),analyze=vi.fn()
  expect(plan).toMatchObject({selectedPlies:[3],positions:[],actualNodeCap:0})
  const result=await refineGameEntries({entries,plan,analyzePosition:analyze})
  expect(selectRefinementView(result.entries,true)[2].classification).toBe('great');expect(analyze).not.toHaveBeenCalled()
 },60000)
 it('keeps the ordinary restoration Qxf6 outside the new proof requests even with stronger roots',()=>{
  const entries=mini('personal-01',49)
  expect(buildRefinementPlan(entries,{criticalOnly:true}).selectedPlies).not.toContain(3)
  entries[2].engine=structuredClone(packets.get(entries[2].fenBefore));entries[2].playedEngine=structuredClone(packets.get(entries[2].fenAfter))
  expect(reclassifyReviewedMoves(entries)[2]).toMatchObject({classification:'best',specialAssessment:{grande:{reason:'ordinary-mate-blocker-capture'}}})
 })
 it('rejects a forged request before searching',async()=>{
  const entries=mini('personal-01',45),plan={...buildRefinementPlan(entries,{criticalOnly:true}),actualNodeCap:99999999},analyze=vi.fn()
  await expect(refineGameEntries({entries,plan,analyzePosition:analyze})).rejects.toThrow('Piano di approfondimento non valido');expect(analyze).not.toHaveBeenCalled()
 })
 it('preserves full pair and alternative certificates when an older or partial archive is saved',async()=>{
  const c=game('personal-01'),entries=reclassifyReviewedMoves(c.entries),proof=nativeProofFor((await finish(mini('personal-01',45)))[2])
  entries[44].refinement={version:'optional-refinement-v1',nativeProof:proof}
  const cache=json('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-01.json')
  const archive=createGameArchive({indexedDB,crypto:webcrypto,databaseName:'native-proof-resave'})
  const {record}=await archive.save({pgn:cache.pgn,analysisEntries:entries})
  await archive.save({pgn:cache.pgn,analysisEntries:c.entries})
  const partial=structuredClone(entries);partial[44].refinement.nativeProof.child=null;partial[44].refinement.nativeProof.alternatives.pop()
  await archive.save({pgn:cache.pgn,analysisEntries:partial})
  const reopened=await archive.get(record.id);await archive.close()
  expect(nativeProofFor(reopened.analysisEntries[44]).alternatives).toHaveLength(4)
  expect(selectRefinementView(reclassifyReviewedMoves(reopened.analysisEntries),true)[44].classification).toBe('great')
 },60000)
})
