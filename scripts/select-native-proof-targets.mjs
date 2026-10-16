import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from './qa/native-wdl-interval.mjs'
import {classifyReviewedMove} from '../src/lib/reviewEvaluation.js'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {SPECIAL_POLICY} from '../src/lib/specialPolicy.js'
const area='agent-output/native-wdl-study-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
const source=(await read('src/lib/responseEvidence.js')).toString(),start=source.indexOf('  try{',source.indexOf('export function assessForcingResponse'))
assert(start>0)
// Isolate the existing pure legal-consequence calculation for search selection.
// It supplies no score comparison and cannot itself promote a move.
let geometry=source.slice(0,source.indexOf('export function assessForcingResponse'))+'export function legalConsequence(entry){\n'+source.slice(start)
geometry=geometry.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
const {legalConsequence}=await import('data:text/javascript;base64,'+Buffer.from(geometry).toString('base64'))
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),baseline=await json('agent-output/grande-recovery-proof-v1/verification-v20.json')
const base=new Map(baseline.rows.map(r=>[`${r.cohort}:${r.game}:${r.ply}`,r])),collection=await json('agent-output/special-completion-evidence-v1/collection.json'),known=new Map()
for(const r of collection.records){const p=await json(r.path);known.set(p.fen,p.engine)}
await read('scripts/select-native-proof-targets.mjs');await read('scripts/qa/native-wdl-interval.mjs')
await writeFile(`${area}/selection-protocol.json`,JSON.stringify({developmentOnly:true,newSearches:0,
 selection:'Unresolved current numerical Best (reference labels never select), engine-best played, non-book/non-forced/nonmate, tentative root and child native Win outcomes >=.75, existing legal forcing consequence. Current candidate comparison is not a certificate. No alternative cutoff for selection; a deeper search can change their outcome.',
 budget:'Only enumerate and deduplicate exact missing root/child pairs. No engine queries in this script.',sources},null,2)+'\n',{flag:'wx'})
const selected=[],positions=new Map()
for(const c of cases)for(const raw of c.entries){
 const prior=base.get(`${c.cohort}:${c.id}:${raw.ply}`);if(prior.actual!=='Migliore')continue
 const e=classifyReviewedMove(raw)
 if(e.classification!=='best'||e.isEngineBest!==true||e.isBookMove||e.moveFacts?.forced||e.moveFacts?.legalMoves<2||e.bestMate!=null||e.playedMate!=null)continue
 const root=e.engine.lines?.find(l=>l.multipv===1)??e.engine,child=e.playedEngine.lines?.find(l=>l.multipv===1)??e.playedEngine
 const w=nativeWdlInterval(e.fenBefore,root.evalCp),z=nativeWdlInterval(e.fenAfter,-child.evalCp)
 if(!w||!z||w.dominant!=='w'||z.dominant!=='w'||Math.min(w.bounds.points.min,z.bounds.points.min)<SPECIAL_POLICY.winning)continue
 const forcing=legalConsequence(e)
 if(!forcing.applicable||!['check','mate-threat','new-material-threat'].includes(forcing.kind))continue
 for(const fen of [e.fenBefore,e.fenAfter])positions.set(fen,{fen,reused:validGrandeSearch(known.get(fen),fen)})
 selected.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,forcing,root:e.fenBefore,child:e.fenAfter})
}
await writeFile(`${area}/selected-targets.json`,JSON.stringify({selected,positions:[...positions.values()],newSearches:0,productionChanged:false,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({selected:selected.length,positions:positions.size,missing:[...positions.values()].filter(p=>!p.reused).length,targets:selected.map(({cohort,game,ply,san})=>({cohort,game,ply,san}))}))
