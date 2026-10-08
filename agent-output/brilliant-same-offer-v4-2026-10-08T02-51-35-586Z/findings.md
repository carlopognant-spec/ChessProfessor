# Confronto delle alternative con la stessa offerta

[Report](report.md), [dati completi](results.json), [protocollo preventivo](../brilliant-same-offer-v4-protocol.md).

La nuova guardia sperimentale elimina il falso Geniale 28.Rac1 senza perdere Nxe5 della partita 6. Su tutte le 592 mosse: TP 1, FP 0, FN 2, zero astensioni rimaste dopo aver riutilizzato le 30 ricerche già raccolte. Rispetto a v3 completa cambia soltanto Rac1. Nessuna nuova ricerca in questo passo.

Il confronto parte dalla stessa FEN, tiene distinti i pezzi e accetta soltanto score senza bound di root distinte alla medesima depth. Rac1 lascia l'alfiere e4 in presa e risulta vincente, ma anche Rab1, Rfc1 e Rfb1 lasciano in presa quel medesimo alfiere e risultano vincenti a depth 19. Il precedente veto sulle sole alternative prive di offerte non coglieva questa situazione. La nuova guardia esclude tale offerta come prova sufficiente che la giocata meriti Geniale.

Non vieta tutti i sacrifici in posizioni favorevoli, né i recuperi al quarto ply. Si applica ai pezzi lasciati sulla stessa casella; mantiene il sacrificio del pezzo appena mosso fuori da questa specifica guardia. È un limite deliberato: non pretende di risolvere la causalità di tutti i sacrifici.

L'audit trova complessivamente sei mosse con undici righe comparabili già vincenti e la medesima offerta. Ciò mostra che il confronto non usa un'eccezione su SAN o numero di partita. Tuttavia la scelta del controllo nasce dall'errore Rac1 già noto: il risultato non è indipendente e il singolo vero positivo non permette di stimare la precisione su nuove partite.

Rb3 resta esclusa dal precedente veto sulle alternative senza sacrificio. Il nuovo audit trova anche h4 vincente alla stessa depth con il medesimo cavallo h8 in presa. Non abbiamo quindi motivo di eliminare i controlli solo per recuperare quel riferimento. Rxf5+ resta esclusa dal veto precedente; il pezzo appena mosso non rientra nel confronto delle offerte stazionarie. Nessun aumento del richiamo storico.

Decisione: conservare v4 come candidato sperimentale, nessuna attivazione nell'app o promozione automatica in Grande. Per migliorare la compatibilità occorre verificare la politica del riferimento e raccogliere sacrifici ulteriori con positivi e negativi completi; altre guardie sul medesimo singolo positivo non dimostrerebbero una soluzione generale.

29 test mirati superati: 10 sul nuovo confronto, 8 v2, 6 attribuzione, 5 audit. Il test sintetico a colori scambiati è stato corretto per rigenerare la FEN dopo la mossa: il Nero incrementa il numero completo di mossa, diversamente dal Bianco. Nessun dato reale modificato. Hash degli input invariati. App, Grande congelata, soglie, classification.js e cache invariati; niente .env/7–10, commit o push. Suite app/build/browser NON ESEGUITI.
