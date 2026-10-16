// Supplemental evidence for a special decision; it never replaces a score profile.
import {createAnalysisMetadata,analysisMetadataKey} from './analysisMetadata.js'
import {validSacrificeSearch} from './sacrificeSearches.js'
export const GRANDE_PROOF_POLICY=Object.freeze({version:'grande-decision-proof-v1',scope:'grande-recovery-proof-v1',nodes:1000000,reserve:5000,maxMoves:12})
export function validGrandeSearch(engine,fen){
 try{return Number.isSafeInteger(engine?.actualNodes)&&engine.actualNodes>0
  &&engine.actualNodes<=GRANDE_PROOF_POLICY.nodes+GRANDE_PROOF_POLICY.reserve
  &&analysisMetadataKey(engine.analysisMetadata)===analysisMetadataKey(createAnalysisMetadata({nodes:GRANDE_PROOF_POLICY.nodes}))
  &&validSacrificeSearch(engine,fen)}catch{return false}
}
export function grandeProofFor(entry,data=entry.refinement?.grandeProof){
 if(data?.version!==GRANDE_PROOF_POLICY.version)return null
 const root=validGrandeSearch(data.root,entry.fenBefore)?data.root:null
 const child=validGrandeSearch(data.child,entry.fenAfter)?data.child:null
 return root||child?{version:GRANDE_PROOF_POLICY.version,root,child}:null
}
export function mergeGrandeProof(entry,...records){
 const rows=records.map(data=>grandeProofFor(entry,data)).filter(Boolean)
 if(!rows.length)return null
 return {version:GRANDE_PROOF_POLICY.version,root:rows.findLast(r=>r.root)?.root??null,child:rows.findLast(r=>r.child)?.child??null}
}
