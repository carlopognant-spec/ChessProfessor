# Cinque scelte dopo 6...d4: risultato e problemi distinti

12 ottobre 2026. Ricostruzione dalle immagini di Carlo:
1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6 4.g3 Nxe4 5.Nxe4 d5 6.Nc3 d4.
FEN prima delle cinque scelte:
`r1bqkb1r/ppp2ppp/2n5/4p3/3p4/2N2NP1/PPPP1P1P/R1BQKB1R w KQkq - 0 7`.

Riferimenti: De2, d3, Ad3, Ab5 Geniali; Ag2 Migliore. I primi, secondo e quinto
sono visibili nelle immagini; Ad3 e Ab5 sono riferiti dall'utente. Nessuna nuova
etichetta è stata recuperata direttamente dalla piattaforma.

## Controllo reale con il codice invariato

Tredici ricerche da 200.000 nodi nominali, totale effettivo **2.601.616 nodi**,
sotto il tetto preventivo 2.665.000. Stesso motore e configurazione per tutti:
Stockfish 19.0.0 large-single, un thread, Hash 16 MB, MultiPV 5, hash pulita.
Nessuna ricerca è stata aggiunta, ripetuta o estesa per ottenere le etichette.

Ag2 è PV1 sia nella ricerca standard sia nel confronto mirato delle cinque
scelte. La ricerca standard comprende tutte le mosse legali; quella mirata
usa searchmoves sui soli cinque candidati e non dimostra una migliore globale.

Con il percorso di produzione le classificazioni sono: De2 Ottima, d3 Ottima,
Ad3 Ottima, Ab5 Ottima, Ag2 Migliore. Tutte le valutazioni speciali si arrestano
per `missing-alternatives`: le due root hanno specialLines vuoto. L'ultima
iterazione completa ha PV1 diversa dal bestmove finale; la più recente è
incompleta, con profondità miste e almeno uno score bound. Il rifiuto quindi
non prova che le prime quattro mosse non siano sacrifici validi.

## Differenze scacchistiche verificate senza interpretazioni inventate

Tutte e cinque lasciano il cavallo c3 catturabile da ...dxc3. Dopo la presa,
la posizione resta vicina all'equilibrio nelle analisi. Anche Ag2 consente
...dxc3 seguito da bxc3: la sola presenza della presa e della compensazione
non la distingue dalle quattro mosse etichettate Geniali.

Le continuazioni dopo l'accettazione, nella MultiPV indipendente:

| Scelta | Score Nero dopo la scelta, linea ...dxc3 | Inizio PV |
|---|---:|---|
| De2 | -0.08 | ...dxc3 dxc3 Ad6 Ag2 O-O |
| d3 | -0.04 | ...dxc3 bxc3 Ae7 De2 Ae6 |
| Ad3 | +0.14 | ...dxc3 dxc3 De7 Ae4 Ag4 |
| Ab5 | +0.23 | ...dxc3 De2 f6 bxc3 Ae6 |
| Ag2 | -0.19 | ...dxc3 bxc3 Ad6 O-O O-O |

Queste sono varianti e stime del motore a questo budget, non prove di unicità
o di tutte le risposte possibili. Ab5 introduce un'inchiodatura geometrica del
cavallo c6 al re e la PV può ritardare la ripresa in c3. De2 può riprendere
col pedone d2 senza la donna ancora in d1; d3 consente soltanto bxc3 come
ripresa immediata del pedone c3. Nessuna di queste osservazioni spiega da sola
perché la piattaforma escluda Ag2 dalla categoria Geniale.

## Analisi supplementare esclusivamente offline

Il protocollo offline è stato fissato prima della verifica. Dai raw esistenti
si conserva, in ordine temporale, l'ultima iterazione completa con PV1 uguale
al bestmove finale. Non si scelgono gli score in base all'etichetta desiderata.
Questa variante della raccolta dati non è stata attivata nell'app.

Per le due root l'iterazione così recuperata è depth 10. Con la root standard
De2 e d3 diventano Geniali; Ad3 e Ab5 restano Ottime per copertura insufficiente
della giocata; **Ag2 diventa Geniale**, in contrasto con il riferimento.

Con la root mirata, che copre esattamente le cinque scelte:

| Scelta | Riferimento | Variante offline | Perdita locale |
|---|---|---|---:|
| De2 | Geniale | Geniale | 0.06246 punti |
| d3 | Geniale | Geniale | 1.37474 punti |
| Ad3 | Geniale | Geniale | 1.06224 punti |
| Ab5 | Geniale | Buona | 3.12386 punti |
| Ag2 | Migliore | Geniale | 0 punti |

Questo confronto mirato coincide con 3/5 riferimenti, ma non è produzione o
una misura di accuratezza indipendente. Ab5 supera la soglia locale Ottima
(3 punti) di circa 0.124 punti: il criterio Geniale accetta solo Migliore/Ottima
e quindi non arriva a valutare il sacrificio. Alzare la soglia per questa sola
mossa sarebbe fitting sul caso; inoltre non eliminerebbe il falso positivo Ag2.

Ag2 viene promossa per `compensated-new-offer`: mantiene una posizione circa
equilibrata, lascia il cavallo in presa dopo il precedente ...d4 e soddisfa
le stesse verifiche di compensazione delle altre scelte. La perdita zero non
è la causa: una Geniale può legittimamente essere PV1. Manca una condizione
generale dimostrata che distingua questo sacrificio dagli altri secondo il
riferimento della piattaforma. Non è stata introdotta alcuna eccezione su
nomi di mosse, case, fase d'apertura o ranking.

## Decisione

Nessuna modifica applicativa, a rating, soglie, repertorio o regole speciali.
Sono stati separati tre limiti: raccolta di snapshot completi, eleggibilità
numerica ai confini e distinzione dei sacrifici rispetto al riferimento.

È ragionevole valutare in futuro la raccolta di un'iterazione precedente
coerente, ma migliorarla renderebbe visibile anche la discordanza Ag2. Prima
di attivare un nuovo criterio Geniale servono altri esempi positivi e negativi
con la stessa struttura, mantenendo indipendente la valutazione del criterio.
Questa diagnosi non giustifica nuove ricerche indiscriminate o coefficienti
legati al rating e non cambia il risultato storico 329/592.

File: manifest e protocollo preventivo; search-00.json … search-12.json per
i raw; results.json per produzione; offline-protocol.md e offline-review.json
per la variante diagnostica. Le cache precedenti e i 20 input congelati sono
invariati. Nessuna lettura di .env o delle partite riservate 7–10.
