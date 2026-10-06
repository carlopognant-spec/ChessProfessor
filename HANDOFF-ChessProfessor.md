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

Risultati personali: 1/10 Mossa mancata riconosciute, personal-01 ply 35 Bc3 dopo Qxd4. Cinque esempi senza conferma dell'occasione vincente e quattro senza errore avversario riconosciuto; ogni caso e primo motivo di rifiuto nei report. Non sono state cambiate ulteriormente le regole per recuperare i nove discordanti. Totale nuovo: 174/342 esatte = 50.87719298245614%, 57 esclusioni; non confrontare direttamente col vecchio 173/332. Categorie comuni invariate: 173/332 = 52.10843373493976%, entro una classe 300/332 = 90.36144578313252%. Storiche invariate: 82/161 = 50.93167701863354% e 139/161 = 86.33540372670808%. Baseline preservate in agent-output/qa-compare-before-missed-opportunity.md e qa-compare-personal-before-missed-opportunity.md. Partite 7–10 non lette e non usate.

Verifiche finali: npm test riuscito, 19 file, 115 passati, 1 skipped e 1 todo (117 totali). Otto test contestuali nuovi, regressione QA sul denominatore e serializzazione LLM aggiornata. Due vecchi placeholder todo Mossa mancata rimossi perché coperti dai nuovi test eseguiti; nessun test reale rimosso o nuovo skip. Resta todo Grande/Geniale e skip mirrored già esistente. Build riuscita: 66 moduli, avviso chunk Libro invariato. git diff --check senza errori.

Browser finale: 5 passati in 27.3 s, console in agent-output/browser-missed-console.txt. Restano i test reali Stockfish 19 e concorrenza; il quinto, con worker simulato, verifica etichetta e alternativa SAN dopo un errore fuori Libro. Il primo input sintetico 1.f3 e5 ha fallito l'aspettativa perché quelle posizioni sono nel repertorio locale (Book protegge la classificazione): corretto il PGN del test a 1.e4 e5 2.a3 a6 3.f3 d6, dopo il primo scarto; protezione Libro mantenuta. Nuovo test browser non dimostra accuratezza del riconoscimento con il motore reale, verificata qui sulle cache Stockfish 16. Artefatti test-results tracciati ripristinati.

Fase completata come prima regola esplicita, non equivalenza con Game Review: copertura ancora 1/10, rating assente e probabilità/ricerche approssimate. Prossimo punto suggerito: affrontare il modello di punti attesi e la sensibilità delle nove discrepanze prima di aggiungere Grande/Geniale o tarare soglie. Nessun commit/push dell'agente.
