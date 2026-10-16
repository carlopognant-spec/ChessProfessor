// Normalize a previously captured restricted UCI stream without running it again.
import assert from 'node:assert/strict'
import {createMultiPvEvidence} from '../../src/lib/multiPvEvidence.js'
import {createAnalysisMetadata} from '../../src/lib/analysisMetadata.js'
import {verifyCapturedSearch} from './verify-captured-search.mjs'
export function reconstructRestrictedSearch(record,source) {
  assert.equal(record.engineVersion,'Stockfish 19 WASM')
  assert.equal(record.budgetNodes,200000)
  const evidence=createMultiPvEvidence(1),latest=new Map();let actualNodes=0,bestmove
  for(const raw of record.rawLines){
    evidence.accept(raw);actualNodes=Math.max(actualNodes,Number(raw.match(/\bnodes (\d+)/)?.[1]??0))
    const s=raw.match(/\bscore (cp|mate) (-?\d+)/)
    if(raw.startsWith('info ')&&s&&!/\b(?:upperbound|lowerbound)\b/.test(raw)){
      const multipv=Number(raw.match(/\bmultipv (\d+)/)?.[1]??1)
      latest.set(multipv,{multipv,depth:Number(raw.match(/\bdepth (\d+)/)?.[1]??0),evalCp:s[1]==='cp'?Number(s[2]):null,mate:s[1]==='mate'?Number(s[2]):null,pv:raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/)??[],raw})
    }
    if(raw.startsWith('bestmove '))bestmove=raw.split(/\s+/)[1]
  }
  assert.equal(bestmove,record.rootUci);assert.equal(actualNodes,record.actualNodes)
  const lines=[...latest.values()].sort((a,b)=>a.multipv-b.multipv),searchMoves=[record.rootUci]
  const result={fen:record.fen,nodes:record.budgetNodes,multiPv:1,searchMoves,actualNodes,bestmove,rawLines:record.rawLines,reconstructedFrom:source,
    engine:{...lines[0],lines,specialLines:evidence.finish(bestmove),fen:record.fen,bestmove,actualNodes,
      analysisMetadata:{...createAnalysisMetadata({nodes:record.budgetNodes,multiPv:1,actualEngineId:record.engineVersion}),searchMoves}}}
  verifyCapturedSearch(result)
  return result
}
