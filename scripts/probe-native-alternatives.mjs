import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch} from './qa/verify-captured-search.mjs'
const area='agent-output/native-alternative-evidence-v1',mode=process.argv[2],sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
assert(['--prepare','--run','--replay'].includes(mode))
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},json=async p=>JSON.parse(await read(p))
const save=(n,v)=>writeFile(`${area}/${n}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
if(mode==='--prepare'){
 await mkdir(area)
 const study=await json('agent-output/native-wdl-study-v1/forcing-choice-study-v2.json'),positions=new Map(),observations=[]
 for(const row of study.results.find(r=>r.id==='native-forcing-choice').changes.filter(r=>r.after==='Grande'&&r.grande?.nativeOutcome)){
  const corpus=await json('agent-output/special-completion-v1/cohorts.json'),e=corpus.cases.find(c=>c.cohort===row.cohort&&c.id===row.game).entries.find(e=>e.ply===row.ply)
  for(const alt of row.grande.nativeOutcome.alternatives){const b=new Chess(e.fenBefore);b.move({from:alt.uci.slice(0,2),to:alt.uci.slice(2,4),promotion:alt.uci[4]});const fen=b.fen();positions.set(fen,{fen});observations.push({cohort:row.cohort,game:row.game,ply:row.ply,uci:alt.uci,fen})}
 }
 const selected={positions:[...positions.values()],selected:observations},pool=new Map()
 const add=async p=>{const b=await read(p),r=JSON.parse(b);if(r.nodes===1000000&&r.multiPv===5&&!r.searchMoves&&!pool.has(r.fen))pool.set(r.fen,{path:p,sha256:sha(b)})}
 const c=await json('agent-output/special-completion-evidence-v1/collection.json');for(const r of c.records){assert.equal(sha(await read(r.path)),r.sha256);await add(r.path)}
 const native=await json('agent-output/native-wdl-evidence-v1/collection.json');for(const r of native.records){assert.equal(sha(await read(r.path)),r.sha256);await add(r.path)}
 const old=await json('agent-output/new-refinement-measurement-v1/collection.json');assert(old.complete)
 for(let i=0;i<old.searches;i++)await add(`agent-output/new-refinement-measurement-v1/search-${String(i).padStart(3,'0')}.json`)
 const schedule=selected.positions.map((p,index)=>({index,fen:p.fen,nodes:1000000,multiPv:5,reuse:pool.get(p.fen)??null}))
 for(const t of schedule.filter(t=>t.reuse))verifyCapturedSearch(await json(t.reuse.path))
 for(const p of ['scripts/probe-native-alternatives.mjs','scripts/qa/native-wdl-interval.mjs','agent-output/native-wdl-study-v1/candidate-native-winning-choice.mjs','agent-output/native-wdl-study-v1/candidate-forcing-choice.js','src/lib/specialClassification.js','src/lib/specialPolicy.js','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const frozen=await json('agent-output/specials-frozen-candidate-v1.json');for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
 const searches=schedule.filter(t=>!t.reuse).length
 await save('protocol.json',{developmentOnly:true,independentValidation:false,selectionUsesExpectedLabels:false,selection:'Every analyzed alternative child of EVERY newly predicted native Great, including false positives, in the frozen expanded study. Predicted labels select, ground truth does not. Check whether alternatives keep a Draw/Loss outcome on an independent child search. No new thresholds or production changes.',schedule,selected:selected.selected,searches,reused:schedule.length-searches,cap:searches*1005000,retries:0,sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({positions:schedule.length,newSearches:searches,reused:schedule.length-searches,cap:searches*1005000}));process.exit(0)
}
const protocol=await json(`${area}/protocol.json`),check=async()=>{for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)}
await check();let actualNodes=0,newSearches=0,engine;const records=[]
if(mode==='--run'){
 try{await access(`${area}/started.json`);throw Error('Already started; no retry')}catch(e){if(e.code!=='ENOENT')throw e}
 await save('started.json',{started:new Date().toISOString(),searches:protocol.searches,cap:protocol.cap})
 try{
  const {NativeEngine}=await import('./qa/native-engine.js')
  engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))]);await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')
  for(const t of protocol.schedule){let p,path
   if(t.reuse){path=t.reuse.path;const b=await readFile(path);assert.equal(sha(b),t.reuse.sha256);p=JSON.parse(b)}
   else{assert(actualNodes+1005000<=protocol.cap);p=await capturedNodeSearch(engine,t.fen,t.nodes,t.multiPv);actualNodes+=p.actualNodes;newSearches++;path=`${area}/search-${t.index}.json`;await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})}
   verifyCapturedSearch(p);assert.equal(p.fen,t.fen);assert.equal(p.nodes,1000000);assert.equal(p.multiPv,5)
   records.push({index:t.index,path,sha256:sha(await readFile(path)),reused:Boolean(t.reuse)})
   console.log(JSON.stringify({completed:records.length,total:protocol.schedule.length,newSearches,actualNodes}))
  }
 }finally{engine?.close()}
 assert.equal(newSearches,protocol.searches);assert(actualNodes<=protocol.cap);await check()
 await save('collection.json',{complete:true,newSearches,actualNodes,cap:protocol.cap,records})
}else{
 const c=await json(`${area}/collection.json`)
 for(const r of c.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);verifyCapturedSearch(p);if(!r.reused){newSearches++;actualNodes+=p.actualNodes}}
 assert.equal(newSearches,c.newSearches);assert.equal(actualNodes,c.actualNodes);await check()
 await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,positions:c.records.length,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?newSearches:0,actualNodes}))
