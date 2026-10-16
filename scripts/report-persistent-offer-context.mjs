import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {calculateWinProbability} from '../src/lib/evaluation.js'
const area='agent-output/persistent-offer-context-v1',parse=async p=>JSON.parse(await readFile(p,'utf8'))
const sha=b=>createHash('sha256').update(b).digest('hex')
const protocol=await parse(`${area}/protocol.json`),collection=await parse(`${area}/collection.json`),replay=await parse(`${area}/replay-check.json`)
assert(replay.passed)
for(const s of protocol.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const score=l=>l.mate!=null?Number(l.mate>0):calculateWinProbability(l.evalCp)
const rows=[]
for(const [i,o]of protocol.offers.entries()){
 const records=collection.records.filter(r=>r.offer===i),packets=[]
 for(const r of records){const bytes=await readFile(r.path);assert.equal(sha(bytes),r.sha256,r.path);packets.push({kind:r.kind,p:JSON.parse(bytes)})}
 const a=packets.find(r=>r.kind==='acceptance').p,c=packets.find(r=>r.kind==='confirmation').p
 const acceptance=a.engine.lines[0],confirmation=c.engine.lines[0]
 rows.push({...o,acceptance:{evalCp:acceptance.evalCp,mate:acceptance.mate,depth:acceptance.depth,moverIndex:1-score(acceptance),path:records.find(r=>r.kind==='acceptance').path},
  confirmation:{evalCp:confirmation.evalCp,mate:confirmation.mate,depth:confirmation.depth,moverIndex:score(confirmation),path:records.find(r=>r.kind==='confirmation').path},
  agreement:Math.abs(1-score(acceptance)-score(confirmation))<=0.1,favorableBoth:Math.min(1-score(acceptance),score(confirmation))>=0.45})
}
assert(rows.every(r=>r.agreement&&r.favorableBoth))
const result={diagnosticOnly:true,developmentOnly:true,independentValidation:false,newSearches:collection.newSearches,actualNodes:collection.actualNodes,
 appChanged:false,labelsChanged:false,rows,
 conclusions:['The earlier Nxh8 acceptance is already favorable to White; missing evidence did not establish a newly compensated offer at Rb3.',
  'Every compared top-5 alternative preserving Qxh8 is also compensated after acceptance. Rb3 is not distinguished by compensation alone.',
  'Rf3/O-O/Rac1/Bxc4 controls also have favorable estimates. Ordinary exchange and persistent-offer protections remain necessary.',
  'Reject a previously-poor-now-compensated explanation for Rb3; do not adjust cutoffs to label this case. Temporal context includes the intervening opposing move.']}
await writeFile(`${area}/results.json`,JSON.stringify(result,null,2)+'\n',{flag:'wx'})
const format=l=>l.mate!=null?`mate ${l.mate}`:`${l.evalCp} cp`
const report=['# Rb3: confronto delle offerte persistenti','',
 '15 ottobre 2026. Diagnosi di sviluppo su casi noti, non validazione indipendente.',
 '18 posizioni: 2 ricerche storiche riusate e 16 nuove a 200k nodi; totale nuovo',
 `${collection.actualNodes.toLocaleString('en-US')} entro il tetto ${collection.cap.toLocaleString('en-US')}. Zero retry. Raw/PV/replay verificati.`,
 '', '| Contesto | Mossa | Accettazione, lato avversario | Conferma, lato offerente | Accordo/favorevole |',
 '|---|---|---|---|---|',...rows.map(r=>`| ${r.kind} | ${r.san} | ${format(r.acceptance)} | ${format(r.confirmation)} | ${r.agreement&&r.favorableBoth} |`),'',
 'Il cavallo h8 poteva gia essere preso dopo Nxh8 e il motore stimava comunque',
 'una posizione favorevole al Bianco. Anche g4, Rbd1 e h4 dalla stessa posizione',
 'di Rb3 mantengono compensazione dopo Qxh8. Mancanza dello score precedente',
 'non significava sacrificio non compensato. Questo chiude una incertezza, senza',
 'fornire un criterio distintivo per assegnare Geniale a Rb3.', '',
 'I controlli Rf3, O-O, Rac1 e Bxc4 hanno anch essi stime favorevoli dopo la presa.',
 'Non equivalgono automaticamente a sacrifici qualificati: rimangono necessari',
 'i controlli su scambio ordinario, offerte persistenti e alternative. Nessuna',
 'modifica al classificatore o alle etichette. Rb3 resta da riprodurre.', '',
 'Le comparazioni temporali includono la risposta intermedia avversaria e non',
 'provano causalita della mossa propria. Le ricerche hanno uguale budget, non',
 'uguale profondita o identiche varianti. Sono stime, non alberi di difesa esaustivi.', '',
 '[Protocollo](protocol.json), [risultati e percorsi delle prove](results.json), [replay](replay-check.json).',''].join('\n')
await writeFile(`${area}/report.md`,report,{flag:'wx'})
console.log(JSON.stringify({passed:true,positions:rows.length*2,newSearches:collection.newSearches,actualNodes:collection.actualNodes,allFavorable:true,productionChanged:false}))
