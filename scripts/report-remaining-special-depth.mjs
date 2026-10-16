import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {nativeWdlInterval} from '../src/lib/nativeWdl.js'
const area='agent-output/remaining-special-depth-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
assert((await json(`${area}/replay-check.json`)).passed)
const protocol=await json(`${area}/protocol.json`),collection=await json(`${area}/collection.json`),packets=new Map()
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b);packets.set(p.fen,p)}
function description(packet,side=1){
 if(!packet)return null
 const e=packet.engine,complete=e.specialLines??[],native=(cp)=>Number.isInteger(cp)?nativeWdlInterval(packet.fen,side*cp):null
 const row=l=>l?{depth:l.depth,uci:l.pv?.[0],cp:l.evalCp==null?null:side*l.evalCp,mate:l.mate==null?null:side*l.mate,native:native(l.evalCp)?.dominant??null,points:native(l.evalCp)?.bounds.points??null}:null
 return{nodes:packet.nodes,actualNodes:packet.actualNodes,bestmove:e.bestmove,complete:complete.length>0,
  completedPrimary:row(complete[0]),latestPrimary:row(e),completed:complete.map(row),scoreSource:'completed-and-latest-kept-separate'}
}
const rows=[]
for(const target of protocol.selected){
 const root1=target.oneMillion.root?await json(target.oneMillion.root):null,child1=target.oneMillion.child?await json(target.oneMillion.child):null
 const one={root:description(root1),child:description(child1,-1)},five={root:description(packets.get(target.fen)),child:description(packets.get(target.after),-1)}
 const original=one.root?.bestmove,latest=five.root.bestmove,primary=five.root.completedPrimary,played=five.root.completed.find(l=>l.uci===original)
 const others=five.root.completed.filter(l=>l.uci!==original),childScores=[five.child.completedPrimary,five.child.latestPrimary].filter(Boolean)
 rows.push({...target,oneMillion:one,fiveMillion:five,bestMoveChanged:original!==latest,completedPairAvailable:five.root.complete&&five.child.complete,
  nativePlayedChildDisagreement:primary?.native&&five.child.completedPrimary?.native?primary.native!==five.child.completedPrimary.native:null,
  onlyPositiveChoice:latest===original&&played?.cp>0&&childScores.length===2&&childScores.every(l=>l.cp>0)&&others.length>0&&others.every(l=>l.cp<0)})
}
await read('scripts/report-remaining-special-depth.mjs')
const remaining=rows.filter(r=>r.reasons.includes('remaining-confirmed-special-discrepancy'))
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/report.json`,JSON.stringify({diagnosticOnly:true,productionChanged:false,newSearches:0,referenceLabelsUsedForUnresolvedSelection:true,
 completedPositions:collection.records.length,actualNodes:collection.actualNodes,cap:collection.cap,rows,remaining,sources},null,2)+'\n',{flag:'wx'})
const table=remaining.map(r=>`| ${r.game}/${r.ply} ${r.san} | ${r.oneMillion.root?.completedPrimary?.cp??'N/D'} | ${r.fiveMillion.root.completedPrimary?.cp??'N/D'} | ${r.fiveMillion.child.completedPrimary?.cp??'N/D'} | ${r.fiveMillion.root.bestmove} |`).join('\n')
await writeFile(`${area}/report.md`,`# Diagnosi di profondita, nessuna regola integrata\n\n80 FEN a5M,43 mosse (6 discrepanze e controlli fissati prima della raccolta). ${collection.actualNodes} nodi entro ${collection.cap},zero retry,replayPASS. Dati di sviluppo;nessuna riserva letta.\n\n| Caso | Root1M completata | Root5M completata | Child5M completata, lato autore | Best5M |\n|---|---:|---:|---:|---|\n${table}\n\nUltime stime parziali e confronti completati sono separati nel JSON. N/D significa che non esiste un confronto completato coerente con il bestmove finale; non autorizza alcuna promozione. Questa diagnosi non cambia i punteggi,il budget o le classificazioni dell'app.\n`,{flag:'wx'})
console.log(JSON.stringify({positions:collection.records.length,actualNodes:collection.actualNodes,remaining:remaining.map(r=>({game:r.game,ply:r.ply,san:r.san,bestMoveChanged:r.bestMoveChanged,complete:r.completedPairAvailable,nativeDisagreement:r.nativePlayedChildDisagreement,onlyPositiveChoice:r.onlyPositiveChoice})),onlyPositiveControls:rows.filter(r=>!r.reasons.includes('remaining-confirmed-special-discrepancy')&&r.onlyPositiveChoice).map(r=>({game:r.game,ply:r.ply,san:r.san}))}))
