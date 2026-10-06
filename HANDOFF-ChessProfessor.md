# ChessProfessor — stato e prosecuzione

Aggiornato: 6 ottobre 2026. Leggere questo file prima di proseguire su un altro PC.

## Aggiornamento: fix Libro locale del 6 ottobre

Autorizzato da Carlo dopo la ricerca dei repertori. `analyzeGame` ora riconosce Libro dalle posizioni di un repertorio locale, non dalle frequenze Explorer né dall'header ECOUrl. Il valore `explorerMinGames: 20` è conservato ma non decide più Libro. Soglie di classificazione, modello cp/probabilità, helper dei matti e categorie speciali non sono stati modificati. La mossa finale di matto conserva la classificazione Migliore anche se compare in una trappola nominata nel repertorio.

Repertorio: 12.377 sequenze validate di JeffML/eco.json, revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, più due integrazioni documentate (Berlin `4.d4 Nxe4` da chess.com e linea completa Bowdler ritardata da Wikibooks). Risultato: 15.522 posizioni. Fonte, revisione e SHA-256 dei file sono nei metadati; licenza MIT upstream e provenienza sono in `src/data/`. Generazione ripetibile: `node scripts/build-opening-book.js`, che scarica soltanto le fonti fissate e valida ogni sequenza prima di scrivere i dati. Non richiede `.env` o Explorer.

Il browser carica il repertorio locale al bisogno; nessuna richiesta alle fonti esterne durante il riconoscimento Libro. La chiave delle posizioni mantiene turno, diritti di arrocco ed en passant legale, ignorando i contatori. Le trasposizioni sono riconosciute. Dopo il primo scarto, la partita non rientra nel libro. I flag e la cronologia sono ricalcolati anche sui cache hit; i dati motore rimangono nella cache FEN+mossa.

Verifiche: tutte le etichette Libro delle fixture 1–6 coincidono; partita 5: 4 bianche + 4 nere; partita 10: 3 bianche + 3 nere, con primo scarto `4.c3`. Il test della 10 passa anche eliminando gli header e senza Explorer. Le integrazioni sono state selezionate dopo aver osservato le partite di sviluppo: questo risultato è una regressione sul campione, non una validazione indipendente. Le etichette 7–9 non sono state lette né usate; le previsioni ECOUrl registrate al punto 5 restano conservate come ipotesi separata.

Suite: 17 file passati, 79 test passati, 1 skipped e 3 todo (83 totali). Build riuscita: 64 moduli; repertorio in chunk separato da circa 982 kB (110 kB gzip), con avviso Vite sul superamento di 500 kB non compressi. Nessuna soglia della build alzata. Collaudo browser NON ESEGUITO; il problema delle frecce dopo import resta al punto 7. Nessun commit/push eseguito dall'agente.

Limite: assenza dal repertorio significa continuazione non documentata da questa raccolta, non prova di assenza dalla teoria. Per ampliare la copertura, aggiungere sequenze con fonte e verifica, evitando di derivare Libro dal numero di partite osservate.

## Aggiornamento: integrazione con GitHub del 6 ottobre

Il commit locale `339adac` è stato creato da Carlo, ma il primo push è stato rifiutato perché `origin/main` conteneva ulteriori commit. Carlo ha avviato `git pull --rebase origin main`, con conflitti. La risoluzione è stata preparata e verificata dall'agente; completamento del rebase e push spettano a Carlo. Non usare il vecchio hash per presumere che il push sia riuscito: il rebase assegnerà un hash nuovo.

Le modifiche arrivate da GitHub includono Stockfish 19 nel browser, helper di valutazione e nuovi test. Il worker ora carica `public/stockfish-19-lite-single.js` e `.wasm`, con `stockfish` tra le dipendenze npm; il vecchio CDN/Blob non è più lo stato attuale. Il motore QA e le cache restano Stockfish 16: questa differenza di versione deve essere considerata prima di dichiarare il QA equivalente all'app. Non sono state rigenerate le cache durante la risoluzione.

Scelte nella risoluzione:

- Conservati worker/assets browser 19, dipendenza e lockfile remoti, helper `cpToProbability` e `moverWinProb` e test aggiunti su GitHub.
- Conservate le soglie locali approvate 1/3/5/10/20 e la classificazione mate a 1/0. `moverWinProb` remoto resta disponibile con il suo contratto 0.99/0.01, ma non viene usato dal classificatore locale: non scambiare queste due API per equivalenti.
- `classifyMove` conserva la validazione remota stretta: input dropPct non finito causa TypeError. `classifyAnalysisEntries` gestisce invece score mancanti come Non valutabile, coerentemente con la scelta approvata nella sessione.
- Integrato il riconoscimento del matto finale tramite chess.js anche quando Stockfish non restituisce score. Un matto dato è Migliore con perdita zero anche se manca lo score precedente. App e QA usano lo stesso helper con il controllo di checkmate.
- Conservati e ampliati i test del matto finale e i test remoti. Aggiornate le aspettative per dati mancanti, come già autorizzato; nessun nuovo test saltato. Il test mirrored era già saltato su GitHub per la mancanza di custom-start FEN.
- Le fixture storiche avevano contenuti identici; mantenuto il fine riga finale della versione remota.
- Gitignore mantiene i filtri remoti per cache/build/artefatti temporanei, protegge `.env` e include distribuzione Stockfish 16 estratta, dati, report e handoff. Lo ZIP duplicato resta escluso.

Verifiche dopo integrazione: `npm ci` riuscito; `npx vitest run tests/`: 16 file passati, 65 test passati, 1 skipped e 3 todo (69 totali). Build riuscita: Vite 5.4.21, 61 moduli, 2.13 s. Entrambi i confronti QA dalle cache hanno exit code 0 e percentuali invariate. Output console in `agent-output/qa-compare-console.txt` e `qa-compare-personal-console.txt`.

L'installazione ha segnalato 7 vulnerabilità (3 moderate, 2 high, 2 critical); non è stato eseguito npm audit fix né cambiato il lockfile per aggiornarle. Valutarle in una fase separata. La documentazione seguente descrive anche le fasi precedenti: questo aggiornamento prevale sui riferimenti al vecchio worker browser e alla precedente suite di 54 test.

## Obiettivo di Carlo

Un'alternativa gratuita con analisi illimitate alla Game Review di chess.com: analisi delle partite con Stockfish, categorie delle mosse e spiegazioni comprensibili, il più possibile simili a quelle della versione a pagamento. La coincidenza esatta con chess.com non è ancora raggiunta né garantita. Non confondere il superamento dei test con l'equivalenza delle analisi.

## Modalità di lavoro concordata

- Un punto/fase alla volta, con STOP e conferma prima della fase successiva.
- Nessun commit o push eseguito dall'agente: fornire i comandi a Carlo.
- Toccare soltanto i file necessari e riportare output reali; se un comando non viene eseguito scrivere NON ESEGUITO.
- Non indebolire i test. Sono state autorizzate modifiche alle aspettative dei test quando è cambiata esplicitamente la classificazione.
- Non esplorare file non necessari di propria iniziativa. Le letture pertinenti alle attività concordate sono state autorizzate durante questa sessione; per ampliare il perimetro chiedere prima.
- Non leggere o pubblicare le chiavi in `.env`.

## Repository e ambiente

- Repository: https://github.com/carlopognant-spec/ChessProfessor ; branch locale: `main`, remote: `origin`.
- Windows / PowerShell, Vite + React, chess.js, react-chessboard. Test con Vitest.
- È stato usato Node v24.13.0. Non implica che questa sia la sola versione compatibile.
- GitHub Pages: https://carlopognant-spec.github.io/ChessProfessor/ . La workflow esistente deploya dopo un push a main.
- Le modifiche della sessione sono locali al momento della scrittura di questo handoff. Nessun commit/push dell'agente. Il file documenta lo stato dei file, non garantisce che Carlo abbia già pubblicato il commit.

## Differenze rispetto all'handoff iniziale in Downloads

Questa copia inizialmente usava delta centipawn e soglie tali che delta zero diventava Imprecisione. I matti o le valutazioni assenti producevano delta zero. `verify-stockfish.js`, i file Stockfish 19 lite-single e le fixture storiche non erano presenti. Non assumere che il fix browser Stockfish 19 sia stato implementato.

Durante la prima fase locale il worker usava Stockfish 16 dal CDN tramite Blob/Web Worker. Dopo l'integrazione remota usa gli asset locali Stockfish 19 (vedere aggiornamento sopra). I suoi test usano un worker finto. Il motore reale usato per il QA è un processo nativo separato: il successo del QA non dimostra che worker, frecce o UI browser funzionino.

## Modifiche completate

### QA e cache reali

- Script npm `qa:compare`: `scripts/qa-compare.js`.
- Adapter UCI reale: `scripts/qa/native-engine.js`.
- Funzioni pure di validazione, confronto, riepilogo e report: `scripts/qa/compare.js`.
- Cache schema 1 in `tests/fixtures/qa/analysis-cache/`: PGN, FEN prima/dopo, SAN/UCI, eval cp/mate/PV grezzi, versione motore, depth, MultiPV, prospettiva dello score e parametri di esecuzione.
- Una sessione motore nuova per partita. Cache persistenti separate dal classificatore: le metriche si ricalcolano senza avviare Stockfish.
- Stockfish 16 ufficiale Windows x64 generico in `tools/stockfish-16/stockfish/stockfish-windows-x86-64.exe`; licenza GPL, sorgenti e documentazione estratti sono inclusi. Provenienza: https://github.com/official-stockfish/Stockfish/releases/tag/sf_16 . Il port browser e il binario possono comunque dare risultati diversi.
- CLI rileva automaticamente quel percorso; `STOCKFISH_PATH` ha precedenza. Non serve impostarlo su un altro PC Windows se il percorso nel clone è conservato. Per altri sistemi fornire un binario appropriato con quella variabile.
- Produzione QA: depth 12, MultiPV 5, Threads 1, Hash 16 MB. Fallback dell'app: depth 8.
- Al primo errore di avvio/analisi reale, STOP con l'errore. Non provare varianti a catena.

### Classificazione cambiata con approvazione esplicita

File: `src/lib/classification.js`, `engineConfig.js`, `gameAnalysis.js`; etichetta Non valutabile aggiunta in `src/components/AnalysisSummary.jsx`.

- App e QA condividono `evaluationFields` e `classifyAnalysisEntries`.
- Confronto dalla prospettiva di chi muove; lo score dopo la mossa viene invertito perché Stockfish valuta dalla parte che deve muovere.
- `dropPct = max(0, 100 × (probabilità migliore − probabilità dopo la mossa))`.
- Modello già presente in `evaluation.js`: sigmoid(cp/400), con cp limitato a ±1000. Non è il modello chess.com ed è ancora provvisorio.
- Soglie massime iniziali in punti percentuali: Migliore 1, Ottima 3, Buona 5, Imprecisione 10, Errore 20; oltre 20 Errore grave. Non sono state tarate sulle partite fornite.
- Matto vincente/perdente: probabilità 1/0. Mate 0 dopo la mossa significa avversario già mattato: probabilità 1 per chi ha mosso.
- Score mancante: Non valutabile, `dropPct` e `evalDelta` nulli. Delta cp rimane solo diagnostico, nullo quando è presente un mate.
- Conservare un matto vincente o perdente dà perdita zero anche se cambia la distanza dal matto: limite noto da riesaminare.
- Geniale, Grande e Mossa mancata non vengono attualmente assegnate. Le costanti e la UI restano predisposte per queste categorie.
- Nessuna chiamata Explorer nello strumento QA. Le etichette attese Libro sono escluse. Escluse anche categorie speciali non implementate, etichette sospette, score mancanti e Forzata. Esclusioni sovrapposte contate una volta nel denominatore.

## Partite e annotazioni

### Storiche e sanity

- `game-1-chigorin-steinitz-1892.json`: 61 ply; `game-2-saintamant-staunton-1843.json`: 132 ply. Fornite da Carlo.
- `game-3-fools-mate.json`: 4 ply, separata dalle metriche aggregate e dalla taratura.
- `suspect-labels.json`: game-1 ply 37 Nxf7, attesa Errore contro commento PGN !!, esclusa in attesa di verifica di Carlo.
- Cache reali generate per tutte e tre.
- `agent-output/qa-compare-centipawn-baseline.md`: report originale, prima del cambio di logica.
- `agent-output/qa-compare.md`: report dopo il cambio: Chigorin esatta 37.5%, entro una classe 80%; Saint Amant 47.107438016528924% e 87.60330578512396%; sanity 75% e 100%. Nel report sanity f3 è Imprecisione anziché Errore, g4 è Errore grave, Qh4# è Migliore.

### Personali

- Originali in `Partite/1` … `Partite/10`: PGN e `analisi.txt`. Non modificati.
- Partite 1–6 completamente annotate: 399 ply. Importate in `tests/fixtures/qa/personal-01.json` … `personal-06.json`. Cache reali generate per tutte.
- Partite 7–10: 203 ply, ancora senza categorie, riservate alla validazione futura. Non analizzate per il confronto e non convertite in fixture annotate. Alcuni PGN contengono NAG: non sono stati scambiati per etichette complete Game Review.
- `scripts/qa-import-personal.js` e `scripts/qa/personal-import.js`: validazione/importazione ripetibile. Rifiutano SAN discordanti, categorie sconosciute o annotazioni parziali.
- Manifest e provenienza in `tests/fixtures/qa/personal-manifest.json`.
- Refusi normalizzati prima dell'uso: personal-03 ply 125 migliroe → Migliore; personal-04 ply 21 erroe → Errore; personal-04 ply 31 migliroe → Migliore. Gli originali sono preservati e le correzioni registrate nel manifest.
- ATTENZIONE futura: l'importer attuale attribuisce `development` a qualsiasi partita completamente annotata. Prima di annotare/importare 7–10, adattare selezione e ruolo per mantenere il gruppo di validazione separato. Non includerle automaticamente nella taratura tramite `--personal`.
- Report personale: `agent-output/qa-compare-personal.md`; output console completo: `qa-compare-personal-console.txt`.
- 332 ply inclusi, 67 esclusi: 39 Libro, 14 Grande, 10 Mossa mancata, 1 Geniale, 3 Forzata. Nessuna valutazione mancante.
- Esatta: 174/332 = 52.40963855421687%; entro una classe: 291/332 = 87.65060240963855%.
- Per categoria attesa: Migliore 105/122 esatte, Ottima 25/74, Buona 20/68, Imprecisione 13/33, Errore 5/27, Errore grave 6/8. Le categorie escluse non sono state nascoste dai conteggi.

## Diagnosi completata, non ancora corretta

- `scripts/qa-diagnose-errors.js`: ha rieseguito soltanto i 22 Errori discordanti a depth 18, MultiPV 5, Stockfish 16, con sessione nuova per ogni coppia di FEN. Le cache di produzione sono intatte.
- Risultati in `agent-output/qa-error-diagnostic.json` (`completed: true`) e `.md`.
- 4/22 diventano Errore, 10/22 cambiano categoria, 18/22 restano discordanti. Questo non è un test di accuratezza complessiva a depth 18 e non isola del tutto profondità e stato della hash.
- Conclusioni e fonti: `agent-output/qa-error-findings.md`.
- Il limite ±1000 rende +1000, +2000 e +4000 indistinguibili: probabilità 0.9241418199787566. Analogo limite negativo. Può produrre perdita zero anche con score molto diversi.
- La politica mate 1/0 ignora accorciamenti di matto subito e introduce discontinuità nel passaggio cp↔mate. Non cambiare soglie per mascherare questi problemi.
- La documentazione chess.com descrive punti attesi basati su eval e rating. Pubblica gli intervalli di perdita: Best 0, Excellent fino a 0.02, Good 0.02–0.05, Inaccuracy 0.05–0.10, Mistake 0.10–0.20, Blunder 0.20–1. La formula completa e le convenzioni ai confini non sono specificate in quella pagina.
- Fonte: https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc . Forza e revisione possono cambiare le etichette: https://support.chess.com/en/articles/11845102-why-did-my-move-classification-change-in-game-review . Non affermare che conosciamo il modello interno completo.

## Prossimi passi, in ordine

1. Presentare a Carlo il piano per il modello di punti attesi e la gestione di posizioni già vinte/perse e matti. Non è ancora autorizzata una nuova modifica di soglie/modello dopo la diagnosi.
2. Distinguere l'identificazione della migliore mossa tramite UCI/PV dal semplice confronto di due analisi indipendenti, soggetto a rumore. Valutare un confronto coerente della mossa giocata.
3. Allineare le categorie comuni alle definizioni pubblicate, distinguendo regole documentate e nostre approssimazioni. Rating WhiteElo/BlackElo è già nei PGN, ma non inventare coefficienti senza una base verificabile. Il modello matematico va scelto prima della taratura.
4. Implementare il piano solo dopo conferma, con test su segni, confini, matto, dati mancanti e prospettiva di entrambi i giocatori. Ricalcolare i report dalle stesse cache per confronti controllati; conservare baseline.
5. Far annotare le quattro partite 7–10 e usarle come validazione separata dopo aver fissato le regole. Adeguare prima importer/CLI perché non entrino automaticamente nel gruppo di sviluppo. Fase 2: valutare l'ipotesi "Libro fino all'ultima mossa nominata nell'ECOUrl"; previsioni registrate prima di vedere le etichette delle partite 7–9: partita 7 Libro fino al ply 2, partita 9 fino al ply 4, partita 8 non prevedibile (URL senza mosse). Punto 2 e verifica Libro chiusi: non modificare ora le regole Libro né il minimo provvisorio di 20 partite per mossa.
6. Progettare Mossa mancata, Grande e Geniale con contesto della partita e varianti reali. Le sei partite contengono 10/14/1 esempi rispettivamente; sono pochi per una validazione robusta, soprattutto Geniale.
7. Verificare nel browser l'analisi completa/import PGN, frecce, progressi, navigazione e spiegazioni legate alle PV. Segnalazione di Carlo da verificare nel collaudo browser: dopo l'import di un PGN, le frecce e le 5 mosse migliori restano ferme a quelle calcolate prima dell'import. Problema annotato, non ancora corretto. Non confondere utility CLI con funzionalità UI completate. Il codice del worker Stockfish browser 19 è arrivato dall'integrazione remota, ma non è stato collaudato nel browser in questa sessione. I moduli finali restano lavoro separato; non iniziarli senza concordare il punto.

## Trasferimento su altro PC

La nuova `.gitignore` include dati, report, cache, script, test e la distribuzione Stockfish estratta. Esclude dipendenze, build, file `.env` con credenziali, log temporanei, `.DS_Store` e lo ZIP Stockfish duplicato. `.env.example` resta incluso. Non è stato fatto staging dall'agente.

Dopo commit/push di Carlo, su un nuovo PC:

```powershell
git clone https://github.com/carlopognant-spec/ChessProfessor.git
Set-Location ChessProfessor
npm ci
npx vitest run tests/
npm run qa:compare
npm run qa:compare -- --personal
```

Per il chatbot locale creare `.env` da `.env.example` e inserire personalmente le credenziali. Le cache e i confronti QA non richiedono chiavi API. Non copiare le chiavi nell'handoff o nel commit. Per iniziare l'app: `npm run dev`.

Comandi aggiuntivi (non necessari per ricalcolare metriche già disponibili):

```powershell
node scripts/qa-import-personal.js
npm run qa:compare -- --generate
npm run qa:compare -- --personal --generate
node scripts/qa-diagnose-errors.js
```

Gli ultimi tre comandi avviano il motore reale e possono durare diversi minuti. La diagnosi sovrascrive i suoi output separati; la generazione sovrascrive le cache del gruppo scelto. Evitare rigenerazioni inutili se si vuole confrontare soltanto una nuova classificazione.

## Verifiche effettivamente eseguite

- Ultimo test prima di questo handoff: `npx vitest run tests/`, 15 file e 54 test passati. Questo controllo precede le sole modifiche documentali e alla gitignore.
- Build dopo la modifica della classificazione: `npm run build` riuscita, Vite 5.4.21, 61 moduli trasformati. Non è stata ripetuta per le sole utility diagnostiche/documentazione.
- Analisi reali storiche e personali completate; diagnosi depth 18 completata; confronto dalle cache riuscito.
- Non è stato eseguito un collaudo browser della UI durante queste fasi.
- Nessun commit/push eseguito dall'agente.

Output reale dell'ultimo test:

```text
 RUN  v2.1.9 C:/Users/carlo.pognant/Desktop/ChessProfessor

 ✓ tests/analysis-presentation.test.js (5 tests) 5ms
 ✓ tests/stockfish.test.js (2 tests) 7ms
 ✓ tests/analysis-classification.test.js (6 tests) 6ms
 ✓ tests/automatic-analysis.test.js (5 tests) 22ms
 ✓ tests/pgn-classification.test.js (6 tests) 22ms
 ✓ tests/qa-compare.test.js (6 tests) 37ms
 ✓ tests/qa-personal-import.test.js (3 tests) 41ms
 ✓ tests/game-analysis-flow.test.js (4 tests) 5ms
 ✓ tests/explorer-analysis.test.js (3 tests) 8ms
 ✓ tests/llm-critical-context.test.js (2 tests) 5ms
 ✓ tests/analysis-summary.test.js (3 tests) 9ms
 ✓ tests/fen-editor.test.js (4 tests) 8ms
 ✓ tests/position-facts.test.js (1 test) 4ms
 ✓ tests/evaluation.test.js (3 tests) 4ms
 ✓ tests/chess-smoke.test.js (1 test) 9ms

 Test Files  15 passed (15)
      Tests  54 passed (54)
   Start at  12:44:55
   Duration  1.48s (transform 297ms, setup 0ms, collect 1.08s, tests 192ms, environment 4ms, prepare 2.24s)
```
