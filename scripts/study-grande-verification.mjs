// Separate user-requested verification: never changes ordinary refinement order.
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {reclassifyReviewedMoves} from '../src/lib/reviewMoves.js'
import {capturedSearchKey as key} from './qa/verify-captured-search.mjs'
const area='agent-output/grande-verification-flow-v1'
await mkdir(area)
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Map()
const read=async path=>{const b=await readFile(path);sources.set(path,sha(b));return b}
const parse=async path=>JSON.parse(await read(path))
const save=(name,v)=>writeFile(`${area}/${name}`,JSON.stringify(v,null,2)+'\n',{flag:'wx'})
const prior=await parse('agent-output/refinement-special-coverage-v1/results.json')
assert(!prior.accepted&&prior.regressed===1)
const lock=await parse('agent-output/grande-comparison-probe-v1/protocol.json')
for(const s of lock.sources){assert.equal(sha(await read(s.path)),s.sha256,s.path)}
await read('scripts/study-grande-verification.mjs')
const oldCandidate=await readFile('agent-output/refinement-special-coverage-v1/candidate.js','utf8')
const helper=oldCandidate.slice(oldCandidate.indexOf('// Verify empirical promotions'),oldCandidate.indexOf('export function refinementReason'))
assert(helper.includes('function specialCoverageReason'))
let source=(await read('src/lib/analysisRefinement.js')).toString().replaceAll('\r\n','\n')
source=`import { SPECIAL_POLICY } from './specialPolicy.js'\nimport { calculateWinProbability } from './evaluation.js'\n`+source
source=source.replace('export function buildRefinementPlan(entries = []) {',helper+`
export function grandeVerificationReason(entry) {
  if (entry.isBookMove || ['book', 'forced'].includes(entry.classification) || entry.playedMate === 0) return null
  const data = refinementFor(entry)
  if (data?.engine && data?.playedEngine) return null
  return specialCoverageReason(entry)
}
export function buildRefinementPlan(entries = [], { grandeOnly = false } = {}) {`)
source=source.replace('  const candidates = entries.map((e, i) => {',`  const candidates = grandeOnly ? view.filter(grandeVerificationReason)
    .map(entry => ({ entry, priority: 2 })) : entries.map((e, i) => {`)
source=source.replace("selectionVersion: REFINEMENT_POLICY.selectionVersion,\n    selectedPlies", "selectionVersion: grandeOnly ? 'grande-verification-v1' : REFINEMENT_POLICY.selectionVersion,\n    ...(grandeOnly ? { scope: 'grande-evidence-v1' } : {}),\n    selectedPlies")
source=source.replace("reason: priority === 0 ? 'unconfirmed-sacrifice' : refinementReason(entry), priority", "reason: grandeOnly ? grandeVerificationReason(entry) : priority === 0 ? 'unconfirmed-sacrifice' : refinementReason(entry), priority")
source=source.replace('  const expected = buildRefinementPlan(entries)',"  const expected = buildRefinementPlan(entries, { grandeOnly: plan.scope === 'grande-evidence-v1' })")
assert(source.includes("scope: 'grande-evidence-v1'"))
await writeFile(`${area}/candidate.js`,source,{flag:'wx'})
const rewritten=source.replaceAll("from 'chess.js'",`from '${import.meta.resolve('chess.js')}'`)
 .replace(/from '(\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,new URL('../src/lib/analysisRefinement.js',import.meta.url)).href}'`)
const proposal=await import('data:text/javascript;base64,'+Buffer.from(rewritten).toString('base64'))
const{cases}=await parse('agent-output/special-evidence-dossier-v1/cohorts.json')
const baseline=await parse('agent-output/rule-precedence-audit-v1/verification.json')
const pool=new Map()
const cc=await parse('agent-output/new-refinement-measurement-v1/collection.json')
for(const p of cc.packets){const path=`agent-output/new-refinement-measurement-v1/${p.file}`,b=await read(path);assert.equal(sha(b),p.sha256);const r=JSON.parse(b);pool.set(key(r.fen,r.nodes,r.multiPv,r.searchMoves),{engine:r.engine,path})}
const pc=await parse('agent-output/refinement-quality-priority-v2/measurement-collection.json')
for(const p of pc.packets){const b=await read(p.path);assert.equal(sha(b),p.sha256);const r=JSON.parse(b);pool.set(key(r.fen,r.nodes,r.multiPv,r.searchMoves),{engine:r.engine,path:p.path})}
for(let i=0;i<16;i++){const path=`agent-output/grande-comparison-probe-v1/search-${i}.json`,r=await parse(path);pool.set(key(r.fen,r.nodes,r.multiPv),{engine:r.engine,path})}
const protocol={date:'2026-10-15',newSearches:0,independentValidation:false,proposal:'Separate explicit verification action after the existing two-round profile. The ordinary plan and all its priorities remain byte-for-byte equivalent. New scope uses the fully reclassified view, including partial deep results; same 12-move, node, sacrifice and archive limits.',
 acceptance:'All five development games replay completely from canonical archives, zero missing packet, positive corrections, zero regression, no correct special lost and no new false special. Keep ordinary plans identical; otherwise do not integrate.',
 candidateSha256:sha(Buffer.from(source)),sources:[...sources].map(([path,sha256])=>({path,sha256}))}
await save('protocol.json',protocol)
const labels={book:'Libro',forced:'Forzata',best:'Migliore',excellent:'Ottima',good:'Buona',inaccuracy:'Imprecisione',mistake:'Errore',blunder:'Errore grave',great:'Grande',brilliant:'Geniale',missed:'Mossa mancata',unclassified:'Non valutabile'}
const production=await import('../src/lib/analysisRefinement.js'),rows=[],uses=[],missing=[],games=[]
for(const c of cases.filter(c=>c.cohort==='refined')){
 const entries=reclassifyReviewedMoves(c.canonical),original=JSON.stringify(entries)
 assert.deepEqual(proposal.buildRefinementPlan(entries),production.buildRefinementPlan(entries))
 const plan=proposal.buildRefinementPlan(entries,{grandeOnly:true})
 let updated=entries
 try{
 const r=await proposal.refineGameEntries({entries,plan,analyzePosition:async(fen,nodes,multiPv,options={})=>{
  const found=pool.get(key(fen,nodes,multiPv,options.searchMoves));if(!found)throw Error(`Missing recorded search: ${fen}`)
  uses.push({game:c.id,path:found.path,fen,nodes,multiPv});return structuredClone(found.engine)
 }})
 updated=r.entries
 }catch(e){missing.push({game:c.id,error:e.message})}
 assert.equal(JSON.stringify(entries),original)
 const view=proposal.selectRefinementView(updated,true),bb=baseline.rows.filter(r=>r.cohort==='refined'&&r.game===c.id)
 assert.equal(view.length,bb.length)
 for(const[i,e]of view.entries())rows.push({game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],before:bb[i].after,after:labels[e.classification]})
 games.push({id:c.id,plan,entries:updated,view})
 console.log(JSON.stringify({game:c.id,selected:plan.selectedPlies,positions:plan.positions.length}))
}
const changes=rows.filter(r=>r.before!==r.after)
const specials=['Grande','Geniale','Mossa mancata'].map(category=>({category,
 beforeTP:rows.filter(r=>r.expected===category&&r.before===category).length,afterTP:rows.filter(r=>r.expected===category&&r.after===category).length,
 beforeFP:rows.filter(r=>r.expected!==category&&r.before===category).length,afterFP:rows.filter(r=>r.expected!==category&&r.after===category).length}))
const corrected=changes.filter(r=>r.after===r.expected).length,regressed=changes.filter(r=>r.before===r.expected).length
const accepted=!missing.length&&corrected>0&&!regressed&&specials.every(s=>s.afterTP>=s.beforeTP&&s.afterFP<=s.beforeFP)
for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await save('results.json',{accepted,newSearches:0,independentValidation:false,corrected,regressed,
 before:rows.filter(r=>r.before===r.expected).length,after:rows.filter(r=>r.after===r.expected).length,specials,missing,changes,rows,uses})
for(const g of games)await save(`game-${g.id}.json`,g)
console.log(JSON.stringify({accepted,corrected,regressed,missing,specials,changes}))
