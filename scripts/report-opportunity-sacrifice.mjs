// Publish the measured development batch; never changes references or scores.
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const area='agent-output/opportunity-sacrifice-batch-v1'
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex')
const verified=await read(`${area}/verification.json`),study=await read(`${area}/study.json`),qa=await read(`${area}/qa-checks.json`)
assert.equal(verified.passed,true);assert.equal(verified.newSearches,0);assert.equal(verified.verifiedPlies,1116)
assert.deepEqual(study.accepted,['intermediate','existing-offer'])
assert.equal(qa.unit.exitCode,0);assert.equal(qa.browser.exitCode,0);assert.equal(qa.build.exitCode,0)
for(const s of verified.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const pct=(n,d)=>(100*n/d).toFixed(1)+'%'
const lines=['# Mosse mancate e false Geniali: gruppo verificato', '',
  '15 ottobre 2026. Versione integrata counterfactual-v12, opportunità opportunity-evidence-v2.',
  'Sviluppo sulle partite precedenti: 262 semimosse iniziali, le stesse 262 approfondite e 592 precedenti. Sono 1.116 righe di confronto, non 1.116 mosse indipendenti.',
  'Nessuna nuova ricerca del motore, nessuna rianalisi delle cinque partite riservate alla validazione. Soglie, rating e tempo di riflessione invariati.', '',
  '## Interventi integrati', '',
  'Una nuova opportunità vincente può essere persa anche partendo da un vantaggio intermedio. Il nuovo criterio richiede confronti completi/coerenti sia per l’errore avversario sia per la risposta, una variante legale diversa dalla giocata e accordo con la stima della posizione successiva. Il criterio originale congelato resta intatto.',
  'Una variante vincente che lascia in presa soltanto pezzi fermi già legalmente catturabili prima della mossa non richiede un nuovo sacrificio. Il controllo verifica catture legali, comprese inchiodature e linee aperte; il solo attacco geometrico non basta.',
  'Le fasce numeriche sono condivise in specialPolicy.js, senza nuovi valori. Il passaggio v11 -> v12 ricalcola le categorie derivate alla riapertura, conservando i dati del motore e le prove archiviate.', '',
  '## Bilancio', '',
  '| Profilo | Prima | Dopo | Correzioni esatte | Regressioni | Altri cambi |', '|---|---:|---:|---:|---:|---:|',
  ...verified.summaries.map(s=>`| ${s.cohort} | ${s.before}/${s.total} (${pct(s.before,s.total)}) | ${s.after}/${s.total} (${pct(s.after,s.total)}) | ${s.corrected} | ${s.regressed} | ${s.other} |`), '',
  'Una correzione esatta aggiuntiva nell’approfondimento: **10.Bf4, Smisiano–ProprioI0 (184316313800), Errore grave -> Mossa mancata**.',
  'Una falsa Geniale eliminata in entrambe le modalità: **27.Bxc4, BUMCestinait0–Smisiano (185262315732), Geniale -> Migliore**. Il riferimento è Ottima: resta una discrepanza numerica e non viene contata come correzione esatta.',
  'Bilancio per questo intervento: +1 correzione esatta, zero regressioni, una falsa Geniale distinta rimossa. Le altre false classificazioni esistenti restano dichiarate nelle tabelle.', '',
  '| Profilo | Speciale | Corrette prima | Corrette dopo | False prima | False dopo |', '|---|---|---:|---:|---:|---:|',
  ...verified.summaries.flatMap(s=>s.categories.map(c=>`| ${s.cohort} | ${c.category} | ${c.beforeTP} | ${c.afterTP} | ${c.beforeFP} | ${c.afterFP} |`)), '',
  'Preservate le Geniali Qxe5 della seconda partita di sviluppo e Nxe5 di personal-06, oltre alla Nxe4 della Glek nei test dedicati. Le Grandi corrette non diminuiscono.', '',
  '## Cambi e posizioni', '', '| Profilo | Partita | Posizione prima della mossa | Riferimento | Prima | Dopo |', '|---|---|---|---|---|---|',
  ...verified.changes.map(r=>`| ${r.cohort} | ${r.game} | [${Math.ceil(r.ply/2)}${r.ply%2?'.':'...'} ${r.san}](https://lichess.org/analysis/standard/${r.fenBefore.replaceAll(' ','_')}) | ${r.expected} | ${r.before} | ${r.after} |`), '',
  '## Ipotesi escluse', '',
  'Occasione di riequilibrio: nell’iniziale +1 correzione e -1 regressione (Nxe4 erroneamente promossa a Mossa mancata), nell’approfondita +2/-0, nessun cambio sulle 592 precedenti. Respinta per la regressione e il nuovo falso positivo.',
  'Matto dallo snapshot del confronto: nessun cambiamento sulle evidenze disponibili; non integrato. Resta il criterio di matto perso già esistente.', '',
  '## Controlli', '',
  `Tutte le ${verified.verifiedPlies} classificazioni integrate coincidono con la combinazione preregistrata. Analisi live di cinque partite intere coerente con la riclassificazione degli archivi.`,
  `Riprodotte le due richieste di approfondimento per partita: ${verified.jobs.length} piani, ${verified.replayedCalls} callback registrate, ${verified.verifiedPackets} pacchetti verificati da raw UCI. Zero ricerche aggiuntive, piani e score invariati.`,
  'Le venti dipendenze congelate, il criterio missedOpportunity.js originario, i riferimenti e le cache storiche sono immutati. I riferimenti riservati sono controllati solo tramite hash.',
  `${qa.unit.passed} test passati e ${qa.unit.todo} TODO; build senza dotenv passata (avviso noto sul repertorio); ${qa.browser.passed} controlli browser passati.`,
  'Browser: riapertura offline dei due archivi v11, salvataggio delle prove, categoria aggiornata senza worker/motore; flusso completo di approfondimento e confronto dei profili preservato.',
  'Questo è sviluppo sul campione noto. La validazione indipendente precedente resta storica; una nuova valutazione generale richiederà nuovi dati.', '']
await writeFile(`${area}/report.md`,lines.join('\n'),{flag:'wx'})
console.log(JSON.stringify({report:true,newSearches:0,exactCorrections:1,regressions:0,distinctFalseBrilliantsRemoved:1}))
