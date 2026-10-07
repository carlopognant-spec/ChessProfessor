# ChessProfessor — stato e prosecuzione

Aggiornato: 7 ottobre 2026. Leggere questo file prima di proseguire su un altro PC. Le sezioni finali Esiti Fase A e Agenda Fase 1ter prevalgono sui riferimenti storici ai prossimi passi.

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
- Partite 7–10: 203 ply, non convertite in fixture annotate per il confronto. Le annotazioni 7–10 non vanno lette. Solo 7–9 restano riservate alla validazione indipendente: la 10 non è più cieca, essendo stata usata per l'ipotesi sul Libro. Alcuni PGN contengono NAG: non sono stati scambiati per etichette complete Game Review.
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
5. Validare sulle partite 7–9 dopo aver fissato le regole; la 10 non è più cieca perché usata per l'ipotesi sul Libro. Adeguare prima importer/CLI perché il gruppo di validazione non entri automaticamente nello sviluppo. Previsioni ECOUrl conservate: partita 7 fino al ply 2, partita 9 fino al ply 4, partita 8 non prevedibile. Non leggere ora le annotazioni 7–10 e non modificare Libro. explorerMinGames non è utilizzato; explorerThreshold interrompe le richieste Explorer e non classifica Libro.
6. Progettare Grande e Geniale e il modello dipendente dal rating, senza inventare coefficienti. Mossa mancata è già implementata, ma copre solo 1/10 casi attesi. Le personali contengono 10/14/1 esempi di Mossa mancata/Grande/Geniale: campione di sviluppo, non validazione indipendente.
7. Verificare nel browser l'analisi completa/import PGN, frecce, progressi, navigazione e spiegazioni legate alle PV. Segnalazione di Carlo da verificare nel collaudo browser: dopo l'import di un PGN, le frecce e le 5 mosse migliori restano ferme a quelle calcolate prima dell'import. Problema annotato, non ancora corretto. Non confondere utility CLI con funzionalità UI completate. Il codice del worker Stockfish browser 19 è arrivato dall'integrazione remota, ma non è stato collaudato nel browser in questa sessione. I moduli finali restano lavoro separato; non iniziarli senza concordare il punto.

8. Collaudare le spiegazioni LLM con i provider: i test della serializzazione non dimostrano la qualità delle risposte. Nessuna API chiamata in questa fase.
9. Valutare le 7 vulnerabilità npm segnalate in precedenza (audit aggiornato NON ESEGUITO in B2). Le chiavi VITE_* usate dai provider e da Explorer nel client sono incluse nel bundle pubblico quando configurate: serve un proxy lato server per conservarle. Non leggere né creare .env.

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

## Aggiornamento: verifica dello stato e ripresa del 6 ottobre 2026

Questo aggiornamento prevale sui riferimenti precedenti a modifiche non committate e rebase da completare. Alla ripresa: branch main, working tree pulito, HEAD d25e710 (Libro locale); commit precedente 073efae (cache distinta per FEN+mossa). Nessun rebase in corso rilevato; pubblicazione e allineamento remoto NON VERIFICATI. Il file handoff è incluso nell'ultimo commit locale.

Carlo ha autorizzato la ripresa e la scelta del punto da affrontare. Prima fase scelta: eliminare la saturazione a ±1000 cp nella funzione calculateWinProbability usata dal classificatore, mantenendo sigmoid(cp/400), soglie attuali, Libro e politica mate 1/0. cpToProbability e moverWinProb mantengono il loro contratto precedente. È una nostra approssimazione, non il modello interno di chess.com. Baseline preservate in agent-output/qa-compare-before-continuous-model.md e qa-compare-personal-before-continuous-model.md. Verifiche della fase in corso; risultati da aggiungere a conclusione.

Esito prima fase: npx vitest run tests/ riuscito, 17 file, 81 test passati, 1 skipped e 3 todo (85 totali); aggiunti due test su perdita oltre ±1000 e simmetria/prospettiva. Build riuscita (64 moduli), permane l'avviso sul chunk repertorio da 982 kB. npm test fallisce invece perché raccoglie anche playwright-check.spec.js nella radice e @playwright/test non è installato: problema preesistente, non corretto in questa fase. Collaudo browser NON ESEGUITO.

Confronti QA dalle stesse cache riusciti, nessuna rigenerazione motore. Storiche aggregate: esatta 44.72049689440994%, entro una classe 85.71428571428571%, invariate. Personali: esatta 174/332 = 52.40963855421687%, invariata; entro una classe 292/332 = 87.95180722891567% (prima 291/332). I report correnti e la loro descrizione del modello sono aggiornati; baseline preservate nei file before-continuous-model. Nessuna soglia modificata. Il risultato non dimostra equivalenza con chess.com. La sigmoid continua comunque a saturare numericamente per valori estremi: rimuove il taglio esplicito, non ogni limite della rappresentazione.

Prossimo punto: riconoscimento della migliore mossa con UCI/PV e confronto coerente della mossa giocata, prima di modificare le soglie. Restano da progettare i metadati sulla distanza del matto. Nessun commit/push eseguito dall'agente.

## Aggiornamento: confronto UCI/PV del 6 ottobre 2026

Completata la fase autorizzata con «continua». App e QA condividono moveEvaluationFields: identificano playedUci e bestUci dalla PV principale, usano la valutazione della mossa giocata nella ricerca MultiPV iniziale quando presente a pari profondità. Per la PV principale il confronto usa lo stesso score e dà perdita zero. Per mosse fuori MultiPV o varianti a profondità diversa resta il confronto della posizione successiva, marcato independent-position. I risultati conservano evaluationSource e isEngineBest; i report riportano i conteggi per fonte. I risultati motore grezzi e le cache restano intatti; app ricalcola i campi anche sui cache hit. Promozioni incluse nell'identità UCI.

Regola locale esplicita: quando UCI/PV indicano che è stata giocata una mossa diversa dalla principale, la categoria massima è Ottima, anche con perdita nulla o entro la vecchia soglia Migliore. Matto dato e Libro conservano priorità. Senza identità disponibile si mantiene il comportamento precedente; score mancanti rimangono Non valutabile. Soglie numeriche, modello cp e politica mate 1/0 invariati. Questa regola sceglie la PV principale, non riconosce tutte le mosse equivalenti come Migliore; non è una replica documentata di chess.com.

Parser browser: conserva depth per le PV, ignora upperbound/lowerbound, cancella score mate/cp precedente quando cambia il tipo. Dati legacy senza depth accettati se entrambe le varianti non lo hanno; pari profondità e stessa ricerca riducono incoerenze ma non garantiscono assenza di rumore. Nessuna ricerca UCI searchmoves aggiunta per le mosse fuori dalle cinque PV. Utility diagnostica storica qa-diagnose-errors.js conserva il suo confronto precedente: non è stata rieseguita e non rappresenta questa fase.

Baseline della fase precedente preservate: agent-output/qa-compare-before-root-pv.md e qa-compare-personal-before-root-pv.md. Report correnti ricalcolati dalle stesse cache Stockfish 16 depth 12, senza rigenerazione: storiche aggregate esatta 82/161 = 50.93167701863354% (prima 44.72049689440994%), entro una classe 139/161 = 86.33540372670808% (prima 85.71428571428571%). Personali esatta 173/332 = 52.10843373493976% (prima 174/332), entro una classe 300/332 = 90.36144578313252% (prima 292/332). Non è una validazione indipendente né prova di equivalenza.

Verifiche: suite tests/ completa con 17 file e 84 passati, 1 skipped, 3 todo; dopo gli ultimi due test aggiunti, controlli mirati stockfish/classification (16 passati, 1 todo) e QA (7 passati) riusciti. Build riuscita, 64 moduli, avviso chunk Libro invariato. git diff --check senza errori. Collaudo browser NON ESEGUITO. Nessun commit/push dell'agente. Prossima fase da concordare: collaudo/fix delle frecce dopo import PGN oppure gestione esplicita della distanza del matto; evitare di cambiare più politiche contemporaneamente.

## Aggiornamento: fix e collaudo frecce dopo import PGN, 6 ottobre 2026

Completata la fase UI autorizzata con «puoi continusre». Individuato il fallback senza verifica FEN in Board: dopo import mostrava engineData della posizione precedente durante l'analisi della nuova partita. Ora i risultati pubblicati da EnginePanel portano il FEN sorgente, vengono applicati soltanto se ancora corrente e sono cancellati al cambio di posizione, import e reset. A ogni nuovo ciclo sono azzerati anche i riferimenti alle analisi precedenti e gli errori. resolveEngineForFen accetta dati live soltanto per FEN corrispondente; se manca playedEngine non ripiega più sull'engine prima della mossa. Il valore cp/mate mostrato viene normalizzato al Bianco usando il turno del FEN sorgente; le PV rimangono grezze. Soglie/modello/Libro invariati.

Installata @playwright/test come dipendenza di sviluppo con lockfile aggiornato; aggiunto playwright.config.js e script npm run test:browser. Browser predefinito Edge headless (già installato su questo PC); PLAYWRIGHT_CHANNEL consente scegliere un altro canale installato. Il server Vite locale viene avviato e chiuso da Playwright sulla porta 4173. npm test ora include soltanto tests/**/*.test.js: il file Playwright viene eseguito con il suo runner, non saltato. Artefatti test-results già tracciati ripristinati al contenuto precedente dopo il collaudo.

Collaudo ESEGUITO: npm run test:browser, 2 test passati in 16.5 s. Test reale: caricamento WASM Stockfish 19 locale, cinque frecce iniziali, mossa manuale e4, import PGN 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6, navigazione sinistra/destra e reset. Verificata legalità delle frecce con chess.js sul FEN visualizzato; nessun pageerror. Test ritardato con worker finto: vecchie frecce assenti mentre si aspetta la nuova analisi dopo import, nuove frecce legali all'arrivo. Explorer simulato nei test per isolare la UI/motore; chatbot/API esterne non collaudati. Non è una prova su tutte le partite, né su import ripetuti rapidamente durante una ricerca ancora attiva. Non è un controllo dell'esattezza delle classificazioni del motore browser contro le cache Stockfish 16.

Verifiche: npm test riuscito, 17 file, 87 passati, 1 skipped, 3 todo (91 totali). Build finale riuscita (64 moduli), avviso chunk Libro invariato. git diff --check senza errori. npm install segnala ancora le 7 vulnerabilità già note; nessun audit fix eseguito. Nessun commit/push dell'agente.

Prossimo punto suggerito: gestione esplicita della distanza del matto e delle categorie nelle posizioni già vinte/perse. Anche la cancellazione/sovrapposizione di richieste UCI durante import molto rapidi merita una fase dedicata: il presente fix impedisce il fallback a dati UI obsoleti, ma non certifica tutti i casi di concorrenza del worker.

## Aggiornamento: richieste UCI concorrenti, 6 ottobre 2026

Completata la fase autorizzata con «prosegui». Riprodotto prima del fix con test deterministico: tre analyze ravvicinati inviavano tre go prima che la prima ricerca restituisse bestmove. Il nuovo callback poteva leggere lo score/bestmove vecchio come risposta della nuova richiesta, nonostante il filtro FEN della UI.

StockfishEngine ora mantiene una ricerca attiva e una sola richiesta in attesa. Una nuova richiesta rifiuta la precedente con analysis superseded, invia stop una volta e ignora gli info della ricerca interrotta. Il vecchio bestmove chiude soltanto quella ricerca; solo allora partono setoption/position/go dell'ultima richiesta. Le richieste intermedie sono scartate anche durante inizializzazione. Se bestmove non arriva entro 15 secondi da stop, le richieste vengono rifiutate con errore esplicito e l'istanza non accetta nuove analisi. Errori worker e destroy chiudono anche le richieste in attesa; destroy usa AbortError e cancella i timer. Nessuna modifica a classificazione, soglie, modello, Libro, cache o adapter QA nativo.

Verifiche: il test di regressione prima fallisce (tre go invece di uno), dopo passa. npm test: 17 file, 91 test passati, 1 skipped e 3 todo (95 totali). Aggiunti quattro test per drain/sostituzione, inizializzazione, timeout di stop, errore/destroy. Build riuscita, 64 moduli; avviso chunk Libro invariato. git diff --check senza errori.

npm run test:browser: 3 passati in 23.0 s su Edge headless. Test con Stockfish 19 reale ampliato: durante l'analisi di un nuovo PGN d4/d5/... viene importato 1.c4; analisi completata, cinque frecce legali nella posizione finale, nessun pageerror. La conta dei go prova che la prima analisi era stata avviata, ma non garantisce che fosse ancora attiva al momento del secondo click: il caso di sovrapposizione è coperto deterministicamente dal terzo test con worker ritardato. Quest'ultimo rifiuta position/go durante una ricerca attiva, emette ancora uno score vecchio prima del bestmove di stop e verifica import rapido, reset durante analisi e legalità delle frecce. Explorer simulato; nessun test chatbot/API esterne. Artefatti test-results già tracciati ripristinati dopo esecuzione. QA cache/report non rieseguiti perché la fase riguarda soltanto il worker browser.

Restano da progettare distanza del matto e categorie speciali; prossima fase suggerita: rendere esplicita la differenza tra perdita di risultato e matto accelerato/rallentato, mantenendo verificabili le scelte. Nessun commit/push dell'agente.

## Aggiornamento: distanza del matto e resoconto, 6 ottobre 2026

Completata la fase autorizzata con «continua». Aggiunto src/lib/mateComparison.js: metadati mateComparison separati dalla perdita percentuale e dalla categoria, condivisi da app e QA. Distingue matto vincente/subito anticipato, rallentato o invariato e matto dato. Non confronta score assenti, non interi, segni opposti o origine non nota. Il confronto parte dalla posizione prima della mossa: root-pv confronta direttamente le distanze; independent-position aggiunge una mossa alla distanza vincente invertita del child, mentre la distanza perdente rimane invariata. Esempio: bestMate +3 e child raw -2 rappresentano distanza invariata, non matto accelerato. Score grezzi immutati. Fonte primaria della convenzione: https://github.com/official-stockfish/Stockfish/blob/sf_16/src/uci.cpp (conversione UCI dei mate), verificata anche nella distribuzione locale src/uci.cpp. Le distanze da analisi separate vengono esplicitamente chiamate stime.

AnalysisSummary mostra i matti al posto di Eval n/d e una nota sulla variazione di distanza; il titolo della nota specifica la posizione di confronto. EnginePanel mostra Scacco matto invece di Matto in 0. Report QA aggiunge una tabella separata per le osservazioni sui matti: personal-04 ply 50 Ne2 riporta matto subito 6 → 3, anticipato, stime da analisi separate. buildCriticalContext e il messaggio realmente serializzato per il chatbot includono bestMate, playedMate e mateComparison; istruzioni al modello vietano di trasformare la distanza in percentuale o nuova categoria. Nessuna chiamata API/LLM eseguita.

Soglie, categorie, probabilità mate 1/0, Libro e cache motore invariati. QA ricalcolato dalle stesse cache, senza avviare il motore nativo: storiche esatta 50.93167701863354%, entro una classe 86.33540372670808%; personali 52.10843373493976% e 90.36144578313252%, tutte invariate. Il presente intervento rende visibile la distanza; non penalizza un matto subito accelerato con Errore/Errore grave, non corregge il modello cp↔mate e non replica la politica interna chess.com.

Verifiche: suite completa npm test, 18 file, 104 passati, 1 skipped, 3 todo (108 totali). Dopo due ulteriori test QA/serializzazione, controllo mirato riuscito (11 passati), per 106 test unici passati complessivamente; la suite completa non è stata ripetuta dopo queste ultime aggiunte. Tredici test nuovi sulla distanza coprono root/child, segni, offset di una mossa, entrambe le parti, dati mancanti, matto dato e formattazione. Build finale riuscita, 65 moduli, avviso chunk Libro invariato.

Browser: npm run test:browser, 4 passati in 25.8 s. Aggiunto test reale Stockfish 19 sul PGN 1.f3 e5 2.g4 Qh4# 0-1: ultima mossa Migliore, Matto dato senza Eval n/d, pannello Scacco matto. Restano i tre test import/navigazione/reset/concorrenza. Explorer simulato. Ultime modifiche dopo browser: solo tooltip di riferimento e serializzazione/prompt chatbot, verificati con build e test mirati; il browser non è stato ripetuto per queste modifiche. Artefatti test-results tracciati ripristinati. Nessun commit/push dell'agente.

Prossimo punto da concordare: scegliere se intervenire sul modello di punti attesi (restano limiti cp↔mate e assenza del rating), oppure avviare la progettazione di Mossa mancata con contesto dell'errore precedente e PV reali. Non usare Partite/7–10 per tarare; rimangono riservate alla validazione. Lo stato corrente è una baseline verificata, non equivalenza con Game Review.

## Aggiornamento: prima implementazione Mossa mancata, 7 ottobre 2026

Fase autorizzata con «allora proseguiamo» dopo la proposta esplicita di affrontare Mossa mancata. Implementata in src/lib/missedOpportunity.js e collegata ad analyzeGame e al confronto QA. Regola e limiti documentati in agent-output/missed-opportunity-policy.md, con fonte ufficiale chess.com e distinzione tra definizione pubblica e approssimazione locale.

Criteri: avversario immediatamente precedente (FEN adiacenti e turni opposti), sua categoria comune Errore/Errore grave, probabilità dalla prospettiva corrente prima dell'errore <=0.60, opportunità dopo errore >=0.75 confermata sia dallo score precedente invertito sia dall'analisi corrente, probabilità dopo la mossa giocata <=0.60. Mossa giocata legale e PV principale alternativa legale (fino a 8 ply), almeno 2 ply salvo matto effettivamente dato dalla PV di un solo ply. Libro, Non valutabile e matto dato protetti; predecessore Libro non avvia il riconoscimento. Nessun coefficiente dipendente dal rating inventato.

I limiti 0.75/0.60 sono provvisori sulla sigmoid locale. Scelti dopo lettura dei dieci esempi di sviluppo, senza ottimizzare per farli coincidere; NON validazione indipendente. Le soglie delle categorie comuni non sono cambiate. La categoria comune resta in baseClassification, dropPct invariato. Il contesto missedOpportunity contiene errore avversario, probabilità e alternativa UCI/SAN; il resoconto lo mostra e il chatbot lo riceve nel messaggio serializzato. Nessuna chiamata ai provider LLM eseguita. I metadati contestuali si ricalcolano sui cache hit, non entrano nella cache FEN+mossa.

QA: cache motore intatte, nessuna nuova analisi nativa. CLI legge anche il repertorio locale per proteggere il contesto Libro come nell'app, senza Explorer e senza derivare flag dalle etichette attese. Le etichette attese Libro restano escluse: non è stato cambiato il confronto per validare Libro. Rimosso Mossa mancata dalle categorie non implementate; rimangono Geniale e Grande. La metrica entro una classe usa soltanto le categorie comuni attese: nessuna distanza ordinale assegnata a Mossa mancata. I report mostrano categoria comune e denominatore separato.

Risultati personali: 1/10 Mossa mancata riconosciute, personal-01 ply 35 Bc3 dopo Qxd4. Cinque esempi senza conferma dell'occasione vincente e quattro senza errore avversario riconosciuto; ogni caso e primo motivo di rifiuto nei report. Non sono state cambiate ulteriormente le regole per recuperare i nove discordanti. Totale nuovo: 174/342 esatte = 50.87719298245614%, 57 esclusioni; non confrontare direttamente col vecchio 173/332. Categorie comuni rispetto alla fase immediatamente precedente: 173/332 = 52.10843373493976%, entro una classe 300/332 = 90.36144578313252%. Rispetto a d25e710 sono cambiate: prima 174/332 esatte e 291/332 entro una classe, ora 173/332 e 300/332. Storiche invariate: 82/161 = 50.93167701863354% e 139/161 = 86.33540372670808%. Baseline preservate in agent-output/qa-compare-before-missed-opportunity.md e qa-compare-personal-before-missed-opportunity.md. Partite 7–10 non lette e non usate.

Verifiche finali: npm test riuscito, 19 file, 115 passati, 1 skipped e 1 todo (117 totali). Otto test contestuali nuovi, regressione QA sul denominatore e serializzazione LLM aggiornata. Due vecchi placeholder todo Mossa mancata rimossi perché coperti dai nuovi test eseguiti; nessun test reale rimosso o nuovo skip. Resta todo Grande/Geniale e skip mirrored già esistente. Build riuscita: 66 moduli, avviso chunk Libro invariato. git diff --check senza errori.

Browser finale: 5 passati in 27.3 s, console in agent-output/browser-missed-console.txt. Restano i test reali Stockfish 19 e concorrenza; il quinto, con worker simulato, verifica etichetta e alternativa SAN dopo un errore fuori Libro. Il primo input sintetico 1.f3 e5 ha fallito l'aspettativa perché quelle posizioni sono nel repertorio locale (Book protegge la classificazione): corretto il PGN del test a 1.e4 e5 2.a3 a6 3.f3 d6, dopo il primo scarto; protezione Libro mantenuta. Nuovo test browser non dimostra accuratezza del riconoscimento con il motore reale, verificata qui sulle cache Stockfish 16. Artefatti test-results tracciati ripristinati.

Fase completata come prima regola esplicita, non equivalenza con Game Review: copertura ancora 1/10, rating assente e probabilità/ricerche approssimate. Prossimo punto suggerito: affrontare il modello di punti attesi e la sensibilità delle nove discrepanze prima di aggiungere Grande/Geniale o tarare soglie. Nessun commit/push dell'agente.

## Esiti Fase A

Fase A accettata da Carlo. Misurazione offline dalle cache esistenti di P1–P6 e delle due storiche, senza modifiche al codice, rigenerazioni motore o lettura delle annotazioni 7–10. Baseline revisionata: d25e710..4105966. Nessun cambio di modello deciso.

- Il clamp ±1000 applicato soltanto nel classificatore cambia 10/342 ply inclusi delle personali, con effetto misto: esatte 174/342 → 175/342 (50,88% → 51,17%); entro una classe 300/332 → 303/332 (90,36% → 91,27%). Sulle sole categorie comuni: 173/332 → 174/332 esatte. Nessun cambio nelle storiche: 82/161 esatte e 139/161 entro una classe. Questo confronto mantiene tutte le altre regole attuali, quindi non ricostruisce integralmente d25e710.
- Correzione della dicitura «categorie comuni invariate»: nell'intero intervallo revisionato erano 174/332 esatte e 291/332 entro una classe; ora sono 173/332 e 300/332. L'invarianza citata nell'aggiornamento Mossa mancata riguarda soltanto la fase immediatamente precedente, non l'intera revisione.
- Personali per evaluationSource: root-pv 124/241 esatte = 51,45%, 215/235 entro una classe = 91,49%; independent-position 47/98 = 47,96%, 82/94 = 87,23%; checkmate 3/3 per entrambe. Denominatori distinti perché Mossa mancata non ha distanza ordinale.
- Condizione isEngineBest=false con dropPct<=1: 92 mosse personali, 83 incluse nelle metriche; comprende un matto dato, per cui prevale la gestione del matto sul cap a Ottima. Storiche: 30 mosse, 25 incluse.
- Mossa mancata: 1/10 attese riconosciuta, 0 falsi positivi, 9 falsi negativi. Cinque senza conferma dell'occasione; quattro senza errore precedente riconosciuto. Precisazione: NON sono quattro posizioni già circa al 100%. P2 ply 51 e 69 erano al 100%; P3 ply 94 al 99,99207243%; P3 ply 44 era al 77,81641849% prima e 86,87555306% dopo. La mossa giocata in quest'ultimo caso conserva 66,76332571%.
- Due matti mancati con etichetta attesa Mossa mancata: P2 ply 51 Qxf7+, bestMate +8 e playedEval +718 cp (85,75391978%); P2 ply 69 Ra6+, bestMate +1 e playedEval +811 cp (88,36543009%). Entrambi sono classificati Errore, senza errore avversario precedente riconosciuto. Nessuna nuova soglia dedotta.
- A4: dieci casi matto/cp nelle personali e uno nel controllo del matto del principiante, nessuno nelle due storiche.
- A5: 798 richieste di analisi memorizzate nelle sei personali; 393 FEN analizzate due volte. Differenza assoluta media fra playedEngine(n) ed engine(n+1) della stessa FEN: 32,74 cp su 349 coppie cp/cp; massimo 2440 cp (P3, ply 88 → 89). Altre coppie: 39 matto/matto e 5 matto/cp. Baseline e cache intatte.

Verifiche Fase A eseguite: npm test, 19 file passati, 115 test passati, 1 skipped e 1 todo (117 totali), 16,29 s; npm run build, 66 moduli, 2,72 s, warning chunk >500 kB; git diff --check exit 0. Nessun file modificato, commit o push. Browser NON ESEGUITO nella Fase A.

## Agenda Fase 1ter

Regole correnti: un punto alla volta con STOP e riepilogo; npm test, npm run build e git diff --check reali dopo ciascun punto B. Nessun commit/push dell'agente: fornire i comandi a Carlo. Non indebolire i test, toccare solo i file necessari, non leggere né creare .env, non leggere annotazioni Partite/7–10, non rigenerare cache. Modello, soglie, Libro, Mossa mancata e categorie non vanno modificati senza autorizzazione esplicita.

### Fase B — correzioni sicure

- B1 completato: ricerca rg in src/scripts/tests; fallbackDepth ed explorerMinGames compaiono solo nella dichiarazione e sono documentati come inutilizzati. explorerThreshold è attivo in gameAnalysis.js per interrompere Explorer, non per Libro. Modificati solo commenti in engineConfig.js. Verifiche: npm test 19 file, 115 passati, 1 skipped, 1 todo, 16,33 s; build 66 moduli, 2,91 s; git diff --check exit 0, avviso LF/CRLF.
- B2: correggere HANDOFF e REVIEW-FOR-CLAUDE, registrare Esiti Fase A e i prossimi passi. Solo documentazione. B1, B2 e B3 autorizzati da Carlo, con STOP dopo ciascuno.
- B3: gestire _fail terminale (stop non onorato entro 15 s o errore worker) ricreando il motore oppure mostrando un messaggio chiaro in EnginePanel; aggiungere un test con worker finto. Ancora da eseguire.
- B4, solo progettazione: descrivere go depth N searchmoves <mossa giocata> dalla FEN iniziale per le mosse fuori dalla MultiPV, eliminando l'analisi della posizione dopo la mossa (analyzePlayedPosition). Coprire frecce e resolveEngineForFen per fenAfter, ultima posizione, matto/stallo, cache FEN+mossa, scripts/qa/native-engine.js con Stockfish 16 e worker Stockfish 19. Stimare numero di ricerche prima/dopo e rischi. Nessuna implementazione o generazione cache autorizzata; non confondere lo score root della mossa giocata con un'analisi completa del fenAfter.

## Esiti Libro e soglie

Risultati C4/C5 accettati da Carlo. Decisione: lasciare le soglie attuali 1/3/5/10/20 pp, il modello, Libro, Mossa mancata e il cap `isEngineBest=false -> massimo Ottima` invariati. L'evidenza iniziale di due alternative entrambe Migliore era un bug di chess.com successivamente risolto; non giustifica varianti senza cap. C9 resta sospeso.

Libro locale coincide con tutte le etichette attese Libro su P1-P6 (conteggi 7, 5, 4, 6, 8, 9). Sulle storiche scarta di due ply per partita: H1 riconosce 14 contro 12 attese, includendo ply 13 d4 e 14 Bg4; H2 riconosce 5 contro 7 attese, escludendo ply 8 Nf6 e 9 Nf3. Nella posizione dopo 1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6 4.d4 Nxe4, il repertorio riconosce gia 5.O-O e tre risposte nere (Be7, a6, Nd6), con ulteriori continuazioni; 5.d5 e 5.dxe5 non risultano Libro.

Ricalcolo offline sulle cache originali P1-P6 e H1-H2: (a) 1/3/5/10/20; (b) 1/2/5/10/20; (c) Migliore soltanto con perdita zero e identita PV1, Ottima a 2, poi 5/10/20, mantenendo l'eccezione corrente del matto dato. Tutte le altre regole e le esclusioni QA conservate. (b) e (c) coincidono su ogni categoria: cambiano 46 mosse incluse, tutte Ottima -> Buona, di cui 16 attese Buona e 15 attese Ottima. Altre sei valutazioni numeriche QA di mosse attese Libro cambiano, ma sono escluse dalle metriche e non cambiano il riconoscimento Libro. La fascia 2-3 pp non e distinguibile con affidabilita dal rumore nei confronti disponibili; non e stata dimostrata un'equivalenza statistica.

| Gruppo | Esatta (a) | Esatta (b)/(c) | Entro una classe (a) | Entro una classe (b)/(c) |
|---|---|---|---|---|
| P1-P6 | 174/342 | 177/342 | 300/332 | 299/332 |
| H1-H2 | 82/161 | 80/161 | 139/161 | 144/161 |
| Totale | 256/503 | 257/503 | 439/493 | 443/493 |

Su circa 500 mosse, esatta 256 -> 257 ed entro una classe 439 -> 443: beneficio esatto marginale e risultati misti fra gruppi. Le soglie pubblicate da chess.com appartengono a un modello a punti attesi dipendente anche dal rating, diverso dalla sigmoid locale dei cp: questo confronto sullo sviluppo non e una validazione e non autorizza modifiche alle soglie.

Rumore chess.com: Carlo riporta due esecuzioni con stesso motore e stessa depth, +0,07 contro +0,29 per la stessa mossa (scarto 0,22 pedoni = 22 cp). E un singolo esempio riferito dall'utente, non una stima di media, varianza o limite generale, e non e stato riprodotto qui. Nel precedente confronto erano state indicate impostazioni diverse (Game Review/Torch Human contro Analisi/Stockfish 19 Lite); la condizione di uguaglianza motore/depth del nuovo confronto e quella riportata nell'ultimo aggiornamento, non verificata indipendentemente.

P5 development, due Game Review con impostazioni Torch Human default e Stockfish 5 s: distanza L1 fra i conteggi 6 per il Bianco e 6 per il Nero. A totali uguali (19+18=37 mosse), almeno 12/2=6 mosse hanno etichette diverse; concordanza massima possibile 31/37=83,78%, circa 84%. E un tetto di concordanza fra queste due revisioni ricavato dai conteggi, non il tetto generale di accuratezza dell'app, ne un confronto per-ply: la concordanza reale puo essere inferiore. Entrambe distano dalla fixture P5 di 6+4=10; dall'app corrente distano rispettivamente 10+10=20 e 8+10=18. Il manifest delle etichette P1-P6 non registra motore, forza, depth o tempo di revisione.

Provenienza Libro: 12.377 sequenze complete da JeffML/eco.json, revisione 36cfd9227f553dec1d39ee20fa0775eea8f8e165 (file ecoA-E.json, licenza MIT), piu due integrazioni con fonti documentate: Berlin 4.d4 Nxe4 da chess.com e Bowdler ritardata da Wikibooks. Il generatore scripts/build-opening-book.js valida e ripercorre tutte le sequenze, raccoglie ogni posizione intermedia e deduplica per i primi quattro campi FEN; produce 15.522 posizioni. Non legge fixture, etichette o directory Partite, e non filtra le posizioni sulla base delle etichette. Tuttavia le due integrazioni furono selezionate dopo aver osservato le partite di sviluppo, come gia documentato in questo HANDOFF: la coincidenza Libro su P1-P6 non e una validazione indipendente. I test confrontano esplicitamente i flag Libro con le etichette delle fixture P1-P6; questo e uso delle etichette per regressione, distinto dalla generazione.

Diagnosi letture: tests/opening-book.test.js, test `recognizes exactly three book moves per side in game 10 even without headers or Explorer`, chiama originalPgn(10) due volte. L'helper elenca Partite/10 e legge il primo file .pgn trovato; non legge analisi.txt. Nello stesso file, it.each([1,2,3,4,5,6]) legge i PGN originali 1-6 e le relative fixture. Dalla ricerca statica nei test non risultano letture di Partite/7, /8 o /9, ne altre letture di /10. La lettura indiretta del PGN 10 nella suite completa C7 e gia stata dichiarata; nelle verifiche successive viene escluso l'intero file, senza modificare i test. Nessun file di Partite/7-10 o .env letto per questa diagnosi.

### Fase C — solo proposte, previa conferma della fase

- C1: posizioni già vinte; confronto numerico con ±1000 usando A1, senza modificare il modello.
- C2: passaggi matto → cp alto, usando i casi A4.
- C3: definizione alternativa o soglie di Mossa mancata usando A3, dichiarando la taratura sullo sviluppo e l'assenza di validazione indipendente. Rispettare prima la tabella richiesta da C8.
- C4: riconoscimento delle alternative equivalenti alla PV principale senza promuovere mosse rumorose a Migliore.
- C5: confronto offline repertorio locale/ECOUrl e ply Libro attesi/prodotti sulle sole P1–P6; non modificare Libro.
- C6: piano Grande/Geniale e modello dipendente dal rating; distinguere quanto documentato da chess.com dalle nostre approssimazioni, senza inventare coefficienti.
- C7: sviluppare l'idea B4 con piano di esperimento su P1–P6 e storiche. Eventuali nuove cache devono essere salvate in una cartella separata, con baseline intatte. Definire confronti di score, categorie, fonti, latenza e numero di ricerche, separando Stockfish 16 nativo e worker 19. L'esperimento non è autorizzato: nessuna nuova cache senza il via libera di Carlo.
- C8: verifica offline soltanto dalle cache esistenti dell'ipotesi che Mossa mancata chess.com riguardi matti forzati mancati con punteggio giocato sotto circa +9 pedoni. Elencare TUTTI i casi personali matto favorevole → cp, con partita, ply, mossa, matto disponibile, punteggio giocato e categoria attesa, inclusi i controesempi. Ipotesi da verificare, non definizione documentata: non proporre soglie prima che Carlo abbia visto la tabella. Nessuna lettura delle annotazioni 7–10.

## Roadmap 2.3 — motore unico adottato (2026-10-07)

Via libera di Carlo: Stockfish 19 large-single a 200.000 nodi, MultiPV 5, Threads 1, Hash 16 MB; pacchetto npm fissato a 19.0.0. App a nodi, defaultDepth 12 conservato per QA/cache legacy. Soglie 1/3/5/10/20, modello, Libro, cap e Mossa mancata invariati. Nessun selettore, fallback automatico al lite o Approfondisci.

Il motore parte con Avvia analisi, poi analizza automaticamente mosse/import/navigazione. Nessun worker o download motore prima dell'azione. Avviso iniziale di circa 100 MB se gli asset non sono in cache. Il plugin Vite serve il pacchetto in sviluppo ed emette JS/WASM in dist; large non aggiunto a sorgenti/public/Git. WASM 99.102.793 byte, identico al pacchetto, sotto 100 MB. Cache browser versionata limitata ai due asset, senza precache, dati partita/API o COOP/COEP. Timeout caricamento 180 s; stop resta 15 s.

Il punto 1.3 (archivio IndexedDB) non è presente nel repository. Per 2.3 predisposti metadati serializzabili in risultati/entry: schema, nome/versione/build/packageVersion, id UCI reale, budget a nodi, MultiPV, Threads, Hash e politica hash; compatibilità per riconoscere record obsoleti e namespace cache separati. Archivio locale effettivo NON ESEGUITO, da realizzare nel punto 1.3.

Riuso del ply successivo soltanto valutato, NON implementato: baseline personali, scarto medio 32,7364 cp su 349 coppie cp/cp; nella cache 2.2b large/200k, 584 coppie su P1-P6/H1-H2 hanno score e PV/depth/linee identici a hash svuotata. Proposta da approvare: riusare solo ricerca completa della stessa FEN e metadati, ricalcolando categorie/Libro/Mossa mancata. Servono iniziale e ultima posizione: 1.184 -> 600 go per 592 ply/8 partite. Stima risparmio 352,823 s di ricerca su 713,325 s; non misurato dopo implementazione, non riguarda il download.

Corretto il rendering di frecce con PV radice duplicate a budget esaurito: chiavi React univoche per linea evitano elementi della posizione precedente. Nessuna modifica ai punteggi/regole. Report completo e dati: agent-output/roadmap-2-3.md e roadmap-2-3-reuse.json.

Verifiche reali finali: npm test con config no-env, suite intera senza esclusioni, 23 file/130 passati, 1 skipped, 1 todo, 6,30 s; build 70 moduli/3,20 s, warning chunk oltre 500 kB; Playwright 10 passati (1,1 min), worker reale, cache dopo reload e riavvio offline, regressione PV duplicate. Vite preview del build verificato. git diff --check exit 0, avvisi LF/CRLF. SHA-256 invariati per 44 file QA protetti; nessuna cache/baseline rigenerata o sovrascritta, nessuna lettura .env o Partite/7-10. Telefono con nuova integrazione/cache e deploy NON ESEGUITI. Nessun commit/push. STOP.

## Roadmap 1.3 — archivio locale delle partite (2026-10-07)

Completato dopo il “prosegui” di Carlo: pannello Partite salvate con IndexedDB, salvataggio esplicito della partita e dell’analisi disponibile, elenco, apertura, rinomina, eliminazione con conferma, esportazione PGN e importazione da file PGN. Nessun server o sincronizzazione; il pannello dichiara che i dati appartengono al browser/dispositivo e possono sparire alla chiusura della modalità privata. Il PGN esportato non include l’analisi: serve a conservare la partita, che potrà essere rianalizzata.

Record: schema archivio 1, SHA-256 del PGN canonico chess.js (include header, risultato e commenti), titolo, giocatori, data/risultato PGN, data del primo inserimento nell’archivio, ultimo aggiornamento. Importare/salvare lo stesso PGN normalizzato aggiorna un solo record, conservando titolo e prima data; PGN con header/commenti diversi restano distinti. Salvare senza analisi non cancella quella esistente; una ricerca compatibile parziale non sostituisce una già più completa. La navigazione salva tutta la continuazione, non il solo prefisso mostrato. Gli originali importati conservano header/commenti; dopo una modifica delle mosse si esporta il nuovo ramo, con header e risultato aggiornato, senza i commenti del ramo originale. Gestiti anche PGN con SetUp/FEN, con analisi dalla FEN iniziale corretta.

Analisi: schema analisi 1, entry/classificazioni e risultati grezzi prima/dopo, identità del motore e budget già predisposti in 2.3. Prima di salvare/riusare si verifica la catena SAN/FEN. Un cambiamento di schema, motore/versione/build, nodi, MultiPV, Threads, Hash o politica hash rende l’analisi obsoleta; resta nel record ma non viene mostrata come corrente. La riapertura compatibile recupera categorie, punteggio e frecce della FEN mostrata, anche dell’ultima posizione, senza avviare worker/download. Avvia analisi richiede esplicitamente un nuovo calcolo; per conservarlo premere Salva partita e analisi. Il cambio di regole in futuro richiederà l’incremento di ANALYSIS_SCHEMA_VERSION; non sono state cambiate soglie, modello, Libro, cap o Mossa mancata.

Scritture atomiche: successo soltanto dopo il commit IndexedDB. Quota esaurita, accesso negato, archivio occupato o indisponibile producono messaggi e non dichiarano salvataggi inesistenti. SHA-256 usa Web Crypto: salvataggio su HTTPS/localhost, errore esplicito su origini prive di crypto.subtle. Corretto il ciclo apertura/chiusura durante StrictMode, emerso nel primo controllo browser. Dipendenza solo di sviluppo fake-indexeddb 6.2.5 per prove simulate; nessuna nuova dipendenza runtime.

Verifiche finali reali: npm test -- --config scripts/qa-no-env-test.config.js --cache false, senza esclusioni, 24 file/137 passati, 1 skipped e 1 todo (139 totali), 7,54 s; npm run build -- --config scripts/qa-no-env-build.config.js, 71 moduli/5,15 s con warning chunk oltre 500 kB; npm run test:browser, 13 passati in 1,3 min. Sette test IndexedDB simulato verificano duplicati, riapertura, schema/settings, SAN/FEN, quota, rollback, FEN custom e StrictMode; tre nuove prove browser verificano roundtrip completo, riapertura offline senza worker, obsolescenza e accesso negato. Primo giro browser: 2 falliti/11 passati, problema connessione chiusa corretto; successivo giro completo tutto superato. git diff --check exit 0 con soli avvisi LF/CRLF. SHA-256 identici per 44 file QA protetti. Cache/baseline intatti, nessuna lettura .env o Partite/7-10, nessun commit/push. Telefono, modalità privata reale e deploy NON ESEGUITI. Report e comandi: agent-output/roadmap-1-3.md. STOP.

## Roadmap 1.2 — layout minimal, alternativa A (2026-10-07)

Proposta preventiva presentata e STOP rispettato; al successivo “procedi” adottata l’alternativa A consigliata. Home con sola scacchiera/frecce, barra/valutazione e avvio motore, navigazione a quattro pulsanti e apertura Strumenti. Scacchiera centrata anche su desktop, senza colonna laterale permanente. Strumenti, inizialmente chiuso, contiene quattro sezioni native espandibili: Editor scacchiera, Partita e analisi, Aperture, Chatbot. Nella sezione partita: import PGN, resoconto, elenco mosse, undo della chat, reset e archivio locale.

I componenti non vengono smontati chiudendo le sezioni: preservate bozza PGN, messaggi/bozza chat, archivio, motore e analisi. Il pannello aperture continua a fornire il contesto come prima, anche quando nascosto. L’editor mostra la bozza ed intercetta i tocchi solo con editor e Strumenti entrambi aperti; chiudere uno dei due ripristina la posizione della partita senza applicare la bozza. Riaprendo l’editor la bozza resta presente, salvo aggiornamento della posizione effettiva, che la sincronizza come prima. Nessuna modifica a classificatore, modello, soglie, Libro, motore o budget.

Mobile: contenitore fluido, controlli a capo e campi limitati alla larghezza disponibile; navigazione e pulsanti/menu almeno 44 px. Verifica browser a 360 px: larghezza documento 360, scacchiera 326, nessun overflow orizzontale; verifica anche con tutte le sezioni aperte e desktop 1280 px. Screenshot controllato visivamente: playwright-report/layout-360.png, ignorato da Git.

Output finali reali: npm test -- --config scripts/qa-no-env-test.config.js --cache false, suite completa senza esclusioni, 24 file/137 passati, 1 skipped, 1 todo (139), 5,73 s; build no-env 71 moduli/2,31 s, warning chunk oltre 500 kB; npm run test:browser, 15 passati/1,3 min. Due nuove prove mobile/desktop controllano home chiusa, larghezza, chat e PGN conservati, editor inattivo se nascosto; prova Stockfish reale estesa per verificare resoconto/frecce e numero di go invariati dopo chiusura/riapertura. I test preesistenti aprono ora le sezioni necessarie, mantenendo tutte le precedenti verifiche. Primo giro mirato: due timeout dovuti a selettore del test che confondeva titolo e nome accessibile del pulsante; corretto, giro finale completo superato. git diff --check exit 0, soli avvisi LF/CRLF. QA: 44 hash protetti invariati, nessuna cache generata o sovrascritta; nessuna lettura .env o Partite/7-10. Artefatti test-results già tracciati ripristinati. Nessun commit/push. Telefono e deploy NON ESEGUITI. Report/file/comandi: agent-output/roadmap-1-2.md. STOP. Prossima fase, solo dopo via libera: 3.1 piano documentato delle categorie speciali, prima di qualsiasi implementazione.
