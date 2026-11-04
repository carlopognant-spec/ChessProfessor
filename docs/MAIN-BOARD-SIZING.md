Misurazione e intervento del 4 novembre 2026 sulla worktree `work/grande-candidate-20261030`.

Questo rapporto descrive il precedente ridimensionamento manuale, ora sostituito dal layout automatico a 779 px. Stato attuale e verifiche: [ANALYSIS-LAYOUT-FINAL.md](ANALYSIS-LAYOUT-FINAL.md). Le misure storiche sotto sono conservate.

La griglia reale viene misurata come unione dei bounding box delle 64 caselle, verificando anche quadratura e dimensione di ogni casella. Le misure sono state raccolte con Playwright ed Edge sul server locale, senza preferenza manuale impostata.

| Viewport | Griglia prima | Griglia dopo | Casella prima | Casella dopo |
| --- | ---: | ---: | ---: | ---: |
| 1497×871 | 559×559 | 700×700 | 69,88 | 87,50 |
| 1920×1080 | 768×768 | 909×909 | 96,00 | 113,63 |
| 1280×900 | 588×588 | 729×729 | 73,50 | 91,13 |
| 390×844 | 311,75×311,75 | 311,75×311,75 | 38,97 | 38,97 |

Tutte le dimensioni sono in pixel CSS. Il dato iniziale a 1497×871 della worktree attuale era 559 px, diverso dai circa 640 px dello screenshot segnalato. Prima dell'intervento la navigazione terminava a y=926,2; ora termina a y=854, entro gli 871 px disponibili.

Su desktop titolo e importazione occupano la colonna destra. Vista, rotazione, riconoscimento del colore e audio sono disponibili nel gruppo espandibile «Vista e suoni». Il cursore «Dimensione» si usa con mouse o tastiera e salva la preferenza in localStorage; «Auto» ripristina il massimo disponibile. Il limite considera larghezza, altezza effettiva di controlli/navigazione/avvisi e almeno 320 px per il pannello destro. Una preferenza temporaneamente troppo grande viene limitata senza essere sovrascritta. Su mobile il cursore è nascosto.

File applicativi toccati: `src/App.jsx`, `src/components/Board.jsx`, `src/components/BoardSizeControls.jsx`, `src/index.css`. Nessuna dipendenza aggiunta.

Verifiche eseguite:

- `node scripts/measure-main-board.mjs before`, poi `node scripts/measure-main-board.mjs after`: 64 caselle per ciascuno dei quattro viewport, barra allineata, nessun overflow orizzontale, navigazione desktop entro il viewport; ridimensionamento con mouse/tastiera, reload, limite e ripristino dopo resize, reset automatico, impostazioni espanse, rotazione/audio, mossa e navigazione, preferenza non valida e localStorage indisponibile.
- `$env:PRACTICE_SIZE_PHASE = 'main-board-resize'; npx.cmd playwright test --config scripts/qa-review-practice-browser.config.js --grep 'practice actual 64-square|practice constrained board' --reporter=line`: **4 passed (26.5s)**. Worker simulato; nessuna ricerca Stockfish reale. Griglia del ripasso invariata: 760 px a 1920×1080, 580 px a 1280×900, 256 px a 390×844. Inclusa sottopromozione con trascinamento.
- `npm.cmd run build -- --config scripts/qa-no-env-build.config.js`: riuscita, con avviso sui bundle oltre 500 kB.
- `git diff --check`: riuscito.

Le misure complete delle caselle sono in `docs/data/main-board-sizing.json`, con screenshot prima/dopo per tutti i viewport. La nuova esecuzione del ripasso è aggiunta sotto la chiave `main-board-resize` in `docs/data/practice-board-sizing.json`; le evidenze precedenti sono conservate. I due file `ReviewPracticePanel.jsx` e `ReviewPracticePanel.css` non sono stati modificati e i loro hash sono rimasti invariati durante l'intervento.

Non rieseguite le suite complete V3, Stockfish e aperture. Nessun commit, push o deploy.
