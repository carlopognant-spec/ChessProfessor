# Copertura dei commenti mossa per mossa

I 280 percorsi contengono 8930 semimosse. Ogni semimossa giocata ha una spiegazione dei suoi effetti, distinta dalla risposta realmente eseguita dall’avversario. I testi sono calcolati sulla posizione: non vengono dichiarati commenti strategici individualmente scritti.

I passaggi con una nota scritta sono 1835 su 4492 coppie di mosse; 45 percorsi hanno una nota scritta per ogni coppia. Questi sono utilizzi nel corso: lo stesso testo può essere riusato su prefissi esattamente uguali. Non sono conteggi di testi unici.

Famiglie interamente commentate per coppia: **Sistema di Londra, Apertura Catalana**. Sono state aggiunte 91 note individuali ai passaggi precedentemente scoperti di queste famiglie. Anche gli altri percorsi conservano le note già presenti e le spiegazioni posizionali di ogni mossa.

Le note strategiche scritte restano un approfondimento. Il riepilogo del turno descrive prima la mossa dell’allievo e poi l’effettiva risposta avversaria: giocando con il Nero, questa è la successiva mossa del Bianco. Le spiegazioni non compaiono prima di aver giocato.

Le frecce includono gli attacchi scoperti con origine nel pezzo che controlla davvero il bersaglio. Controllo, pressione e sostegno descrivono la geometria: non certificano che una futura cattura sia legale o vantaggiosa. Non viene attivato Stockfish.

| Famiglia | Percorsi | Semimosse spiegate | Coppie con nota scritta | Percorsi interamente commentati per coppia |
| --- | ---: | ---: | ---: | ---: |
| Partita Italiana | 11 | 354 | 66/178 | 1 |
| Partita Spagnola | 14 | 446 | 99/224 | 1 |
| Difesa Siciliana | 19 | 606 | 92/304 | 1 |
| Difesa Francese | 14 | 449 | 77/226 | 1 |
| Difesa Caro-Kann | 16 | 511 | 103/257 | 1 |
| Difesa Scandinava | 6 | 191 | 35/96 | 1 |
| Difesa Pirc e Moderna | 6 | 193 | 42/97 | 1 |
| Difesa Alekhine | 6 | 191 | 43/96 | 1 |
| Difesa Petrov | 6 | 193 | 42/97 | 1 |
| Partita Scozzese | 5 | 159 | 37/80 | 1 |
| Partita Viennese | 5 | 159 | 32/80 | 1 |
| Gambetto di Re | 6 | 191 | 35/96 | 1 |
| Difesa Philidor | 5 | 159 | 33/80 | 1 |
| Gambetto di Donna | 17 | 545 | 82/274 | 1 |
| Sistema di Londra | 5 | 159 | 80/80 | 5 |
| Difesa Est-Indiana | 14 | 439 | 126/224 | 1 |
| Difesa Grünfeld | 5 | 161 | 37/81 | 1 |
| Difesa Nimzo-Indiana | 5 | 161 | 38/81 | 1 |
| Difesa Ovest-Indiana | 5 | 159 | 37/80 | 1 |
| Apertura Catalana | 5 | 159 | 80/80 | 5 |
| Difesa Olandese | 6 | 191 | 39/96 | 1 |
| Difesa Benoni e Benko | 6 | 191 | 39/96 | 1 |
| Gambetto di Budapest | 5 | 159 | 40/80 | 1 |
| Apertura Inglese | 10 | 319 | 46/160 | 1 |
| Apertura Réti | 6 | 193 | 32/97 | 1 |
| Partita dei Quattro Cavalli | 6 | 191 | 44/96 | 1 |
| Apertura Larsen | 6 | 191 | 28/96 | 1 |
| Apertura Bird | 6 | 191 | 30/96 | 1 |
| Attacco Trompowsky | 6 | 191 | 36/96 | 1 |
| Sistemi Colle e Torre | 6 | 191 | 38/96 | 1 |
| Difesa Bogo-Indiana | 6 | 191 | 43/96 | 1 |
| Difesa Vecchia Indiana | 6 | 191 | 41/96 | 1 |
| Difesa Nimzowitsch | 6 | 191 | 36/96 | 1 |
| Difesa Owen | 6 | 191 | 33/96 | 1 |
| Altre aperture di Re | 6 | 191 | 34/96 | 1 |
| Aperture di Donna e sistemi | 6 | 191 | 32/96 | 1 |
| Altre aperture e sistemi | 6 | 191 | 28/96 | 1 |

I passaggi ancora privi di nota scritta sono elencati per percorso in [formato leggibile dalla macchina](data/opening-commentary-coverage.json). La scrittura individuale integrale resta un lavoro aperto; le spiegazioni posizionali non vengono contate come revisione editoriale.

Rigenerazione: `node scripts/report-opening-commentary.mjs`. I test riproducono tutte le mosse dei 280 percorsi e controllano i fatti dichiarati sulla scacchiera, oltre alle transizioni dei turni e ai casi di en passant, arrocco, promozione e attacco scoperto.
