# Aumento dei nodi: due partite pubbliche

Fonte: [PGN Mentor, Mondiale 2024](https://www.pgnmentor.com/events/WorldChamp2024.pgn).
Prime due partite del file, selezione fissata prima delle ricerche. Nessuna etichetta indipendente disponibile.

130 semimosse; 130 FEN distinte; 260 ricerche senza ripetizioni.
Nodi effettivi: 156.059.772; limite: 157.300.000.
Verificati 20 input congelati. Codice applicativo, soglie e budget iniziale invariati.

## Tempo misurato

PC: AMD Ryzen 5 2600X Six-Core Processor           ; win32/x64; v24.19.0.
Stockfish 19 large-single WASM, un thread, Hash 16 MB, MultiPV 5, hash pulita per ricerca.
Esecuzione tramite Node, non browser: tempi di ricerca e trasporto, caricamento iniziale separato.
Nessuna misura di telefono, batteria, RAM, fluidità UI o tempo completo di apertura/import.

| Budget | Totale richieste (s) | Mediana per FEN (s) | P90 per FEN (s) | Totale tempo UCI (s) |
|---|---:|---:|---:|---:|
| 200.000 | 93.21 | 0.72 | 0.80 | 91.73 |
| 1.000.000 | 470.02 | 3.66 | 4.01 | 468.53 |

Rapporto dei tempi totali: 5.04×. Mediana dei rapporti accoppiati: 5.11×.
Avvio del motore separato: 0.71 secondi. Una sola esecuzione, ordine dei budget alternato; nessun intervallo di confidenza.

## Cambiamenti del motore e copertura selettiva

| Partita | Mosse | Categorie cambiate a 1M | Prima scelta cambiata | Cambi completi intercettati dal lotto selettivo |
|---|---:|---:|---:|---:|
| public-wcc2024-1 | 84 | 20 | 18 | 3/20 |
| public-wcc2024-2 | 46 | 12 | 20 | 8/12 |

Il confronto selettivo riguarda un solo lotto, massimo 12 mosse: non equivale a premere più volte il comando.
La versione completa a 1M non è un riferimento di correttezza; la copertura misura concordanza, non precisione.

| Categoria | Iniziale | Completa 1M | Selettiva | Uscite dalla categoria a 1M | Ingressi a 1M |
|---|---:|---:|---:|---:|---:|
| Libro | 19 | 19 | 19 | 0 | 0 |
| Forzata | 0 | 0 | 0 | 0 | 0 |
| Migliore | 54 | 58 | 56 | 11 | 15 |
| Ottima | 46 | 43 | 43 | 16 | 13 |
| Buona | 2 | 3 | 3 | 1 | 2 |
| Imprecisione | 5 | 5 | 5 | 2 | 2 |
| Errore | 1 | 0 | 1 | 1 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 |
| Grande | 3 | 2 | 3 | 1 | 0 |
| Geniale | 0 | 0 | 0 | 0 | 0 |
| Mossa mancata | 0 | 0 | 0 | 0 | 0 |
| Non valutabile | 0 | 0 | 0 | 0 | 0 |

## Transizioni

- Ottima → Migliore: 14
- Migliore → Ottima: 11
- Imprecisione → Ottima: 2
- Buona → Imprecisione: 1
- Errore → Imprecisione: 1
- Ottima → Buona: 2
- Grande → Migliore: 1

## public-wcc2024-1

Dubbie iniziali: 37; selezionate: 12; FEN del lotto: 17.
Costo delle FEN della partita: iniziale 61.05 s; completa 1M 305.43 s.
Costo aggiuntivo del lotto stimato sommando le ricerche già misurate: 66.74 s; iniziale più lotto 127.80 s.
Questa somma non è una nuova misura end-to-end dell’app. Le FEN condivise compaiono nei costi individuali di entrambe le partite, ma una volta sola nei totali globali.

| Ply | Mossa | 200k | Completa 1M | Lotto selettivo | Selezionata | Perdita 200k → 1M |
|---|---|---|---|---|---|---|
| 13 | c3 | Ottima | Migliore | Migliore | true | 0.250 → 0.000 |
| 17 | Be3 | Migliore | Ottima | Migliore | false | 0.000 → 0.187 |
| 20 | Qa5 | Ottima | Migliore | Migliore | true | 1.562 → 0.000 |
| 21 | Bg2 | Migliore | Ottima | Ottima | false | 0.000 → 0.250 |
| 31 | Bf2 | Ottima | Migliore | Ottima | false | 0.000 → 0.000 |
| 33 | Qe2 | Ottima | Migliore | Ottima | false | 0.562 → 0.000 |
| 45 | Rc2 | Imprecisione | Ottima | Imprecisione | false | 6.065 → 0.936 |
| 47 | h4 | Migliore | Ottima | Migliore | false | 0.000 → 2.625 |
| 50 | Rxc3 | Ottima | Migliore | Ottima | false | 0.427 → 0.000 |
| 54 | fxe6 | Buona | Imprecisione | Buona | false | 4.324 → 7.870 |
| 59 | Qc2 | Errore | Imprecisione | Errore | false | 10.409 → 5.084 |
| 61 | Qd2 | Ottima | Migliore | Ottima | false | 2.917 → 0.000 |
| 66 | Rxf1+ | Ottima | Migliore | Ottima | false | 0.000 → 0.000 |
| 73 | Bg3 | Ottima | Buona | Ottima | false | 2.447 → 3.679 |
| 74 | Be4 | Grande | Migliore | Grande | false | 0.000 → 0.000 |
| 76 | h6 | Migliore | Ottima | Migliore | false | 0.000 → 0.807 |
| 79 | Bd6 | Migliore | Ottima | Migliore | false | 0.000 → 0.000 |
| 80 | Qc2+ | Ottima | Migliore | Ottima | false | 0.694 → 0.000 |
| 82 | Qxa2 | Ottima | Migliore | Ottima | false | 1.817 → 0.000 |
| 83 | Be6+ | Imprecisione | Ottima | Imprecisione | false | 5.186 → 2.154 |

## public-wcc2024-2

Dubbie iniziali: 21; selezionate: 12; FEN del lotto: 20.
Costo delle FEN della partita: iniziale 33.70 s; completa 1M 171.99 s.
Costo aggiuntivo del lotto stimato sommando le ricerche già misurate: 72.84 s; iniziale più lotto 106.54 s.
Questa somma non è una nuova misura end-to-end dell’app. Le FEN condivise compaiono nei costi individuali di entrambe le partite, ma una volta sola nei totali globali.

| Ply | Mossa | 200k | Completa 1M | Lotto selettivo | Selezionata | Perdita 200k → 1M |
|---|---|---|---|---|---|---|
| 11 | a4 | Migliore | Ottima | Ottima | false | 0.000 → 0.000 |
| 12 | d6 | Migliore | Ottima | Migliore | false | 0.000 → 0.187 |
| 13 | O-O | Ottima | Migliore | Migliore | true | 0.125 → 0.000 |
| 16 | Be6 | Migliore | Ottima | Migliore | false | 0.000 → 0.125 |
| 20 | O-O | Ottima | Buona | Buona | true | 1.874 → 3.186 |
| 23 | b3 | Ottima | Migliore | Migliore | true | 0.250 → 0.000 |
| 25 | Rfxd1 | Ottima | Migliore | Migliore | true | 0.125 → 0.000 |
| 26 | Rad8 | Migliore | Ottima | Ottima | true | 0.000 → 0.187 |
| 27 | Rdc1 | Migliore | Ottima | Ottima | false | 0.000 → 0.687 |
| 28 | Nd4 | Ottima | Migliore | Migliore | true | 0.062 → 0.000 |
| 30 | Rd6 | Migliore | Ottima | Migliore | false | 0.000 → 0.062 |
| 45 | Nc3 | Ottima | Migliore | Ottima | false | 0.375 → 0.000 |

## Limiti e decisione

Due partite di grandi maestri non rappresentano le partite amatoriali. Cambiamento non significa miglioramento: mancano etichette esterne.
Nessuna nuova precisione generale, nessuna correzione/regressione dimostrata rispetto a Chess.com. Il risultato storico 329/592 resta distinto.
Conservare il profilo rapido e l’approfondimento facoltativo. Il costo e i cambiamenti misurati non giustificano da soli un aumento globale.
Per decidere servono riferimenti indipendenti su partite nuove e una misura nel browser sui dispositivi di destinazione.

Verifica offline: classificazioni ricostruite da tutti i raw conservati, piano selettivo e telemetria riconciliati. Nessuna ricerca aggiuntiva.
