import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {describe,it,expect} from 'vitest'
import {classifyReviewedMove} from '../src/lib/reviewEvaluation.js'
import {classifyMoveOpportunity} from '../src/lib/moveOpportunities.js'
import {retainEstablishedWinningBlunder} from '../src/lib/opportunityEpisodes.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
const load=id=>JSON.parse(readFileSync(new URL(`../agent-output/refinement-quality-priority-v2/priority-game-${id}-round-2.json`,import.meta.url)))
const stored=load('185262315732'),slav=load('185230271130')
function example(){
 const [own,previous,entry]=structuredClone(stored.view.slice(58,61)).map(classifyReviewedMove)
 return{own,previous,entry,result:classifyMoveOpportunity(entry,previous)}
}

describe('history of a restored established winning chance',()=>{
 it('preserves the severe numerical mistake and records why the opportunity was superseded',()=>{
  const {own,previous,entry,result}=example(),original=JSON.stringify([own,previous,entry])
  expect(result.classification).toBe('missed')
  const e=retainEstablishedWinningBlunder(result,entry,previous,own)
  expect(e).toMatchObject({classification:'blunder',missedOpportunity:null,
   missedOpportunityReason:'restored-own-winning-chance',opportunityAssessment:{status:'retain-numerical',
    proposedOpportunity:expect.any(Object),evidence:{previousOwnPly:59}}})
  expect(e.bestEval).toBe(entry.bestEval);expect(e.playedEval).toBe(entry.playedEval)
  expect(JSON.stringify([own,previous,entry])).toBe(original)
 })
 it.each([
  ['missing own history',s=>{s.own=null}],
  ['previous own move already Missed',s=>{s.own.classification='missed'}],
  ['wrong ply',s=>{s.own.ply--}],
  ['broken chain',s=>{s.own.fenAfter=s.own.fenBefore}],
  ['own book move',s=>{s.own.isBookMove=true}],
  ['opponent book move',s=>{s.previous.isBookMove=true}],
  ['bounded own root',s=>{s.own.engine.lines[0].upperbound=true;s.own.engine.specialLines[0].upperbound=true}],
  ['wrong child FEN',s=>{s.entry.playedEngine.fen=s.previous.fenBefore}],
  ['illegal child continuation',s=>{s.entry.playedEngine.lines[0].pv=['a1a8']}],
  ['restricted own search',s=>{s.own.engine.analysisMetadata.searchMoves=[s.own.playedUci]}],
  ['new proven mate',s=>{s.result.missedOpportunity={kind:'forced-mate'}}],
  ['substantially stronger new opportunity',s=>{s.entry.engine.specialLines[0].evalCp=2500;s.entry.engine.lines[0].evalCp=2500}],
 ])('does not override the opportunity with %s',(_,mutate)=>{
  const s=example();mutate(s)
  expect(retainEstablishedWinningBlunder(s.result,s.entry,s.previous,s.own).classification).toBe('missed')
 })
 it('recomputes numerical evidence rather than trusting stale displayed probabilities',()=>{
  const s=example();s.own.bestProbability=0.1;s.entry.bestProbability=0.2
  expect(retainEstablishedWinningBlunder(s.result,s.entry,s.previous,s.own).classification).toBe('blunder')
 })
 it('keeps the following real missed opportunity while removing the false one',()=>{
  const entries=structuredClone(stored.view.slice(58,62)),result=reclassifyReviewedMoves(entries)
  expect(result.map(e=>e.classification)).toEqual(['blunder','missed','blunder','missed'])
  expect(reclassifyReviewedMoves(result)).toEqual(result)
 })
 it('preserves repeated real opportunities Bg4 and Bxf3',()=>{
  const e=reclassifyReviewedMoves(structuredClone(stored.view.slice(20,24)))
  expect(e[1]).toMatchObject({playedMove:'Bg4',classification:'missed'})
  expect(e[3]).toMatchObject({playedMove:'Bxf3',classification:'missed'})
 })
 it('preserves the missed mate Bh4+ after the earlier ordinary blunder Bd8+',()=>{
  const e=reclassifyReviewedMoves(structuredClone(slav.view.slice(50,53)))
  expect(e[2]).toMatchObject({playedMove:'Bh4+',classification:'missed',missedOpportunity:{kind:'forced-mate'}})
 })
 it('clears stale history decisions before re-evaluating a newly supported Grande',()=>{
  const entries=structuredClone(slav.view.slice(23,25))
  entries[1].opportunityAssessment={status:'retain-numerical',policyVersion:'opportunity-episode-v1'}
  entries[1].specialAssessment={version:'counterfactual-v14'}
  const e=reclassifyReviewedMoves(entries)[1]
  expect(e).toMatchObject({playedMove:'Ne2',classification:'great',opportunityAssessment:null,
    specialAssessment:{version:'counterfactual-v24'}})
 })
 it('traces the numerical, opportunity and final history decisions without changing labels',()=>{
  // The diagnostic compiler runs in native Node, outside Vite's module loader.
  const program=`
    import{readFileSync}from'node:fs';
    import{tracedSpecialSource}from'./scripts/qa/trace-special-rules.mjs';
    import{classifyReviewedMove}from'./src/lib/reviewEvaluation.js';
    import{reclassifyReviewedMoves}from'./src/lib/reviewMoves.js';
    const entries=JSON.parse(readFileSync('agent-output/refinement-quality-priority-v2/priority-game-185262315732-round-2.json')).view.slice(58,62).map(classifyReviewedMove);
    const original=JSON.stringify(entries);
    const mod=await import(tracedSpecialSource(readFileSync('src/lib/specialClassification.js','utf8'),readFileSync('src/lib/moveOpportunities.js','utf8')));
    const traced=mod.reclassifySpecialMoves(entries),normal=reclassifyReviewedMoves(entries);
    console.log(JSON.stringify({traced:traced.map(e=>e.classification),normal:normal.map(e=>e.classification),trace:traced[2].specialAssessment.ruleTrace,unchanged:JSON.stringify(entries)===original}));`
  const data=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',program],{
    cwd:fileURLToPath(new URL('../',import.meta.url)),encoding:'utf8'}))
  expect(data.traced).toEqual(data.normal)
  expect(data.trace).toEqual(expect.arrayContaining([
    expect.objectContaining({rule:'original-opportunity',category:'missed',status:'supported'}),
    expect.objectContaining({rule:'opportunity-history',category:'blunder',status:'final'}),
  ]))
  expect(data.unchanged).toBe(true)
 })
})
