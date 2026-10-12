# Confronto del budget su due partite pubbliche nuove

12 ottobre 2026. Selezione fissata prima delle ricerche: le prime due partite
nell'ordine del file WorldChamp2024.pgn di PGN Mentor. Nessuna selezione per
mosse, valutazioni o risultati del motore. Partite di grandi maestri: campione
piccolo e non rappresentativo delle partite amatoriali.

Confronto completo 200.000 / 1.000.000 nodi per ciascuna FEN distinta, includendo
iniziale e finale. Budget totale: 1.200.000 nodi per FEN non terminale, più
5.000 di riserva per ciascuna ricerca. Due sole ricerche per FEN, alternando
l'ordine dei budget tra posizioni. Nessuna ripetizione, estensione o retry.
Manifest con FEN, budget e hash prima del primo go; marker monouso.

Stockfish npm 19.0.0 large-single WASM, un thread, Hash 16 MB, MultiPV 5,
hash pulita e ucinewgame a ogni ricerca. Stesso codice di classificazione
dell'app, libro attivo fino alla prima uscita. Confrontare anche il primo
lotto selettivo di massimo 12 mosse tramite le API applicative, riusando
soltanto le ricerche a 1M di questa raccolta: nessun go aggiuntivo.

Registrare raw UCI, nodi effettivi, tempo UCI e tempo della richiesta con
trasporto Node. Il tempo riguarda questo PC e il motore WASM fuori dal browser:
non misura apertura dell'app, caricamento della rete neurale nel browser,
fluidità dell'interfaccia, batteria o prestazioni del telefono. Nessuna
misura di RAM o consumo energetico viene dedotta dal solo tempo.

Metriche: tempo totale e rapporto, distribuzione dei tempi accoppiati,
prima scelta cambiata, score cambiati, transizioni delle categorie, evidenza
coerente e copertura del lotto selettivo rispetto al confronto completo.
Le categorie a 1M sono un confronto più costoso, non verità di riferimento.
Non esistono etichette indipendenti per queste partite: precisione, correzioni
e regressioni rispetto a Chess.com restano non misurabili.

Non modificare app, soglie, rating, profili predefiniti, cache o report
precedenti. Verificare i 20 input congelati prima e dopo. Non leggere .env
o partite personali riservate 7–10. Eventuali etichette fornite dall'utente
saranno un esperimento distinto, senza cambiare questo campione a posteriori.
