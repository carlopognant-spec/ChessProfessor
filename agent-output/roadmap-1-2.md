# 1.2 — Layout minimal, alternativa A

Implementata l’alternativa consigliata dopo la proposta preventiva e il “procedi” di Carlo.

Home: scacchiera/frecce, barra e valutazione, avvio analisi, navigazione e apertura Strumenti. Desktop con scacchiera centrata; mobile fluido, senza colonna laterale.

Strumenti contiene sezioni espandibili, tutte inizialmente chiuse:

- Editor scacchiera: FEN, palette, applicazione posizione.
- Partita e analisi: PGN, riepilogo, mosse, undo chat, reset e partite salvate.
- Aperture: pannello esistente.
- Chatbot: chat esistente.

Chiusura senza smontaggio: messaggi e bozza chat, PGN, analisi e motore persistono. Il contesto aperture continua ad aggiornarsi come prima. Editor attivo solo con editor e menu entrambi aperti: la home mostra sempre la posizione effettiva e permette mosse normali anche se prima era selezionato un pezzo nella palette. La bozza resta alla riapertura, salvo una successiva mossa effettiva che la sincronizza come prima.

Non modificati motore, budget, classificazioni, soglie, Libro o modello. Nessuna nuova cache QA, nessun commit/push. Nessuna lettura .env o Partite/7-10.

## File

Modificati in questo punto:

- src/App.jsx
- src/index.css
- playwright-check.spec.js
- HANDOFF-ChessProfessor.md

Creato: agent-output/roadmap-1-2.md.

Artefatti ignorati: dist rigenerato dal build; screenshot playwright-report/layout-360.png. I due artefatti test-results già tracciati e puliti all’inizio sono stati ripristinati al termine. Le modifiche precedenti ancora presenti nel repository non appartengono a questo punto.

## Output reali (estratti)

```text
> chess-study-app@0.1.0 test
> vitest run --config scripts/qa-no-env-test.config.js --cache false

 RUN  v2.1.9 C:/Users/carlo/Desktop/ChessProfessor
 Test Files  24 passed (24)
      Tests  137 passed | 1 skipped | 1 todo (139)
   Start at  13:40:20
   Duration  5.73s
```

Exit 0, suite completa senza esclusioni; skipped/todo preesistenti.

```text
> chess-study-app@0.1.0 build
> vite build --config scripts/qa-no-env-build.config.js

vite v5.4.21 building for production...
✓ 71 modules transformed.
dist/index.html                                0.82 kB │ gzip:   0.45 kB
dist/engine-cache-sw.js                        1.25 kB
dist/stockfish-19.0.0-single.js               21.32 kB
dist/stockfish-Copying.txt                    35.82 kB │ gzip:  12.29 kB
dist/stockfish-19.0.0-single.wasm         99,102.79 kB
dist/assets/index-CaCvrfaE.css                 6.87 kB │ gzip:   2.01 kB
dist/assets/stockfish-C-TTLhOJ.js              4.76 kB │ gzip:   1.75 kB
dist/assets/index-CPdVCdZ4.js                382.60 kB │ gzip: 121.39 kB
dist/assets/openingPositions-K7E3GpIt.js     982.40 kB │ gzip: 110.30 kB
(!) Some chunks are larger than 500 kB after minification.
✓ built in 2.31s
```

Exit 0; suggerimenti Vite standard omessi. Asset large solo nel build ignorato, non aggiunti al repository.

```text
> chess-study-app@0.1.0 test:browser
> playwright test

Running 15 tests using 1 worker
  ok  1 minimal home at 360px preserves chat, PGN and editor drafts without horizontal scrolling (2.2s)
  ok  2 minimal home at 1280px preserves chat, PGN and editor drafts without horizontal scrolling (1.8s)
  ok  3 local archive preserves the full PGN across navigation and reload, imports, exports, renames and deletes (2.4s)
  ok  4 saved analysis opens offline without a worker and obsolete analysis is preserved but hidden (2.6s)
  ok  5 unavailable IndexedDB leaves the game playable and shows an archive error (995ms)
  ok  6 mobile navigation uses only buttons in imported and freely played games (2.2s)
  ok  7 navigation preserves chat undo snapshots and restores the original continuation (1.9s)
  ok  8 lazy start and explicit engine restart preserve the game after worker error under StrictMode (2.0s)
  ok  9 lazy start and explicit engine restart preserve the game after unacknowledged stop under StrictMode (17.2s)
  ok 10 partial MultiPV duplicate roots never leave old arrows after a position change (1.4s)
  ok 11 real Stockfish 19 refreshes five legal arrows after PGN import and navigation (19.6s)
  ok 12 clears previous arrows while a newly imported position is waiting for analysis (5.2s)
  ok 13 rapid imports and reset stop the old search before another go command (5.9s)
  ok 14 real mating game shows mate given instead of a missing evaluation (7.1s)
  ok 15 missed opportunity renders the verified alternative and previous opponent move (1.1s)

  15 passed (1.3m)
```

Exit 0. Riferimenti di riga e avvisi NO_COLOR/FORCE_COLOR omessi. Il primo giro mirato ha avuto due timeout: selettore del test errato, titolo “Seleziona Q” cercato come nome accessibile, anziché nome “Q”. Corretto usando getByTitle; nessuna aspettativa eliminata. I test precedenti ora aprono le sezioni necessarie; tutte le verifiche su PGN, archivio, worker, frecce e categorie restano. La prova Stockfish reale aggiunge chiusura/riapertura del menu con otto entry conservate, frecce legali e nessun nuovo go.

Misura separata e screenshot controllato visivamente:

```json
{"viewport":360,"content":360,"board":326}
```

La prova mobile controlla anche l’assenza di overflow con le sezioni aperte. Nessuna chiamata a provider LLM: messaggio su posizione non critica, gestito localmente.

```text
QA protected files: 44; mismatches: 0
git diff --check: exit 0
```

Hash confrontati con protectedFiles del run-plan 2.2b, solo tests/fixtures/qa. Diff check con soli avvisi LF/CRLF, nessun errore di whitespace. Telefono e deploy: NON ESEGUITO.

## Comandi per Carlo (non eseguiti)

I file già modificati comprendono anche lavoro dei punti precedenti: controllare il diff prima di aggiungerli.

```powershell
git status --short
git diff --check
git diff -- src/App.jsx src/index.css playwright-check.spec.js HANDOFF-ChessProfessor.md
git add src/App.jsx src/index.css playwright-check.spec.js HANDOFF-ChessProfessor.md agent-output/roadmap-1-2.md
git diff --cached --stat
git diff --cached --check
```

STOP. Prossima fase da autorizzare: 3.1, piano delle categorie speciali e confronto con definizioni ufficiali prima di implementare.
