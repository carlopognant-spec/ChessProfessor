# Geniale v2 — confronto offline

Protocollo: ../brilliant-offer-v2-protocol.md. Dati già studiati, nessuna validazione indipendente.

| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |
|---|---|---:|---:|---:|---:|---:|
| development | v1 | 1 | 0 | 0 | 1 | 1 |
| development | v2 | 1 | 1 | 0 | 0.5 | 1 |
| historical | v1 | 0 | 0 | 2 | n/d | 0 |
| historical | v2 | 0 | 1 | 2 | 0 | 0 |
| all | v1 | 1 | 0 | 2 | 1 | 0.3333333333333333 |
| all | v2 | 1 | 2 | 2 | 0.3333333333333333 | 0.3333333333333333 |

Astensioni: 26. Ricerche eseguite: 0. Esiti modificati dall'evidenza supplementare mirata: 0.

| Partita | Ply | SAN | Riferimento | V2 | Motivo | Alternative vincenti senza sacrificio |
|---|---:|---|---|---|---|---|
| personal-02 | 14 | O-O | Ottima | true | supported-material-offer |  |
| personal-06 | 11 | Nxe5 | Geniale | true | supported-material-offer |  |
| game-1-chigorin-steinitz-1892 | 53 | Rb3 | Geniale | false | winning-nonsacrifice-alternative | h8f7, h5f7 |
| game-1-chigorin-steinitz-1892 | 55 | Rf3 | Migliore | true | supported-material-offer |  |
| game-1-chigorin-steinitz-1892 | 61 | Rxf5+ | Geniale | false | winning-nonsacrifice-alternative | g4g5, h6f8 |

## Tutti i candidati materiali

| Partita | Ply | SAN | Riferimento | Base | V2 | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 11 | Bd2 | Ottima | Ottima | false | missing-acceptance-score |
| personal-01 | 23 | a4 | Ottima | Ottima | false | missing-acceptance-score |
| personal-01 | 25 | Bb4 | Buona | Ottima | false | missing-acceptance-score |
| personal-01 | 27 | c4 | Ottima | Ottima | false | ordinary-exchanges |
| personal-01 | 29 | Qd2 | Errore | Errore | false | protected-category |
| personal-01 | 31 | g4 | Errore | Errore | false | protected-category |
| personal-01 | 35 | Bc3 | Mossa mancata | Mossa mancata | false | protected-category |
| personal-01 | 37 | Qe3 | Ottima | Ottima | false | missing-acceptance-score |
| personal-01 | 40 | Nd7 | Ottima | Buona | false | protected-category |
| personal-02 | 6 | Na6 | Imprecisione | Imprecisione | false | protected-category |
| personal-02 | 8 | Nf6 | Ottima | Ottima | false | ordinary-exchanges |
| personal-02 | 10 | e5 | Migliore | Migliore | false | ordinary-exchanges |
| personal-02 | 12 | Bb4 | Migliore | Migliore | false | ordinary-exchanges |
| personal-02 | 13 | Nxe5 | Ottima | Ottima | false | ordinary-exchanges |
| personal-02 | 14 | O-O | Ottima | Ottima | true | supported-material-offer |
| personal-02 | 15 | Bd2 | Buona | Imprecisione | false | protected-category |
| personal-02 | 16 | d6 | Buona | Imprecisione | false | protected-category |
| personal-02 | 17 | Nxf7 | Errore grave | Errore grave | false | protected-category |
| personal-02 | 19 | Bc4 | Migliore | Migliore | false | poor-after-position |
| personal-02 | 20 | Kf8 | Errore grave | Errore grave | false | protected-category |
| personal-02 | 23 | a3 | Migliore | Migliore | false | ordinary-exchanges |
| personal-02 | 26 | Bg4 | Migliore | Migliore | false | missing-acceptance-score |
| personal-02 | 30 | Bxf2+ | Errore grave | Errore grave | false | protected-category |
| personal-02 | 32 | b5 | Imprecisione | Buona | false | protected-category |
| personal-02 | 34 | Bh5 | Buona | Ottima | false | poor-after-position |
| personal-02 | 36 | Bg6 | Errore | Ottima | false | poor-after-position |
| personal-02 | 38 | d5 | Buona | Buona | false | protected-category |
| personal-02 | 40 | Kf8 | Imprecisione | Buona | false | protected-category |
| personal-02 | 44 | Kg7 | Migliore | Ottima | false | poor-after-position |
| personal-02 | 46 | Bxe4 | Imprecisione | Ottima | false | poor-after-position |
| personal-02 | 48 | Kf8 | Imprecisione | Buona | false | protected-category |
| personal-02 | 50 | Qf7 | Migliore | Ottima | false | poor-after-position |
| personal-03 | 10 | h6 | Ottima | Ottima | false | ordinary-exchanges |
| personal-03 | 16 | f4 | Imprecisione | Imprecisione | false | protected-category |
| personal-03 | 18 | a6 | Imprecisione | Buona | false | protected-category |
| personal-03 | 27 | Nxe5 | Mossa mancata | Errore | false | protected-category |
| personal-03 | 30 | Qe7 | Buona | Ottima | false | poor-after-position |
| personal-03 | 40 | Rhg8 | Ottima | Migliore | false | poor-after-position |
| personal-03 | 41 | Re6+ | Errore grave | Errore grave | false | protected-category |
| personal-03 | 43 | dxe6 | Errore | Imprecisione | false | protected-category |
| personal-03 | 44 | Kxe6 | Mossa mancata | Errore | false | protected-category |
| personal-03 | 51 | f3 | Buona | Buona | false | protected-category |
| personal-03 | 53 | a4 | Imprecisione | Imprecisione | false | protected-category |
| personal-03 | 55 | Ke1 | Imprecisione | Imprecisione | false | protected-category |
| personal-03 | 57 | Kd2 | Buona | Migliore | false | poor-after-position |
| personal-03 | 59 | Ke1 | Buona | Ottima | false | poor-after-position |
| personal-03 | 61 | c5 | Ottima | Ottima | false | poor-after-position |
| personal-03 | 63 | d4 | Migliore | Migliore | false | poor-after-position |
| personal-03 | 65 | Kd2 | Buona | Ottima | false | poor-after-position |
| personal-03 | 67 | Kd3 | Migliore | Ottima | false | poor-after-position |
| personal-03 | 76 | h2 | Ottima | Migliore | false | winning-nonsacrifice-alternative |
| personal-03 | 79 | Ke3 | Errore | Ottima | false | poor-after-position |
| personal-04 | 9 | Bf4 | Buona | Ottima | false | missing-acceptance-score |
| personal-04 | 10 | e6 | Migliore | Ottima | false | missing-acceptance-score |
| personal-04 | 11 | Bg2 | Migliore | Migliore | false | ordinary-exchanges |
| personal-04 | 12 | Bd6 | Ottima | Ottima | false | ordinary-exchanges |
| personal-04 | 15 | Ng5 | Imprecisione | Imprecisione | false | protected-category |
| personal-04 | 21 | e5 | Errore | Errore | false | protected-category |
| personal-04 | 23 | Nd2 | Imprecisione | Errore | false | protected-category |
| personal-04 | 25 | a3 | Migliore | Ottima | false | poor-after-position |
| personal-04 | 27 | Nxc4 | Migliore | Migliore | false | poor-after-position |
| personal-04 | 30 | Kf8 | Migliore | Buona | false | protected-category |
| personal-04 | 34 | Nbc6 | Migliore | Ottima | false | poor-after-position |
| personal-04 | 40 | Nxd4 | Errore | Imprecisione | false | protected-category |
| personal-04 | 42 | Ke7 | Forzata | Migliore | false | forced-move |
| personal-04 | 46 | Be4+ | Imprecisione | Ottima | false | poor-after-position |
| personal-04 | 47 | f3 | Ottima | Ottima | false | winning-nonsacrifice-alternative |
| personal-04 | 48 | Nd4 | Errore | Ottima | false | poor-after-position |
| personal-04 | 55 | Rac1 | Migliore | Ottima | false | missing-acceptance-score |
| personal-05 | 6 | Nf6 | Libro | Libro | false | protected-category |
| personal-05 | 8 | Nxe4 | Libro | Libro | false | protected-category |
| personal-05 | 10 | Bc5 | Buona | Buona | false | protected-category |
| personal-05 | 13 | Bxd7+ | Errore | Errore grave | false | protected-category |
| personal-05 | 14 | Qxd7 | Mossa mancata | Errore | false | protected-category |
| personal-05 | 15 | Qe2 | Errore grave | Errore grave | false | protected-category |
| personal-05 | 18 | b6 | Buona | Ottima | false | winning-nonsacrifice-alternative |
| personal-05 | 20 | O-O | Migliore | Migliore | false | winning-nonsacrifice-alternative |
| personal-05 | 22 | Qe7 | Imprecisione | Imprecisione | false | protected-category |
| personal-05 | 23 | Qe4 | Buona | Ottima | false | poor-after-position |
| personal-05 | 24 | Qxg5 | Errore grave | Errore grave | false | protected-category |
| personal-05 | 26 | Nf2 | Errore | Buona | false | protected-category |
| personal-05 | 28 | Re8 | Ottima | Ottima | false | poor-after-position |
| personal-05 | 30 | g5 | Ottima | Ottima | false | poor-after-position |
| personal-05 | 33 | Kd2 | Ottima | Migliore | false | ordinary-exchanges |
| personal-05 | 34 | Re8 | Buona | Buona | false | protected-category |
| personal-05 | 35 | Re1 | Migliore | Migliore | false | winning-nonsacrifice-alternative |
| personal-05 | 36 | Kf8 | Errore | Errore | false | protected-category |
| personal-06 | 11 | Nxe5 | Geniale | Migliore | true | supported-material-offer |
| personal-06 | 14 | Bxd4 | Buona | Buona | false | protected-category |
| personal-06 | 16 | d6 | Migliore | Migliore | false | missing-acceptance-score |
| personal-06 | 18 | Bg4 | Errore | Imprecisione | false | protected-category |
| personal-06 | 20 | Bh5 | Buona | Imprecisione | false | protected-category |
| personal-06 | 22 | Bg6 | Migliore | Migliore | false | poor-after-position |
| personal-06 | 24 | h6 | Migliore | Migliore | false | poor-after-position |
| personal-06 | 26 | c5 | Buona | Imprecisione | false | protected-category |
| personal-06 | 28 | b5 | Buona | Imprecisione | false | protected-category |
| personal-06 | 30 | b4 | Buona | Ottima | false | poor-after-position |
| personal-06 | 31 | Nd5 | Grande | Migliore | false | missing-acceptance-score |
| personal-06 | 32 | Qd7 | Buona | Errore | false | protected-category |
| personal-06 | 36 | Kg7 | Migliore | Migliore | false | poor-after-position |
| personal-06 | 40 | Ne5 | Migliore | Ottima | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 15 | Bb5 | Ottima | Buona | false | protected-category |
| game-1-chigorin-steinitz-1892 | 16 | exd4 | Imprecisione | Buona | false | protected-category |
| game-1-chigorin-steinitz-1892 | 17 | cxd4 | Migliore | Migliore | false | ordinary-exchanges |
| game-1-chigorin-steinitz-1892 | 18 | Bd7 | Imprecisione | Buona | false | protected-category |
| game-1-chigorin-steinitz-1892 | 20 | Nce7 | Errore | Buona | false | protected-category |
| game-1-chigorin-steinitz-1892 | 26 | Bb6 | Migliore | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 30 | d5 | Errore | Errore | false | protected-category |
| game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Migliore | false | ordinary-exchanges |
| game-1-chigorin-steinitz-1892 | 33 | Ba3 | Migliore | Ottima | false | missing-acceptance-score |
| game-1-chigorin-steinitz-1892 | 35 | Rb1 | Migliore | Migliore | false | missing-acceptance-score |
| game-1-chigorin-steinitz-1892 | 36 | Nhf5 | Errore | Imprecisione | false | protected-category |
| game-1-chigorin-steinitz-1892 | 37 | Nxf7 | Errore | Errore | false | protected-category |
| game-1-chigorin-steinitz-1892 | 40 | Kxe6 | Migliore | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 42 | Qc8 | Imprecisione | Imprecisione | false | protected-category |
| game-1-chigorin-steinitz-1892 | 44 | Kf6 | Imprecisione | Imprecisione | false | protected-category |
| game-1-chigorin-steinitz-1892 | 46 | g6 | Ottima | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 50 | Kf6 | Migliore | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 52 | Bxd4 | Buona | Buona | false | protected-category |
| game-1-chigorin-steinitz-1892 | 53 | Rb3 | Geniale | Ottima | false | winning-nonsacrifice-alternative |
| game-1-chigorin-steinitz-1892 | 54 | Qd7 | Ottima | Ottima | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 55 | Rf3 | Migliore | Migliore | true | supported-material-offer |
| game-1-chigorin-steinitz-1892 | 58 | Rg8 | Errore | Migliore | false | poor-after-position |
| game-1-chigorin-steinitz-1892 | 60 | Rg6 | Imprecisione | Errore | false | protected-category |
| game-1-chigorin-steinitz-1892 | 61 | Rxf5+ | Geniale | Migliore | false | winning-nonsacrifice-alternative |
| game-2-saintamant-staunton-1843 | 39 | Rac1 | Ottima | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 41 | Qd1 | Migliore | Migliore | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 43 | Nh4 | Imprecisione | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 45 | Qd2 | Ottima | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 46 | Nh7 | Buona | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 47 | Qc2 | Buona | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 49 | Kh1 | Buona | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 51 | Nf5 | Imprecisione | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 55 | Qb3 | Imprecisione | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore | Migliore | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 58 | Rc4 | Ottima | Migliore | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 59 | Na2 | Errore | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 60 | Nf6 | Migliore | Migliore | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 61 | Bd3 | Ottima | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 62 | Qc6 | Imprecisione | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 63 | Qb2 | Migliore | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 64 | Qd7 | Buona | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 65 | Kg1 | Ottima | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 66 | Nh5 | Errore | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 67 | Qd2 | Imprecisione | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 68 | f5 | Ottima | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 69 | f4 | Imprecisione | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 70 | Ng3 | Ottima | Ottima | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore | false | missing-acceptance-score |
| game-2-saintamant-staunton-1843 | 77 | Re2 | Imprecisione | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 78 | Rg6 | Migliore | Migliore | false | ordinary-exchanges |
| game-2-saintamant-staunton-1843 | 79 | Rd1 | Errore | Errore | false | protected-category |
| game-2-saintamant-staunton-1843 | 83 | Rde1 | Errore | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 87 | Qb2 | Imprecisione | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 89 | Kf2 | Migliore | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 91 | Qa2 | Buona | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 93 | g3 | Migliore | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 95 | Qa3 | Migliore | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 97 | Qc3 | Imprecisione | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 99 | h4 | Ottima | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 101 | Qe1 | Buona | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 103 | Kf1 | Migliore | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 105 | Kg1 | Migliore | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 107 | hxg5 | Ottima | Migliore | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 108 | Bxf4 | Buona | Ottima | false | winning-nonsacrifice-alternative |
| game-2-saintamant-staunton-1843 | 109 | Bxf4 | Buona | Buona | false | protected-category |
| game-2-saintamant-staunton-1843 | 110 | Qxe2 | Buona | Imprecisione | false | protected-category |
| game-2-saintamant-staunton-1843 | 122 | Rxb4 | Migliore | Ottima | false | winning-nonsacrifice-alternative |
| game-2-saintamant-staunton-1843 | 125 | Ke2 | Ottima | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 127 | Ke3 | Ottima | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 129 | Ke2+ | Ottima | Ottima | false | poor-after-position |
| game-2-saintamant-staunton-1843 | 131 | Ke1 | Ottima | Ottima | false | poor-after-position |

Grande, app e cache invariati. Nessun commit/push. Suite app/build/browser NON ESEGUITI.
