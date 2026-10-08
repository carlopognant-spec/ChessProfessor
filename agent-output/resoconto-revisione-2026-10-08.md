# Resoconto della revisione ChessProfessor — 8 ottobre 2026

Base: `main`, commit `7d33608`. Ramo di lavoro: `cleanup/revisione-2026-10-08`.
Le modifiche sono state suddivise in commit dedicati e pubblicate sul ramo di revisione; main non è stato modificato.

## Rimozioni circoscritte A1–A8

- A1: eliminato `verify-stockfish.js`: script obsoleto con require in progetto ESM e asset inesistente. Non eseguito.
- A2: eliminata solo la dichiarazione inutilizzata `uciOf`; `auditCompensationHistory` conservato.
- A3: rimossa solo la proprietà `isGameOver` dal value del contesto; controlli terminali conservati.
- A4: eliminato solo `analysisCache.has`; get, set, delete e clear conservati.
- A5: rimossa solo `config` dal risultato della factory: nessun consumatore, checkpoint o hash di riferimento dipendente dalla proprietà trovato. ENGINE_CONFIG e size conservati.
- A6: rimossa la variabile CSS inutilizzata `--walnut`; il colore delle caselle proviene da Board.
- A7: sostituito il ternario con due rami identici con `finalFen`; test del matto conservato.
- A8: rimosso il secondo svuotamento del riferimento e la seconda notifica vuota nel solo ramo senza mosse; clear e return conservati.

## Correzioni e documentazione

- Riattivato il test di simmetria delle posizioni passando `baseFen` invece di `startingFen`, con libro vuoto per il confronto simmetrico e verifica della FEN iniziale.
- Corretto il conflitto CSS che sovrascriveva spessore e opacità generati per le frecce; aggiunta verifica di regressione.
- Aggiornati README e scripts/qa/README: motore large single, 200.000 nodi, MultiPV 5, categorie correnti e distinzione dalla QA storica.
- Riordinate le categorie del resoconto: Geniale, Grande, Libro, Migliore, Ottima, Buona, Imprecisione, Errore, Mossa mancata, Errore grave, Non valutabile.

## Prestazioni e navigazione

- L'analisi usa la cronologia completa della partita: avanti e indietro riutilizzano i risultati senza riavviare l'analisi.
- Mantenuta la cronologia canonica durante l'analisi, evitando di ricostruirla ripetutamente.
- Riutilizzati i risultati grezzi tra posizioni consecutive quando il provider del motore coincide e la FEN corrisponde: N+1 ricerche invece di 2N in questo percorso.
- Disaccoppiata l'analisi motore dalle richieste di rete Explorer. OpeningPanel riusa fino a 100 richieste pendenti o completate; gli errori possono essere ritentati.
- Su una partita sintetica di 168 semimosse, con motore simulato, la gestione dei risultati è scesa da circa 1.882 ms a 44 ms, con risultati serializzati identici. Questo misura il lavoro dell'applicazione, non la velocità di Stockfish reale.
- Navigazione verificata con motore simulato: circa 119–216 ms e nessuna nuova ricerca durante gli spostamenti.

## Frecce e classificazione sulla scacchiera

- Durante la revisione compare una sola freccia: la migliore alternativa disponibile prima della mossa giocata, ricavata dal risultato completato di quella mossa.
- Nessuna freccia sulle mosse da libro, sulle mosse ancora in attesa di analisi o sulla posizione iniziale della revisione.
- Freccia ridisegnata come sagoma SVG unica con asta e punta integrate.
- Aggiunto il simbolo di classificazione in alto a destra del pezzo mosso, con colori e icone basati sui riferimenti forniti e colorazione delle caselle di partenza e arrivo.
- Ridotta l'animazione dei pezzi a 120 ms. Nessuna modifica alle formule o alle soglie di classificazione.

## Cache: scelta approvata e implementata

La vecchia Map di sessione veniva consultata prima della cache TTL, mantenendo disponibili risultati oltre la scadenza TTL. Ora la factory predefinita usa una sola Map di sessione: riuso fino al reset o all'evizione FIFO al limite configurato. Un indice di chiavi gestisce l'evizione senza duplicare i valori. La chiave conserva la configurazione del motore.

La cache TTL autonoma resta disponibile per chiamanti espliciti; una cache iniettata nella factory è l'unica autorità sui valori e mantiene il proprio comportamento di scadenza. Aggiunti test per riuso, reset, evizione e cache iniettata.

## Verifiche e vincoli

| Verifica | Prima della revisione | Dopo l'ultimo intervento sul codice |
| --- | --- | --- |
| Test applicativi senza .env | 148 superati, 1 saltato, 1 todo | 160 superati, 0 saltati, 1 todo |
| Test Node degli script | 112 superati | 112 superati |
| Build senza .env | Riuscita | Riuscita |

Comandi eseguiti dopo i commit di lavoro:

```text
npm test -- --config scripts/qa-no-env-test.config.js --cache false
node --test scripts/*.test.js
npm run build -- --config scripts/qa-no-env-build.config.js
```

Rimane l'avviso di build sul chunk del libro di apertura superiore a 500 kB. Le verifiche browser aggiuntive hanno usato un Worker simulato, senza ricerche reali. Reset, frecce, simboli, navigazione e visualizzazione mobile verificati con dati sintetici.

Verifica manuale del reset: analizzare una partita, navigare avanti e indietro, controllare che simbolo e freccia corrispondano alla mossa selezionata; azzerare la partita e verificare che resoconto, simboli e freccia spariscano; caricare una nuova partita e controllare che non compaiano risultati della precedente.

Non letti né modificati .env o partite riservate 7–10. Nessuna nuova ricerca Stockfish o richiesta LLM. Nessuna modifica a soglie, formule, esperimenti vietati, distribuzioni Stockfish 16, export di versione degli schemi o validatedAnalysis. Nessun aggiornamento dei report storici datati.

Tutti i 20 file protetti sono rimasti identici, byte per byte, alla baseline locale precedente alla revisione. Il lock non è stato aggiornato.

## Questioni ancora aperte

- La discrepanza preesistente del lock per `classification.js` non è stata risolta; non va aggirata né interpretata automaticamente come differenza semantica. Per gli altri casi indagati sono state ricostruite differenze di fine riga. Dettagli in `cleanup-lock-diagnosis-2026-10-08.md`.
- La scelta delle frecce e della cache è stata approvata e implementata; non rimangono decisioni pendenti su questi due interventi.
- Refactoring B1–B6 fuori dal perimetro e non eseguiti.

I log locali, gli screenshot di verifica e gli audit non tracciati restano artefatti locali. Questo resoconto registra nel repository il lavoro concluso e i limiti delle verifiche.

## Commit e file modificati

L'elenco seguente copre tutti i commit e i file modificati dalla base fino a `2cd47d7`; il commit che aggiunge questo resoconto si aggiunge alla lista.

### Commit

- `a534243` cleanup: remove obsolete root Stockfish verification script (A1)
- `380fa11` cleanup: remove unused compensation history uciOf helper (A2)
- `1fffc16` cleanup: stop publishing unused game-over context value (A3)
- `2e2be22` cleanup: remove unused analysis cache has method (A4)
- `1db93fb` cleanup: remove unused analysis session config property (A5)
- `dbde569` cleanup: remove unused walnut CSS variable (A6)
- `c3eec0a` cleanup: simplify identical final FEN test branches (A7)
- `c7f2856` cleanup: remove duplicate empty-game analysis reset (A8)
- `383bf10` test: restore mirrored-position classification symmetry with baseFen
- `a3de8bb` docs: align engine settings and categories with current app and legacy QA
- `a52f1a3` fix: preserve generated thickness and opacity of engine arrows
- `b12d40c` docs: record frozen lock newline diagnosis and unresolved classification hash
- `fcc74d5` test: verify engine arrows remain visible with SVG styles
- `56afadb` ui: order summary categories like Chess.com
- `2bc80d4` fix: reuse full game analysis during move navigation
- `0c6e4a6` perf: retain canonical move history during game analysis
- `45f974d` perf: reuse engine results between consecutive game positions
- `de9a67e` perf: decouple engine analysis from Explorer network requests
- `8260759` docs: describe analysis reuse and independent opening requests
- `ccc8805` feat: show one completed best-move alternative outside opening theory
- `980e0df` feat: mark the reviewed move with a classification badge
- `d8fcc39` ui: match move classification icons and square highlights to references
- `2cd47d7` refactor: use one session cache without default TTL

### File (A = aggiunto, M = modificato, D = eliminato)

```text
M	README.md
A	agent-output/cleanup-lock-diagnosis-2026-10-08.md
M	playwright-check.spec.js
M	scripts/brilliant-compensation-history.js
M	scripts/qa/README.md
M	src/components/Board.jsx
M	src/components/EnginePanel.jsx
A	src/components/MoveClassificationBadge.jsx
M	src/components/OpeningPanel.jsx
M	src/context/GameContext.jsx
M	src/index.css
M	src/lib/analysisCache.js
M	src/lib/analysisPresentation.js
M	src/lib/gameAnalysis.js
A	src/lib/moveReviewPresentation.js
M	tests/analysis-presentation.test.js
M	tests/automatic-analysis.test.js
M	tests/classification-win-prob.test.js
M	tests/game-analysis-flow.test.js
A	tests/move-classification-badge.test.js
D	verify-stockfish.js
```
