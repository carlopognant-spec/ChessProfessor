# Decisione dopo il confronto pubblico

Due partite nuove, 130 semimosse, 260 ricerche fissate in anticipo.
200k nodi: 93,21 secondi; 1M: 470,02 secondi, rapporto 5,04.
Il costo riguarda il motore WASM tramite Node su questo PC, non il browser
o il telefono. Nessuna misura energetica o di memoria.

## Che cosa cambia

32 categorie cambiano; 25 transizioni sono Migliore/Ottima. La prima scelta
cambia su 38 semimosse, comprese mosse per cui la categoria non cambia.
Il classificatore corrente distingue la prima scelta da alternative quasi
equivalenti: alcuni passaggi Migliore/Ottima corrispondono a perdite molto
piccole, non a un cambiamento importante della qualità pratica della mossa.

Le altre sette transizioni: due Imprecisione -> Ottima, una Buona ->
Imprecisione, una Errore -> Imprecisione, due Ottima -> Buona, una Grande ->
Migliore. Nessuna etichetta indipendente è disponibile: non sono correzioni
o regressioni dimostrate rispetto a Chess.com.

Nel caso 37...Be4 della prima partita, Be4 resta la prima scelta a entrambi
i budget. A 200k la migliore alternativa analizzata è ...h6 (+0,96 per il
Nero), mentre Be4 vale +4,73. A 1M la migliore alternativa diventa ...h5
(+1,39), mentre Be4 vale +4,52. Il divario nella scala locale scende da
0,20568 a 0,16983, sotto il criterio Grande di 0,20. La mossa resta Migliore,
ma perde la conferma Grande perché l'alternativa è rivalutata. Sono confronti
tra le cinque alternative analizzate, non prove su tutte le mosse legali.

Libro: 19 mosse, invariato. Non ci sono categorie Geniale, Mancata, Forzata
o Errore grave in nessuna delle due versioni: questo campione non misura
la sensibilità di quelle categorie né la loro precisione.

## Limiti dell'approfondimento selettivo attuale

Il primo lotto di 12 mosse per partita intercetta 11 dei 32 cambiamenti
della ricerca completa: 3/20 nella prima partita, 8/12 nella seconda.
Non produce ulteriori transizioni rispetto alla versione completa in questo
campione, ma rimane diverso da essa su 21 righe.

Dei 21 cambiamenti non intercettati:

- 10 erano già mosse dubbie, oltre il limite del primo lotto;
- 11 non erano segnalati come dubbie all'inizio. Sono dieci mosse inizialmente
  Migliori con perdita zero e la Grande già confermata.

La scelta cronologica concentra il primo lotto nella prima parte della
partita. Inoltre una prima scelta inizialmente coerente con perdita zero
può cambiare con più ricerca, anche se nessun segnale iniziale la seleziona.
Premere nuovamente il comando può coprire altre mosse già dubbie; non
garantisce di selezionare quelle che non erano segnalate.

Costo aggiuntivo del lotto, sommando le ricerche già misurate: 139,58 secondi.
Iniziale più lotto: circa 232,80 secondi, rispetto ai 470,02 della ricerca
completa a 1M. È una somma dei costi osservati, non una nuova misura end-to-end
dell'app. Il confronto selettivo ha riusato i raw, senza altre ricerche.

## Raccomandazione

Conservare analisi rapida e approfondimento facoltativo. Non adottare 1M
ovunque sulla base di soli cambi di categoria. Un prossimo studio dovrebbe
valutare la priorità delle mosse selezionate, la verifica delle etichette
speciali già confermate e la stabilità della prima scelta tra alternative
vicine. Sono ipotesi da verificare, non nuovi criteri attivati.

Per misurare precisione e beneficio reale servono riferimenti indipendenti
su partite nuove. Per decidere il costo per gli utenti servono misure nel
browser e sui dispositivi di destinazione. Una simulazione di rallentamento
del PC non sostituirebbe una misura sul telefono.

App, profilo iniziale, criteri, rating e risultato storico 329/592 invariati.
156.059.772 nodi effettivi sotto il limite 157.300.000, nessun retry o
ampliamento del campione. Raw, manifest, timing e verifica offline conservati;
20 input congelati integri. Non rilanciare la raccolta monouso.
