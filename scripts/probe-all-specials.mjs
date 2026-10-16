// Complete, bounded evidence collection, independent of classifier experiments.
import{readFile,writeFile,mkdir,access}from'node:fs/promises'
import{createHash}from'node:crypto'
import{fileURLToPath}from'node:url'
import assert from'node:assert/strict'
import{capturedNodeSearch}from'./qa/captured-node-search.js'
import{verifyCapturedSearch,capturedSearchKey as key}from'./qa/verify-captured-search.mjs'
const area='agent-output/special-completion-evidence-v1',mode=process.argv[2]
assert(['--prepare','--run','--replay'].includes(mode))
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async p=>{const b=await readFile(p);sources.set(p,sha(b));return b},parse=async p=>JSON.parse(await read(p))
const save=(n,v)=>writeFile(`${area}/${n}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
if(mode==='--prepare'){
 await mkdir(area)
 const ledger=await parse('agent-output/special-completion-v1/ledger.json')
 for(const s of ledger.sources)assert.equal(sha(await read(s.path)),s.sha256,s.path)
 const{cases}=await parse('agent-output/special-completion-v1/cohorts.json')
 for(const p of ['scripts/probe-all-specials.mjs','scripts/qa/captured-node-search.js','scripts/qa/verify-captured-search.mjs',
  'scripts/qa/native-engine.js','scripts/qa/wasm-engine.cjs','node_modules/stockfish/package.json',
  'node_modules/stockfish/bin/stockfish-19-single.js','node_modules/stockfish/bin/stockfish-19-single.wasm'])await read(p)
 const targetMap=new Map()
 for(const r of ledger.rows.filter(r=>['Grande','Geniale'].includes(r.expected)||['Grande','Geniale'].includes(r.actual)))targetMap.set(`${r.game}:${r.ply}`,r)
 const audit=await parse('agent-output/rule-precedence-audit-v1/audit.json')
 for(const r of audit.displaced)targetMap.set(`${r.game}:${r.ply}`,r)
 for(const[game,ply]of[['185262315732',30],['185230271130',18],['185262315732',53]])targetMap.set(`${game}:${ply}`,{game,ply,control:true})
 const targets=[...targetMap.values()].map(r=>{
  const c=cases.find(c=>c.id===r.game&&c.cohort==='refined')??cases.find(c=>c.id===r.game&&c.cohort==='old')
  const e=c.entries.find(e=>e.ply===r.ply);assert(e)
  return{game:r.game,ply:r.ply,san:e.playedMove,expected:c.expected[e.ply-1],cohort:c.cohort,control:Boolean(r.control)||!['Grande','Geniale'].includes(c.expected[e.ply-1]),before:e.fenBefore,after:e.fenAfter}
 })
 const pool=new Map()
 async function add(path,expected){const b=await read(path);if(expected)assert.equal(sha(b),expected,path);const p=JSON.parse(b)
  if(p.nodes===1000000&&p.multiPv===5&&!p.searchMoves&&p.scope!=='forced-root-move')pool.set(p.fen,{path,sha256:sha(b)})}
 const first=await parse('agent-output/new-refinement-measurement-v1/collection.json')
 for(const p of first.packets)await add(`agent-output/new-refinement-measurement-v1/${p.file}`,p.sha256)
 const recent=await parse('agent-output/refinement-quality-priority-v2/measurement-collection.json')
 for(const p of recent.packets)await add(p.path,p.sha256)
 for(let i=0;i<7;i++)await add(`agent-output/targeted-special-evidence-v1/search-${i}.json`)
 for(let i=0;i<16;i++)await add(`agent-output/grande-comparison-probe-v1/search-${i}.json`)
 const fens=[...new Set(targets.flatMap(t=>[t.before,t.after]))]
 assert(fens.length<=120)
 const schedule=fens.map((fen,index)=>({index,fen,nodes:1000000,multiPv:5,reuse:pool.get(fen)??null}))
 const searches=schedule.filter(t=>!t.reuse).length,cap=searches*1005000
 await save('protocol.json',{date:'2026-10-15',developmentOnly:true,independentValidation:false,
  selection:'Union of all expected/actual Great and Brilliant across development profiles, all prior material-protection cases, and Be7/Nd6/Bxc4 negative controls. Strongest recorded profile per game; no holdout reads.',
  questions:['Which missing labels still fail with complete, equal-budget, independent comparisons?',
   'Which sacrifices are persistent, already compensated or reproducible by nonsacrificing alternatives?',
   'Which claimed unique choices have several equally good alternatives under deeper evidence?'],
  interpretation:'No change to production, ordinary scores or labels. New evidence is separate and cannot be used to silently overwrite the numerical profile.',
  engine:'Stockfish 19 WASM large-single',threads:1,hashMb:16,clearHashPerSearch:true,retries:0,
  targets,schedule,searches,reused:schedule.length-searches,nominalNodes:searches*1000000,cap,
  sources:[...sources].map(([path,sha256])=>({path,sha256}))})
 console.log(JSON.stringify({targets:targets.length,positions:schedule.length,searches,reused:schedule.length-searches,cap}));process.exit(0)
}
const protocol=await parse(`${area}/protocol.json`)
const verify=async()=>{for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)}
await verify()
let engine,actualNodes=0,newSearches=0;const records=[]
if(mode==='--run'){
 try{await access(`${area}/started.json`);throw Error('Already started; no retry')}catch(e){if(e.code!=='ENOENT')throw e}
 await save('started.json',{started:new Date().toISOString(),searches:protocol.searches,cap:protocol.cap})
 try{
  if(protocol.searches){const{NativeEngine}=await import('./qa/native-engine.js')
   engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))])
   await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')}
  for(const t of protocol.schedule){let path,p
   if(t.reuse){path=t.reuse.path;assert.equal(sha(await readFile(path)),t.reuse.sha256);p=JSON.parse(await readFile(path,'utf8'))}
   else{
    assert(actualNodes+t.nodes+5000<=protocol.cap)
    p=await capturedNodeSearch(engine,t.fen,t.nodes,t.multiPv);assert(p.actualNodes<=t.nodes+5000)
    actualNodes+=p.actualNodes;newSearches++;path=`${area}/search-${t.index}.json`
    await writeFile(path,JSON.stringify(p,null,2)+'\n',{flag:'wx'})
   }
   verifyCapturedSearch(p);assert.equal(key(p.fen,p.nodes,p.multiPv),key(t.fen,t.nodes,t.multiPv))
   records.push({index:t.index,fen:t.fen,path,sha256:sha(await readFile(path)),reused:Boolean(t.reuse)})
   console.log(JSON.stringify({completed:records.length,total:protocol.schedule.length,newSearches,actualNodes}))
  }
 }finally{engine?.close()}
 assert.equal(newSearches,protocol.searches);assert(actualNodes<=protocol.cap);await verify()
 await save('collection.json',{complete:true,newSearches,actualNodes,cap:protocol.cap,records})
}else{
 const saved=await parse(`${area}/collection.json`)
 for(const r of saved.records){const b=await readFile(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b)
  verifyCapturedSearch(p);assert.equal(p.fen,r.fen);if(!r.reused){newSearches++;actualNodes+=p.actualNodes}}
 assert.equal(newSearches,saved.newSearches);assert.equal(actualNodes,saved.actualNodes);await verify()
 await save('replay-check.json',{passed:true,newSearches:0,engineStarted:false,verifiedPositions:saved.records.length,verifiedNewSearches:newSearches,actualNodes})
}
console.log(JSON.stringify({passed:true,mode,newSearches:mode==='--run'?newSearches:0,actualNodes}))
