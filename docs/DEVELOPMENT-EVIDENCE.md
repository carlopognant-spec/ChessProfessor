# Dati riproducibili e output locali

Il codice, i test e gli script sono versionati. Alcuni dati di sviluppo
restano sotto `agent-output` per compatibilita con i test esistenti: sono
fixture immutabili selezionate. Le eccezioni esplicite in `.gitignore`
includono i dati necessari ai test e alla ricostruzione del rapporto offline,
insieme ai manifest e risultati delle ricerche. I manifest controllano gli hash.

Le ricerche esplorative non necessarie, le pagine HTML scaricate, screenshot,
cache derivate di `review-automation` e risultati Playwright rimangono locali.
Ignorare questi file non li elimina dal computer. Le partite originali e i
riferimenti sono conservati in `Partite`; i dati riservati alla validazione
non vanno usati per sviluppare o adattare le regole.

Comandi riproducibili senza leggere un file `.env` locale:

```sh
npm ci
npm test -- --config scripts/qa-no-env-test.config.js --cache false
npm run build -- --config scripts/qa-no-env-build.config.js
npm run review:auto
```

Il primo `review:auto` ricostruisce la propria cache dai dati versionati;
non avvia Stockfish. I successivi riutilizzano cache e risultati finche
prove e sorgenti non cambiano. I test usano fixture versionate, non quella
cache derivata. `.gitattributes` conserva i byte delle prove e dei tre sorgenti
con terminazioni miste registrati nei vecchi manifest. I controlli degli hash
restano confronti di byte esatti, anche per le dipendenze sorgente.

Gli script storici di ricerca sono in parte monouso e richiedono i rispettivi
output locali; i protocolli completati non vanno rilanciati su sorgenti nuove.
Il comando supportato per il confronto corrente e `review:auto`.

## Interpretazione dei riferimenti

La concordanza con una lista non basta a dimostrare una regola. Conservare
provenienza, modalita di analisi, impostazioni note e affidabilita del
riferimento; distinguere etichette Game Review, feedback dell'analisi e
annotazioni editoriali dei PGN.

Il 16 ottobre Carlo ha rianalizzato Chigorin–Steinitz nella Game Review e
ha confermato che 14...c6 **non** risulta Grande. La categoria esatta non e
stata comunicata. Non ha ritrovato Saint Amant–Staunton, quindi 38...Ne4
resta non verificata. Il rapporto conserva i vecchi riferimenti storici:
32/34 e 4/4 sono concordanza con quella lista, non una prova di accuratezza
rispetto a tutte le attuali etichette Chess.com.

La priorita e comprendere e verificare meccanismi generali, con esempi e
controesempi, mantenendo i casi corretti. Le discordanze non giustificano
automaticamente nuove soglie o eccezioni. Il chiarimento originale e in
`agent-output/classification-source-review-v1/user-clarification.json`.
