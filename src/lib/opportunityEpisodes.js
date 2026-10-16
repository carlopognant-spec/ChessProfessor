// Distinguish a new opportunity from a restored established winning position.
import { Chess } from 'chess.js'
import { classifyReviewedMove } from './reviewEvaluation.js'
import { SPECIAL_POLICY as policy } from './specialPolicy.js'
const primary = engine => engine?.lines?.find(l => l.multipv === 1) ?? engine
const exact = line => line && !line.bound && !line.lowerbound && !line.upperbound
  && !/\b(?:lowerbound|upperbound)\b/.test(line.raw ?? '')
function play(board, uci) {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci ?? '')) throw Error('Invalid move')
  return board.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})
}
function verified(input) {
  if (!input || input.engine?.fen !== input.fenBefore || input.playedEngine?.fen !== input.fenAfter
    || input.engine.analysisMetadata?.searchMoves || input.playedEngine.analysisMetadata?.searchMoves) return null
  const board = new Chess(input.fenBefore)
  play(board,input.playedUci ?? input.uci)
  if(board.fen()!==input.fenAfter)return null
  const e=classifyReviewedMove(input)
  if(!['coherent','independent'].includes(e.evaluationEvidence?.status)
    || ![e.bestProbability,e.playedProbability].every(v=>Number.isFinite(v)&&v>=0&&v<=1))return null
  const child=primary(e.playedEngine)
  if(!exact(child)||!child.pv?.length||!e.comparisonPv?.length)return null
  for(const [fen,pv]of [[e.fenBefore,e.comparisonPv],[e.fenAfter,child.pv]]){
    const b=new Chess(fen);for(const u of pv)play(b,u)
  }
  return e
}
export function retainEstablishedWinningBlunder(result,input,previous,previousOwn) {
  // This assessment is derived from history and must be recomputed on reopen.
  if (result.opportunityAssessment) result = { ...result, opportunityAssessment: null }
  if(result.classification!=='missed'||result.missedOpportunity?.kind==='forced-mate'
    ||previousOwn?.classification!=='blunder'||previousOwn.isBookMove||previous?.isBookMove||input.isBookMove
    ||previousOwn.ply!==input.ply-2||previous?.ply!==input.ply-1
    ||previousOwn.fenAfter!==previous.fenBefore||previous.fenAfter!==input.fenBefore)return result
  try{
    const own=verified(previousOwn),prior=verified(previous),current=verified(input)
    if(!own||!prior||!current||own.numericalClassification!=='blunder'||current.numericalClassification!=='blunder'
      ||!['mistake','blunder'].includes(prior.numericalClassification)
      ||current.bestMate>0||current.playedMate===0||current.playedMate>0)return result
    if(new Chess(own.fenBefore).turn()!==new Chess(current.fenBefore).turn())return result
    const p=policy
    if(own.bestProbability<p.winning||own.playedProbability>p.nonWinning
      ||current.bestProbability<p.winning||current.playedProbability>p.nonWinning
      ||Math.abs(current.bestProbability-own.bestProbability)>p.consistency
      ||Math.abs(own.playedProbability-(1-prior.bestProbability))>p.consistency
      ||Math.abs(current.bestProbability-(1-prior.playedProbability))>p.consistency)return result
    return{...result,classification:current.numericalClassification,missedOpportunity:null,
      missedOpportunityReason:'restored-own-winning-chance',opportunityAssessment:{status:'retain-numerical',
        reason:'restored-own-winning-chance',policyVersion:'opportunity-episode-v1',
        proposedOpportunity:result.missedOpportunity,evidence:{previousOwnPly:own.ply,
          establishedIndex:own.bestProbability,lostIndex:own.playedProbability,
          beforeOpponentIndex:1-prior.bestProbability,restoredIndex:current.bestProbability,
          playedIndex:current.playedProbability}}}
  }catch{return result}
}
