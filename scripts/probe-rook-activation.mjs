import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch,capturedSearchKey as key} from './qa/verify-captured-search.mjs'
import {newRookKingFileAccess} from '../agent-output/grande-recovery-proof-v1/candidate-rook-access.mjs'
const area='agent-output/rook-activation-evidence-v1',mode=process.argv[2]
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map(),read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const save=(name,value)=>writeFile(`${area}/${name}`,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const value={p:1,n:3,b:3,r:5,q:9,k:0},material=(b,s)=>b.board().flat().filter(Boolean).reduce((a,p)=>a+(p.color===s?1:-1)*value[p.type],0)
const uci=m=>m.from+m.to+(m.promotion??''),play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
if(mode==='--prepare'){
 await mkdir(area)
 const {cases}=await parse('agent-output/special-completion-v1/cohorts.json')
 const selected=await parse('agent-output/grande-recovery-proof-v1/rook-access-targets.json')
 assert.equal(selected.selectionUsesExpectedLabels,false)
 const entry=(id,ply)=>cases.find(c=>c.id===id&&c.cohort==='refined')?.entries[ply-1]??cases.find(c=>c.id===id&&c.cohort==='old').entries[ply-1]
 const offers=[]
 for(const t of selected.targets){
  const e=entry(t.game,t.ply),a=newRookKingFileAccess(e);assert(a)
  for(const offer of t.offers){
   const accepted=new Chess(e.fenAfter);play(accepted,offer.uci)
   const initial=new Chess(e.fenBefore),side=initial.turn(),baseline=material(initial,side)
   const recoveries=accepted.moves({verbose:true}).filter(m=>m.captured).filter(m=>{const b=new Chess(accepted.fen());b.move(m.san);return material(b,side)>=baseline}).map(m=>({uci:uci(m),san:m.san}))
   offers.push({game:t.game,ply:t.ply,san:e.playedMove,control:false,fen:e.fenAfter,capture:offer.uci,acceptedFen:accepted.fen(),recoveries})
  }
 }
 const oldProtocol=await parse('agent-output/persistent-offer-context-v1/protocol.json'),old=await parse('agent-output/persistent-offer-context-v1/collection.json'),pool=new Map()
 for(const r of old.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);verifyCapturedSearch(p);pool.set(key(p.fen,p.nodes,p.multiPv,p.searchMoves),{path:r.path,sha256:r.sha256})}
 for(const o of oldProtocol.offers.filter(o=>['persistent-control','negative-control'].includes(o.kind))){
  const b=new Chess(o.fen);play(b,o.capture)
  offers.push({...o,control:true,acceptedFen:b.fen(),recoveries:[]})
 }
 const schedule=[],unique=new Map()
 const add=(fen,multiPv,searchMoves)=>{
  const k=key(fen,200000,multiPv,searchMoves)
  if(unique.has(k))return unique.get(k)
  const index=schedule.length;unique.set(k,index);schedule.push({index,fen,nodes:200000,multiPv,...(searchMoves?{searchMoves}:{}),reuse:pool.get(k)??null});return index
 }
 for(const o of offers){
  o.acceptance=add(o.fen,1,[o.capture]);o.confirmation=add(o.acceptedFen,5)
  for(const r of o.recoveries){
   const b=new Chess(o.acceptedFen);play(b,r.uci)
   r.search=add(o.acceptedFen,1,[r.uci]);r.afterFen=b.fen();r.confirmation=add(b.fen(),5)
  }
 }
 const searches=schedule.filter(s=>!s.reuse).length;assert(searches<=16)
 for(const p of ['scripts/probe-rook-activation.mjs','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','src/lib/multiPvEvidence.js','src/lib/analysisMetadata.js','src/lib/specialPolicy.js','agent-output/grande-recovery-proof-v1/rook-access-hypothesis.md','agent-output/grande-recovery-proof-v1/candidate-rook-access.mjs','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/package.json','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const frozen=await parse('agent-output/specials-frozen-candidate-v1.json');for(const s of frozen.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
 await save('protocol.json',{developmentOnly:true,independentValidation:false,selectionUsesExpectedLabels:false,
  selection:'All recorded rook-access geometries with stationary piece offers in numerical Best/Excellent development entries, plus already recorded negative controls. Every immediate full material recovery is searched and corroborated.',
  purpose:'Distinguish compensated offensive rook activation from ordinary exchanges and apparently available immediate material recovery. No classification change by this collection.',
  nodes:200000,threads:1,hashMb:16,clearHashPerSearch:true,retries:0,offers,schedule,searches,reused:schedule.length-searches,cap:searches*205000,
  sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({offers:offers.length,positions:schedule.length,newSearches:searches,reused:schedule.length-searches,cap:searches*205000}));process.exit(0)
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
    actualNodes+=p.actualNodes;newSearches++;path=`${area}/search-${t.index}.json`
    await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})
   }
   verifyCapturedSearch(p);assert.equal(key(p.fen,p.nodes,p.multiPv,p.searchMoves),key(t.fen,t.nodes,t.multiPv,t.searchMoves))
   records.push({index:t.index,path,sha256:sha(await readFile(path)),reused:Boolean(t.reuse)})
   console.log(JSON.stringify({completed:records.length,total:protocol.schedule.length,newSearches,actualNodes}))
  }
 }finally{engine?.close()}
 assert.equal(newSearches,protocol.searches);assert(actualNodes<=protocol.cap);await check()
 await save('collection.json',{complete:true,newSearches,actualNodes,cap:protocol.cap,records})
}else{
 const collection=await parse(`${area}/collection.json`)
 for(const r of collection.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256);verifyCapturedSearch(JSON.parse(b));if(!r.reused){newSearches++;actualNodes+=JSON.parse(b).actualNodes}}
 assert.equal(newSearches,collection.newSearches);assert.equal(actualNodes,collection.actualNodes);await check()
 await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,verifiedPositions:collection.records.length,verifiedNewSearches:newSearches,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?newSearches:0,actualNodes}))
