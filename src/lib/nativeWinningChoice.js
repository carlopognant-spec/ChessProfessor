import {Chess} from 'chess.js'
import {nativeWdlInterval} from './nativeWdl.js'
import {validGrandeSearch} from './grandeProofs.js'
import {assessForcingResponse,legalForcingConsequence} from './responseEvidence.js'
import {calculateWinProbability} from './evaluation.js'
import {SPECIAL_POLICY} from './specialPolicy.js'
import {nativeProofFor} from './nativeEvidence.js'
import {knightPawnEvasionExploitingQueenPin} from './knightPinEvasion.js'
import {potentialEdgeSearch} from './nativeEdgeChoice.js'
export function nativeWinningPotential(entry,roots){
 try{
  if(entry.engine?.analysisMetadata?.engine.version!=='19'||!roots.coherent||!validGrandeSearch(entry.engine,entry.fenBefore)||!validGrandeSearch(entry.playedEngine,entry.fenAfter)
   ||roots.raw[0]?.pv[0]!==entry.playedUci||[entry.engine,entry.playedEngine,...roots.raw].some(l=>l.mate!=null))return null
  const forcing=assessForcingResponse(entry,roots)
  if(!forcing.applicable||!['check','mate-threat','new-material-threat'].includes(forcing.kind))return null
  const root=roots.raw[0],child=entry.playedEngine,idx=calculateWinProbability
  if(Math.abs(idx(root.evalCp)-(1-idx(child.evalCp)))>SPECIAL_POLICY.consistency)return null
  const played=nativeWdlInterval(entry.fenBefore,root.evalCp),confirmed=nativeWdlInterval(entry.fenAfter,-child.evalCp)
  const alternatives=roots.raw.slice(1).map(l=>nativeWdlInterval(entry.fenBefore,l.evalCp))
  if(!played||!confirmed||!alternatives.length||alternatives.some(a=>!a))return null
  const maintained=Math.min(played.bounds.points.min,confirmed.bounds.points.min),alternative=Math.max(...alternatives.map(a=>a.bounds.points.max))
  if(played.dominant!=='w'||confirmed.dominant!=='w'||alternatives.some(a=>!['d','l'].includes(a.dominant))
   ||maintained<SPECIAL_POLICY.winning||maintained-alternative<SPECIAL_POLICY.gap)return null
  return {forcing,played,confirmed,alternatives,maintained}
 }catch{return null}
}
export function nativeWinningChoice(entry,roots){
 try{
  const potential=nativeWinningPotential(entry,roots);if(!potential)return null
  const {forcing,played,confirmed,alternatives,maintained}=potential,idx=calculateWinProbability
  const proof=nativeProofFor(entry,entry.nativeDecisionProof)
  if(!proof?.root||!proof.child)return null
  const records=proof.alternatives
  if(!Array.isArray(records)||records.length!==alternatives.length)return null
  const alternativeProofs=[]
  for(const [i,l]of roots.raw.slice(1).entries()){
   const matches=records.filter(r=>r.uci===l.pv[0]);if(matches.length!==1)return null
   const r=matches[0],b=new Chess(entry.fenBefore),u=l.pv[0]
   b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
   if(r.fen!==b.fen()||!validGrandeSearch(r.engine,r.fen)||r.engine.mate!=null)return null
   const checked=nativeWdlInterval(r.fen,-r.engine.evalCp)
   if(!checked||!['d','l'].includes(checked.dominant)||Math.abs(idx(l.evalCp)-(1-idx(r.engine.evalCp)))>SPECIAL_POLICY.consistency)return null
   alternativeProofs.push({uci:u,fen:r.fen,root:alternatives[i].bounds,child:checked.bounds,dominant:checked.dominant})
  }
  const corroboratedAlternative=Math.max(...alternativeProofs.map(a=>Math.max(a.root.points.max,a.child.points.max)))
  if(maintained-corroboratedAlternative<SPECIAL_POLICY.gap)return null
  return {kind:'critical-native-winning-choice',version:'native-outcome-corroborated-v2',forcing,
   played:played.bounds,confirmed:confirmed.bounds,maintained,alternative:corroboratedAlternative,minimumGap:maintained-corroboratedAlternative,alternativeProofs,
   alternatives:alternatives.map((a,i)=>({uci:roots.raw[i+1].pv[0],dominant:a.dominant,bounds:a.bounds})),
   inferredFromRoundedCp:true,proofScope:'completed-top-k-with-independent-played-and-alternative-children',proofAgainstEveryDefense:false}
 }catch{return null}
}

// Search selection only: tentative estimates and a legal forcing consequence
// justify deeper evidence; they never certify a category.
export function potentialNativeSearch(entry){
 try{
  if(entry.classification!=='best'||entry.isEngineBest!==true||entry.isBookMove||entry.moveFacts?.forced||entry.bestMate!=null||entry.playedMate!=null)return false
  if(potentialEdgeSearch(entry))return true
  const root=entry.engine?.lines?.find(l=>l.multipv===1)??entry.engine,child=entry.playedEngine?.lines?.find(l=>l.multipv===1)??entry.playedEngine
  const a=nativeWdlInterval(entry.fenBefore,root.evalCp),b=nativeWdlInterval(entry.fenAfter,-child.evalCp)
  if(!a||!b||a.dominant!=='w'||b.dominant!=='w'||Math.min(a.bounds.points.min,b.bounds.points.min)<SPECIAL_POLICY.winning)return false
  const forcing=legalForcingConsequence(entry)
  return forcing.applicable&&['check','mate-threat','new-material-threat'].includes(forcing.kind)
    || Boolean(knightPawnEvasionExploitingQueenPin(entry))
 }catch{return false}
}
