# Cinque scelte dopo 6...d4: protocollo prima della raccolta

12 ottobre 2026. Posizione ricostruita dalle immagini: 1.e4 e5 2.Nf3 Nc6
3.Nc3 Nf6 4.g3 Nxe4 5.Nxe4 d5 6.Nc3 d4. Candidati: Qe2, d3, Bd3, Bb5,
Bg2. Riferimenti forniti dall'utente: prime quattro Geniale, Bg2 Migliore.
Le annotazioni vengono confrontate solo dopo la classificazione.

Congelare le regole correnti; nessuna modifica a soglie, rating o classificatore.
Tredici ricerche da 200.000 nodi ciascuna, Stockfish 19.0.0 large-single,
MultiPV 5, un thread, Hash 16 MB, ucinewgame + Clear Hash per ricerca:

- posizione prima di 6...d4, per il contesto;
- posizione dopo 6...d4 con tutte le mosse disponibili, configurazione dell'app;
- stessa posizione con searchmoves limitato alle cinque scelte: confronto
  diagnostico a copertura mirata, non ricerca di una migliore globale;
- cinque posizioni dopo ciascuna scelta, senza restrizioni;
- cinque posizioni dopo la risposta legale ...dxc3, senza restrizioni.

Budget nominale 2.600.000 nodi; tetto telemetrico 2.665.000; riserva 5.000
per ricerca. Nessuna ricerca aggiuntiva o ripetizione automatica dopo errore.
Conservare raw, metadati e risultati di ogni ricerca prima delle verifiche.

Applicare la politica prima con la root standard e poi con la root mirata,
riportando separatamente i risultati. La seconda può chiarire i rifiuti dovuti
a scelte fuori dalla MultiPV standard, ma non è il comportamento di produzione
e non può provare che la prima scelta delle cinque sia migliore di tutte le
mosse legali. Non sostituire dati della root standard con singoli score mirati.

Per ogni scelta verificare identità del cavallo offerto, catture legali,
recupero immediato, score dopo accettazione, compensazione corroborata e primo
blocco del criterio. Confrontare positivi e negativo della stessa posizione.
Qualunque differenza numerica dalle immagini può dipendere da build/profondità;
non correggere le regole per adattarle a questo unico caso.

Preservare le 20 dipendenze congelate, cache e report precedenti. Non leggere
.env o partite riservate 7–10. Manifest monouso prima di avviare il motore.
