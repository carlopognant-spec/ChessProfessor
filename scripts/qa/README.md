# Confronto QA

Questo documento descrive il codice corrente. I report e le baseline storiche
conservano configurazione, data e risultati della loro esecuzione.

## Configurazione dell'app

La fonte è `src/lib/engineConfig.js`: Stockfish **19.0.0**, build
**large-single**, budget nominale **200.000 nodi**, **MultiPV 5**, Threads 1,
Hash 16 MB. Il worker browser invia `ucinewgame` e `Clear Hash` prima di ogni
ricerca. Gli asset provengono dal pacchetto npm tramite
`scripts/stockfish-assets.js`; non vengono usati i vecchi asset lite.

`defaultDepth: 12` resta per il QA storico. Non è il limite di ricerca del
browser e non esiste un fallback corrente a depth 8.

Le cache dell'esperimento a nodi sono in
`tests/fixtures/qa/analysis-cache-large-200k/<data-esecuzione>/` e registrano
motore, build, budget, hash policy, score e telemetria. Non sono intercambiabili
con le cache legacy a depth 12. `scripts/qa-nodes-experiment.js` genera nuove
ricerche e un output separato: non è un controllo unitario né un comando da
lanciare durante una semplice pulizia del codice.

## Categorie e precisione

App e QA condividono la classificazione numerica. Il modello attivo usa
`sigmoid(cp/400)` senza taglio dei centipawn nella funzione
`calculateWinProbability`. `dropPct` è la perdita in punti percentuali dalla
prospettiva di chi muove, limitata inferiormente a zero.

Massimi correnti: Migliore 1, Ottima 3, Buona 5, Imprecisione 10, Errore 20;
oltre 20, Errore grave. Una mossa diversa dalla PV principale riceve al massimo
Ottima quando l'identità UCI è nota, salvo matto dato. La mossa giocata usa il
suo score MultiPV a pari profondità se presente; altrimenti quello della
posizione successiva, riportato alla prospettiva di chi muove.

Libro viene assegnato dal repertorio locale finché la partita non devia;
la soglia Explorer di 15 partite serve solo a fermare le richieste durante
l'analisi. Le posizioni senza score sufficienti sono Non valutabile.

Matto vincente/perdente corrisponde a probabilità 1/0. Il matto dato ha perdita
zero. Conservare lo stesso esito del matto non penalizza una variazione della
distanza; il confronto della distanza è diagnostico. La regola della PV
principale continua ad applicarsi alle categorie comuni.

Mossa mancata è attiva con una politica locale provvisoria: errore avversario
adiacente, nuova opportunità vincente confermata, occasione non mantenuta e
variante alternativa legalmente verificata. La politica richiede probabilità
vincente almeno 0,75 e usa 0,60 come limite non vincente. Non è il modello
dipendente dal rating di Chess.com.

Grande e Geniale restano categorie sperimentali, non attivate nell'app.
Il confronto comune le considera non supportate. Gli esperimenti v2/v3/v4 e
il valutatore congelato hanno risultati separati e non modificano la scala
produttiva. Il valutatore verifica le dipendenze elencate in
`agent-output/specials-frozen-candidate-v1.json`: una mancata corrispondenza
degli hash richiede diagnosi, senza aggiornare il lock per aggirare il controllo.

`cpToProbability` e `moverWinProb` restano API legacy con il loro contratto
limitato; non sono usate dal classificatore numerico corrente. La precisione
0–100 in `src/lib/accuracy.js` è un calcolo distinto, basato sulla formula
pubblica Lichess e sui punteggi delle posizioni effettive. Non va sostituita con
la curva della classificazione né con una stima Elo.

## Test senza nuove ricerche

Da PowerShell nella radice del progetto:

```powershell
npm test -- --config scripts/qa-no-env-test.config.js --cache false
$researchTests = @(Get-ChildItem scripts -Filter '*.test.js' | ForEach-Object { $_.FullName })
node --test @researchTests
npm run build -- --config scripts/qa-no-env-build.config.js
```

Queste configurazioni non caricano `.env`. I test verificano funzioni pure,
worker/processi simulati, legalità e provenienza con dati di sviluppo.
`npm run test:browser` è separato e alcune prove avviano ricerche reali.

## QA storico a profondità fissa

`npm run qa:compare` legge le cache in `tests/fixtures/qa/analysis-cache/` e
scrive `agent-output/qa-compare.md`. Dati mancanti producono un report parziale
e codice di uscita 1. Non è un comando di sola lettura dei report.

Con `--personal` confronta le fixture personali presenti nella cartella.
Il gruppo di sviluppo è costituito dalle partite 1–6; 7–10 restano riservate.
La discovery di questa CLI non costituisce una whitelist dei soli ID 1–6:
non usarla quando sono presenti fixture riservate senza verificarne prima
l'ambito. Il relativo output è `agent-output/qa-compare-personal.md`.

L'opzione `--generate` avvia ricerche reali e scrive le cache legacy; non va
usata per rieseguire semplicemente i test o preservare le baseline.
La scelta del motore è `STOCKFISH_PATH`, poi l'eseguibile locale
`tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe` se disponibile,
altrimenti `stockfish` nel PATH. Stockfish 16 resta per il percorso storico;
non coincide con Stockfish 19 dell'app. Conservare distribuzione, licenza e
sorgenti. La CLI non installa o scarica un motore.

Le fixture storiche principali sono
`tests/fixtures/qa/game-1-chigorin-steinitz-1892.json` e
`game-2-saintamant-staunton-1843.json`: PGN e annotazioni `{ply, san, category}`
per ogni semimossa. Le etichette sospette sono in `suspect-labels.json`.
La partita sanity è separata dal campione di confronto.

Cache legacy schema 1: PGN esatto, versione motore, depth 12, MultiPV 5,
data di generazione e posizioni prima/dopo con SAN/UCI e score grezzi dalla
prospettiva del lato al tratto. Non contengono classificazioni. Ogni partita
usa `ucinewgame` e una cache nuova; non riusa la cache dell'app. La hash policy
del QA legacy non va descritta come quella delle ricerche correnti a nodi.

Il confronto esatto include Mossa mancata; la metrica entro una classe usa
solo le sei categorie comuni attese. Libro, Forzata, categorie non supportate,
etichette sospette e score mancanti sono esclusi secondo la politica della
CLI. Le ragioni possono sovrapporsi; ciascuna riga viene esclusa dal
denominatore una sola volta. Con denominatore zero la percentuale è N/D.
Il QA legacy conserva categorie numeriche sulle righe Libro escluse;
gli adattatori dei report dell'app le riportano a Libro.

## Import e diagnostica storica

`scripts/qa-import-personal.js` valida PGN e liste, crea fixture annotate e
scrive `personal-manifest.json`; non interpreta NAG come etichette Game Review.
Legge tutte le cartelle numeriche in `Partite`, comprese le riservate: non
eseguirlo nel lavoro limitato alle partite 1–6. Le sorgenti originali non
vengono modificate, ma le fixture e il manifest vengono scritti.

`scripts/qa-diagnose-errors.js` avvia Stockfish reale a depth 18 sui soli
Errori discordanti delle fixture personali selezionate. Scrive
`agent-output/qa-error-diagnostic.json` e `.md`; al primo errore si ferma e
l'eventuale risultato parziale ha `completed: false`. La selezione delle
fixture personali richiede lo stesso controllo delle riserve. Il campione
non misura l'accuratezza dell'intero gruppo a depth 18.

Questi comandi e gli esperimenti motore sono distinti dai test unitari.
I risultati storici, inclusa la baseline in centipawn, rimangono intatti.
Le cache e i report già studiati non dimostrano una validazione indipendente
o una corrispondenza al 100% con Chess.com.
