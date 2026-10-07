# Punto 1.3 — archivio locale

Partite salvate in IndexedDB, browser/dispositivo corrente. Salvataggio manuale; apertura, rinomina, eliminazione con conferma, importazione file ed esportazione PGN. Aprire l’elenco **Partite salvate** sotto l’importatore PGN, premere **Salva partita e analisi** quando si vuole conservarle. La riapertura di analisi compatibili non avvia il motore. Per aggiornarle: **Avvia analisi**, attendere, quindi salvare nuovamente.

Il salvataggio conserva tutta la partita anche navigando indietro. Duplicati identificati con SHA-256 del PGN canonico, header/commenti inclusi. Import/export mantiene i commenti della partita originale; se si modifica il ramo, il nuovo PGN mantiene gli header ma non i commenti del ramo sostituito. Data d’importazione = primo inserimento nell’archivio. La rinomina cambia il titolo locale, non gli header PGN. PGN export conserva la partita, non il database delle analisi.

Analisi salvata con schema, Stockfish 19 large-single/19.0.0, 200.000 nodi, MultiPV 5, Threads 1, Hash 16 e hash svuotata; id UCI diagnostico. Incompatibilità di schema/impostazioni o catena SAN/FEN rendono l’analisi obsoleta: non visualizzata, non cancellata. Analisi parziali ammesse; una compatibile più breve non cancella quella già completa. Dopo futuri cambiamenti di regole incrementare ANALYSIS_SCHEMA_VERSION. Soglie e regole attuali invariate.

Quota/accesso negato/IndexedDB assente: messaggi espliciti; nessun successo prima del commit. Il salvataggio SHA-256 richiede HTTPS/localhost. Il browser può cancellare i dati, specialmente in modalità privata; nessuna sincronizzazione o garanzia di persistenza illimitata.

## File di questo punto

Creati:

- src/lib/gameArchive.js
- src/components/GameArchive.jsx
- tests/game-archive.test.js
- agent-output/roadmap-1-3.md

Modificati (alcuni contenevano già modifiche dei punti precedenti):

- src/App.jsx
- src/components/EnginePanel.jsx
- src/context/GameContext.jsx
- src/lib/gameAnalysis.js (FEN iniziale opzionale, default invariato)
- src/index.css (solo stili archivio)
- package.json e package-lock.json (fake-indexeddb 6.2.5 solo sviluppo)
- playwright-check.spec.js
- HANDOFF-ChessProfessor.md

Build e report temporanei nei percorsi ignorati dist/playwright-report/test-results. I due artefatti test-results già tracciati, puliti prima della prova, ripristinati dopo i test. Nessuna nuova cache QA. Le modifiche precedenti del repository restano presenti: questo elenco riguarda esclusivamente 1.3.

## Output reali finali

Suite completa senza esclusioni, config no-env:

```text
> chess-study-app@0.1.0 test
> vitest run --config scripts/qa-no-env-test.config.js --cache false

 RUN  v2.1.9 C:/Users/carlo/Desktop/ChessProfessor

 ✓ tests/analysis-presentation.test.js (7 tests) 12ms
 ✓ tests/mate-comparison.test.js (13 tests) 14ms
 ✓ tests/analysis-classification.test.js (12 tests) 14ms
 ✓ tests/missed-opportunity.test.js (8 tests) 73ms
 ✓ tests/engine-assets.test.js (3 tests) 16ms
 ✓ tests/game-archive.test.js (7 tests) 147ms
 ✓ tests/qa-compare.test.js (9 tests) 104ms
 ✓ tests/automatic-analysis.test.js (11 tests) 746ms
 ✓ tests/pgn-classification.test.js (8 tests | 1 skipped) 28ms
 ✓ tests/llm-critical-context.test.js (3 tests) 10ms
 ✓ tests/analysis-metadata.test.js (2 tests) 21ms
 ✓ tests/classification-win-prob.test.js (6 tests | 1 skipped) 308ms
 ✓ tests/stockfish.test.js (13 tests) 488ms
 ✓ tests/game-navigation.test.js (3 tests) 29ms
 ✓ tests/game-analysis-flow.test.js (4 tests) 8ms
 ✓ tests/qa-personal-import.test.js (3 tests) 39ms
 ✓ tests/evaluation.test.js (4 tests) 7ms
 ✓ tests/explorer-analysis.test.js (3 tests) 12ms
 ✓ tests/analysis-summary.test.js (3 tests) 9ms
 ✓ tests/qa-native-engine.test.js (1 test) 490ms
 ✓ tests/position-facts.test.js (1 test) 8ms
 ✓ tests/chess-smoke.test.js (1 test) 13ms
 ✓ tests/fen-editor.test.js (4 tests) 12ms
 ✓ tests/opening-book.test.js (10 tests) 6285ms

 Test Files  24 passed (24)
      Tests  137 passed | 1 skipped | 1 todo (139)
   Start at  13:28:36
   Duration  7.54s
```

Exit 0. Le righe dei singoli test lenti e le componenti del tempo sono omesse; i conteggi sopra sono quelli effettivi.

```text
> chess-study-app@0.1.0 build
> vite build --config scripts/qa-no-env-build.config.js

vite v5.4.21 building for production...
transforming...
✓ 71 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                0.82 kB │ gzip:   0.45 kB
dist/engine-cache-sw.js                        1.25 kB
dist/stockfish-19.0.0-single.js               21.32 kB
dist/stockfish-Copying.txt                    35.82 kB │ gzip:  12.29 kB
dist/stockfish-19.0.0-single.wasm         99,102.79 kB
dist/assets/index-5ngOdL4_.css                 5.85 kB │ gzip:   1.84 kB
dist/assets/stockfish-Dbv5W782.js              4.76 kB │ gzip:   1.75 kB
dist/assets/index-BT41fvld.js                381.84 kB │ gzip: 121.22 kB
dist/assets/openingPositions-K7E3GpIt.js     982.40 kB │ gzip: 110.30 kB

(!) Some chunks are larger than 500 kB after minification.
✓ built in 5.15s
```

Exit 0; suggerimenti standard Vite sul frazionamento dei chunk omessi. Nessun nuovo binario nel repository.

```text
> chess-study-app@0.1.0 test:browser
> playwright test

Running 13 tests using 1 worker
  ok  1 local archive preserves the full PGN across navigation and reload, imports, exports, renames and deletes (2.7s)
  ok  2 saved analysis opens offline without a worker and obsolete analysis is preserved but hidden (2.5s)
  ok  3 unavailable IndexedDB leaves the game playable and shows an archive error (944ms)
  ok  4 mobile navigation uses only buttons in imported and freely played games (2.4s)
  ok  5 navigation preserves chat undo snapshots and restores the original continuation (1.9s)
  ok  6 lazy start and explicit engine restart preserve the game after worker error under StrictMode (1.5s)
  ok  7 lazy start and explicit engine restart preserve the game after unacknowledged stop under StrictMode (16.9s)
  ok  8 partial MultiPV duplicate roots never leave old arrows after a position change (1.9s)
  ok  9 real Stockfish 19 refreshes five legal arrows after PGN import and navigation (23.5s)
  ok 10 clears previous arrows while a newly imported position is waiting for analysis (5.1s)
  ok 11 rapid imports and reset stop the old search before another go command (5.8s)
  ok 12 real mating game shows mate given instead of a missing evaluation (7.6s)
  ok 13 missed opportunity renders the verified alternative and previous opponent move (1.1s)

  13 passed (1.3m)
```

Exit 0. Percorsi/riferimenti di riga e warning NO_COLOR/FORCE_COLOR omessi. Il primo giro ha dato 2 falliti/11 passati: connessione IndexedDB chiusa durante il doppio avvio StrictMode. Correzione e regressione aggiunta; verifica dedicata successiva 2/2, poi suite completa sopra.

```text
QA protected files: 44; mismatches: 0
git diff --check: exit 0
```

git diff --check produce soltanto avvisi LF/CRLF per i file modificati già presenti, senza errori di whitespace. SHA-256 confrontati con protectedFiles del run-plan 2.2b, limitatamente a tests/fixtures/qa. Non letti .env o Partite/7-10. Cache/baseline intatti. Telefono, modalità privata reale, deploy: NON ESEGUITO. Nessun commit/push.

## Comandi Git per Carlo (non eseguiti)

Questi file includono anche modifiche precedenti ancora non committate: controllare il diff prima di aggiungerli.

```powershell
git status --short
git diff --check
git diff -- src/App.jsx src/components/EnginePanel.jsx src/context/GameContext.jsx src/lib/gameAnalysis.js src/index.css package.json package-lock.json playwright-check.spec.js HANDOFF-ChessProfessor.md
git add src/lib/gameArchive.js src/components/GameArchive.jsx tests/game-archive.test.js agent-output/roadmap-1-3.md src/App.jsx src/components/EnginePanel.jsx src/context/GameContext.jsx src/lib/gameAnalysis.js src/index.css package.json package-lock.json playwright-check.spec.js HANDOFF-ChessProfessor.md
git diff --cached --stat
git diff --cached --check
```

STOP al punto 1.3. Nessun altro punto implementato.
