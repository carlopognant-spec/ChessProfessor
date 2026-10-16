import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import assert from 'node:assert/strict'
import {Chess} from 'chess.js'
import {capturedNodeSearch} from './qa/captured-node-search.js'
import {verifyCapturedSearch} from './qa/verify-captured-search.mjs'
import {createMultiPvEvidence} from '../src/lib/multiPvEvidence.js'
import {createAnalysisMetadata} from '../src/lib/analysisMetadata.js'
const area='agent-output/persistent-offer-context-v1',mode=process.argv[2]
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const save=(name,value)=>writeFile(`${area}/${name}`,JSON.stringify(value,null,2)+'\n',{flag:'wx'})
const play=(b,u)=>b.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]})
if(mode==='--prepare'){
 await mkdir(area,{recursive:true})
 const baseline=await parse('agent-output/special-completion-v1/verification-v17.json')
 for(const s of baseline.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
 const {cases}=await parse('agent-output/special-completion-v1/cohorts.json')
 const entry=(id,ply)=>cases.find(c=>c.id===id&&c.cohort==='refined')?.entries[ply-1]??cases.find(c=>c.id===id&&c.cohort==='old').entries[ply-1]
 const historical='game-1-chigorin-steinitz-1892',rb3=entry(historical,53),offers=[]
 offers.push({kind:'earlier-own-move',game:historical,ply:51,san:'Nxh8',fen:entry(historical,51).fenAfter,capture:'c8h8'})
 offers.push({kind:'played',game:historical,ply:53,san:'Rb3',fen:rb3.fenAfter,capture:'c8h8'})
 const collection=await parse('agent-output/special-completion-evidence-v1/collection.json')
 const record=collection.records.find(r=>r.fen===rb3.fenBefore),packet=await parse(record.path)
 assert.equal(sources.get(record.path),record.sha256)
 for(const l of packet.engine.specialLines){
  if(l.pv[0]===rb3.playedUci)continue
  const b=new Chess(rb3.fenBefore),m=play(b,l.pv[0])
  if(b.get('h8')?.type!=='n'||!b.moves({verbose:true}).some(m=>m.from==='c8'&&m.to==='h8'))continue
  offers.push({kind:'same-position-alternative',game:historical,ply:53,san:m.san,fen:b.fen(),capture:'c8h8'})
 }
 offers.push({kind:'persistent-control',game:historical,ply:55,san:'Rf3',fen:entry(historical,55).fenAfter,capture:'a8h8'})
 for(const [game,ply,capture]of [['personal-02',14,'f1a6'],['personal-04',55,'c3e4'],['185262315732',53,'b5c4']]){
  const e=entry(game,ply),b=new Chess(e.fenAfter)
  play(b,capture)
  offers.push({kind:'negative-control',game,ply,san:e.playedMove,fen:e.fenAfter,capture})
 }
 const reusedRb3='agent-output/brilliant-rb3-acceptance-2026-10-08T02-03-27-001Z/search-200000.json'
 const oldRb3=await parse(reusedRb3)
 assert.equal(oldRb3.rootUci,'c8h8');assert.equal(oldRb3.fen,rb3.fenAfter)
 const oldPath='agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json'
 const old=await parse(oldPath),rac1=old.searches.find(s=>s.id==='personal-04'&&s.ply===55&&s.rootUci==='c3e4')
 assert(rac1,'Exact archived Rac1 query must exist')
 const schedule=[]
 for(const [index,offer]of offers.entries()){
  const b=new Chess(offer.fen),m=play(b,offer.capture);assert(['n','b','r','q'].includes(m.captured))
  const reuse=offer.kind==='played'?{path:reusedRb3}:offer.game==='personal-04'?{path:oldPath,id:offer.game,ply:offer.ply,uci:offer.capture}:null
  schedule.push({index:schedule.length,offer:index,kind:'acceptance',fen:offer.fen,nodes:200000,multiPv:1,searchMoves:[offer.capture],reuse})
  schedule.push({index:schedule.length,offer:index,kind:'confirmation',fen:b.fen(),nodes:200000,multiPv:5})
 }
 for(const p of ['scripts/probe-persistent-offer-context.mjs','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs','src/lib/multiPvEvidence.js','src/lib/analysisMetadata.js','scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/package.json','node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const searches=schedule.filter(s=>!s.reuse).length
 assert(offers.length===9&&schedule.length===18&&searches===16)
 await save('protocol.json',{developmentOnly:true,independentValidation:false,diagnosticOnly:true,selectionUsesKnownReference:true,
  hypothesis:'Compare the exact prior acceptance with current Rb3 and every completed top-5 alternative preserving Qxh8. Include Rf3/O-O/Rac1/Bxc4 protections. No classification rule or numerical change is authorized by this diagnostic alone.',
  interpretation:'Temporal comparison includes the intervening opponent move. Same-position alternatives permit a closer attribution check; favorable acceptance alone proves neither novelty nor Brilliant. No threshold fitting.',
  nodes:200000,engine:'Stockfish 19 WASM large-single',threads:1,hashMb:16,clearHashPerSearch:true,retries:0,
  offers,schedule,searches,reused:2,nominalNodes:searches*200000,actualNodeCap:searches*205000,
  sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({offers:offers.length,searches,reused:2,cap:searches*205000}));process.exit(0)
}
const protocol=await parse(`${area}/protocol.json`)
const check=async()=>{for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)}
await check()
function reconstruct(t,old){
 assert.equal(old.engineVersion,'Stockfish 19 WASM');assert.equal(old.fen,t.fen)
 assert.equal(old.budgetNodes,t.nodes);assert.equal(old.rootUci,t.searchMoves[0])
 const evidence=createMultiPvEvidence(1),latest=new Map();let actualNodes=0,bestmove
 for(const raw of old.rawLines){
  evidence.accept(raw);actualNodes=Math.max(actualNodes,Number(raw.match(/\bnodes (\d+)/)?.[1]??0))
  const score=raw.match(/\bscore (cp|mate) (-?\d+)/)
  if(raw.startsWith('info ')&&score&&!/\b(?:upperbound|lowerbound)\b/.test(raw)){
   const multipv=Number(raw.match(/\bmultipv (\d+)/)?.[1]??1)
   latest.set(multipv,{multipv,depth:Number(raw.match(/\bdepth (\d+)/)?.[1]??0),evalCp:score[1]==='cp'?Number(score[2]):null,mate:score[1]==='mate'?Number(score[2]):null,pv:raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/)??[],raw})
  }
  if(raw.startsWith('bestmove '))bestmove=raw.split(/\s+/)[1]
 }
 const lines=[...latest.values()].sort((a,b)=>a.multipv-b.multipv)
 return {...t,rawLines:old.rawLines,actualNodes,bestmove,reconstructedFrom:t.reuse,
  engine:{...lines[0],lines,specialLines:evidence.finish(bestmove),bestmove,fen:t.fen,actualNodes,
   analysisMetadata:{...createAnalysisMetadata({nodes:t.nodes,multiPv:t.multiPv,actualEngineId:old.engineVersion}),searchMoves:t.searchMoves}}}
}
let engine,actualNodes=0,newSearches=0;const records=[]
if(mode==='--run'){
 try{await access(`${area}/started.json`);throw Error('Already started; no retry')}catch(e){if(e.code!=='ENOENT')throw e}
 await save('started.json',{started:new Date().toISOString(),searches:protocol.searches,cap:protocol.actualNodeCap})
 try{
  const {NativeEngine}=await import('./qa/native-engine.js')
  engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))])
  await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')
  for(const t of protocol.schedule){let p
   if(t.reuse){let old=JSON.parse(await readFile(t.reuse.path,'utf8'));if(t.reuse.id)old=old.searches.find(s=>s.id===t.reuse.id&&s.ply===t.reuse.ply&&s.rootUci===t.reuse.uci);p=reconstruct(t,old)}
   else{
    assert(actualNodes+t.nodes+5000<=protocol.actualNodeCap)
    const transport=t.searchMoves?{version:engine.version,request:(commands,handler)=>engine.request(commands.map(c=>c.startsWith('go nodes ')?`${c} searchmoves ${t.searchMoves.join(' ')}`:c),handler)}:engine
    p=await capturedNodeSearch(transport,t.fen,t.nodes,t.multiPv)
    if(t.searchMoves){p.searchMoves=t.searchMoves;p.engine.analysisMetadata.searchMoves=t.searchMoves}
    actualNodes+=p.actualNodes;newSearches++
   }
   verifyCapturedSearch(p)
   const path=`${area}/search-${t.index}.json`;await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})
   records.push({index:t.index,offer:t.offer,kind:t.kind,path,sha256:sha(await readFile(path)),reused:Boolean(t.reuse)})
   console.log(JSON.stringify({completed:records.length,total:protocol.schedule.length,newSearches,actualNodes}))
  }
 }finally{engine?.close()}
 assert.equal(newSearches,protocol.searches);assert(actualNodes<=protocol.actualNodeCap);await check()
 await save('collection.json',{complete:true,newSearches,actualNodes,cap:protocol.actualNodeCap,records})
}else{
 const collection=await parse(`${area}/collection.json`)
 for(const r of collection.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256,r.path);const p=JSON.parse(b);verifyCapturedSearch(p);if(!r.reused){newSearches++;actualNodes+=p.actualNodes}}
 assert.equal(newSearches,collection.newSearches);assert.equal(actualNodes,collection.actualNodes);await check()
 await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,verifiedPositions:collection.records.length,verifiedNewSearches:newSearches,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?newSearches:0,actualNodes}))
