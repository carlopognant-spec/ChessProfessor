# Prestazioni di «Verifica le scelte decisive» — 1 novembre 2026

Correzione esclusivamente di esecuzione e stabilità, nella worktree
`work/grande-candidate-20261030`. Nessuna modifica al classificatore v3,
alle soglie, al budget Stockfish o alle aperture. Nessun commit, push o deploy.

## Causa verificata

Riproduzione in Edge headless, contesto isolato sul server locale 4173, con le
66 semimosse reali dell'archivio già disponibile
`agent-output/refinement-quality-priority-v2/priority-game-184316820266-round-2.json`.

L'handler del pulsante in `EnginePanel` chiamava direttamente
`buildRefinementPlan(entries, { criticalOnly: true })`. Quest'ultimo usa
`selectRefinementView`, che ricalcola l'intera partita con la v3. Seguivano:

- un'altra costruzione del piano in `refineGameEntries`, necessaria per validarlo;
- il piano ordinario nel render React dopo i cambi di stato;
- ulteriori proiezioni durante pubblicazione, completamento, toggle e navigazione.

Il profilo CDP attribuisce circa 52,6 secondi cumulativi del percorso osservato
a `buildRefinementPlan`, con circa 27,7 secondi nel render e 15 secondi nella
validazione di `refineGameEntries`. Sono tempi inclusivi di chiamate annidate,
non vanno sommati. Il lavoro dominante è in `chess.js` (`_moves`, make/undo,
attacchi e prove legali), attraversando la v3 e le verifiche di compatibilità.

Il confronto isolato ha eseguito **zero ricerche Stockfish reali**: il worker
motore era una sentinella che registra `go` e risponde solo allo stop. Il blocco
esiste quindi prima e indipendentemente dalla ricerca. Non sono emerse ricerche
sovrapposte; non era un flusso di aggiornamenti React per ogni linea UCI.
Le copie/serializzazioni non risultano il costo dominante del blocco riprodotto.

## Correzione

- `refinementWorker.js` esegue le stesse funzioni `buildRefinementPlan`,
  `refineGameEntries` e `selectRefinementView` fuori dal thread UI. Anche la
  validazione del piano resta integra: nessun percorso di verifica abbreviato.
- `refinementWorkerClient.js` inoltra al proprietario Stockfish le richieste di
  ricerca con FEN, nodi, MultiPV e storia invariati. Le ricerche restano seriali.
  ID del lavoro e identità del worker scartano risposte tardive. Abort termina
  il worker anche durante una lunga elaborazione sincrona.
- `EnginePanel` prepara i piani in modo asincrono, congela il piano di partenza
  durante il lavoro, riusa le proiezioni per snapshot e non ricalcola scacchi
  nel render o durante la navigazione. L'acquisizione del job precede ogni
  `await`: due clic nello stesso tick non creano due sessioni.
- La cancellazione ferma anche l'eventuale ricerca Stockfish e conserva gli
  snapshot parziali già completati; import, cambio partita e smontaggio
  invalidano il lavoro precedente. Il progresso mostra il totale del piano.
- Il worker è incluso **inline nella build**: può essere ricreato dopo un
  caricamento offline senza scaricare un nuovo file. Gli smoke di produzione
  verificano anche questo caso. Nei test del dev server i mock Stockfish
  lasciano eseguire il medesimo codice worker reale, preventivamente bundlato.

## Misure osservate

Un confronto prima/dopo, stessa partita e stessa sentinella; non un benchmark
statistico e non una misura della velocità Stockfish.

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Risoluzione del clic | 12.761 ms | 50 ms |
| Massimo long task UI | 27.941 ms | 166 ms |
| Tempo del comando Interrompi | 28.006 ms | 84 ms |
| Massimo intervallo rAF | 27.943 ms | 167 ms |
| Long task cumulativi nell'intervallo | 56.321 ms | 728 ms |
| Navigazione tramite Playwright | 325 ms | 468 ms |

Il tempo di navigazione include l'interazione e i controlli del driver; non
viene presentato come un miglioramento della velocità di navigazione.
La preparazione richiede ancora decine di secondi in background (circa 44 s
nel percorso osservato fino alla fase di ricerca/annullamento). La correzione
elimina il blocco UI, non promette un piano istantaneo.

Un secondo scenario usa una risposta **autentica già archiviata a 1M nodi**,
con ritardo controllato di 750 ms, dichiarato come simulazione dell'attesa:

- massimo long task durante verifica/risultato parziale/cancellazione: **163 ms**;
- clic 51 ms, navigazione 317 ms, annullamento 111 ms;
- prova parziale salvata, FEN e mosse conservati;
- ripresa senza ripetere la prima posizione già verificata;
- tre richieste registrate, nessuna sovrapposta; zero nuove ricerche reali.

Il salvataggio esplicito dell'archivio, effettuato dal test per controllare i
risultati parziali, produce ancora un long task di **1.099 ms**. Il profilo lo
colloca in `gameArchive.save`/merge e validazione delle prove. È separato dalla
verifica e resta un limite noto, fuori da questa correzione mirata.

Un terzo scenario annulla già durante la pianificazione: due doppiclic nello
stesso tick, uno per tentativo, producono un solo piano per tentativo; stop
effettivo del worker in **130/126 ms**, navigazione FEN corretta, riprova possibile,
zero richieste Stockfish e zero errori browser.

## Verifiche

- **63 test Vitest distinti PASS**: worker reale su trasporto Node, piano e
  risultati identici al percorso sincrono, budget invariati, abort, ripresa,
  rifiuto piani falsificati, v3, archivio, approfondimenti e sessione ripasso.
- **3 scenari prestazionali browser PASS**, descritti sopra.
- **27 smoke di regressione distinti PASS**, con riuso degli esiti validi e
  riesecuzione dei casi corretti: 4 navigazione/UI, 17 ripasso, 2 produzione v3
  con worker e archivio offline, 4 approfondimenti/completamento/cancellazione/
  fallimento motore e ripartenza.
- Build produzione PASS, 157 moduli. Resta l'avviso Vite sui bundle oltre 500 kB;
  il codice worker inline aumenta il JS principale per preservare l'offline.
- Dieci hash protetti e candidati v1/v2 invariati; `git diff --check` PASS.

Nelle prime esecuzioni erano fallite due attese di testo per una conversione
di codifica nei soli test, poi ripristinata; uno smoke ha inoltre rilevato il
caricamento offline del nuovo worker, corretto con il pacchetto inline.
I casi interessati sono stati rieseguiti con successo.
La suite Vitest completa e i benchmark storici non sono stati rilanciati:
questa verifica riguarda il percorso modificato. Nessuna nuova ricerca reale
sul corpus o sulle mosse diagnostiche.

## File di questa correzione

Applicazione:

- `src/components/EnginePanel.jsx`
- `src/lib/refinementWorker.js`
- `src/lib/refinementWorkerClient.js`

Test e strumenti:

- `tests/refinement-worker.test.js`
- `tests/helpers/browser-refinement-worker.js`
- `grande-performance.spec.js`
- `scripts/qa-grande-performance-browser.config.js`
- `scripts/qa-refinement-browser.config.js`
- adeguamento dei mock worker in `analysis-ui.spec.js`, `review-practice.spec.js`,
  `playwright-check.spec.js`, `grande-v3-smoke.spec.js`; quest'ultimo verifica
  anche l'esecuzione del worker inline offline sulla build.

I profili CDP e gli eventi integrali restano esterni al codice applicativo:
`%TEMP%/grande-performance-before-planning.json`,
`grande-performance-after-planning.json`, `grande-performance-after-cached.json`,
`grande-performance-after-early-cancel.json`.
Il riepilogo persistente è in `docs/data/grande-performance-verification.json`.

Per ripetere solo gli smoke prestazionali sulla versione corretta, con il dev
server già attivo a 4173, selezionare esplicitamente la fase `after`:

```powershell
$env:GRANDE_PERF_PHASE = 'after'
$env:GRANDE_PERF_MODE = 'planning'
node node_modules/@playwright/test/cli.js test --config scripts/qa-grande-performance-browser.config.js
```

Non eseguire `phase=before` sui sorgenti corretti: la misura precedente è già
archiviata e non viene rigenerata. Nessuna dipendenza runtime da questi dati.
