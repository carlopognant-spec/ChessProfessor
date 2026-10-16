import {readFile} from 'node:fs/promises'
const {cases}=JSON.parse(await readFile('agent-output/review-batch-v1/cohorts.json'))
for (const c of cases) if(c.cohort==='new-refined') for(const [i,e] of c.entries.entries()) if(c.expected[i]==='Mossa mancata') {
 const p=c.entries[i-1]; console.log(JSON.stringify({game:c.id,ply:e.ply,san:e.playedMove,actual:e.classification,best:e.bestEval,played:e.playedEval,mate:e.bestMate,drop:e.dropPct,reason:e.missedOpportunityReason,opp:p?.playedMove,oppClass:p?.numericalClassification,before:1-p?.bestProbability,offered:1-p?.playedProbability,current:e.bestProbability,after:e.playedProbability,pv:e.engine.lines[0]?.pv.slice(0,6),beforeFen:e.fenBefore}))
}
