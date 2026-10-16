import {readFile} from 'node:fs/promises'
import {selectRefinementView} from '../src/lib/analysisRefinement.js'
const data=JSON.parse(await readFile('agent-output/new-refinement-measurement-v1/game-185230271130-round-2.json'))
const entries=selectRefinementView(data.entries,true)
for (const e of entries.slice(22,28)) console.log(JSON.stringify({ply:e.ply,san:e.playedMove,fen:e.fenBefore,label:e.classification,assessment:e.specialAssessment,lines:(e.engine.specialLines??e.engine.lines).slice(0,3)}))
