import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {pendingSacrificeTargets,materialRecoveryTargets} from '../src/lib/sacrificeSearches.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch,capturedSearchKey as key} from './qa/verify-captured-search.mjs'
import {reconstructRestrictedSearch} from './qa/reconstruct-captured-search.mjs'
const area='agent-output/all-sacrifice-proofs-v1',mode=process.argv[2]
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const save=(name,value)=>writeFile(`${area}/${name}`,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
if(mode==='--prepare'){
 await mkdir(area)
 const {cases}=await parse('agent-output/special-completion-v1/cohorts.json'),targets=new Map(),observations=[]
 for(const c of cases){
  const entries=reclassifyReviewedMoves(c.entries)
  for(const t of pendingSacrificeTargets(entries,{includeRecoveries:true})){
   const e=entries.find(e=>e.ply===t.ply),k=key(t.fen,200000,1,[t.captureUci])
   observations.push({cohort:c.cohort,game:c.id,ply:t.ply,captureUci:t.captureUci,key:k})
   if(!targets.has(k))targets.set(k,{...t,game:c.id,san:e.playedMove,recoveries:materialRecoveryTargets(e,t.captureUci)})
  }
  console.log(JSON.stringify({selected:c.id,cohort:c.cohort,uniqueTargets:targets.size}))
 }
 const pool=new Map()
 const add=async path=>{const b=await read(path),p=JSON.parse(b);if(p.nodes!==200000)return
  pool.set(key(p.fen,p.nodes,p.multiPv,p.searchMoves),{path,sha256:sha(b)})}
 for(const collectionPath of ['agent-output/persistent-offer-context-v1/collection.json','agent-output/rook-activation-evidence-v1/collection.json']){
  const c=await parse(collectionPath);for(const r of c.records){assert.equal(sha(await read(r.path)),r.sha256);await add(r.path)}
 }
 const recent=await parse('agent-output/new-references-200k-v1/collection.json');assert(recent.complete)
 for(let i=0;i<recent.searches;i++)await add(`agent-output/new-references-200k-v1/search-${String(i).padStart(3,'0')}.json`)
 const legacyPath='agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json',legacy=await parse(legacyPath)
 for(const [i,r]of legacy.searches.entries()){
  const p=reconstructRestrictedSearch(r,{path:legacyPath,index:i}),path=`${area}/reconstructed-${i}.json`
  await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'});pool.set(key(p.fen,p.nodes,p.multiPv,p.searchMoves),{path,sha256:sha(await read(path))})
 }
 const schedule=[],seen=new Map(),addTask=(fen,multiPv,searchMoves)=>{
  const k=key(fen,200000,multiPv,searchMoves);if(seen.has(k))return seen.get(k)
  const index=schedule.length;seen.set(k,index);schedule.push({index,fen,nodes:200000,multiPv,...(searchMoves?{searchMoves}:{}),reuse:pool.get(k)??null});return index
 }
 for(const t of targets.values()){
  t.acceptance=addTask(t.fen,1,[t.captureUci]);t.confirmation=addTask(t.acceptedFen,5)
  for(const r of t.recoveries.filter(r=>!r.terminal)){r.search=addTask(t.acceptedFen,1,[r.uci]);r.confirmation=addTask(r.afterFen,5)}
 }
 for(const t of schedule.filter(t=>t.reuse)){const p=await parse(t.reuse.path);verifyCapturedSearch(p)}
 for(const p of ['scripts/probe-all-sacrifice-proofs.mjs','scripts/qa/reconstruct-captured-search.mjs','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','src/lib/specialClassification.js','src/lib/specialPolicy.js','src/lib/sacrificeEvidence.js','src/lib/sacrificeSearches.js','src/lib/rookAccess.js','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/package.json','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const searches=schedule.filter(t=>!t.reuse).length
 await save('protocol.json',{developmentOnly:true,independentValidation:false,selectionUsesExpectedLabels:false,
  selection:'Every currently pending sacrifice acceptance and every immediate full material recovery in all18development profiles, before request caps. Covers complete proof-only application flows, not only the rook motif.',
  nodes:200000,threads:1,hashMb:16,clearHashPerSearch:true,retries:0,targets:[...targets.values()],observations,schedule,searches,reused:schedule.length-searches,cap:searches*205000,sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({targets:targets.size,positions:schedule.length,newSearches:searches,reused:schedule.length-searches,cap:searches*205000}));process.exit(0)
}
const protocol=await parse(`${area}/protocol.json`),check=async()=>{for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)}
await check();let engine,actualNodes=0,newSearches=0;const records=[]
if(mode==='--run'){
 try{await access(`${area}/started.json`);throw Error('Already started; no retry')}catch(e){if(e.code!=='ENOENT')throw e}
 await save('started.json',{started:new Date().toISOString(),searches:protocol.searches,cap:protocol.cap})
 try{
  const {NativeEngine}=await import('./qa/native-engine.js')
  engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))]);await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')
  for(const t of protocol.schedule){let p,path
   if(t.reuse){path=t.reuse.path;const b=await readFile(path);assert.equal(sha(b),t.reuse.sha256);p=JSON.parse(b)}
   else{
    assert(actualNodes+t.nodes+5000<=protocol.cap)
    const transport=t.searchMoves?{version:engine.version,request:(commands,handler)=>engine.request(commands.map(c=>c.startsWith('go nodes ')?`${c} searchmoves ${t.searchMoves.join(' ')}`:c),handler)}:engine
    p=await capturedNodeSearch(transport,t.fen,t.nodes,t.multiPv)
    if(t.searchMoves){p.searchMoves=t.searchMoves;p.engine.analysisMetadata.searchMoves=t.searchMoves}
    actualNodes+=p.actualNodes;newSearches++;path=`${area}/search-${t.index}.json`;await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})
   }
   verifyCapturedSearch(p);assert.equal(key(p.fen,p.nodes,p.multiPv,p.searchMoves),key(t.fen,t.nodes,t.multiPv,t.searchMoves))
   records.push({index:t.index,path,sha256:sha(await readFile(path)),reused:Boolean(t.reuse)})
   console.log(JSON.stringify({completed:records.length,total:protocol.schedule.length,newSearches,actualNodes}))
  }
 }finally{engine?.close()}
 assert.equal(newSearches,protocol.searches);assert(actualNodes<=protocol.cap);await check()
 await save('collection.json',{complete:true,newSearches,actualNodes,cap:protocol.cap,records})
}else{
 const c=await parse(`${area}/collection.json`)
 for(const r of c.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);verifyCapturedSearch(p);if(!r.reused){newSearches++;actualNodes+=p.actualNodes}}
 assert.equal(newSearches,c.newSearches);assert.equal(actualNodes,c.actualNodes);await check()
 await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,verifiedPositions:c.records.length,verifiedNewSearches:newSearches,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?newSearches:0,actualNodes}))
