import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from '../src/lib/nativeWdl.js'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch} from './qa/verify-captured-search.mjs'
const area='agent-output/depth-stability-v1',mode=process.argv[2],nodes=10000000
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const save=(p,v)=>writeFile(`${area}/${p}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
if(mode==='--prepare'){
 await mkdir(area)
 const report=await json('agent-output/remaining-special-depth-v1/report.json')
 assert((await json('agent-output/remaining-special-depth-v1/replay-check.json')).passed)
 const selected=report.rows.filter(r=>r.bestMoveChanged||!r.completedPairAvailable||r.nativePlayedChildDisagreement===true)
 const positions=new Map()
 for(const r of selected)for(const fen of[r.fen,r.after])if(!positions.has(fen))positions.set(fen,{fen,nodes,multiPv:5,index:positions.size})
 for(const p of ['scripts/probe-depth-stability.mjs','src/lib/nativeWdl.js','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const schedule=[...positions.values()]
 await save('protocol.json',{developmentOnly:true,independentValidation:false,productionChanged:false,referenceLabelsUsedForSelection:false,
  hypothesis:'Resolve precisely the engine evidence disagreements already observed at5M: changed bestmove, missing completed paired snapshot, or discordant native root/child outcome. Every matching row of the43-position development study is included; no reference labels select cases. One fixed10M node search per distinct root/played-child, no retry or score propagation.',
  selected:selected.map(r=>({game:r.game,cohort:r.cohort,ply:r.ply,san:r.san,fen:r.fen,after:r.after,reasons:{bestMoveChanged:r.bestMoveChanged,completedPairAvailable:r.completedPairAvailable,nativePlayedChildDisagreement:r.nativePlayedChildDisagreement}})),
  schedule,searches:schedule.length,cap:schedule.length*(nodes+5000),nodes,multiPv:5,threads:1,hashMb:16,clearHashPerSearch:true,retries:0,
  sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({cases:selected.length,positions:schedule.length,cap:schedule.length*(nodes+5000)}));process.exit(0)
}
const protocol=await json(`${area}/protocol.json`),check=async()=>{for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)}
await check();let engine,actualNodes=0;const records=[]
if(mode==='--run'){
 try{await access(`${area}/started.json`);throw Error('Already started; no retry')}catch(e){if(e.code!=='ENOENT')throw e}
 await save('started.json',{started:new Date().toISOString(),searches:protocol.searches,cap:protocol.cap})
 try{
  const {NativeEngine}=await import('./qa/native-engine.js')
  engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))]);await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')
  for(const t of protocol.schedule){
   assert(actualNodes+t.nodes+5000<=protocol.cap)
   const p=await capturedNodeSearch(engine,t.fen,t.nodes,t.multiPv);verifyCapturedSearch(p);actualNodes+=p.actualNodes
   const path=`${area}/search-${t.index}.json`;await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})
   records.push({index:t.index,path,sha256:sha(await readFile(path))})
   console.log(JSON.stringify({completed:records.length,total:protocol.searches,actualNodes}))
  }
 }finally{engine?.close()}
 await check();assert(actualNodes<=protocol.cap);await save('collection.json',{complete:true,actualNodes,cap:protocol.cap,records})
}else{
 const c=await json(`${area}/collection.json`)
 for(const r of c.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);verifyCapturedSearch(p);actualNodes+=p.actualNodes}
 assert.equal(actualNodes,c.actualNodes);await check();await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,positions:c.records.length,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?records.length:0,actualNodes}))
