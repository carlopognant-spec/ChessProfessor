import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {nativeWinningChoice} from '../src/lib/nativeWinningChoice.js'
import {NATIVE_PROOF_POLICY} from '../src/lib/nativeEvidence.js'
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)))
const {cases}=json('agent-output/special-completion-v1/cohorts.json'),deep=new Map(),alternative=new Map()
for(const r of json('agent-output/native-wdl-evidence-v1/collection.json').records){const p=json(r.path);deep.set(p.fen,p.engine)}
for(const r of json('agent-output/native-alternative-evidence-v1/collection.json').records){const p=json(r.path);alternative.set(p.fen,p.engine)}
const observations=json('agent-output/native-alternative-evidence-v1/protocol.json').selected
function example(id,ply,cohort='old'){
 const raw=structuredClone(cases.find(c=>c.id===id&&c.cohort===cohort).entries[ply-1])
 const e={...raw,engine:structuredClone(deep.get(raw.fenBefore)),playedEngine:structuredClone(deep.get(raw.fenAfter)),
  nativeDecisionProof:{alternatives:observations.filter(t=>t.cohort===cohort&&t.game===id&&t.ply===ply).map(t=>({uci:t.uci,fen:t.fen,engine:structuredClone(alternative.get(t.fen))}))}}
 e.nativeDecisionProof={...e.nativeDecisionProof,version:NATIVE_PROOF_POLICY.version,root:e.engine,child:e.playedEngine}
 const roots={status:'available',coherent:true,coverage:{source:'completed-snapshot',legal:new Chess(e.fenBefore).moves().length},
  lines:e.engine.specialLines.map(l=>({uci:l.pv[0]})),raw:e.engine.specialLines}
 return {e,roots}
}
describe('corroborated native outcome prototype, not enabled in production',()=>{
 it.each([['personal-01',45],['game-1-chigorin-steinitz-1892',25],['game-1-chigorin-steinitz-1892',39],['game-2-saintamant-staunton-1843',80]])('requires independent alternatives as well as the played child in %s/%s',(id,ply)=>{
  const {e,roots}=example(id,ply),original=JSON.stringify(e),p=nativeWinningChoice(e,roots)
  expect(p).toMatchObject({version:'native-outcome-corroborated-v2',proofAgainstEveryDefense:false})
  expect(p.alternativeProofs).toHaveLength(4);expect(p.minimumGap).toBeGreaterThanOrEqual(.20)
  expect(JSON.stringify(e)).toBe(original)
 })
 it('rejects the formerly false Nc3 because Ne5 still wins on the independent child',()=>{
  const {e,roots}=example('184316820266',9,'initial')
  expect(nativeWinningChoice(e,roots)).toBeNull()
 })
 it.each(['missing','fen','uci','duplicate','budget','overshoot','bounded','incomplete','illegal-pv'])('does not certify %s alternative evidence',kind=>{
  const {e,roots}=example('personal-01',45),rows=e.nativeDecisionProof.alternatives,r=rows[0]
  if(kind==='missing')rows.pop()
  if(kind==='fen')r.fen=e.fenBefore
  if(kind==='uci')r.uci=e.playedUci
  if(kind==='duplicate')rows[1]=structuredClone(r)
  if(kind==='budget')r.engine.analysisMetadata.budget.value=200000
  if(kind==='overshoot')r.engine.actualNodes=1005001
  if(kind==='bounded')r.engine.specialLines[0].lowerbound=true
  if(kind==='incomplete')r.engine.specialLines=[]
  if(kind==='illegal-pv')r.engine.specialLines[0].pv=['a1a8']
  expect(nativeWinningChoice(e,roots)).toBeNull()
 })
})
