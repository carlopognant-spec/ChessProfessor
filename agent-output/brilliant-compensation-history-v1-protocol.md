# Compensazione delle offerte persistenti — audit v1

8 ottobre 2026. Protocollo prima del confronto. Nessuna assegnazione nuova di Geniale: misurare se le evidenze disponibili sostengono il cambiamento della compensazione, evitando un'altra regola adattata ai tre positivi. Nessuna nuova ricerca motore, modifica a file precedenti/app/soglie/Grande/cache, lettura .env o partite 7–10, commit/push.

Enumerare tutte le offerte materiali nelle 592 mosse consentite, a prescindere dal riferimento e dalla categoria. Per ciascun pezzo non appena mosso usare l'ultima posizione con l'avversario al tratto, dopo la precedente mossa dello stesso giocatore. Verificare la catena FEN. Enumerare tutte le catture legali di quel pezzo nella posizione precedente.

Per ogni cattura precedente raccogliere TUTTE le righe salvate con la sua radice, sia da playedEngine della precedente mossa propria sia da engine della mossa avversaria seguente: sono ricerche distinte sulla stessa FEN. Verificare legalità della PV, colore, depth positivo, score senza bound. Riportare score e depth di ciascuna fonte; non scegliere la fonte che favorisce l'ipotesi. Radici duplicate e differenze di depth restano visibili, non diventano una media o un nuovo score.

Per le accettazioni attuali raccogliere TUTTE le righe child disponibili con la radice richiesta. Riportare intervallo minimo/massimo delle probabilità locali normalizzate per chi offre il pezzo. Eventuali score con bound non sono evidenza utilizzabile. La soglia 0,45 rimane quella precedente, senza calibrazione.

Diagnostica per offerta: se tutte le catture precedenti sono coperte, tutti gli score precedenti sono sotto 0,45 e tutti quelli attuali almeno 0,45, registrare 'precedentemente sfavorevole, ora compensata'; se tutti gli score precedenti erano già almeno 0,45, registrare 'già compensata'. Score discordanti attorno alla soglia o catture non coperte sono irrisolti. Non riempire i dati mancanti con score neutri.

Il confronto è temporale: tra le due posizioni cambia anche una mossa dell'avversario. Non prova che la mossa propria abbia CAUSATO il cambiamento. Una futura verifica causale deve confrontare diverse mosse proprie dalla medesima FEN iniziale, con difese comparabili e budget fissato. La probabilità locale non è l'Expected Points di Chess.com.

Report: copertura, categorie degli esiti, dettaglio dei tre Geniale di riferimento e dei due falsi positivi v2, tutti i casi diagnostici di compensazione nuova. Annotazioni consultate soltanto dopo il calcolo. Hash prima/dopo, nessuna attivazione.
