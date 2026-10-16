// Development cohort only; new searches are bounded and replayable offline.
import { readFile, writeFile, readdir, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { capturedNodeSearch } from './qa/captured-node-search.js'
import { capturedSearchKey as key, verifyCapturedSearch } from './qa/verify-captured-search.mjs'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/refinement-quality-priority-v2', mode = process.argv[2]
assert.ok(['--prepare', '--run', '--replay'].includes(mode))
const ids = ['185262315732', '184316820266', '184316313800', '185230271130', '185230000668']
const cap = 257600000, maxSearches = 320, maxRounds = 2
const sha = b => createHash('sha256').update(b).digest('hex'), json = x => JSON.parse(JSON.stringify(x)), watched = new Map()
const read = async path => JSON.parse(await readFile(path, 'utf8'))
async function watch(path) { const b = await readFile(path); watched.set(path, sha(b)); return b }
async function input(path) { return JSON.parse(await watch(path)) }
async function tree(folder) { for (const e of (await readdir(folder, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
  const p = `${folder}/${e.name}`; if (e.isDirectory()) await tree(p); else if (e.isFile()) await watch(p)
} }
async function verify() { for (const [path, hash] of watched) assert.equal(sha(await readFile(path)), hash, path) }
const save = (name, value) => writeFile(`${area}/${name}`, JSON.stringify(json(value), null, 2) + '\n', { flag: 'wx' })
async function output(name, value) { if (mode === '--run') await save(name, value); else assert.deepEqual(await read(`${area}/${name}`), json(value), name) }
const label = { book:'Libro', forced:'Forzata', best:'Migliore', excellent:'Ottima', good:'Buona', inaccuracy:'Imprecisione',
  mistake:'Errore', blunder:'Errore grave', great:'Grande', brilliant:'Geniale', missed:'Mossa mancata', unclassified:'Non valutabile' }
const study = await input(`${area}/study.json`)
assert.deepEqual(study.accepted, [])
for (const s of study.sources) if (s.path !== 'src/lib/analysisRefinement.js') assert.equal(sha(await readFile(s.path)), s.sha256)
await tree('src')
for (const p of ['scripts/measure-refinement-priority-v2.mjs', 'scripts/qa/verify-captured-search.mjs',
  'scripts/qa/captured-node-search.js', 'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs', `${area}/protocol.md`,
  'node_modules/stockfish/package.json', 'node_modules/stockfish/bin/stockfish-19-single.js',
  'node_modules/stockfish/bin/stockfish-19-single.wasm']) await watch(p)
// Hash the reserved references without parsing or using their labels/positions.
const reserved = await input('agent-output/holdout-validation-v1/manifest.json')
for (const s of reserved.sources.filter(s => s.path.startsWith('Partite/Validazione/'))) {
  assert.equal(sha(await watch(s.path)), s.sha256)
}
for (const p of ['agent-output/holdout-validation-v1/results.json', 'agent-output/holdout-validation-v1/offline-check.json']) await watch(p)
const frozen = await input('agent-output/specials-frozen-candidate-v1.json')
for (const s of frozen.sources) assert.equal(sha(await watch(s.path)), s.sha256)
const pool = new Map(), games = [], uses = [], jobs = [], records = []
const prior = await input('agent-output/new-refinement-measurement-v1/collection.json')
for (const r of prior.packets) {
  const p = `agent-output/new-refinement-measurement-v1/${r.file}`, b = await watch(p)
  assert.equal(sha(b), r.sha256); const packet = JSON.parse(b); verifyCapturedSearch(packet)
  pool.set(key(packet.fen, packet.nodes, packet.multiPv, packet.searchMoves), { packet, path: p, provenance: 'prior' })
}
for (let i = 0; i < 7; i++) {
  const path = `agent-output/targeted-special-evidence-v1/search-${i}.json`, p = await input(path)
  const searchMoves = p.scope === 'forced-root-move' ? [p.uci] : undefined
  const packet = { ...p, ...(searchMoves ? { searchMoves, engine: { ...p.engine,
    analysisMetadata: { ...p.engine.analysisMetadata, searchMoves } } } : {}) }
  verifyCapturedSearch(packet)
  pool.set(key(packet.fen, packet.nodes, packet.multiPv, packet.searchMoves), { packet, path, provenance: 'prior' })
}
for (const id of ids) {
  const original = await input(`agent-output/new-references-200k-v1/game-${id}.json`)
  const old = await input(`agent-output/new-refinement-measurement-v1/game-${id}-round-2.json`)
  const ref = await input(`Partite/Confermate/chesscom-${id}/riferimento.json`)
  const pgn = await watch(`Partite/Confermate/chesscom-${id}/partita.pgn`)
  assert.equal(ref.status, 'user-confirmed'); assert.ok(ref.annotations.every(a => a.userConfirmed && !a.needsReview))
  const board = new Chess(); board.loadPgn(pgn.toString('utf8'))
  assert.deepEqual(board.history(), ref.annotations.map(a => a.san))
  const initial = reclassifyReviewedMoves(original.liveEntries), baseline = selectRefinementView(old.entries, true)
  assert.deepEqual(initial.map(e => e.playedMove), board.history())
  games.push({ id, ref, initial, baseline, entries: initial, rounds: [], failed: false, firstPlan: buildRefinementPlan(initial) })
}
assert.equal(games.reduce((n,g) => n + g.initial.length, 0), 262)
assert.equal(games.reduce((n,g) => n + g.baseline.filter((e,i) => label[e.classification] === g.ref.annotations[i].category).length, 0), 184)
const spec = { cap, maxSearches, maxRounds, independentValidation: false, selectionVersion: 'evidence-priority-v2',
  games: games.map(g => ({ id:g.id, plies:g.initial.length, firstPlan:g.firstPlan })),
  sources: [...watched].map(([path,sha256]) => ({path,sha256})) }
if (mode === '--prepare') { await save('measurement-manifest.json', spec); console.log(JSON.stringify({ prepared:true, firstPlans:spec.games.map(g=>({id:g.id, selected:g.firstPlan.selectedPlies, extra:g.firstPlan.extraSearches})), cap })); process.exit(0) }
assert.deepEqual(await read(`${area}/measurement-manifest.json`), spec)
await verify()
let engine, actualNodes=0, searches=0, searchMs=0, cursor=0, collection
if (mode === '--run') {
  try { await access(`${area}/measurement-started.json`); throw Error('Already started; no repeated engine run') } catch(e) { if(e.code!=='ENOENT')throw e }
  await save('measurement-started.json',{at:new Date().toISOString(),cap,maxSearches})
} else { collection=await read(`${area}/measurement-collection.json`); assert.equal(collection.complete,true) }
async function search(fen,nodes,multiPv,options={}) {
  const {searchMoves}=options, k=key(fen,nodes,multiPv,searchMoves), cached=pool.get(k)
  if(cached) { uses.push({fen,nodes,multiPv,...(searchMoves?{searchMoves}:{}),path:cached.path,provenance:cached.provenance});return cached.packet.engine }
  assert.ok(searches<maxSearches&&actualNodes+nodes+5000<=cap)
  let packet,path
  if(mode==='--run') {
    if(!engine){engine=new NativeEngine(process.execPath,120000,[fileURLToPath(new URL('./qa/wasm-engine.cjs',import.meta.url)),fileURLToPath(new URL('../node_modules/stockfish/bin/stockfish-19-single.js',import.meta.url))]);await engine.init();assert.equal(engine.version,'Stockfish 19 WASM')}
    const transport=searchMoves?{version:engine.version,request:(commands,handler)=>engine.request(commands.map(c=>c.startsWith('go nodes ')?`${c} searchmoves ${searchMoves.join(' ')}`:c),handler)}:engine
    const start=performance.now(),p=await capturedNodeSearch(transport,fen,nodes,multiPv)
    packet={...p,elapsedMs:performance.now()-start,...(searchMoves?{searchMoves,engine:{...p.engine,analysisMetadata:{...p.engine.analysisMetadata,searchMoves}}}:{})}
    verifyCapturedSearch(packet);path=`${area}/priority-search-${String(records.length).padStart(3,'0')}.json`
    await writeFile(path,JSON.stringify(packet,null,2)+'\n',{flag:'wx'})
  }else{
    const r=collection.packets[cursor++];assert.ok(r);path=r.path;const b=await readFile(path);assert.equal(sha(b),r.sha256);packet=JSON.parse(b);verifyCapturedSearch(packet)
    assert.equal(key(packet.fen,packet.nodes,packet.multiPv,packet.searchMoves),k)
  }
  const record={packet,path,provenance:'new'};pool.set(k,record);records.push(record)
  searches++;actualNodes+=packet.actualNodes;searchMs+=packet.elapsedMs
  uses.push({fen,nodes,multiPv,...(searchMoves?{searchMoves}:{}),path,provenance:'new'})
  if(mode==='--run')console.log(JSON.stringify({searches,actualNodes,scope:searchMoves?'acceptance':'position'}))
  return packet.engine
}
const snapshots=games.map(g=>JSON.stringify(g.initial))
try {
  for(let round=1;round<=maxRounds;round++)for(const g of games){
    if(g.failed)continue;const plan=buildRefinementPlan(g.entries);if(!plan.selectedPlies.length)continue
    const job={game:g.id,round,plan},beforeSearches=searches,beforeNodes=actualNodes;let partial=g.entries
    console.log(JSON.stringify({game:g.id,round,selected:plan.selectedPlies,positions:plan.positions.length,extra:plan.extraSearches}))
    try{const result=await refineGameEntries({entries:g.entries,plan,analyzePosition:search,onEntries:e=>{partial=e}});g.entries=result.entries;job.status='complete';job.applicationNodes=result.actualNodes;job.applicationSearches=result.searches}
    catch(e){if(mode==='--replay')throw e;g.entries=partial;g.failed=true;job.status='partial';job.error=e.message}
    job.newSearches=searches-beforeSearches;job.newNodes=actualNodes-beforeNodes;jobs.push(job)
    const view=selectRefinementView(g.entries,true);g.rounds.push({round,view,job})
    await output(`priority-game-${g.id}-round-${round}.json`,{id:g.id,round,entries:g.entries,view,job})
  }
}finally{engine?.close()}
for(const[g,i]of games.map((g,i)=>[g,i]))assert.equal(JSON.stringify(g.initial),snapshots[i])
assert.ok(actualNodes<=cap);assert.ok(searches<=maxSearches);assert.ok(jobs.length<=10)
await verify()
await output('measurement-collection.json',{complete:true,searches,actualNodes,searchMs,jobs,uses,
  packets:await Promise.all(records.map(async r=>({path:r.path,sha256:sha(await readFile(r.path))})))})
if(mode==='--replay')assert.equal(cursor,collection.packets.length)
const rows=games.flatMap(g=>g.initial.map((e,i)=>({game:g.id,ply:e.ply,san:e.playedMove,expected:g.ref.annotations[i].category,
  initial:label[e.classification],before:label[g.baseline[i].classification],first:label[(g.rounds.find(r=>r.round===1)?.view[i]??e).classification],
  after:label[(g.rounds.at(-1)?.view[i]??e).classification],fenBefore:e.fenBefore,
  selectedRounds:g.rounds.filter(r=>r.job.plan.selectedPlies.includes(e.ply)).map(r=>r.round)})))
function summary(rr,phase,base='before'){
  return{total:rr.length,exactBefore:rr.filter(r=>r[base]===r.expected).length,exactAfter:rr.filter(r=>r[phase]===r.expected).length,
    corrected:rr.filter(r=>r[base]!==r.expected&&r[phase]===r.expected).length,regressed:rr.filter(r=>r[base]===r.expected&&r[phase]!==r.expected).length,
    other:rr.filter(r=>r[base]!==r[phase]&&r[base]!==r.expected&&r[phase]!==r.expected).length,
    specials:['Geniale','Grande','Mossa mancata'].map(category=>({category,expected:rr.filter(r=>r.expected===category).length,
      beforeTP:rr.filter(r=>r.expected===category&&r[base]===category).length,afterTP:rr.filter(r=>r.expected===category&&r[phase]===category).length,
      beforeFP:rr.filter(r=>r.expected!==category&&r[base]===category).length,afterFP:rr.filter(r=>r.expected!==category&&r[phase]===category).length}))}
}
const result={independentValidation:false,newSearches:searches,actualNodes,searchMs,failedJobs:jobs.filter(j=>j.status!=='complete'),
  vsPrevious:summary(rows,'after'),firstVsInitial:summary(rows,'first','initial'),finalVsInitial:summary(rows,'after','initial'),
  perGame:games.map(g=>({id:g.id,...summary(rows.filter(r=>r.game===g.id),'after'),remaining:buildRefinementPlan(g.entries).candidateCount})),rows}
await output('measurement-results.json',result)
assert.equal(rows.find(r=>r.game==='184316820266'&&r.ply===41).first,'Geniale','Previously confirmed brilliant must be reached on the first click')
if(mode==='--replay')await save('measurement-offline-check.json',{passed:true,newSearches:0,verifiedNewSearches:searches,verifiedPriorSearches:prior.packets.length+7,verifiedPlies:262,vsPrevious:result.vsPrevious,sources:watched.size})
await verify()
console.log(JSON.stringify({complete:true,mode,newSearches:mode==='--run'?searches:0,vsPrevious:result.vsPrevious,firstVsInitial:result.firstVsInitial,finalVsInitial:result.finalVsInitial,failedJobs:result.failedJobs.length},null,2))
