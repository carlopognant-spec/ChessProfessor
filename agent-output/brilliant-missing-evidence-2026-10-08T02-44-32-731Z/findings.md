# Esito delle 30 ricerche mancanti

[Risultati, score e UCI grezzi](results.json), [report completo](report.md), [manifest usato](schedule.json).

Tutte le 30 radici sono state ricercate a 200.000 nodi nominali, con score senza bound e PV legalmente ripercorse. Totale effettivo 6.003.955 nodi, entro il cap 7.500.000. Motore Stockfish 19 WASM large-single, MultiPV 1, Threads 1, Hash 16 MB, ucinewgame e Clear Hash a ogni ricerca. UCI_ShowWDL supportato e attivato; WDL registrato separatamente, senza usarlo per modificare classificazioni o soglie. Esecuzione e confronto: circa 33 secondi.

Le 26 astensioni precedenti sono tutte risolte: 21 mosse escluse come scambi ordinari, 4 come offerte persistenti, 1 assegnata Geniale. Nessun nuovo vero positivo rispetto ai riferimenti. Risultato dopo completamento: TP 1, FP 1, FN 2; prima: TP 1, FP 0, FN 2. La variante non è un miglioramento da attivare nell'app.

## Nuovo falso positivo: personale 4, 28.Rac1

Riferimento Migliore; comune locale Ottima; v3 con prova mancante si asteneva; con score disponibile assegna Geniale.

Accettazione Nxe4: il motore segnala matto contro il Nero in 3. PV salvata: Nxe4 Rfd1+ Nd6 Rxd6+ Ke8 Rd8#. Il Bianco perde temporaneamente l'alfiere e recupera il saldo al quarto ply. WDL dopo accettazione: 0/0/1000 dal lato Nero. La miglior difesa originale rifiuta l'offerta, con Nd5, ma il motore segnala comunque matto contro il Nero. Il sacrificio accettato non è necessario per vincere.

Diagnosi basata sulle sole cache esistenti, senza ricerche extra:

| Root prima di Rac1 | Mate per il Bianco | Depth | Accettazioni materiali legali |
|---|---:|---:|---|
| Rab1 | 5 | 19 | Nxe4, Nxb1 |
| Rfc1 | 5 | 19 | Nxe4 |
| Rac1 | 5 | 19 | Nxe4 |
| Rfb1 | 6 | 19 | Nxe4, Nxb1 |
| Qf6 | 7 | 18 | Nxe4 |

Le altre root sono vincenti secondo i risultati del motore, ma v2/v3 non le usa come veto perché presentano anch'esse almeno un pezzo catturabile. Questa guardia identifica un'offerta materiale, non dimostra che tale offerta costituisca un sacrificio significativo o che la vittoria dipenda da Rac1.

Il controllo storico non risolve il problema: dopo 27.Qxg5+ il Nero è sotto scacco e non può giocare Nxe4. Dopo 27...Kd7 la presa diventa legalmente possibile. V3 attribuisce 'new-legal-offer' confrontando i due turni avversari, ma tra le posizioni c'è anche Kd7. Non è una prova che Rac1 abbia creato la possibilità o la compensazione. Il confronto temporale può confondere una risposta avversaria con l'effetto della mossa propria.

Questi score sono stime a budget limitato; una PV legale non prova matto contro ogni difesa. Non inventare un'eccezione su Rac1 né vietare recuperi al quarto ply: anche Nxe5 vero positivo recupera allora. I nuovi dati vanno conservati per il successivo confronto delle alternative dalla stessa FEN e dello stesso pezzo offerto.

## Effetto dei sei casi analizzati in precedenza

Le sei offerte sfavorevoli in quattro mosse non diventano esempi mancati di Grande: nei riferimenti nessuna è Grande. Tre mosse non sono la root principale; g6 è principale ma non segue un errore e non dimostra unicità. Queste conclusioni restano distinte dalle guardie sul sacrificio. Nessuna promozione automatica quando un sacrificio è escluso; nessun ampliamento della regola Grande per recuperare tali casi.

## Decisione

Conservare i 30 risultati come nuove prove, mantenere v3 fuori dall'app, nessuna soglia modificata. Prossima diagnosi: confrontare da una stessa FEN le alternative che preservano o cambiano la medesima offerta e il risultato; distinguere sacrificio significativo, offerta incidentale e semplice vittoria già disponibile. Fissare protocollo prima di cambiare classificazione. Rb3/Rxf5+ restano esclusi dal veto locale esistente: non rimuoverlo per adattarsi a quei due riferimenti.

30 test mirati superati (4 selezione score, 8 v2, 6 attribuzione, 7 compensazione, 5 audit), più controllo sintattico del runner. Hash di tutti gli input invariati. App, soglie, Grande congelata, classification.js e cache QA invariati. Nessun commit/push o lettura .env/partite 7–10. Suite app/build/browser NON ESEGUITI. Dati già studiati: nessuna validazione indipendente.
