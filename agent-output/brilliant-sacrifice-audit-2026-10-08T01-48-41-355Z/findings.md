# Geniale: cosa manca rispetto ai sacrifici reali

8 ottobre 2026. Audit descrittivo di tutte le 592 mosse personali 1–6 e delle due storiche. Protocollo ../brilliant-sacrifice-audit-v1-protocol.md scritto prima dell'estrazione globale. Tre riferimenti Geniale già conosciuti: nessuna validazione indipendente.

## I tre casi

| Partita e mossa | Accettazione legale | Saldo rispetto a prima dell'offerta | Evidenza disponibile | Esito v1 |
|---|---|---:|---|---|
| Personale 6, Nxe5, ply 11 | ...Nxe5 | −2 | Miglior risposta, PV salvata e compensazione circa pari | Geniale |
| Chigorin–Steinitz, Rb3, ply 53 | ...Qxh8 prende il cavallo h8 | −3 | Accettazione fuori dalle linee salvate; miglior risposta ...Kg7 rifiuta | Ottima |
| Chigorin–Steinitz, Rxf5+, ply 61 | ...Qxf5 prende la torre | −2 | Miglior risposta e continuazione salvata con matto favorevole al giocatore | Migliore |

Nxe5 muove il pezzo offerto, inizialmente non attaccato geometricamente; dopo l'accettazione d4 prepara il recupero tramite combinazione. Non è una ricattura immediata.

Rb3 non offre immediatamente la torre b3: la cattura legale rilevata è della donna c8 contro il cavallo h8, già attaccato prima della mossa. Questo illustra una famiglia che il rilevatore v1 non riconosce bene: muovere un altro pezzo lasciando deliberatamente quello attaccato. Ma il calcolo di ...Qxh8 non è disponibile nella cache; non è possibile dichiarare qui che l'accettazione mantenga la compensazione. Inoltre la v1 protegge la categoria comune Ottima e le root alternative g4/h4/Nf7/Qf7 hanno score già vincenti secondo la soglia locale. Depth diverse impongono prudenza nel confronto quantitativo.

Rxf5+ è un vero candidato materiale nella PV: cattura un cavallo (+3), offre la torre (−5), saldo −2, poi Qf8+ e Qxf5 recuperano con una combinazione. La regola v1 lo esclude perché anche g5 è già vincente, +983 cp alla stessa depth 15 della giocata. L'accettazione stimata ha mate −6 dal lato dell'avversario, favorevole al sacrificante. Questa esclusione è una scelta prudente del protocollo; non è una prova che il riferimento storico sia sbagliato. Non abbassare la soglia per recuperare il singolo esempio.

## Il confronto con gli scambi

- 173 mosse permettono almeno un'accettazione legale con perdita netta di almeno 2 punti materiali rispetto a prima della mossa.
- Tutti i tre riferimenti Geniale sono inclusi, ma anche 170 mosse con altre etichette. Questi sono abbinamenti di una proprietà materiale, non 170 errori del classificatore.
- 102 delle 173 hanno categoria comune Migliore/Ottima: nemmeno essere una buona mossa e perdere materiale basta.
- 213 possibili accettazioni materiali; 129 non hanno una linea child corrispondente nelle cache.
- 44 accettazioni salvate recuperano immediatamente il saldo con una presa, quindi includono normali scambi o guadagni tramite scambio.
- La miglior risposta accetta un'offerta materiale in 43 mosse. Un sacrificio può invece essere rifiutato: l'assenza di accettazione nella PV1 non basta per negarlo.

Le offerte multiple della stessa mossa non sono esempi indipendenti. Attacchi geometrici preesistenti possono includere pezzi inchiodati; le catture dopo la mossa sono invece enumerate legalmente. Le PV sono stime del motore, non prove contro tutte le difese.

## Decisione e prossimo lavoro concreto

Geniale rimane invariata, 1 riconosciuta su 3 e zero false assegnazioni osservate nella prova v1. Grande rimane congelata. Nessuna estensione adottata sulla base di questi tre positivi.

L'estensione da progettare deve distinguere pezzo mosso in sacrificio e pezzo lasciato in presa, accettazione e rifiuto, scambio immediato e recupero tramite combinazione. Per valutare i casi fuori MultiPV servirebbero analisi dedicate delle accettazioni legali, selezionate con una regola indipendente dalle etichette. Tali ricerche NON ESEGUITE in questo audit. Nuovi positivi e negativi annotati restano necessari per valutarne l'affidabilità.

## Verifiche

Cinque nuovi test superati: sacrificio con continuazione quieta, scambio immediato, accettazione fuori cache, bound/mate e dati illegali. Replay completo di tutte le partite e delle PV child; hash delle 17 sorgenti invariati. Zero nuove ricerche motore. App, Grande, soglie, cache e file precedenti intatti. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
