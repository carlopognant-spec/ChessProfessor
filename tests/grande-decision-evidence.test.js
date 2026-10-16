import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {classifyReviewedMove} from '../src/lib/reviewEvaluation.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {assessForcingResponse} from '../src/lib/responseEvidence.js'

const load=id=>JSON.parse(readFileSync(new URL(`../agent-output/refinement-quality-priority-v2/priority-game-${id}-round-2.json`,import.meta.url)))
const games={'185262315732':load('185262315732'),'185230271130':load('185230271130'),'185230000668':load('185230000668')}
const pair=(id,end)=>structuredClone(games[id].view.slice(end-2,end)).map(classifyReviewedMove)
function threat(fen,uci){
 const game=new Chess(fen),legal=game.moves({verbose:true}),m=game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
 const entry={fenBefore:fen,fenAfter:game.fen(),playedUci:m.from+m.to+(m.promotion??''),engine:{analysisMetadata:{multiPv:2}}}
 // The helper consumes an already validated comparison; the synthetic scores
 // do not enter its chess checks. Real comparison integration is tested below.
 const roots={status:'available',coherent:true,coverage:{source:'completed-snapshot',legal:legal.length},
   lines:[{uci}],raw:[{},{}]}
 return{entry,roots,result:assessForcingResponse(entry,roots)}
}

describe('Grande decision evidence',()=>{
 it.each([
  ['185262315732',30,'Be7'],['185230271130',18,'Nd6'],
 ])('migrates the false Grande %s/%s to its unchanged numerical best',(id,end,san)=>{
  const entries=pair(id,end).map(e=>({...e,specialAssessment:{version:'counterfactual-v13'}})),original=JSON.stringify(entries)
  const result=reclassifyReviewedMoves(entries),e=result[1]
  expect(e).toMatchObject({playedMove:san,classification:'best',numericalClassification:'best',
    specialAssessment:{version:'counterfactual-v24',grande:{status:'rejected',reason:'no-forcing-response-established'}}})
  expect(e.bestEval).toBe(entries[1].bestEval);expect(e.playedEval).toBe(entries[1].playedEval)
  expect(JSON.stringify(entries)).toBe(original);expect(reclassifyReviewedMoves(result)).toEqual(result)
 })

 it('computes Be7 recovery with the selected completed comparisons, without the partial-iteration gain',()=>{
  const entries=pair('185262315732',30),e=reclassifyReviewedMoves(entries)[1],context=e.specialAssessment.context
  expect(context.before).toBe(1-entries[0].bestProbability)
  expect(context.available).toBe(entries[1].bestProbability)
  expect(context.createdGain).toBeLessThan(0.20)
  expect(e.classification).toBe('best')
 })

 it.each([
  ['185230271130',25,'Ne2','a5'],['185230000668',7,'d5','c6'],
 ])('retains the actual forcing response %s/%s',(id,end,san,target)=>{
  const e=reclassifyReviewedMoves(pair(id,end))[1]
  expect(e).toMatchObject({playedMove:san,classification:'great',specialAssessment:{grande:{
    status:'supported',forcing:{kind:'new-material-threat',target}}}})
 })

 it('does not treat an attack by a pinned knight as a legal material threat',()=>{
  const sample=threat('k3r3/8/8/8/5q2/8/P3N3/4K3 w - - 0 1','a2a3')
  expect(new Chess(sample.entry.fenAfter).attackers('f4','w')).toContain('e2')
  expect(sample.result).toMatchObject({applicable:true,kind:'no-forcing-event'})
 })

 it('recognizes a gain when the geometric recapturer is pinned',()=>{
  const sample=threat('4k3/5p2/8/4n1N1/8/8/8/4RBK1 w - - 0 1','f1c4')
  expect(sample.result).toMatchObject({applicable:true,kind:'new-material-threat',target:'f7'})
 })

 it('does not invent a new material threat from an unchanged legal attack',()=>{
  expect(threat('k7/5r2/8/6N1/8/8/P7/7K w - - 0 1','a2a3').result)
    .toMatchObject({applicable:true,kind:'no-forcing-event'})
 })

 it('recognizes an immediate mating threat without calling it a forced mate against every reply',()=>{
  expect(threat('7k/8/6K1/8/8/8/P7/5Q2 w - - 0 1','f1f7').result)
    .toMatchObject({applicable:true,kind:'mate-threat'})
 })

 it.each([
  ['legacy',s=>{s.roots.coverage.source='legacy-lines'}],
  ['mixed depth',s=>{s.roots.coherent=false}],
  ['restricted root',s=>{s.entry.engine.analysisMetadata.searchMoves=['a2a3']}],
  ['incomplete comparison',s=>{s.roots.raw.pop()}],
  ['bounded comparison',s=>{s.roots.raw[0].upperbound=true}],
  ['another root',s=>{s.roots.lines[0].uci='a2a4'}],
  ['wrong after FEN',s=>{s.entry.fenAfter=s.entry.fenBefore}],
 ])('leaves %s evidence outside the new filter',(_,change)=>{
  const sample=threat('k7/5r2/8/6N1/8/8/P7/7K w - - 0 1','a2a3');change(sample)
  expect(assessForcingResponse(sample.entry,sample.roots)).toEqual({applicable:false})
 })
})
