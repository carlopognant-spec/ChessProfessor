// Summarize verified development results. No engine and no reference relabeling.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
const area='agent-output/refinement-quality-priority-v2'
const read=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex')
const manifest=await read(`${area}/measurement-manifest.json`),study=await read(`${area}/study.json`)
const result=await read(`${area}/measurement-results.json`),offline=await read(`${area}/measurement-offline-check.json`)
const collection=await read(`${area}/measurement-collection.json`)
assert.equal(offline.passed,true);assert.equal(offline.newSearches,0);assert.equal(result.failedJobs.length,0)
for(const s of manifest.sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const original=await readFile(`${area}/analysisRefinement-before.js`,'utf8'),current=await readFile('src/lib/analysisRefinement.js','utf8')
assert.equal(sha(Buffer.from(original)),study.sources.find(s=>s.path==='src/lib/analysisRefinement.js').sha256)
const projection='function entriesWithKnown(entries, known, selectedPlies) {'
assert.equal(current.slice(current.indexOf(projection)),original.slice(original.indexOf(projection)),
  'Existing stored evidence, validation, projection and classification must remain unchanged')
const reservedManifest=await read('agent-output/holdout-validation-v1/manifest.json')
for(const s of reservedManifest.sources.filter(s=>s.path.startsWith('src/')&&s.path!=='src/lib/analysisRefinement.js'))
  assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
assert.equal(result.rows.length,262)
const correct=key=>result.rows.filter(r=>r[key]===r.expected).length
assert.equal(correct('initial'),172);assert.equal(correct('before'),184);assert.equal(correct('first'),175);assert.equal(correct('after'),188)
const changes=result.rows.filter(r=>r.before!==r.after)
assert.equal(changes.filter(r=>r.after===r.expected).length,5)
assert.equal(changes.filter(r=>r.before===r.expected).length,1)
assert.equal(changes.filter(r=>r.before!==r.expected&&r.after!==r.expected).length,1)
assert.equal(collection.searches,14);assert.equal(collection.actualNodes,12405068)
assert.equal(collection.jobs.length,10);assert.ok(collection.jobs.every(j=>j.status==='complete'))
assert.ok(collection.jobs.every(j=>j.plan.selectedPlies.length<=12&&j.plan.positions.length<=24&&j.plan.sacrifices.length<=4))
assert.equal(study.variants.find(v=>v.id==='quality').accepted,false)
assert.equal(study.variants.find(v=>v.id==='equal-depth').accepted,false)
const pct=(n,d)=>(100*n/d).toFixed(1)+'%'
const lines=['# Priorità delle prove nell’approfondimento', '',
  '15 ottobre 2026. Misura sulle cinque partite personali di sviluppo, 262 semimosse. Non è una nuova validazione indipendente.',
  'Le cinque partite riservate alla validazione precedente non sono state riclassificate, rianalizzate o usate per scegliere le regole.', '',
  '## Modifica integrata', '',
  'Fra i candidati già eleggibili, il piano evidence-priority-v2 verifica prima i sacrifici con prove pendenti, poi altri candidati Geniale/Grande, poi valutazioni mancanti/discordanti, indipendenti e infine confini numerici. Spareggio cronologico.',
  'Restano i limiti di 12 mosse, 24 FEN a 1M, quattro offerte di sacrificio con verifiche a 200k per richiesta. La scelta delle ricerche non promuove direttamente alcuna categoria.',
  'Formato delle prove optional-refinement-v1 e classificatori invariati; le analisi archiviate si riaprono con le stesse categorie, il nuovo ordine si applica alla prossima richiesta esplicita.', '',
  '## Risultati', '',
  '| Confronto | Prima | Dopo | Correzioni | Regressioni | Cambi ancora errati |', '|---|---:|---:|---:|---:|---:|',
  `| Vecchia selezione, fino a due clic → nuova selezione, fino a due clic | 184/262 (${pct(184,262)}) | 188/262 (${pct(188,262)}) | 5 | 1 | 1 |`,
  `| Analisi normale → primo clic nuovo | 172/262 (${pct(172,262)}) | 175/262 (${pct(175,262)}) | 10 | 7 | 12 |`,
  `| Analisi normale → fino a due clic nuovi | 172/262 (${pct(172,262)}) | 188/262 (${pct(188,262)}) | 25 | 9 | 11 |`, '',
  '| Partita | Vecchia selezione | Nuova selezione | Correzioni | Regressioni | Candidati rimasti |', '|---|---:|---:|---:|---:|---:|',
  ...result.perGame.map(g=>`| ${g.id} | ${g.exactBefore}/${g.total} | ${g.exactAfter}/${g.total} | ${g.corrected} | ${g.regressed} | ${g.remaining} |`), '',
  'Qxe5 della partita 184316820266 è verificata e classificata Geniale già al primo clic. L’analisi normale rimane invariata.',
  'Questo confronto modifica sia l’ordine sia le posizioni raggiunte entro due richieste: non significa che le nuove prove siano sempre più corrette.', '',
  '| Speciale | Attese | Corrette prima | Corrette dopo | False prima | False dopo |', '|---|---:|---:|---:|---:|---:|',
  ...result.vsPrevious.specials.map(s=>`| ${s.category} | ${s.expected} | ${s.beforeTP} | ${s.afterTP} | ${s.beforeFP} | ${s.afterFP} |`), '',
  '## Tutti i cambi rispetto alla selezione precedente', '',
  '| Partita | Posizione prima della mossa | Confermata | Prima | Dopo | Esito |', '|---|---|---|---|---|---|',
  ...changes.map(r=>`| ${r.game} | [${Math.ceil(r.ply/2)}${r.ply%2?'.':'...'} ${r.san}](https://lichess.org/analysis/standard/${r.fenBefore.replaceAll(' ','_')}) | ${r.expected} | ${r.before} | ${r.after} | ${r.after===r.expected?'correzione':r.before===r.expected?'regressione':'ancora errata'} |`), '',
  '22.Qxf6 della partita 185262315732 è la regressione: il riferimento dice Ottima, la nuova selezione produce Migliore. 21...O-O passa da Imprecisione a Buona ma il riferimento dice Errore: resta una discrepanza.', '',
  '## Prove di stabilità scartate', '',
  'quality: conservare il confronto iniziale completo quando quello nuovo non contiene più un confronto completo della giocata ha corretto 2 etichette e peggiorato altre 2, con 2 cambi ancora errati. Non integrato.',
  'equal-depth: conservare l’iniziale anche a pari profondità non ha modificato le categorie sui dati disponibili. Non integrato.',
  'La protezione già presente per un confronto iniziale completo più profondo rimane invariata.',
  'Sulle 262 semimosse iniziali e sulle 592 precedenti questi esperimenti non introducono cambi; gli esiti iniziali correnti rimangono 172/262 e 338/592.', '',
  '## Verifica e costo', '',
  `Nuove ricerche dello studio: ${collection.searches}, ${collection.actualNodes} nodi; limite preregistrato 320 ricerche /257600000 nodi. Nessun retry o fallimento.`,
  `Il nuovo flusso completo richiede ${collection.uses.length} callback, ${collection.jobs.reduce((n,j)=>n+j.applicationNodes,0)} nodi contando anche le prove riusate. Non confondere le sole ricerche nuove dello studio con il costo di un’analisi nell’app.`,
  'I massimi per richiesta rimangono invariati, il costo effettivo dipende dalle posizioni scelte. Non è dimostrato un miglioramento di velocità.',
  'Replay offline: tutte le 14 nuove ricerche e le prove pregresse validate da raw UCI, piani e risultati riprodotti; zero nuove ricerche nel controllo.',
  'Hash di sorgenti, input di sviluppo, riferimenti riservati e 20 sorgenti congelate verificati. Corpo della proiezione/riclassificazione degli archivi identico alla versione precedente.',
  'Test: 330 passati e 1 TODO; build senza dotenv passata, avviso noto sulla dimensione del repertorio. Controlli browser registrati in qa-checks.json.',
  'Dati osservati di sviluppo; una nuova misura indipendente richiederà un nuovo campione dopo gli interventi. Nessuna modifica alle regole di Mossa mancata o ai falsi speciali in questo intervento.', '']
await writeFile(`${area}/report.md`,lines.join('\n'),{flag:'wx'})
const escape=x=>`"${String(x??'').replaceAll('"','""')}"`
const csv=[['game','ply','san','expected','initial','previousRefined','firstNew','finalNew','fenBefore'],
  ...result.rows.map(r=>[r.game,r.ply,r.san,r.expected,r.initial,r.before,r.first,r.after,r.fenBefore])]
await writeFile(`${area}/moves.csv`,csv.map(row=>row.map(escape).join(',')).join('\n')+'\n',{flag:'wx'})
await writeFile(`${area}/verification.json`,JSON.stringify({passed:true,newSearches:0,verifiedPlies:262,
  archivedProjectionUnchanged:true,otherApplicationSourcesUnchanged:true,holdoutReferencesUnchanged:true,
  vsPrevious:result.vsPrevious,manifestSourcesVerified:manifest.sources.length},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({verified:true,rows:result.rows.length,positive:5,negative:1,net:4}))
