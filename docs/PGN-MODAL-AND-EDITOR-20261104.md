Importazione PGN modale e valutazione dell'editor — 4 novembre 2026.

Directory e Git verificati prima del lavoro: `C:\Users\carlo\AppData\Local\Temp\chessprofessor-grande-candidate-20261030`, branch `work/grande-candidate-20261030`. Modifiche precedenti preservate. Server aggiornato ancora raggiungibile su `http://127.0.0.1:5173/ChessProfessor/`.

Un solo pulsante «Importa partita», compatto e allineato a destra in fondo al pannello di analisi, apre `PgnImportDialog`, componente React basato sul dialogo nativo. In pratica il medesimo pulsante compare nel footer della sessione. Nessun posizionamento fisso o sovrapposizione a scacchiera, notazione e navigazione. Rimossi il pulsante precedente nell'intestazione, il modulo PGN negli Strumenti e il caricamento file duplicato nell'archivio.

La modale comprende testo, file, conferma, Annulla, errori, focus iniziale, ciclo Tab/Shift+Tab, Escape e ritorno del focus. Bozza e partita sono separate: aprire, leggere un file, annullare o chiudere non applica il PGN. Un file lento annullato non può sovrascrivere una bozza successiva. La bozza resta disponibile riaprendo la modale. Al cambio di sezione la modale si chiude senza cancellarla.

Nessun nuovo parser: il testo confermato usa `GameContext.importPgn`; il file confermato usa il servizio archivio esistente (`archive.save`, validazione e deduplicazione), poi `handleOpenArchive`, mantenendo il precedente salvataggio automatico del file. Leggere il file usa lo stesso `File.text()` spostato dal vecchio controllo. Dopo il successo la partita si aggiorna, la modale si chiude e il focus torna alla scacchiera. Durante il ripasso la sostituzione richiede conferma; annullare mantiene tentativo, SAN non inviato e progressi. Import non valido non chiude la pratica.

Archivio, salvataggio, apertura, rinomina, esportazione ed eliminazione restano negli Strumenti. Un aggiornamento della lista rende subito visibili i file appena importati.

L'editor è nascosto dalla barra ordinaria con `EDITOR_AVAILABLE = false`; la modalità di editing della scacchiera è quindi inattiva. `PositionEditor.jsx`, `positionEditor.js` e `GameContext.loadFen` non sono stati modificati in questo intervento. Nessun nuovo pulsante dell'editor.

| Dipendenza conservata | Funzione e conseguenza della rimozione definitiva |
| --- | --- |
| `PositionEditor` → `loadFen` | Unico accesso UI al caricamento diretto di una FEN senza mosse; utile per studio di posizioni e preparazione di esercizi. |
| `GameContext` → `parseAndValidateFen` | Dipendenza di caricamento del contesto; eliminare la libreria senza scollegarla romperebbe l'app. |
| `App`/`Board` → `setPieceAtFen` e callback editor | Palette, cancellazione pezzi, anteprima, lato al tratto, arrocchi ed en passant. Ora inattivi nella UI ordinaria. |
| Import PGN `SetUp`/`FEN` | Resta supportato e verificato, ma richiede almeno una mossa; non sostituisce lo studio di una FEN pura. |
| Analisi e ripasso normali | Non richiedono che l'editor sia visibile: lavorano sulle posizioni del contesto e sulle proprie scacchiere. |

Consiglio: **conservare l'editor come futura funzione avanzata**, non eliminarlo definitivamente. Il PGN copre partite da FEN personalizzata, ma non creazione e analisi diretta di posizioni senza mosse. Per ora resta nascosto come richiesto, senza introdurre un nuovo accesso.

File applicativi: `src/App.jsx`, `src/components/GameArchive.jsx`, `src/index.css`; nuovo `src/components/PgnImportDialog.jsx`. Test importatori e fixture aggiornati al nuovo accesso; i finali prima preparati con l'editor vengono importati con PGN `SetUp`/`FEN` e una mossa legale. La verifica del componente editor è isolata nei test, non un accesso nascosto dell'app.

Verifiche concluse:

- `npx.cmd vitest run tests/game-archive.test.js tests/fen-editor.test.js tests/game-navigation.test.js tests/analysis-presentation.test.js`: **28 test passati**, 4 file.
- Configurazione `scripts/qa-pgn-import-modal.config.js`: **16 casi browser passati (33,5 s)** su import testo/file, focus, validazione, Annulla/Escape, persistenza della bozza, geometria desktop/mobile, archivio, varianti, mainline, finali, drag da tastiera e ripasso. I casi del ripasso usano i mock preesistenti; non sono nuove prove del motore reale.
- File import a 1497×871 e 390×844, più lettura fallita/annullata e cambio sezione: **3 casi passati (11,8 s)**, esecuzione separata con un caso desktop ripetuto.
- Suite base, selezione `minimal home|isolated position editor|local archive preserves|mobile navigation uses`: **5 casi passati (20,9 s)**, inclusi 360/1280 px, chat, editor isolato, esportazione, rinomina e cancellazione archivio.
- `npm.cmd run build -- --config scripts/qa-no-env-build.config.js`: riuscita in 5,10 s; resta l'avviso sui bundle oltre 500 kB. `git diff --check`: riuscito.
- Screenshot ispezionati: [desktop](data/pgn-modal-1497.png), [mobile](data/pgn-modal-390.png).

Durante le prime verifiche è stato corretto il ciclo Tab della modale. Le fixture sono state poi adattate alla nuova UI e al fatto che i controlli dell'editor sono nascosti; i risultati verdi sopra si riferiscono alle esecuzioni successive. Non sono una singola esecuzione della suite completa.

Non eseguite tutte le suite o verifiche su tastiera mobile fisica. Alcuni vecchi scenari di audit/editor (`analysis-ux-audit.spec.js`, `browser-inputs.spec.js`, `editor-board-regression.spec.js`) conservano riferimenti alla vecchia UI e non sono stati rilanciati: non rappresentano copertura dell'editor raggiungibile nell'app attuale. V3, Stockfish, worker, aperture, dati protetti e checkout originale non modificati. Nessuna dipendenza installata; nessun commit, push o deploy.
