# MultiPV coerente: risultato tecnico e limite della classificazione

Protocollo preventivo: ../stockfish-specials-complete-multipv-v1-protocol.md. Selezione in due giri tra gli otto giochi consentiti, prime posizioni strutturalmente irrisolte per ply, senza usare le etichette. Quindici posizioni selezionate: personale 5 aveva un solo caso disponibile. Nessun adattamento delle soglie.

## Ricerche reali

15 ricerche Stockfish 19 npm 19.0.0 large-single, MultiPV 5, Threads 1, Hash 16, hash pulita per ricerca. Budget nominale 200.000 nodi ciascuna; totale nominale 3.000.000, effettivo 3.002.050. Tetto 4.000.000 rispettato. Tempo della raccolta circa 12,3 secondi, esclusa preparazione. Raw UCI completo in search-01.json…search-15.json; pianificazione salvata prima dei go in schedule.json.

## Evidenza tecnica

I raccoglitori esistenti src/lib/stockfish.js e scripts/qa/native-engine.js aggiornano una mappa per indice multipv indipendentemente dalla profondità. Interrompere a nodi prefissati durante un'iterazione può lasciare un insieme misto; uno stesso root può comparire in due indici provenienti da iterazioni diverse. Non è prova che Stockfish abbia fornito un MultiPV completo con duplicati.

Sulle stesse nuove ricerche reali:

- Ultime righe per indice: profondità miste in 15/15; radici duplicate in 5/15.
- Ultimo blocco completo ordinato PV1…PV5: 15/15, stessa profondità e radici distinte.
- PV legalmente ripercorse; PV1 del blocco sempre uguale al bestmove finale.
- Profondità del blocco: 11–15. Nodi al blocco completo dal 35,5% al 98,4% dei nodi finali. Essere coerente non implica usare gli score più recenti della ricerca incompleta.

Il nuovo raccoglitore scripts/stockfish-complete-multipv.js risolve il confronto nel solo esperimento. App e parser precedenti non modificati. Il confronto ultime righe/blocco usa lo stesso raw e isola la modalità di raccolta; il confronto con la vecchia cache include anche il nuovo calcolo.

## Etichette: nessun miglioramento

Nei 15 casi c'erano due Grande di riferimento: personale 4 Qb4 (ply 22), storico Chigorin–Steinitz Nc4 (25). Il classificatore speciale v1 invariato non ne riconosce nessuna anche con input confrontabili.

Assegna invece tre nuove false Grande:

- Personale 5 Bxg5 (ply 25), riferimento Migliore.
- Personale 6 Qxd4 (ply 15), riferimento Migliore.
- Personale 3 Qxf6 (ply 12), riferimento Migliore.

Concordanza nei selezionati: 11/15 prima, 8/15 usando il blocco completo. Nessuna Geniale attesa o assegnata in questo sottoinsieme: non misura Geniale.

Nel totale di 586 mosse incluse, sostituendo soltanto questi 15 risultati: Grande da 4 TP / 4 FP / 20 FN a 4 TP / 7 FP / 20 FN; concordanza da 310 a 307. Geniale invariata, 1 TP / 0 FP / 2 FN. Il resto del campione non è stato ricalcolato: non chiamare questo totale un'analisi completa col nuovo raccoglitore.

## Decisione

Conservare il raccoglitore coerente come strumento sperimentale; respingere l'attivazione della combinazione raccoglitore + regola v1. Le vecchie astensioni nascondevano anche assegnazioni errate, quindi recuperare la copertura non è equivalente a migliorare la somiglianza a Chess.com. Il confronto tra alternative è utile ma insufficiente per riconoscere Grande; serve una definizione ulteriore verificabile, senza eccezioni costruite sui singoli falsi positivi.

Le etichette di sviluppo sono ormai state osservate ripetutamente: qualsiasi prossima regola derivata da questi casi richiederà un confronto indipendente prima dell'adozione. Partite 7–10 rimangono riservate e non lette.

## Verifiche

- 45 test dedicati superati, inclusi sei nuovi su blocchi completi, profondità, duplicati, bound, mate, PV mancanti e bestmove discordante.
- Baseline v1 riprodotta su tutte le 592 mosse prima delle ricerche.
- Hash di tutte le sorgenti lette invariati; nessuna modifica a file tracciati, app o QA.
- Script sintatticamente valido; suite app/build/browser NON ESEGUITI, perché l'app è invariata.
- .env e partite 7–10 non letti. Nessun commit/push.
