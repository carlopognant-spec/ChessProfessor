# Roadmap 2.3 — motore unico

Adottato Stockfish 19 large-single, npm 19.0.0 fissato, 200.000 nodi, MultiPV 5, Threads 1, Hash 16 MB. Soglie, modello, Libro, cap e Mossa mancata invariati. `defaultDepth: 12` resta per i vecchi strumenti/cache QA a depth; l'app invia `go nodes 200000`.

Il motore parte con «Avvia analisi», poi segue automaticamente mosse/import/navigazione. Prima dell'azione la pagina non crea worker e non scarica JS/WASM del motore. Se non sono presenti entrambi gli asset nella cache, mostra l'avviso di circa 100 MB. Timeout caricamento 180 s, distinto dallo stop non onorato entro 15 s. Nessun selettore, alternativa automatica o pulsante Approfondisci.

Il plugin Vite serve gli asset da npm in sviluppo e li emette in dist al build. Il grande non è stato aggiunto ai sorgenti/public/Git; dist è ignorato. WASM: 99.102.793 byte, JS: 21.315 byte, identici byte per byte al pacchetto; nessun file oltre 100 MB. Inclusa Copying.txt. Il vecchio lite in public non entra nel build.

Cache browser versionata, soltanto per i due asset del motore. Il service worker non precachea, non conserva app/partite/API, non imposta COOP/COEP. Quando non è disponibile, l'analisi parte e il browser usa la cache HTTP. La cache può essere eliminata/evicta dal browser. Testati localhost e build di produzione; telefono con questa nuova integrazione NON ESEGUITO.

## Metadati: prerequisito 1.3 assente

Nel repository manca ancora l'archivio IndexedDB del punto 1.3. Una domanda asincrona ha esplicitato il prerequisito; senza risposta, il perimetro adottato è metadati ora, archivio nel punto 1.3. Nessuna nuova UI di archivio introdotta. I risultati serializzabili e le entry di partita registrano:

```json
{
  "analysisMetadata": {
    "schemaVersion": 1,
    "engine": {
      "name": "Stockfish",
      "version": "19",
      "packageVersion": "19.0.0",
      "build": "large-single",
      "actualEngineId": "Stockfish 19 WASM"
    },
    "budget": { "kind": "nodes", "value": 200000 },
    "multiPv": 5,
    "threads": 1,
    "hashMb": 16,
    "hashPolicy": "clear-per-search"
  }
}
```

La chiave della cache di sessione include identità/condizioni, FEN e mossa. `isAnalysisCurrent` riconosce come obsoleti record senza metadati o con motore/budget/condizioni diversi. Testata conservazione dopo JSON e separazione delle cache fra budget. Salvataggio locale effettivo del punto 1.3 NON ESEGUITO.

## Riuso del ply successivo: non implementato

Il codice continua a chiamare analyzePosition e analyzePlayedPosition. Nessuna cache QA rigenerata.

Baseline P1–P6: 393 FEN consecutive duplicate, 349 cp/cp, scarto assoluto medio 32,7364 cp, mediana 6, P90 36, massimo 2440; 39 mate/mate e 5 mate/cp. Ricerche indipendenti della stessa FEN non garantiscono punteggi equivalenti.

Cache 2.2b large/200k, ucinewgame e Clear Hash per ogni ricerca: 584 coppie su P1–P6/H1–H2, 535 cp/cp e 49 mate/mate. Score identici in tutte; identiche anche le linee per multipv/depth/score/PV, escludendo raw con tempo/NPS. Risultato del campione, non garanzia per altre condizioni/piattaforme.

Proposta da approvare separatamente: riusare la ricerca completa del fenAfter come fenBefore del ply successivo, soltanto con FEN completa e metadati uguali. Riutilizzare dati motore, non categorie/Libro/Mossa mancata, che richiedono il contesto della partita. Conservare ricerca iniziale e ultima posizione: N+1 ricerche anziché 2N. Frecce del fenAfter ricevono una MultiPV completa; una partita terminata per abbandono richiede ancora l'ultima ricerca. Matto/stallo conservano la gestione corrente. Invalidare il riuso se cambiano motore, budget, Hash, Threads, MultiPV o politica hash. La FEN priva di cronologia resta il limite corrente sulle ripetizioni.

592 ply in 8 partite: 1.184 → 600 go, 584 risparmiati (49,32%). Le ricerche eliminabili sono costate 352,823 s su 713,325 s di ricerca. Stima controfattuale: 360,502 s di ricerca più avvio/IO/Explorer/UI. Non è un tempo misurato dopo implementazione; download e inizializzazione non si dimezzano. Dati: roadmap-2-3-reuse.json.

## Verifiche reali

```text
npm test -- --config scripts/qa-no-env-test.config.js --cache false
Test Files 23 passed (23)
Tests 130 passed | 1 skipped | 1 todo (132)
Duration 6.30s; exit 0; nessuna esclusione

npm run build -- --config scripts/qa-no-env-build.config.js
70 modules transformed; built in 3.20s; exit 0
Warning: chunk oltre 500 kB

npm run test:browser
10 passed (1.1m); exit 0

git diff --check
exit 0; avvisi LF/CRLF
```

Prima suite browser: 8 passati/1 fallito. Il budget a nodi può lasciare due linee MultiPV con la stessa mossa radice a depth diverse; la vecchia chiave React start/end duplicata lasciava una freccia precedente nel DOM. Corrette chiavi univoche per linea e aggiunta regressione. Lettura FEN/frecce del test resa atomica, mantenendo la verifica di legalità. La valutazione visualizzata è legata alla FEN corrente; score/regole non alterati.

Browser reale: niente worker/download prima dell'azione, cinque frecce legali, import/navigazione, cache dopo reload, riavvio offline del solo motore da cache, stop/riavvio senza perdere la partita, matto e Mossa mancata. Verificato anche dist tramite vite preview: zero worker prima dell'avvio, id Stockfish 19 WASM, tutti i go a 200.000 nodi, cache WASM presente, due entry dopo PGN e FEN scacchiera/valutazione uguali.

SHA-256 invariati per 44 file QA protetti. Artefatti Playwright tracciati riscritti dalla suite ripristinati; altre modifiche preesistenti lasciate intatte. Nessuna lettura .env o Partite/7–10. NON ESEGUITI: telefono con nuova UI/cache, deploy/push, salvataggio IndexedDB, riuso delle ricerche. Nessun commit/push.
