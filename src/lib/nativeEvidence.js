import {Chess} from 'chess.js'
import {validGrandeSearch} from './grandeProofs.js'
import {validSacrificeAttempt} from './sacrificeSearches.js'
export const NATIVE_PROOF_POLICY=Object.freeze({version:'native-winning-proof-v1',scope:'grande-winning-proof-v1',nodes:1000000,reserve:5000,maxMoves:12,maxPositions:24})
export function nativeAlternativeFen(entry,uci){
 const b=new Chess(entry.fenBefore);b.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});return b.fen()
}
export function validNativeAttempt(engine,fen){
 return engine?.analysisMetadata?.budget.value===NATIVE_PROOF_POLICY.nodes&&validSacrificeAttempt(engine,fen)
}
export function nativeProofFor(entry,data=entry.refinement?.nativeProof){
 try{
  if(data?.version!==NATIVE_PROOF_POLICY.version)return null
  const root=validGrandeSearch(data.root,entry.fenBefore)?data.root:null,child=validGrandeSearch(data.child,entry.fenAfter)?data.child:null
  const alternatives=(Array.isArray(data.alternatives)?data.alternatives:[]).flatMap(r=>{
   try{
    if(data.alternatives.filter(x=>x.uci===r.uci).length!==1||r.fen!==nativeAlternativeFen(entry,r.uci)||!validGrandeSearch(r.engine,r.fen))return[]
    return[{uci:r.uci,fen:r.fen,engine:r.engine}]
   }catch{return[]}
  })
  const attempts=(Array.isArray(data.attempts)?data.attempts:[]).filter(r=>{
   try{return ([entry.fenBefore,entry.fenAfter].includes(r.fen)||r.fen===nativeAlternativeFen(entry,r.uci))&&validNativeAttempt(r.engine,r.fen)}catch{return false}
  })
  return root||child||alternatives.length||attempts.length?{version:NATIVE_PROOF_POLICY.version,root,child,alternatives,attempts}:null
 }catch{return null}
}
export function mergeNativeProof(entry,...records){
 const rows=records.map(r=>nativeProofFor(entry,r)).filter(Boolean);if(!rows.length)return null
 const alternatives=new Map(),attempts=new Map()
 for(const row of rows){for(const r of row.alternatives)alternatives.set(r.uci,r);for(const r of row.attempts)attempts.set(r.fen,r)}
 return{version:NATIVE_PROOF_POLICY.version,root:rows.findLast(r=>r.root)?.root??null,child:rows.findLast(r=>r.child)?.child??null,alternatives:[...alternatives.values()],attempts:[...attempts.values()]}
}
