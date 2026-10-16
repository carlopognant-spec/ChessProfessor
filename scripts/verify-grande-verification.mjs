import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {buildRefinementPlan,refineGameEntries,selectRefinementView} from '../src/lib/analysisRefinement.js'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
const area='agent-output/empirical-grande-verification-v1'
const sha=b=>createHash('sha256').update(b).digest('hex'),parse=async p=>JSON.parse(await readFile(p,'utf8'))
const protocol=await parse(`${area}/protocol.json`)
assert.equal(sha(await readFile(protocol.priorResults)),protocol.priorResultsSha256)
assert.equal(sha(await readFile(`${area}/refinement-before.js`)),protocol.beforeSha256)
assert.equal(sha(await readFile('src/lib/analysisRefinement.js')),protocol.candidateSha256)
const lock=await parse('agent-output/grande-comparison-probe-v1/protocol.json')
for(const s of lock.sources)if(!['src/lib/analysisRefinement.js','src/components/EnginePanel.jsx'].includes(s.path))assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const sources=[]
for(const path of ['src/lib/analysisRefinement.js','src/components/EnginePanel.jsx','scripts/verify-grande-verification.mjs'])sources.push({path,sha256:sha(await readFile(path))})
const raw=(await readFile(`${area}/refinement-before.js`,'utf8')).replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/analysisRefinement.js',import.meta.url)).href}'`)
const old=await import('data:text/javascript;base64,'+Buffer.from(raw).toString('base64'))
const{cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json'),original=JSON.stringify(cases)
const baseline=await parse('agent-output/rule-precedence-audit-v1/verification.json')
const packets=new Map()
for(let i=0;i<16;i++){const p=await parse(`agent-output/grande-comparison-probe-v1/search-${i}.json`);packets.set(p.fen,p)}
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const rows=[],games=[];let calls=0
for(const c of cases.filter(c=>c.cohort==='refined')){
 const entries=reclassifyReviewedMoves(c.canonical),initial=JSON.stringify(entries)
 assert.deepEqual(buildRefinementPlan(entries),old.buildRefinementPlan(entries))
 const plan=buildRefinementPlan(entries,{grandeOnly:true})
 assert(plan.positions.length<=24&&plan.selectedPlies.length<=12&&plan.extraSearches<=8)
 const result=await refineGameEntries({entries,plan,analyzePosition:async(fen,nodes,multiPv)=>{
  const p=packets.get(fen);assert(p,'No new engine query allowed');assert.equal(p.nodes,nodes);assert.equal(p.multiPv,multiPv);calls++;return structuredClone(p.engine)
 }})
 const view=selectRefinementView(result.entries,true),bb=baseline.rows.filter(r=>r.cohort==='refined'&&r.game===c.id)
 for(const[i,e]of view.entries())rows.push({game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:bb[i].after,after:labels[e.classification]})
 assert.equal(JSON.stringify(entries),initial)
 assert.deepEqual(result.entries.map(e=>e.engine),entries.map(e=>e.engine))
 assert.deepEqual(result.entries.map(e=>e.playedEngine),entries.map(e=>e.playedEngine))
 assert.equal(buildRefinementPlan(result.entries,{grandeOnly:true}).selectedPlies.length,0)
 games.push({id:c.id,selected:plan.selectedPlies,positions:plan.positions.length,actualNodes:result.actualNodes})
 console.log(JSON.stringify({verified:c.id,selected:plan.selectedPlies}))
}
assert.equal(JSON.stringify(cases),original)
const changes=rows.filter(r=>r.before!==r.after)
assert.deepEqual(changes.map(r=>[r.game,r.ply,r.before,r.after]),[['184316820266',21,'Grande','Migliore']])
assert(changes.every(r=>r.after===r.expected))
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256)
const result={passed:true,applicationChanged:true,classifierVersion:'counterfactual-v15',scope:'grande-evidence-v1',newSearches:0,
 independentValidation:false,before:194,after:195,corrected:1,regressed:0,initialUnchanged:176,oldUnchanged:338,
 ordinaryPlansUnchanged:true,inputsUnchanged:true,initialEnginesUnchanged:true,repeatedRequestEmpty:true,recordedSearches:calls,games,changes,rows,sources}
await writeFile(`${area}/verification.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,corrected:1,regressed:0,recordedSearches:calls,games}))
