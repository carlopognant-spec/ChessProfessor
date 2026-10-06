# ChessProfessor: richiesta di revisione per Claude

Aggiornato: 7 ottobre 2026.

## Compito richiesto

Revisiona le modifiche implementate nell'intervallo `d25e710..4105966` (baseline: Libro locale). Il commit `4105966` contiene le modifiche da revisionare; considera separatamente gli interventi successivi nel working tree, con `git diff` e `git status --short`. Nessun commit/push viene eseguito dall'agente.

Prima presenta i problemi trovati, con gravità, file/riga, scenario riproducibile e correzione suggerita. Distingui bug, scelte di prodotto e limiti statistici. Non modificare codice o soglie prima del riscontro di Carlo. Non fare commit o push.

Leggi questo riepilogo, gli aggiornamenti finali di `HANDOFF-ChessProfessor.md` e `agent-output/missed-opportunity-policy.md`. Non leggere né creare `.env` o credenziali. Non leggere le annotazioni di Partite/7–10 né usarle per tarare. Le partite 7–9 restano riservate alla validazione indipendente; la 10 non è più cieca perché è stata usata per l'ipotesi sul Libro. Non rigenerare le cache motore per una revisione del classificatore.

## Obiettivo e stato reale

Alternativa gratuita con analisi illimitate alla Game Review di chess.com, con Stockfish, categorie e spiegazioni. Non è stata raggiunta l'equivalenza con chess.com. Stack: React 19, Vite 5, chess.js, react-chessboard, Vitest e Playwright.

Il browser usa Stockfish 19 lite single via asset locali. Le cache QA provengono da Stockfish 16 nativo, depth 12, MultiPV 5, Threads 1, Hash 16 MB: non sono equivalenti al motore browser. La raccolta Libro locale era già in `d25e710`; non è stata ampliata in queste fasi.

## Modifiche da revisionare

### Valutazioni e identificazione della migliore mossa

- `src/lib/evaluation.js`: `calculateWinProbability` usa sigmoid(cp/400) senza il precedente taglio a ±1000. `cpToProbability` e `moverWinProb` mantengono i loro contratti precedenti. Verifica gli effetti della divergenza fra queste API e la saturazione numerica residua.
- `src/lib/classification.js`: `moveEvaluationFields` confronta la mossa UCI giocata con la PV principale. Quando la mossa compare nella MultiPV alla stessa profondità usa il suo score dalla ricerca iniziale; altrimenti mantiene il confronto con la posizione successiva, segnato `independent-position`.
- Una mossa diversa dalla PV principale riceve al massimo Ottima anche con perdita zero. Senza identità UCI/PV si conserva il comportamento precedente. Questa scelta non riconosce tutte le mosse equivalenti come Migliore.
- Soglie comuni invariate: 1/3/5/10/20 punti percentuali. Classificatore mate 1/0; helper remoto `moverWinProb` resta 0.99/0.01. Score mancanti: Non valutabile. Matto dato: Migliore con perdita zero.
- `src/lib/gameAnalysis.js`: ricalcola campi e contesto anche sui cache hit; cache FEN+mossa conserva solo dati della posizione/mossa.

### UI e ciclo delle ricerche UCI

- `src/App.jsx`, `components/Board.jsx`, `components/EnginePanel.jsx`, `lib/analysisPresentation.js`: dati live associati al FEN, cancellati a cambio posizione/import/reset. Nessun fallback dall'analisi dopo la mossa a quella prima. Cp e mate visualizzati normalizzati al Bianco; PV grezze preservate.
- `src/lib/stockfish.js`: una ricerca attiva e una richiesta in attesa. Nuova richiesta rifiuta la precedente, invia `stop` una sola volta, ignora i vecchi `info`, aspetta il vecchio `bestmove`, poi avvia solo l'ultima richiesta. Timeout di stop: 15 secondi, errore terminale per l'istanza. Errore worker e destroy rifiutano anche le richieste pendenti.
- Parser conserva la profondità, scarta score upperbound/lowerbound e cancella cp/mate precedente quando cambia il tipo.

Verifica soprattutto richieste prima di ready, import/reset/navigation durante ricerca, errori, teardown React StrictMode, timer e promesse pendenti. Il filtro FEN della UI da solo non impedisce l'attribuzione di output UCI vecchio a una nuova ricerca.

### Distanza del matto

- `src/lib/mateComparison.js`: informazione separata da categoria/perdita. Distingue matto anticipato, rallentato, invariato o dato.
- Confronto dalla posizione prima della mossa: root PV diretta; score vincente della posizione successiva, già invertito, aumenta di una mossa per compensare la convenzione UCI. Score perdente non aumenta. Caso chiave: M3 prima e raw −M2 dopo sono distanza invariata.
- Non confronta segni opposti, dati mancanti o origine ignota. Le analisi separate sono chiamate stime. UI, QA e contesto chatbot ricevono i metadati.

Verifica conversione UCI, segni e convenzioni terminali; nessuna penalità di distanza è stata introdotta nella classificazione.

### Prima regola per Mossa mancata

- `src/lib/missedOpportunity.js`, `engineConfig.js`: passaggio contestuale dopo le categorie comuni, condiviso da app e QA.
- Richiede errore avversario immediatamente precedente, FEN adiacenti e turni opposti, precedente categoria comune Errore/Errore grave, probabilità corrente prima dell'errore <=0.60, occasione >=0.75 confermata da entrambe le analisi e probabilità dopo la mossa <=0.60.
- Richiede mossa giocata legale e PV alternativa distinta e legale, fino a otto ply. Una PV di un solo ply vale soltanto se dà davvero matto. Libro, Non valutabile e matto dato restano protetti.
- Conserva `baseClassification` e `dropPct`. Il contesto contiene errore precedente, probabilità e alternativa UCI/SAN; non viene memorizzato nella cache FEN+mossa.
- 0.75/0.60 sono limiti locali provvisori sulla sigmoid, senza rating. Scelti dopo lettura dei dieci casi di sviluppo, senza ottimizzare la coincidenza. Non sono parametri pubblicati da chess.com né validazione indipendente.

La regola riconosce **solo 1/10 esempi attesi**: personal-01 ply 35 Bc3 dopo Qxd4. Cinque falliscono la conferma dell'occasione e quattro il requisito dell'errore precedente secondo il modello locale. Non modificare i limiti per nascondere queste discrepanze: valutane prima le cause.

### QA e spiegazioni

- `scripts/qa/compare.js`, `scripts/qa-compare.js`: contesto elaborato in ordine dei ply, indipendentemente dall'ordine delle annotazioni. Repertorio locale usato per proteggere il contesto Libro; etichette attese Libro ancora escluse dal confronto.
- Mossa mancata ora inclusa nel confronto esatto. Grande e Geniale ancora escluse. Entro una classe usa soltanto categorie comuni attese: Mossa mancata non ha distanza ordinale.
- Personali: totale corrente **174/342 = 50.8772%**, inclusa Mossa mancata. Per confrontare l'intero intervallo revisionato usa le sole categorie comuni: **prima 174/332 esatte e 291/332 entro una classe; ora 173/332 e 300/332**. Non sono invariate; erano rimaste invariate soltanto rispetto alla fase immediatamente precedente all'introduzione di Mossa mancata. Storiche correnti: 82/161 esatte e 139/161 entro una classe.
- Baseline nei report `agent-output/*before-*`; report correnti e console preservati. Controlla denominatori, esclusioni sovrapposte, falsi positivi e separazione fra dati grezzi e contesto.
- `src/lib/llm/criticalContext.js` e `systemPrompt.js`: includono matti e occasione nel messaggio effettivamente serializzato. Nessuna API LLM chiamata durante queste fasi; qualità delle spiegazioni ancora da collaudare.

## Verifiche già eseguite

```powershell
npm test
npm run build
npm run test:browser
npm run qa:compare
npm run qa:compare -- --personal
git diff --check
```

- Unitari: 19 file, **115 passati, 1 skipped e 1 todo**, 117 totali. I due placeholder Mossa mancata sono stati sostituiti dalla copertura eseguita dei nuovi test; nessun test reale rimosso. Restano skip mirrored preesistente e todo Grande/Geniale.
- Build: 66 moduli, riuscita. Avviso chunk Libro circa 982 kB invariato.
- Browser: **5 passati**, 27.3 s. Stockfish 19 reale per import/navigazione/reset, cambio rapido e matto finale; worker simulati per ritardi, concorrenza deterministica e UI Mossa mancata. Explorer simulato. Non equivale a validazione completa delle classificazioni browser.
- Playwright usa Edge headless già installato; `PLAYWRIGHT_CHANNEL` può scegliere un altro canale installato. Vitest raccoglie `tests/**/*.test.js`; Playwright ha un runner separato.
- Installazione segnalava 7 vulnerabilità npm già note; nessun audit fix eseguito.

## Risultato atteso della revisione

Elenco ordinato per gravità dei bug e delle lacune, con prove e riferimenti precisi. Indica anche eventuali disaccordi sulle scelte matematiche e di categoria, senza presentarli come difetti dimostrati. Proponi il prossimo intervento verificabile. Grande/Geniale, modello dipendente dal rating e validazione indipendente restano lavoro successivo.

## Prossimi passi dopo la revisione

- Procedere un punto alla volta con STOP e riepilogo. B1 completato: documentati fallbackDepth ed explorerMinGames come inutilizzati; explorerThreshold è attivo e non decide Libro. B2 aggiorna soltanto documentazione; B3 affronterà gli errori terminali del motore con un worker finto. Nessun cambio a modello, soglie, Libro, Mossa mancata o categorie autorizzato.
- Grande/Geniale e modello dipendente dal rating: progettazione separata, distinguendo documentazione chess.com e approssimazioni locali, senza inventare coefficienti.
- Validazione indipendente sulle partite 7–9 dopo aver fissato le regole; tenere la 10 fuori dal gruppo cieco e adattare importer/CLI prima dell'importazione.
- Collaudare le spiegazioni LLM: la serializzazione è testata, la qualità delle risposte dei provider non è stata verificata.
- Valutare le 7 vulnerabilità npm segnalate dall'installazione precedente; audit aggiornato NON ESEGUITO in B2. Le credenziali VITE_* usate nel client entrano nel bundle pubblico: serve un proxy lato server per conservare le chiavi. Non leggere .env né pubblicare credenziali.
- Esiti e agenda delle Fasi A/B/C, inclusi B4 searchmoves, C7 esperimento separato e C8 ipotesi sui matti mancati, sono registrati nell'handoff. B4 è solo progettazione; nessuna implementazione o nuova cache autorizzata.
