# Diagnosi mirata Rb3: accettazione del cavallo

8 ottobre 2026. Protocollo preventivo per il caso storico già annotato Geniale: Chigorin–Steinitz, ply 53 Rb3. Selezione dichiaratamente guidata dal caso da spiegare; non campione per misurare precisione o richiamo. Nessuna regola adattata al risultato.

Fonte: cache large 200k storica e audit dei sacrifici già salvati. Verificare PGN, FEN e legalità di Rb3 e Qxh8. Partite 7–10 e .env esclusi; app, soglie, Grande, cache/file esistenti invariati, nessun commit/push.

## Ricerche

Due ricerche indipendenti della posizione DOPO Rb3, vincolate alla sola radice c8h8 (Qxh8). Stockfish npm 19.0.0 large-single, MultiPV 1, Threads 1, Hash 16; ucinewgame e Clear Hash prima di ciascuna. Budget fissati 200.000 e 1.000.000 nodi. Massimo nominale 1.200.000; tetto effettivo 1.300.000, con 2.000 nodi di riserva prima di avviare ciascuna ricerca. Non aumentare il budget dopo l'esito.

Salvare raw UCI completo, effettivi nodi/tempo, ultimo score senza bound e root corretto, depth e nodi al relativo score; replay legale della PV. È una ricerca su una risposta, non enumerazione di tutte le difese.

Score UCI dal lato del Nero, invertito per il Bianco. Mostrare cp/mate senza convertire distanze mate in cp; registrare materiale per ply e probabilità locale come stima. Se non emerge uno score valido, esito insufficiente. Confrontare le due ricerche e la miglior difesa memorizzata (...Kg7, -672 cp dal lato Nero). Le ricerche separatamente possono avere precisioni diverse: non trasformare una differenza cp in un'ottimalità dimostrata.

## Interpretazione

Accettazione favorevole al Bianco confermerebbe la compensazione stimata per questa offerta, ma non rimuoverebbe le altre esclusioni della v1: Rb3 è Ottima locale e ci sono alternative già vincenti. Non adottare Geniale per recuperare il riferimento storico. Dopo le due ricerche fermare la raccolta e documentare il risultato, senza ulteriori go.
