# 3.1 Diagnosi e 3.2 Precisione dalle cache

Nessuna ricerca motore. Soglie e classificazioni invariate. Dati di sviluppo, non validazione.

| Gruppo | Motore/budget | TP | FP | FN | Precisione categoria | Richiamo |
|---|---|---:|---:|---:|---:|---:|
| development | native16Depth12 | 1 | 0 | 9 | 100.0% | 10.0% |
| development | large19Nodes200k | 1 | 0 | 9 | 100.0% | 10.0% |
| historical | native16Depth12 | 0 | 0 | 0 | N/D | N/D |
| historical | large19Nodes200k | 0 | 0 | 0 | N/D | N/D |

Grande/Geniale non attivate: nessuna prova completa di unicità o di sacrificio/miglior difesa/controfattuale. Diagnosi di ogni esempio in results.json; nessuna nuova soglia inventata.

| Partita | Bianco SF16 | Nero SF16 | Bianco large200k | Nero large200k |
|---|---:|---:|---:|---:|
| personal-01 | 74.93 | 63.29 | 67.67 | 59.52 |
| personal-02 | 87.04 | 78.72 | 87.66 | 76.11 |
| personal-03 | 72.09 | 87.19 | 59.77 | 85.47 |
| personal-04 | 90.91 | 65.27 | 86.48 | 50.64 |
| personal-05 | 70.78 | 52.80 | 63.15 | 36.57 |
| personal-06 | 93.00 | 82.12 | 93.55 | 81.82 |
| game-1-chigorin-steinitz-1892 | 90.01 | 85.14 | 87.75 | 82.97 |
| game-2-saintamant-staunton-1843 | 89.54 | 92.57 | 88.38 | 91.94 |

Precisione da formula richiesta, senza bonus +1 del codice lila; pesi e aggregazione verificati sulle fonti ufficiali. Clamp cp e mate a ±1000; stallo = 0 cp; catena unica di FEN tramite playedEngine, nessuna fusione dei root score indipendenti. Non equivale alla formula privata chess.com. Correlazione/scarto e stima livello NON ESEGUITI: mancano i dati dell’utente.

## Tutti i casi Mossa mancata sul motore adottato

| Partita | Ply | Mossa | Attesa | Ottenuta | Motivo | best cp/mate | played cp/mate |
|---|---:|---|---|---|---|---|---|
| personal-01 | 30 | Nh5 | Mossa mancata | mistake | no-confirmed-winning-opportunity | 49 | -191 |
| personal-01 | 35 | Bc3 | Mossa mancata | missed | confirmed | 705 | -122 |
| personal-02 | 51 | Qxf7+ | Mossa mancata | inaccuracy | no-opponent-error | mate 13 | 925 |
| personal-02 | 69 | Ra6+ | Mossa mancata | inaccuracy | no-opponent-error | mate 1 | 1149 |
| personal-03 | 27 | Nxe5 | Mossa mancata | mistake | no-confirmed-winning-opportunity | 398 | 122 |
| personal-03 | 28 | Nxe5 | Mossa mancata | blunder | no-confirmed-winning-opportunity | -122 | -516 |
| personal-03 | 44 | Kxe6 | Mossa mancata | mistake | no-opponent-error | 836 | 379 |
| personal-03 | 94 | Qg1+ | Mossa mancata | excellent | no-opponent-error | 1041 | 884 |
| personal-05 | 12 | Nxf2 | Mossa mancata | inaccuracy | no-confirmed-winning-opportunity | 105 | -51 |
| personal-05 | 14 | Qxd7 | Mossa mancata | mistake | no-confirmed-winning-opportunity | 345 | 123 |

24 hash invariati; go = 0. Cache e baseline intatti.
