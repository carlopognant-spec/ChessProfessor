# Grande: contesto delle prese, confronto per partita

8 ottobre 2026. Protocollo scritto prima della nuova estrazione/addestramento. Zero nuove ricerche motore, app e file precedenti intatti, niente .env/7–10 o commit/push. Dataset personali 1–6 e due storiche già studiato: nessuna validazione indipendente.

## Ipotesi e caratteristiche aggiuntive

Il modello prudente precedente usa errore avversario + mossa senza presa. Per cercare una famiglia distinta di Grande che catturano, aggiungere sette proprietà calcolate senza riferimenti Chess.com:

1. Il pezzo catturato è proprio quello mosso dall'avversario nel ply precedente, anche quando il precedente non aveva catturato.
2. L'avversario ha almeno una risposta legale che cattura il pezzo appena mosso. Considerare il pezzo promosso e la casa effettiva della cattura en passant. È possibilità, non previsione di una ricattura favorevole.
3. La mossa precedente dell'avversario era una presa.
4. La precedente mossa dello stesso giocatore era una presa.
5. Il saldo materiale prima della mossa è non positivo, con valori 1/3/3/5/9. Nessuna soglia selezionata dai risultati.
6. Prima dell'ultima mossa avversaria, la probabilità locale dal lato del giocatore era al massimo 0,60: invertire la migliore valutazione root precedente, con curva esistente e mate positivo/negativo. Score mancanti/bound sono sconosciuti.
7. La precedente mossa dello stesso giocatore aveva già una probabilità root almeno 0,75. Score mancanti/bound sono sconosciuti.

Mantenere le dodici proprietà originali. Non introdurre feature dipendenti da SAN, ply, ID, Elo o categorie di riferimento; non escludere globalmente le ricatture.

## Modello e confronto

Stessa politica prudente: costo FP=4, TP=1, Laplace almeno 0,80, almeno tre nuovi positivi per regola, massimo due regole con uno/due predicati. Nessun allentamento del supporto per recuperare singoli esempi. Addestrare da zero su cinque personali e predire la sesta; storico con training su tutte le sei, senza addestramento storico. Conservare Geniale v1 e il filtro candidato precedente.

Confronto appaiato per mossa con il precedente modello prudente: TP/FP/FN, precisione/richiamo per gruppo, nuovi positivi, positivi persi, errori introdotti/corretti. Riportare tutte le regole per fold; nessuna unione automatica dei due modelli. Nessuna scelta post hoc delle caratteristiche e nessuna attivazione nell'app.

Test della nuova estrazione: prese, ricattura legale contro attacco di pezzo inchiodato, promozione, en passant, colori, catena interrotta, prospettiva precedente, valori ignoti e immutabilità. Hash sorgenti verificati prima/dopo.
