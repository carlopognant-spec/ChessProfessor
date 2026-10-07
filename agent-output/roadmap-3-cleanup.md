# Correzioni e chiusura — 7 ottobre 2026

## Completato

- Chat: selezione dell'entry per ply, FEN dopo la mossa e cronologia completa; posizione iniziale/ramo diverso senza entry coerente non ricevono il contesto dell'ultima mossa. buildCriticalContext rifiuta anche direttamente un'entry per altra FEN.
- FEN personalizzata: numerazione dell'analisi dalla FEN prima della mossa; MoveList usa turno e contatore della FEN iniziale, anche per partenza col Nero. Nessuna modifica ai punteggi/classificazioni o alle analisi archiviate già salvate.
- Rimosso singleton analysisCache non importato, parametri fallbackDepth/explorerMinGames inutilizzati, vecchia summarizeAnalysis e parser PGN non raggiunto dall'app. I test PGN verificano ora describePgn, realmente usato dall'archivio; i test di riepilogo usano buildAnalysisSummary. Nessun dato fixture eliminato.
- Rimossi import labels/variabile score nello script searchmoves, import calculateWinProbability non usato nel test e parametro error non usato nel callback worker.
- Workflow Pages: suite unit prima della build; non eseguito deploy.
- Nuova scansione: 85 file, nessun modulo src orfano, zero gruppi esatti di funzioni duplicate. Output separato code-audit-after-cleanup.json; prima diagnosi conservata.

## Cosa resta e perché

cpToProbability/moverWinProb restano API legacy coperte da test con contratto diverso dalla sigmoid di classificazione; non unificate alterando le formule. Parsing UCI worker/native/esperimenti, replay PGN e cache sessione/TTL hanno differenze funzionali: nessuna fusione automatica. Gli export richiamati internamente non sono codice morto. Il parametro startingFen non consumato nel vecchio helper del test di simmetria è una debolezza da affrontare insieme al test già skipped, non una prova di copertura delle FEN personalizzate; nuovi test attivi coprono numerazione e lato.

Il workflow contiene variabili VITE dei provider, che finiscono nel client. Nessun valore segreto letto. Non cambiata l'architettura provider e non pubblicato nulla: spostare credenziali private richiede un backend e un progetto dedicato.

L'audit è statico e manuale, non garantisce che ogni percorso dinamico o regola CSS sia utile o privo di bug. Telefono non ritestato in questo passaggio.

## Dati chess.com e 3.3

Acquisiti i sei screenshot identificati da giocatori e numero di ply, Elo da P1–P6. Nessuna lettura di Partite/7–10. Settima immagine esclusa. Dati in chesscom-development-results.json, con metadati ignoti e Punteggi partita di P6 mancanti rappresentati come null.

Precisione large200k rispetto a chess.com, 12 valori: MAE 9,4395 punti, differenza media −3,7649, massimo 21,4584 (Nero P4), Pearson 0,8059. Risultati descrittivi su dati development dipendenti, non validazione.

**3.3 non implementato:** dieci punteggi da sei partite e un range Elo 580–791 non supportano una conversione attendibile Precisione→Elo. P3 mostra già Precisione chess.com 78,4/79,2 con Punteggi partita 700/1350: la sola Precisione non determina il livello riportato. Mancano anche impostazione della revisione e Punteggi P6, richiesti a Carlo. Nessun valore inventato o nuovo default. Grande/Geniale restano sospese per le prove mancanti documentate nel piano.

## Verifiche reali

```
npm test -- --config scripts/qa-no-env-test.config.js --cache false
Test Files 25 passed (25)
Tests 148 passed | 1 skipped | 1 todo (150)
Duration 5.73s

npm run build -- --config scripts/qa-no-env-build.config.js
73 modules transformed
built in 2.32s

npm run test:browser
15 passed (1.3m)

git diff --check
exit 0
```

Build: warning repertorio >500 kB. Git: avvisi LF→CRLF, nessun errore whitespace finale. Suite senza esclusioni aggiuntive, envDir isolato. Browser eseguito dopo le correzioni UI; successive rimozioni riguardano helper non raggiunti dall'app, verificate da suite unit e build. Gli artefatti browser tracciati sono stati ripristinati. Cache/baseline intatti, nessuna nuova analisi QA generata; nessuna lettura .env, nessun commit/push.

File nuovi di questo passaggio: agent-output/chesscom-development-results.json, agent-output/code-audit-after-cleanup.json, agent-output/roadmap-3-cleanup.md. File modificati: src/App.jsx, src/components/MoveList.jsx, src/lib/{analysisPresentation.js,gameAnalysis.js,analysisCache.js,engineConfig.js,stockfish.js,llm/criticalContext.js}, scripts/{qa-searchmoves-experiment.js,audit-code.cjs}, tests/{game-navigation.test.js,llm-critical-context.test.js,automatic-analysis.test.js,classification-win-prob.test.js,game-analysis-flow.test.js,pgn-classification.test.js}, .github/workflows/deploy.yml, HANDOFF-ChessProfessor.md, agent-output/code-audit.md. Eliminato src/lib/pgn.js. I file del passaggio precedente restano pendenti e sono elencati in roadmap-3-results.md.

Comandi di revisione per Carlo (nessun commit automatico):

```powershell
git status --short
git diff --stat
git diff --check
git diff -- src/App.jsx src/lib/analysisPresentation.js src/lib/gameAnalysis.js src/lib/llm/criticalContext.js
```

## Aggiornamento dati successivo

Carlo ha completato P6 (1550/1300) e fornito le impostazioni: Revisione Stockfish Normale ~5 s (versione non indicata), separata dall'Analisi Stockfish 19 Lite/5 s/5 linee/1 thread e dal Cloud Stockfish 18. Sono superati i riferimenti precedenti a P6 e impostazioni mancanti. Le dodici osservazioni restano un campione di sviluppo limitato; la progettazione/calibrazione offline del 3.3 rimane da completare, nessun modello adottato. Dati aggiornati in chesscom-development-results.json. Solo dati/documentazione modificati; test e build NON RIESEGUITI in questo aggiornamento.
