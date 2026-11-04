Intervento del 4 novembre 2026, esclusivamente in `C:\Users\carlo\AppData\Local\Temp\chessprofessor-grande-candidate-20261030`, branch `work/grande-candidate-20261030`. Directory, branch e stato Git verificati prima delle modifiche; lavoro precedente conservato.

I quattro pulsanti di navigazione e il contatore delle semimosse compaiono una sola volta, immediatamente dopo la notazione Bianco/Nero nel pannello destro. Usano lo stesso componente e la stessa logica precedenti. «Vista e suoni» raccoglie i controlli secondari nello stesso pannello.

La dimensione della griglia è ora automatica, con riferimento massimo di 779 px. CSS limita ulteriormente la larghezza in base alle due colonne e l'altezza con `100dvh - 90px`. Il pannello destro conserva almeno 320 px sul desktop. Nessuno slider, valore in pixel, pulsante Auto o preferenza manuale viene letto dall'applicazione. La vecchia preferenza resta nei dati del browser, senza effetto sul layout. Nessuna dipendenza o nuova logica JavaScript per il dimensionamento.

Misure Playwright/Edge sul server locale, in pixel CSS, dopo il completamento delle animazioni:

| Viewport | Griglia 8×8 effettiva | Singola casella |
| --- | ---: | ---: |
| 1920×1080 | 779×779 | 97,375×97,375 |
| 1497×871 | 779×779 | 97,375×97,375 |
| 1280×900 | 779×779 | 97,375×97,375 |
| 390×844 | circa 311,81×311,81 | circa 38,97×38,97 |

La griglia è l'unione delle 64 caselle, non il contenitore. Ogni casella è verificata per proporzioni; i pezzi SVG restano entro la propria casella dopo l'animazione. Barra di valutazione allineata in altezza e posizione; rotazione coerente con la scacchiera. Nessun overflow orizzontale o sovrapposizione tra pannelli nei viewport misurati. Su mobile il pannello destro segue la scacchiera nel normale scorrimento verticale; tutti i pulsanti di navigazione misurano almeno 44×44 px.

File applicativi modificati: `src/App.jsx`, `src/components/AnalysisSummary.jsx`, `src/components/Board.jsx`, `src/index.css`. Eliminato `src/components/BoardSizeControls.jsx`, introdotto nell'intervento precedente. Nessuna modifica a `MoveNavigation`, contesto della partita, classificatore V3, Stockfish, worker, aperture o checkout originale.

Verifiche e file di supporto:

- `scripts/measure-main-board.mjs`: aggiornato per il layout automatico; misura tutti i viewport, controlla assenza dei controlli manuali, vecchia preferenza ignorata, griglia/caselle/pezzi/barra, posizione e unicità della navigazione, quattro pulsanti, frecce della tastiera, selezione dalla notazione, continuazione ipotetica e ritorno alla mainline. Verifica anche l'adattamento a 1000×600 e l'assenza di errori pagina. Esecuzione riuscita.
- Evidenze nuove in `docs/data/analysis-layout-final.json` e quattro screenshot `analysis-layout-final-*.png`. Le misure e gli screenshot precedenti restano conservati.
- `analysis-ui.spec.js`, `analysis-polish.spec.js`, `long-game-stability.spec.js`: aggiornati per aprire «Vista e suoni» prima di usare i controlli raggruppati. Il test di stabilità lungo è stato adeguato ma non rieseguito.
- `scripts/qa-analysis-layout.config.js`: configurazione per i test browser mirati, riutilizza quella esistente e il server con discovery dotenv disabilitata.
- `npx.cmd vitest run tests/game-navigation.test.js tests/analysis-presentation.test.js tests/evaluation-bar.test.js`: **22 test passati**, 3 file.
- `$env:PRACTICE_SIZE_PHASE = 'layout-final'; npx.cmd playwright test --config scripts/qa-analysis-layout.config.js --grep 'orientation uses|rotation remains|bar, contextual|original Web Audio|resignation exploration|cannot extend|threefold repetition|practice actual 64-square|practice constrained board' --reporter=line`: **15 passati e 1 timeout** in 3,2 minuti. Passati rotazione/identità e storage negato, barra e didattica su tre viewport, audio, esplorazione e conservazione dell'archivio, finali e ripetizione, i quattro casi del ripasso.
- Il caso `cannot extend a game ended by fifty-move draw` è scaduto aspettando il menu iniziale, prima di applicare la posizione. Retry isolato con `--grep 'fifty-move draw' --trace on --timeout 30000`: **1 passed (8.4s)** senza modificare il codice. Il timeout non si è riprodotto; la sua causa non è accertata. Non si presenta questa verifica come una singola suite da 16 test tutta verde.
- Ripasso: griglie ancora di **760×760**, **580×580** e **256×256** px a 1920×1080, 1280×900 e 390×844. Passata anche la sottopromozione con trascinamento. I casi browser del ripasso usano un worker simulato, non nuove ricerche Stockfish reali.
- `npm.cmd run build -- --config scripts/qa-no-env-build.config.js`: riuscita; resta l'avviso sui bundle oltre 500 kB.
- `git diff --check`: riuscito.

I file `ReviewPracticePanel.jsx` e `ReviewPracticePanel.css` restano identici all'inizio dell'intervento (SHA256 `DDEE8424AD285FDF8C2249E24A5C934FE8BD5A8149B302B763083B880858B27E` e `D2867A4E1A72563DDDAA14BEAEC5A281207C56AB2C6AE66AA997DFAC76469F59`). Le nuove misure del ripasso vengono aggiunte sotto `layout-final` nel rapporto esistente, senza sovrascrivere quelle precedenti.

Non rieseguite le suite complete V3, Stockfish, aperture e stabilità lunga. Nessun commit, push, merge o deploy.
