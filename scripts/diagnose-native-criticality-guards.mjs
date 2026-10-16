import {readFile,writeFile} from 'node:fs/promises'
import {Chess} from 'chess.js'
import {createHash} from 'node:crypto'
import {detectMaterialRealization} from '../src/lib/materialRealization.js'
import {assessForcingResponse} from '../src/lib/responseEvidence.js'
import {deferredForcingResponse} from '../src/lib/deferredResponse.js'
import {classifyReviewedMove} from '../src/lib/reviewEvaluation.js'
import {nativeWdlInterval} from './qa/native-wdl-interval.mjs'
const area='agent-output/native-wdl-study-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
const study=await json(`${area}/criticality-study.json`),{cases}=await json('agent-output/special-completion-v1/cohorts.json'),collection=await json('agent-output/special-completion-evidence-v1/collection.json'),packets=new Map()
for(const r of collection.records){const p=await json(r.path);packets.set(p.fen,p.engine)}
let source=(await read('src/lib/specialClassification.js')).toString().replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`).replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/specialClassification.js',import.meta.url)).href}'`)
source+='\nexport {rootEvidence}\n'
const {rootEvidence}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const rows=[]
for(const r of study.proposals){
 const c=cases.find(c=>c.cohort===r.cohort&&c.id===r.game),i=c.entries.findIndex(e=>e.ply===r.ply),e=c.entries[i]
 const current=classifyReviewedMove({...e,engine:packets.get(e.fenBefore),playedEngine:packets.get(e.fenAfter)})
 const before=new Chess(e.fenBefore),side=before.turn(),v={p:1,n:3,b:3,r:5,q:9,k:0},baseline=before.board().flat().filter(Boolean).reduce((s,p)=>s+(p.color===side?1:-1)*v[p.type],0)
 const roots=rootEvidence(current,before,side,baseline),forcing=assessForcingResponse(current,roots),deferred=deferredForcingResponse(current,roots,forcing)
 const prior=c.entries[i-1],previousOwn=c.entries[i-2],prevPacket=packets.get(prior?.fenBefore)
 rows.push({game:r.game,cohort:r.cohort,ply:r.ply,san:r.san,expected:r.expected,realization:detectMaterialRealization(current,prior,previousOwn),forcing,deferred,
  incomingCheck:before.isCheck(),previousNative:prevPacket?.mate==null&&Number.isInteger(prevPacket?.evalCp)?nativeWdlInterval(prior.fenBefore,-prevPacket.evalCp)?.dominant:null})
}
await writeFile(`${area}/guard-diagnosis.json`,JSON.stringify({diagnosticOnly:true,newSearches:0,productionChanged:false,selection:'Every proposal from the rejected broad native outcome model; inspect existing realization, forcing and deferability guards without inventing a cutoff.',rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows))
