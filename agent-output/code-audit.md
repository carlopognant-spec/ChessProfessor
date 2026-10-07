# Audit del codice — 7 ottobre 2026

Diagnosi, nessuna rimozione automatica. Analisi AST/import di 86 file first-party JS/JSX/CJS; revisione manuale dei punti sotto e del workflow Pages. Dati, vendor, .env e Partite/7–10 esclusi. Risultato macchina: code-audit-static.json. Nessun clone esatto di funzione sostanziale rilevato; questo NON esclude duplicazione semantica, CSS inutilizzato o percorsi dinamici.

## Problemi da affrontare

1. **Chat e navigazione:** src/App.jsx passa sempre `analysisEntries.at(-1)`. Aprendo un'analisi completa e tornando a un ply precedente, la chat riceve l'ultima entry mentre FEN e cronologia sono quelle correnti. criticalContext.js non controlla questa corrispondenza e combina PV/categoria dell'ultima mossa con fatti della FEN corrente. Correzione futura: risoluzione dell'entry per posizione e guardia di coerenza; test con archivio completo e navigazione indietro.
2. **Numerazione da FEN personalizzata:** gameAnalysis.js assegna moveNumber da indice, partendo da 1; non considera il contatore iniziale della FEN. Serve verificare anche lato e numerazione nella navigazione di una partita che inizia col Nero. Non è un problema delle fixture standard.
3. **Deploy:** il workflow Pages esegue build senza suite di test. Le variabili VITE dei provider vengono incorporate nel client: i nomi sono letti dal workflow, nessun valore segreto o .env è stato letto. Il controllo richiede valutare l'architettura di accesso ai provider prima di un deploy pubblico.

## Candidati al riordino

| Codice | Evidenza e cautela |
|---|---|
| src/lib/pgn.js / parsePgnMoves | Modulo non raggiunto dall'app; importato dai test. App e archivio usano altri percorsi PGN. |
| evaluation.js: cpToProbability, moverWinProb | Consumati dall'esterno solo nei test; formula diversa dalla sigmoid del classificatore. Non sostituirla automaticamente. |
| gameAnalysis.js: summarizeAnalysis | Consumata solo dai test; la UI usa buildAnalysisSummary. |
| analysisCache.js: singleton analysisCache | Nessun import; la factory createAnalysisCache resta attiva. |
| engineConfig.js: fallbackDepth, explorerMinGames | Parametri non utilizzati. defaultDepth invece serve al QA legacy. |
| qa-searchmoves-experiment.js | Import labels e variabile score non utilizzati. |
| stockfish.js | Parametro error del callback onerror non utilizzato. |
| classification-win-prob.test.js | Import calculateWinProbability e parametro startingFen non utilizzati. |

Gli export segnalati dall'AST non equivalgono a funzioni morte: accuracyWinPercent, moveAccuracy, aggregateAccuracy, classifyMove e altre funzioni sono chiamate internamente al loro modulo. Le costanti schema dell'archivio e validatedAnalysis sono usate internamente. I binding con prefisso `_` sono scarti intenzionali.

Duplicazione semantica candidata: parsing UCI fra worker e adattatori QA; replay/validazione PGN in app, archivio e script; cache Map di sessione e cache TTL. Hanno contratti differenti (cancellazione, trasporto, errori, durata): prima di unificare servono test di questi contratti. Nessun refactoring eseguito nell'audit.

La verifica statica non prova assenza di bug: CSS, condizioni dipendenti da servizi esterni, telefono e vecchi archivi richiedono controlli mirati. Non sono stati eseguiti nuovi esperimenti motore né chiamate LLM.

## Aggiornamento dopo le correzioni

La diagnosi sopra fotografa lo stato precedente. Chat/FEN e numerazione corrette, helper PGN e summarizeAnalysis rimossi, singleton/parametri/binding inutilizzati rimossi, test nel workflow aggiunti. Scansione successiva: code-audit-after-cleanup.json. Duplicazioni semantiche e API legacy con test mantenute per differenze di contratto; limiti e verifiche in roadmap-3-cleanup.md.
