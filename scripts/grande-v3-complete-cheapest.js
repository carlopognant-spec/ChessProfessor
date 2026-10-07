import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { completedRootScore } from './grande-completed-score.js'
import { branchA } from './grande-v3-branch-a.js'

const root=new URL('../',import.meta.url)
const previous='agent-output/grande-v3-branch-a-2026-10-07T15-37-51-155Z/'
const watched=[],sha=bytes=>createHash('sha256').update(bytes).digest('hex')
async function input(path){const bytes=await readFile(new URL(path,root));watched.push({path,sha256:sha(bytes)});return JSON.parse(bytes)}
const prior=await input(previous+'results.json'),plan=await input(previous+'missing-search-plan.json')
const schedule=await input('agent-output/grande-progressive-2026-10-07T15-12-20-834Z/schedule.json')
const pkg=await input('node_modules/stockfish/package.json')
if(pkg.version!=='19.0.0'||prior.summary.failure||!prior.summary.sourceHashesUnchanged)throw Error('Incompatible input')
watched.push(...prior.watched)
for(const file of watched)if(sha(await readFile(new URL(file.path,root)))!==file.sha256)throw Error(`Changed source ${file.path}`)
const selected=plan.items.slice(0,5),cap=20000000
if(selected.reduce((s,c)=>s+c.nominalNodes,0)>cap)throw Error('Frozen selection exceeds budget')
const directory=new URL(`agent-output/grande-v3-completion-${new Date().toISOString().replace(/[:.]/g,'-')}/`,root)
await mkdir(directory)
const save=(name,data)=>writeFile(new URL(name,directory),JSON.stringify(data,null,2)+'\n',{flag:'wx'})
await save('schedule.json',{policy:'v3-branch-a',ordering:plan.ordering,selection:'first five from previously saved cost plan',cap,selected,maximumNominalNodes:selected.reduce((s,c)=>s+c.nominalNodes,0),previous})
const records=structuredClone(prior.records),outcomes=[],searchRecords=[]
let engine,searches=0,nominalNodes=0,actualNodes=0,failure=null
const started=performance.now()
try{
  engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('scripts/qa/wasm-engine.cjs',root)),fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js',root))])
  await engine.init()
  if(!/^Stockfish 19\b/.test(engine.version))throw Error('Unexpected UCI engine')
  for(const item of selected){
    const record=records.find(r=>r.gameId===item.gameId&&r.ply===item.ply)
    const candidate=schedule.candidates.find(c=>c.gameId===item.gameId&&c.ply===item.ply)
    if(record.status!=='incomplete'||!candidate)throw Error('Invalid selected candidate')
    const before=record.status
    for(const missing of item.missing){
      if(nominalNodes+missing.budgetNodes>cap||actualNodes+missing.budgetNodes>cap){record.reason='budget-cap';break}
      const target=record.roots.find(r=>r.uci===missing.uci)
      if(!target||target.provenance.some(p=>p.budget===missing.budgetNodes))throw Error('Duplicate or unknown root')
      await engine.request(['ucinewgame','setoption name Clear Hash','setoption name MultiPV value 1','isready'],line=>line==='readyok'?true:undefined)
      nominalNodes+=missing.budgetNodes;searches++
      const rawLines=[],searchStarted=performance.now();let maxNodes=0
      const result=await engine.request([`position fen ${candidate.fenBefore}`,`go nodes ${missing.budgetNodes} searchmoves ${missing.uci}`],raw=>{
        rawLines.push(raw);maxNodes=Math.max(maxNodes,Number(raw.match(/\bnodes (\d+)/)?.[1]??0))
        if(raw.startsWith('bestmove '))return{bestmove:raw,actualNodes:maxNodes,elapsedMs:performance.now()-searchStarted}
      })
      actualNodes+=result.actualNodes
      const evidence={gameId:item.gameId,ply:item.ply,fen:candidate.fenBefore,uci:missing.uci,budgetNodes:missing.budgetNodes,...result,rawLines}
      const filename=`search-${String(searches).padStart(4,'0')}.json`
      await save(filename,evidence)
      if(!result.actualNodes||result.bestmove.split(' ')[1]!==missing.uci)throw Error('Invalid root search')
      const selection=completedRootScore(rawLines,missing.uci)
      if(selection.completed){const game=new Chess(candidate.fenBefore);for(const uci of selection.completed.pv)game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})}
      const pairs=target.provenance.map((p,i)=>({provenance:p,score:target.scores[i]}))
      pairs.push({provenance:{budget:missing.budgetNodes,path:fileURLToPath(new URL(filename,directory))},score:selection.completed})
      pairs.sort((a,b)=>a.provenance.budget-b.provenance.budget)
      target.provenance=pairs.map(p=>p.provenance);target.scores=pairs.map(p=>p.score)
      searchRecords.push({gameId:item.gameId,ply:item.ply,uci:missing.uci,budgetNodes:missing.budgetNodes,actualNodes:result.actualNodes,completedScore:selection.completed,finalScore:selection.latest})
      const verdict=branchA(record.roots,record.uci,record.legalCount)
      Object.assign(record,verdict)
      console.log(JSON.stringify({searches,game:item.gameId,ply:item.ply,uci:missing.uci,budget:missing.budgetNodes,status:record.status,actualNodes}))
      if(record.status!=='incomplete')break
    }
    outcomes.push({gameId:item.gameId,ply:item.ply,san:item.san,before,after:record.status,reason:record.reason,guardedGapCp:record.guardedGapCp??null})
    await save(`candidate-${item.gameId}-${item.ply}.json`,record)
    if(record.reason==='budget-cap')break
  }
}catch(error){failure=error.stack;console.error(failure)}finally{engine?.close()}
let hashesUnchanged=true
for(const file of watched)if(sha(await readFile(new URL(file.path,root)))!==file.sha256)hashesUnchanged=false
const statuses={};for(const r of records)statuses[r.status]=(statuses[r.status]??0)+1
const summary={policy:'v3-branch-a',cap,newSearches:searches,newNominalNodes:nominalNodes,newActualNodes:actualNodes,elapsedMs:performance.now()-started,selectedCandidates:selected.length,processedSelected:outcomes.length,totalCandidates:records.length,statuses,sourceHashesUnchanged:hashesUnchanged,failure,annotationsRead:false}
await save('results.json',{summary,records,outcomes,searchRecords,watched})
const report=['# Grande v3 — completamento dei cinque candidati meno costosi','',...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`),'','| Partita | Ply | SAN | Prima | Dopo | Motivo |','|---|---:|---|---|---|---|',...outcomes.map(r=>`| ${r.gameId} | ${r.ply} | ${r.san} | ${r.before} | ${r.after} | ${r.reason} |`),'','Selezione per costo prima del confronto con etichette. Scope sperimentale, nessuna categoria attivata nell’app.','Score complete alla depth/nodi registrati; gli intervalli sono guardie operative, non confidenza statistica.','Test sintetici eseguiti separatamente; suite app/build/browser NON ESEGUITI. .env e Partite/7–10 non letti. Nessun commit/push. STOP.',''].join('\n')
await writeFile(new URL('report.md',directory),report,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary,outcomes},null,2))
if(failure||!hashesUnchanged)process.exitCode=1
