# Confronto QA

## Partite personali

`node scripts/qa-diagnose-errors.js` riesegue soltanto gli Errori discordanti delle sei partite personali a depth 18, lasciando inalterate le cache di produzione. Produce `agent-output/qa-error-diagnostic.json` e `.md`; al primo errore si ferma e l'eventuale JSON parziale ha `completed: false`. Non misura l'accuratezza dell'intero campione a depth 18. Il rapporto delle conclusioni è `agent-output/qa-error-findings.md`.

`node scripts/qa-import-personal.js` valida PGN e liste in `Partite/<numero>/`, importa le partite completamente annotate e registra provenienza, refusi normalizzati e partite non annotate in `tests/fixtures/qa/personal-manifest.json`. Le sorgenti restano intatte. Non interpreta i simboli NAG del PGN come etichette Game Review.

`npm run qa:compare -- --personal --generate` genera cache reali per le fixture personali annotate. `npm run qa:compare -- --personal` ripete le metriche dalle cache. Il report è `agent-output/qa-compare-personal.md`, separato da quello storico e dalla sanity. Le partite 1–6 costituiscono il gruppo di sviluppo; 7–10 restano riservate alla validazione futura, senza attribuire loro etichette. Le etichette Forzata sono contate e escluse (`forced`) poiché non appartengono alla scala di qualità.

La CLI rileva automaticamente `tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe` nel progetto, anche dopo il clone su un altro PC Windows. È Stockfish 16 dalla release ufficiale https://github.com/official-stockfish/Stockfish/releases/tag/sf_16, scelto per la stessa versione principale usata dal worker dell'app. La distribuzione estratta (eseguibile, licenza, sorgenti e documentazione) è inclusa in Git; soltanto lo ZIP duplicato è escluso. `STOCKFISH_PATH` ha precedenza. La versione effettiva è registrata nelle cache e nel report. Il motore nativo e il port browser possono comunque produrre risultati diversi.

`npm run qa:compare` legge esclusivamente le cache e scrive `agent-output/qa-compare.md` oltre alla console. Dati mancanti producono un report parziale e codice di uscita 1.

`npm run qa:compare -- --generate` genera valutazioni reali con un eseguibile UCI disponibile nel PATH come `stockfish`, oppure indicato dalla variabile PowerShell `$env:STOCKFISH_PATH = 'C:\percorso\stockfish.exe'`. Il primo errore interrompe l'esecuzione senza tentare alternative. Non viene installato né scaricato un motore.

Le fixture principali da fornire sono `tests/fixtures/qa/game-1-chigorin-steinitz-1892.json` e `game-2-saintamant-staunton-1843.json`: oggetto con `label`, `pgn`, `annotations` contenente `{ply, san, category}` per ogni mossa. Le etichette sono quelle italiane del report. Il nome file identifica la partita. Le etichette sospette sono configurate in `suspect-labels.json`.

Cache schema 1: PGN esatto, versione motore, depth e MultiPV di produzione, data di generazione, prospettiva side-to-move e lista di posizioni prima/dopo con SAN/UCI e valutazioni grezze. Le cache non contengono classificazioni. Ogni partita usa `ucinewgame` e un oggetto cache nuovo; non viene riutilizzata la cache FEN dell'app.

La classificazione usa ora il calo di probabilità dalla prospettiva di chi muove. App e QA condividono normalizzazione e classificatore. Il modello già presente è sigmoid(cp/400), con cp limitato a ±1000; è una stima, non il modello chess.com. `dropPct` indica punti percentuali, con miglioramenti apparenti limitati a perdita zero. Massimi iniziali: Migliore 1, Ottima 3, Buona 5, Imprecisione 10, Errore 20; oltre 20 Errore grave. Questi valori non sono stati tarati sulle fixture. Il delta cp resta diagnostico e vale N/D in presenza di matti o score mancanti.

Matto vincente/perdente equivale a probabilità 1/0. Un mate 0 dopo la mossa segnala il matto subito dall'avversario, quindi probabilità 1 per chi ha mosso. Conservare un matto vincente è Migliore, anche se diventa più lungo; conservare un matto perdente produce perdita zero. La distanza dal matto non viene usata per la categoria. Geniale, Grande e Mossa mancata restano riservate ai punti successivi. Le valutazioni mancanti risultano Non valutabile, mai probabilità neutra.

Libro, categorie non implementate, etichette sospette e posizioni prive di valutazioni sono escluse dalle metriche. Le ragioni possono sovrapporsi, mentre il denominatore esclude ogni riga una sola volta. La partita sanity resta separata. Le percentuali hanno come denominatore i ply inclusi; con denominatore zero sono N/D. Il report precedente in centipawn è conservato in `agent-output/qa-compare-centipawn-baseline.md`.

Vitest usa dati sintetici per verificare le funzioni pure, mai per generare cache o report reali. Nessuna promessa di corrispondenza al 100% con chess.com.
