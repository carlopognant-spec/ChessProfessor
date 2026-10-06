# Prima regola locale per Mossa mancata

Fase autorizzata da Carlo dopo la proposta di affrontare questa categoria. La definizione pubblica di [chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) descrive un'occasione di ottenere una posizione vincente persa dopo un errore dell'avversario; i criteri dipendono dal rating. Non pubblica tutti i parametri necessari a riprodurla.

## Regola implementata

App e QA usano `classifyMissedOpportunity`, dopo la classificazione comune, con probabilità dalla prospettiva di chi muove:

1. La mossa precedente appartiene all'avversario e il suo FEN finale coincide con il FEN iniziale corrente.
2. La categoria comune della mossa precedente è Errore o Errore grave. Una mossa Libro non avvia il riconoscimento.
3. Prima dell'errore, `1 - previous.bestProbability <= 0.60`: non c'era già il vantaggio richiesto dalla regola.
4. Dopo l'errore, `1 - previous.playedProbability >= 0.75` e `current.bestProbability >= 0.75`: entrambe le analisi confermano l'occasione.
5. Dopo la mossa giocata, `current.playedProbability <= 0.60`: l'occasione non è conservata.
6. La PV principale propone una mossa diversa da quella giocata. La mossa giocata e fino a otto semimosse della PV sono legali secondo chess.js. Una PV di una sola semimossa viene accettata solo se dà effettivamente matto.

Libro, Non valutabile e matto dato conservano la priorità. Score assenti o contesto incompleto non producono Mossa mancata. La categoria comune rimane in `baseClassification`; `dropPct` non cambia. Il contesto viene ricalcolato anche sui cache hit e non viene memorizzato nella cache FEN+mossa.

I limiti 0.75/0.60 sono una scelta locale provvisoria sulla sigmoid(cp/400), senza rating. Sono stati scelti dopo aver ispezionato i dieci esempi di sviluppo, senza cercare valori che massimizzino la coincidenza. Non sono coefficienti pubblicati da chess.com né validati indipendentemente. Legittimità della PV significa legalità delle mosse, non prova autonoma che la linea vinca; la valutazione è quella del motore. Il confronto tra ricerche può ancora avere rumore.

## Risultato sulle stesse cache

- Un solo caso riconosciuto tra i dieci attesi: personal-01, ply 35 Bc3, dopo Qxd4. Alternativa verificata: Bh7+ Kxh7 Qxd4 Kg8 Bc3 e5 Rxe5 Rxe5.
- Cinque casi falliscono la conferma dell'occasione vincente: personal-01 ply 30; personal-03 ply 27 e 28; personal-05 ply 12 e 14.
- Quattro non sono preceduti da Errore/Errore grave secondo le valutazioni locali: personal-02 ply 51 e 69; personal-03 ply 44 e 94.
- Il report espone il primo criterio non soddisfatto, non tutti i motivi possibili. Nessuna etichetta attesa è usata per decidere la categoria.

La copertura dei casi attesi è 1/10: non è sufficiente a dichiarare la categoria equivalente a Game Review. Nessuna ulteriore taratura effettuata per recuperare gli altri nove.

## Metriche e denominatori

Mossa mancata entra nel confronto esatto: 342 mosse incluse invece di 332, con 174 esatte (50.87719298245614%). Le 57 esclusioni rimaste sono Libro, Grande, Geniale e Forzata. La corrispondenza sulle sole categorie comuni rimane 173/332 (52.10843373493976%).

Mossa mancata non ha una posizione nella scala Migliore–Errore grave: la metrica entro una classe usa le 332 categorie comuni attese, 300 entro una classe (90.36144578313252%). Se una categoria comune viene prevista come Mossa mancata, non conta come entro una classe. Non si attribuisce una distanza ordinale arbitraria a questa categoria.

Il QA legge il repertorio locale soltanto per le protezioni del contesto; continua a escludere dal confronto le etichette attese Libro, senza introdurre una nuova verifica delle etichette Libro in questa fase. Le baseline sono preservate nei report `before-missed-opportunity`. Partite 7–10 non lette e non usate.
