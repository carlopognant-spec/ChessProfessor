import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { completedRootScore } from './grande-completed-score.js'
import { branchA } from './grande-v3-branch-a.js'

const root = new URL('../',import.meta.url)
const v1='agent-output/grande-progressive-2026-10-07T15-12-20-834Z/'
const v2='agent-output/grande-progressive-v2-2026-10-07T15-24-36-014Z/'
const watched=[], searches=new Map()
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
async function input(path) { const bytes=await readFile(new URL(path,root));watched.push({path,sha256:sha(bytes)});return JSON.parse(bytes) }
const old=await input(v1+'results.json'), prior=await input(v2+'results.json'), schedule=await input(v1+'schedule.json')
if(prior.summary.failure||!prior.summary.sourceHashesUnchanged)throw Error('Invalid previous experiment')
const key=(c,uci,budget)=>JSON.stringify([c.gameId,c.ply,c.fenBefore,uci,budget])
for(const [folder,total] of [[v1,old.summary.searches],[v2,prior.summary.newSearches]])for(let i=1;i<=total;i++) {
  const path=folder+`search-${String(i).padStart(4,'0')}.json`,record=await input(path)
  const c=schedule.candidates.find(c=>c.gameId===record.gameId&&c.ply===record.ply)
  if(!c||record.fen!==c.fenBefore||record.bestmove.split(' ')[1]!==record.uci||![200000,1000000].includes(record.budgetNodes))throw Error('Invalid search provenance')
  const selected=completedRootScore(record.rawLines,record.uci).completed
  if(selected){const game=new Chess(c.fenBefore);for(const uci of selected.pv)game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]})}
  const id=key(c,record.uci,record.budgetNodes)
  if(searches.has(id))throw Error('Duplicate search key: no silent replacement')
  searches.set(id,{score:selected,path})
}
const priorRecords=new Map(prior.records.map(r=>[`${r.gameId}:${r.ply}`,r]))
const records=schedule.candidates.map(c=>{
  const roots=[{uci:c.uci},...c.alternatives].map(m=>{
    const provenance=[],scores=[]
    for(const budget of [200000,1000000])if(searches.has(key(c,m.uci,budget))){const entry=searches.get(key(c,m.uci,budget));scores.push(entry.score);provenance.push({budget,path:entry.path})}
    return {uci:m.uci,scores,provenance}
  })
  const verdict=branchA(roots,c.uci,c.legalCount)
  const before=priorRecords.get(`${c.gameId}:${c.ply}`)
  return {gameId:c.gameId,ply:c.ply,san:c.san,uci:c.uci,legalCount:c.legalCount,previousStatus:before?.status??'not-run',previousReason:before?.reason??null,...verdict,roots}
})
for(const file of watched)if(sha(await readFile(new URL(file.path,root)))!==file.sha256)throw Error('Source changed')
const count=field=>{const counts={};for(const r of records)counts[r[field]]=(counts[r[field]]??0)+1;return counts}
const summary={policy:'v3-branch-a-envelope-without-absolute-oscillation-veto',newSearches:0,storedSearchesRead:searches.size,totalCandidates:records.length,statuses:count('status'),reasons:count('reason'),sourceHashesUnchanged:true,annotationsRead:false,failure:null,
  numericBoundaries:{playedMinimumCp:0,alternativeMaximumCp:-200,minimumGapCp:200,guardCp:50},
  policyChange:'No abs(delta)>50 veto; both scores must support the guarded decision. All roots and both budgets required for a positive result.',
  dataRole:'development; proposal formed after seeing v2 labels, not independent validation'}
const transitions=records.filter(r=>r.status!==r.previousStatus||r.reason!==r.previousReason).map(r=>({gameId:r.gameId,ply:r.ply,san:r.san,from:r.previousStatus,previousReason:r.previousReason,to:r.status,reason:r.reason}))
const directory=new URL(`agent-output/grande-v3-branch-a-${new Date().toISOString().replace(/[:.]/g,'-')}/`,root)
await mkdir(directory)
await writeFile(new URL('results.json',directory),JSON.stringify({summary,records,transitions,watched},null,2)+'\n',{flag:'wx'})
const report=['# Grande v3 — replay offline ramo A','',...Object.entries(summary).map(([k,v])=>`- ${k}: ${JSON.stringify(v)}`),'','| Partita | Ply | SAN | Prima | Dopo | Motivo dopo |','|---|---:|---|---|---|---|',...transitions.map(r=>`| ${r.gameId} | ${r.ply} | ${r.san} | ${r.from} (${r.previousReason}) | ${r.to} | ${r.reason} |`),'','Nessuna ricostruzione dei risultati mancanti. Tutti i candidati, anche quelli non attesi Grande, inclusi nel replay. Ramo B/matti/Geniale NON ESEGUITI.','App, soglie produttive, file esistenti e cache intatti. Test sintetici eseguiti separatamente; suite app/build/browser NON ESEGUITI. Nessun commit/push. STOP.',''].join('\n')
await writeFile(new URL('report.md',directory),report,{flag:'wx'})
console.log(JSON.stringify({output:fileURLToPath(directory),summary,changedUnstable:transitions.filter(r=>r.previousReason==='unstable-score')},null,2))
