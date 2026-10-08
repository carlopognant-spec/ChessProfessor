# Esito attribuzione Geniale v3

[Report completo](brilliant-offer-attribution-v3-2026-10-08T02-28-55-079Z/report.md), [risultati e hash](brilliant-offer-attribution-v3-2026-10-08T02-28-55-079Z/results.json), [protocollo](brilliant-offer-attribution-v3-protocol.md).

Su 592 mosse, v3 elimina i due falsi positivi v2 senza perdere il vero positivo Nxe5 della partita 6: TP 1, FP 0, FN 2. Ventisei astensioni per accettazioni prive di score. Non aumenta il numero di Geniale riconosciuti rispetto a v1. L'ipotesi nasce dagli errori già osservati: non è validazione indipendente e non dimostra precisione perfetta su partite nuove.

La nuova evidenza distingue un pezzo appena offerto da uno già legalmente catturabile dopo la precedente mossa dello stesso giocatore. Nell'arrocco della partita 2 il cavallo a6 poteva già essere preso con Bxa6; in Rf3 il cavallo h8 poteva già essere preso con Qxh8 dopo Rb3. Il confronto usa vere posizioni consecutive e mosse legali, includendo l'effetto delle inchiodature. Non modifica artificialmente il lato al tratto.

Il recupero al quarto ply compare sia nei due falsi positivi sia in Nxe5: dunque un divieto basato sulla sola durata eliminerebbe anche il vero sacrificio riconosciuto. Il modulo registra le continuazioni senza aggiungere questo veto.

Limite dell'attribuzione: una mossa può rendere favorevole un sacrificio già legalmente disponibile. La semplice novità della presa non misura il cambiamento della compensazione. V3 può quindi scartare sacrifici autentici; non chiamarla una definizione completa di Geniale. Rb3 e Rxf5+ restano fermate prima da alternative salvate già vincenti senza sacrificio.

Decisione: conservare il filtro e l'esperimento come strumenti diagnostici, nessuna attivazione nell'app e nessun modello definitivo. Per migliorare il richiamo serve distinguere compensazione introdotta dalla mossa e offerta persistente, con nuovi riferimenti indipendenti; modificare i veti sui due soli casi storici non dimostrerebbe generalizzazione.

Diciannove test mirati passati: sei attribuzione, otto v2, cinque audit. Un FEN sintetico nel test è stato corretto perché il cavallo iniziale non attaccava la casella prevista; nessuna modifica ai dati reali. Hash degli input invariati. Nessuna nuova ricerca motore, modifica a file precedenti/app/Grande/cache, commit/push. Suite app/build/browser NON ESEGUITI.
