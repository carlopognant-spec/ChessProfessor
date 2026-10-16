import { readFile } from 'node:fs/promises'
import { selectRefinementView } from '../src/lib/analysisRefinement.js'
const prev=JSON.parse(await readFile('agent-output/grande-response-v9-verification-v1/results.json'))
for (const game of [...new Set(prev.rows.map(r=>r.game))]) {
 const data=JSON.parse(await readFile(`agent-output/new-refinement-measurement-v1/game-${game}-round-2.json`))
 const entries=selectRefinementView(data.entries,true)
 for(const [i,e] of entries.entries()) {
  const row=prev.rows.find(r=>r.game===game&&r.ply===e.ply)
  if(row.after!=='Grande'||row.expected==='Grande') continue
  console.log(JSON.stringify({game,ply:e.ply,san:e.playedMove,expected:row.expected,fen:e.fenBefore,grande:e.specialAssessment.grande,
   previous:entries[i-1]?.playedMove,own:entries[i-2]?.playedMove,
   roots:(e.engine.specialLines??e.engine.lines).map(l=>({d:l.depth,cp:l.evalCp,mate:l.mate,pv:l.pv.slice(0,6)})),
   child:(e.playedEngine.specialLines??e.playedEngine.lines).slice(0,2).map(l=>({d:l.depth,cp:l.evalCp,mate:l.mate,pv:l.pv.slice(0,6)}))}))
 }
}
