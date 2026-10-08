# Riutilizzo deterministico della stessa posizione

Il filtro temporale è respinto: perde personale 6 d4 e non elimina falsi positivi. Non viene usato qui.

Ipotesi fissata prima dei risultati: alcune astensioni dipendono da linee root non confrontabili. La cache contiene una seconda analisi della stessa FEN: playedEngine della mossa precedente. Usarla solo per problemi strutturali, senza scegliere in base a score, categoria o annotazioni.

1. Preferire engine corrente se PV1/PV2 sono distinte, alla stessa profondità positiva, con score finiti o mate non zero senza bound, e radici mostrate non duplicate.
2. Solo se questa struttura non è utilizzabile, considerare playedEngine della mossa immediatamente precedente con fenAfter esattamente uguale a fenBefore corrente, catena legale e colori alternati. Fonti dalla stessa cache omogenea di motore/configurazione/budget. Stessi controlli strutturali sulla seconda ricerca.
3. Se entrambe non sono utilizzabili, conservare l'originale. Mai combinare linee, deduplicare silenziosamente o confrontare depth diverse.
4. Non scegliere una fonte perché assegna Grande, rende la giocata PV1 o si avvicina a Chess.com. Il classificatore v1 e le sue soglie restano invariati.

Con la fonte selezionata ricalcolare anche categoria numerica e Mossa mancata con le funzioni esistenti; riportare variazioni della baseline comune. Confrontare TP/FP/FN e concordanza per gruppo. Una copertura maggiore non basta per attivare le categorie nell'app.

Solo personali 1–6 e due storiche. Zero nuove ricerche, app/cache/file precedenti intatti, output nuovo. Nessuna lettura .env o 7–10, nessun nuovo commit/push. Hash sorgenti verificati. Questo rimane sviluppo, non validazione indipendente.
