import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from '../src/lib/nativeWdl.js'
import {validGrandeSearch} from '../src/lib/grandeProofs.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch} from './qa/verify-captured-search.mjs'
const area='agent-output/remaining-special-depth-v1',mode=process.argv[2],nodes=5000000
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const save=(p,v)=>writeFile(`${area}/${p}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
if(mode==='--prepare'){
 await mkdir(area)
 const verified=await json('agent-output/native-winning-integration-v1/verification.json');assert(verified.passed)
 const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),known=new Map(),selected=new Map(),positions=new Map()
 for(const collection of ['special-completion-evidence-v1','native-wdl-evidence-v1','native-alternative-evidence-v1']){
  const c=await json(`agent-output/${collection}/collection.json`)
  for(const r of c.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);if(p.nodes===1000000&&p.multiPv===5&&!p.searchMoves&&!known.has(p.fen))known.set(p.fen,{engine:p.engine,path:r.path})}
 }
 const choose=(r,reason)=>{
  const c=cases.find(c=>c.cohort===r.cohort&&c.id===r.game),e=c.entries.find(e=>e.ply===r.ply),key=c.id+':'+e.ply
  const prior=selected.get(key)
  if(prior){if(!prior.reasons.includes(reason))prior.reasons.push(reason);return}
  const root=known.get(e.fenBefore),child=known.get(e.fenAfter)
  selected.set(key,{game:c.id,cohort:c.cohort,ply:e.ply,san:e.playedMove,reasons:[reason],fen:e.fenBefore,after:e.fenAfter,oneMillion:{root:root?.path??null,child:child?.path??null}})
  for(const fen of [e.fenBefore,e.fenAfter])if(!positions.has(fen))positions.set(fen,{fen,nodes,multiPv:5,index:positions.size})
 }
 for(const r of verified.unresolved)choose(r,'remaining-confirmed-special-discrepancy')
 // Matched score regimes: the best and second root have the same native
 // outcome, as in all six unresolved cases. Current labels select controls.
 for(const r of verified.rows.filter(r=>r.cohort!=='initial'&&r.actual==='Migliore')){
  const root=known.get(r.fenBefore)?.engine,child=known.get(r.fenAfter)?.engine
  if(!validGrandeSearch(root,r.fenBefore)||!validGrandeSearch(child,r.fenAfter)||root.specialLines[0].pv[0]!==cases.find(c=>c.cohort===r.cohort&&c.id===r.game).entries[r.ply-1].playedUci)continue
  const [a,b]=root.specialLines
  if(!b||a.mate!=null||b.mate!=null||child.mate!=null)continue
  const x=nativeWdlInterval(r.fenBefore,a.evalCp),y=nativeWdlInterval(r.fenBefore,b.evalCp)
  if(x?.dominant&&x.dominant===y?.dominant)choose(r,'current-best-with-matched-native-outcome-regime')
 }
 const rejected=await json('agent-output/native-wdl-study-v1/forcing-choice-study-v2.json')
 for(const r of rejected.results.find(r=>r.id==='native-forcing-choice').falseSpecials)choose(r,'previously-rejected-false-special-control')
 for(const p of ['scripts/probe-remaining-special-depth.mjs','src/lib/nativeWdl.js','src/lib/specialClassification.js','src/lib/specialPolicy.js','src/lib/grandeProofs.js','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const schedule=[...positions.values()]
 await save('protocol.json',{developmentOnly:true,independentValidation:false,referenceLabelsUsedForUnresolvedSelection:true,
  hypothesis:'Distinguish engine-budget instability from absent structural classification rules in all remaining confirmed special discrepancies. Compare completed snapshots and independent played children at1M versus5M; no score propagation or rule integration.',
  controls:'All currently Best observations with available valid1M pairs and matching native best/second-root outcomes, plus every previously rejected native false-special control. No post-result case expansion.',
  selected:[...selected.values()],schedule,searches:schedule.length,cap:schedule.length*(nodes+5000),nodes,multiPv:5,threads:1,hashMb:16,clearHashPerSearch:true,retries:0,
  sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({cases:selected.size,positions:schedule.length,cap:schedule.length*(nodes+5000),targets:[...selected.values()].map(({game,ply,san,reasons})=>({game,ply,san,reasons}))}));process.exit(0)
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
