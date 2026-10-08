# Geniale v3 — attribuzione dell'offerta

Protocollo fissato prima dell'esecuzione, 8 ottobre 2026. Ipotesi nata dai due falsi positivi v2: studio adattato ai dati già osservati, non validazione indipendente. Nessuna nuova soglia numerica, ricerca motore, modifica a file precedenti/app/Grande/cache, lettura .env o partite 7–10, commit/push.

Conservare tutti i controlli v2. Per assegnare Geniale deve esistere almeno una sua accettazione qualificante attribuibile alla mossa corrente:

- il pezzo offerto è quello appena mosso; oppure
- il pezzo è rimasto sulla propria casella, ma non era già catturabile legalmente nell'ultima posizione con l'avversario al tratto, subito dopo la precedente mossa dello stesso giocatore (due ply prima).

Confrontare catture legali, non attacchi geometrici: un pezzo inchiodato può attaccare senza poter catturare. Verificare la catena FEN e il colore/tipo del pezzo. Se manca la posizione precedente, l'attribuzione del pezzo lasciato in presa è ignota e causa astensione. Non creare una FEN cambiando artificialmente il lato al tratto. Se l'offerta era già possibile, non assegnare Geniale per questa sola evidenza; ciò non dimostra che la mossa sia priva di creatività o sacrificio.

Registrare anche il recupero materiale nelle PV e la natura delle catture: semplice descrizione, nessun veto aggiunto sul quarto ply o su recuperi successivi. Un sacrificio vero può recuperare materiale dopo una combinazione.

Confrontare tutte le 592 mosse con v1/v2; riportare ciascuna variazione, positivi persi, astensioni, TP/FP/FN per personali e storiche. Nessuna promozione nell'app anche se spariscono i due errori già noti: il richiamo storico resta il problema da risolvere con riferimenti nuovi.
