# Confronto QA

Classificazione locale in centipawn; dropPct non disponibile. Nessuna taratura. Le esclusioni possono sovrapporsi.

Motore: Stockfish 16; depth 12; MultiPV 5.

## Chigorin vs Steinitz, 1892 (World Championship Rematch, Game 1)

Ply: 61; inclusi: 40; esclusi unici: 21.
Corrispondenza esatta: 27.5%; entro una classe: 30%.

Conteggi attesi:
- Migliore: 19
- Ottima: 7
- Buona: 1
- Imprecisione: 9
- Errore: 5
- Errore grave: 0
- Libro: 12
- Geniale: 2
- Grande: 6
- Mossa mancata: 0

Esclusioni: {"book":12,"unsupported":8,"suspect":1,"missing":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Imprecisione | N/D | -6 | 35 | N/D | 29 | N/D | book |
| 2 | e5 | Libro | Imprecisione | N/D | -11 | -28 | N/D | -39 | N/D | book |
| 3 | Nf3 | Libro | Imprecisione | N/D | -3 | 40 | N/D | 37 | N/D | book |
| 4 | Nc6 | Libro | Imprecisione | N/D | -13 | -32 | N/D | -45 | N/D | book |
| 5 | Bc4 | Libro | Imprecisione | N/D | -24 | 42 | N/D | 18 | N/D | book |
| 6 | Bc5 | Libro | Imprecisione | N/D | -13 | -14 | N/D | -27 | N/D | book |
| 7 | b4 | Libro | Imprecisione | N/D | -47 | 40 | N/D | -7 | N/D | book |
| 8 | Bxb4 | Libro | Buona | N/D | 32 | 0 | N/D | 32 | N/D | book |
| 9 | c3 | Libro | Imprecisione | N/D | -20 | -35 | N/D | -55 | N/D | book |
| 10 | Ba5 | Libro | Imprecisione | N/D | -17 | 23 | N/D | 6 | N/D | book |
| 11 | O-O | Libro | Imprecisione | N/D | -45 | -13 | N/D | -58 | N/D | book |
| 12 | d6 | Libro | Imprecisione | N/D | -20 | 58 | N/D | 38 | N/D | book |
| 13 | d4 | Migliore | Imprecisione | N/D | -6 | -29 | N/D | -35 | N/D |  |
| 14 | Bg4 | Migliore | Imprecisione | N/D | -5 | 44 | N/D | 39 | N/D |  |
| 15 | Bb5 | Ottima | Imprecisione | N/D | -24 | -43 | N/D | -67 | N/D |  |
| 16 | exd4 | Imprecisione | Imprecisione | N/D | -40 | 64 | N/D | 24 | N/D |  |
| 17 | cxd4 | Migliore | Imprecisione | N/D | 1 | -28 | N/D | -27 | N/D |  |
| 18 | Bd7 | Imprecisione | Imprecisione | N/D | -61 | 27 | N/D | -34 | N/D |  |
| 19 | Bb2 | Imprecisione | Imprecisione | N/D | -45 | 29 | N/D | -16 | N/D |  |
| 20 | Nce7 | Errore | Errore | N/D | -100 | 16 | N/D | -84 | N/D |  |
| 21 | Bxd7+ | Migliore | Imprecisione | N/D | -18 | 87 | N/D | 69 | N/D |  |
| 22 | Qxd7 | Migliore | Imprecisione | N/D | -10 | -78 | N/D | -88 | N/D |  |
| 23 | Na3 | Ottima | Imprecisione | N/D | -32 | 97 | N/D | 65 | N/D |  |
| 24 | Nh6 | Imprecisione | Imprecisione | N/D | -80 | -58 | N/D | -138 | N/D |  |
| 25 | Nc4 | Grande | Imprecisione | N/D | -33 | 138 | N/D | 105 | N/D | unsupported |
| 26 | Bb6 | Migliore | Imprecisione | N/D | 3 | -111 | N/D | -108 | N/D |  |
| 27 | a4 | Migliore | Imprecisione | N/D | 6 | 108 | N/D | 114 | N/D |  |
| 28 | c6 | Grande | Imprecisione | N/D | -13 | -110 | N/D | -123 | N/D | unsupported |
| 29 | e5 | Migliore | Imprecisione | N/D | -39 | 117 | N/D | 78 | N/D |  |
| 30 | d5 | Errore | Errore | N/D | -152 | -77 | N/D | -229 | N/D |  |
| 31 | Nd6+ | Grande | Imprecisione | N/D | -5 | 225 | N/D | 220 | N/D | unsupported |
| 32 | Kf8 | Migliore | Imprecisione | N/D | -20 | -217 | N/D | -237 | N/D |  |
| 33 | Ba3 | Migliore | Imprecisione | N/D | 10 | 237 | N/D | 247 | N/D |  |
| 34 | Kg8 | Ottima | Imprecisione | N/D | -8 | -242 | N/D | -250 | N/D |  |
| 35 | Rb1 | Migliore | Imprecisione | N/D | -34 | 238 | N/D | 204 | N/D |  |
| 36 | Nhf5 | Errore | Errore | N/D | -156 | -236 | N/D | -392 | N/D |  |
| 37 | Nxf7 | Errore | Errore grave | N/D | -231 | 392 | N/D | 161 | N/D | suspect |
| 38 | Kxf7 | Migliore | Imprecisione | N/D | 21 | -185 | N/D | -164 | N/D |  |
| 39 | e6+ | Grande | Imprecisione | N/D | 18 | 195 | N/D | 213 | N/D | unsupported |
| 40 | Kxe6 | Migliore | Imprecisione | N/D | 0 | -213 | N/D | -213 | N/D |  |
| 41 | Ne5 | Migliore | Errore | N/D | -114 | 250 | N/D | 136 | N/D |  |
| 42 | Qc8 | Imprecisione | Imprecisione | N/D | 1 | -158 | N/D | -157 | N/D |  |
| 43 | Re1 | Grande | Buona | N/D | 39 | 162 | N/D | 201 | N/D | unsupported |
| 44 | Kf6 | Imprecisione | Imprecisione | N/D | -74 | -210 | N/D | -284 | N/D |  |
| 45 | Qh5 | Grande | Imprecisione | N/D | -7 | 306 | N/D | 299 | N/D | unsupported |
| 46 | g6 | Ottima | Imprecisione | N/D | -17 | -336 | N/D | -353 | N/D |  |
| 47 | Bxe7+ | Imprecisione | Imprecisione | N/D | -22 | 339 | N/D | 317 | N/D |  |
| 48 | Kxe7 | Imprecisione | Imprecisione | N/D | -14 | -334 | N/D | -348 | N/D |  |
| 49 | Nxg6+ | Migliore | Buona | N/D | 25 | 345 | N/D | 370 | N/D |  |
| 50 | Kf6 | Migliore | Imprecisione | N/D | -20 | -341 | N/D | -361 | N/D |  |
| 51 | Nxh8 | Ottima | Errore | N/D | -161 | 527 | N/D | 366 | N/D |  |
| 52 | Bxd4 | Buona | Errore | N/D | -136 | -364 | N/D | -500 | N/D |  |
| 53 | Rb3 | Geniale | Imprecisione | N/D | -66 | 526 | N/D | 460 | N/D | unsupported |
| 54 | Qd7 | Ottima | Imprecisione | N/D | -80 | -471 | N/D | -551 | N/D |  |
| 55 | Rf3 | Migliore | Imprecisione | N/D | -31 | 529 | N/D | 498 | N/D |  |
| 56 | Rxh8 | Migliore | Imprecisione | N/D | -18 | -533 | N/D | -551 | N/D |  |
| 57 | g4 | Migliore | Imprecisione | N/D | -3 | 553 | N/D | 550 | N/D |  |
| 58 | Rg8 | Errore | Imprecisione | N/D | -62 | -495 | N/D | -557 | N/D |  |
| 59 | Qh6+ | Ottima | Imprecisione | N/D | -47 | 584 | N/D | 537 | N/D |  |
| 60 | Rg6 | Imprecisione | Errore grave | N/D | -336 | -537 | N/D | -873 | N/D |  |
| 61 | Rxf5+ | Geniale | Imprecisione | N/D | 0 | N/D | 8 | N/D | 7 | unsupported |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata |
|---|---|---|---|---|---|---|---|---|---|---|
| Migliore | 0 | 0 | 1 | 17 | 1 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 0 | 0 | 0 | 6 | 1 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 0 | 8 | 0 | 1 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## Saint Amant vs Staunton, 1843

Ply: 132; inclusi: 121; esclusi unici: 11.
Corrispondenza esatta: 10.743801652892563%; entro una classe: 31.40495867768595%.

Conteggi attesi:
- Migliore: 37
- Ottima: 40
- Buona: 25
- Imprecisione: 15
- Errore: 4
- Errore grave: 0
- Libro: 7
- Geniale: 0
- Grande: 4
- Mossa mancata: 0

Esclusioni: {"book":7,"unsupported":4,"suspect":0,"missing":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | d4 | Libro | Imprecisione | N/D | -10 | 35 | N/D | 25 | N/D | book |
| 2 | d5 | Libro | Imprecisione | N/D | -14 | -18 | N/D | -32 | N/D | book |
| 3 | c4 | Libro | Imprecisione | N/D | -3 | 34 | N/D | 31 | N/D | book |
| 4 | e6 | Libro | Imprecisione | N/D | -13 | -24 | N/D | -37 | N/D | book |
| 5 | e3 | Libro | Imprecisione | N/D | -20 | 30 | N/D | 10 | N/D | book |
| 6 | c5 | Buona | Imprecisione | N/D | -9 | -12 | N/D | -21 | N/D |  |
| 7 | Nc3 | Migliore | Imprecisione | N/D | -7 | 18 | N/D | 11 | N/D |  |
| 8 | Nf6 | Libro | Imprecisione | N/D | 1 | -13 | N/D | -12 | N/D | book |
| 9 | Nf3 | Libro | Imprecisione | N/D | -5 | 15 | N/D | 10 | N/D | book |
| 10 | Be7 | Ottima | Imprecisione | N/D | -22 | -10 | N/D | -32 | N/D |  |
| 11 | Bd3 | Imprecisione | Imprecisione | N/D | -50 | 41 | N/D | -9 | N/D |  |
| 12 | b6 | Buona | Imprecisione | N/D | -39 | 13 | N/D | -26 | N/D |  |
| 13 | O-O | Ottima | Imprecisione | N/D | -4 | 33 | N/D | 29 | N/D |  |
| 14 | O-O | Ottima | Imprecisione | N/D | -3 | -23 | N/D | -26 | N/D |  |
| 15 | b3 | Buona | Imprecisione | N/D | -36 | 26 | N/D | -10 | N/D |  |
| 16 | Bb7 | Ottima | Imprecisione | N/D | -15 | 13 | N/D | -2 | N/D |  |
| 17 | cxd5 | Migliore | Imprecisione | N/D | 5 | 3 | N/D | 8 | N/D |  |
| 18 | exd5 | Buona | Imprecisione | N/D | -35 | 2 | N/D | -33 | N/D |  |
| 19 | Qc2 | Buona | Imprecisione | N/D | -44 | 43 | N/D | -1 | N/D |  |
| 20 | Nc6 | Migliore | Imprecisione | N/D | -11 | 4 | N/D | -7 | N/D |  |
| 21 | a3 | Migliore | Imprecisione | N/D | 0 | 7 | N/D | 7 | N/D |  |
| 22 | a6 | Imprecisione | Imprecisione | N/D | -45 | -5 | N/D | -50 | N/D |  |
| 23 | Rd1 | Buona | Imprecisione | N/D | -37 | 51 | N/D | 14 | N/D |  |
| 24 | cxd4 | Migliore | Imprecisione | N/D | 2 | -26 | N/D | -24 | N/D |  |
| 25 | exd4 | Migliore | Imprecisione | N/D | -5 | 24 | N/D | 19 | N/D |  |
| 26 | h6 | Ottima | Imprecisione | N/D | -13 | -22 | N/D | -35 | N/D |  |
| 27 | b4 | Ottima | Imprecisione | N/D | -27 | 35 | N/D | 8 | N/D |  |
| 28 | Bd6 | Migliore | Imprecisione | N/D | -4 | -17 | N/D | -21 | N/D |  |
| 29 | Re1 | Migliore | Imprecisione | N/D | 0 | 14 | N/D | 14 | N/D |  |
| 30 | b5 | Ottima | Imprecisione | N/D | -2 | -12 | N/D | -14 | N/D |  |
| 31 | h3 | Ottima | Imprecisione | N/D | 0 | 12 | N/D | 12 | N/D |  |
| 32 | Rc8 | Migliore | Imprecisione | N/D | -3 | -11 | N/D | -14 | N/D |  |
| 33 | Qb3 | Ottima | Imprecisione | N/D | -8 | 17 | N/D | 9 | N/D |  |
| 34 | Qc7 | Buona | Imprecisione | N/D | 0 | -17 | N/D | -17 | N/D |  |
| 35 | Bd2 | Ottima | Imprecisione | N/D | -1 | 15 | N/D | 14 | N/D |  |
| 36 | Qb6 | Ottima | Imprecisione | N/D | -6 | -14 | N/D | -20 | N/D |  |
| 37 | Be3 | Ottima | Imprecisione | N/D | -7 | 19 | N/D | 12 | N/D |  |
| 38 | Ne7 | Ottima | Imprecisione | N/D | -21 | -19 | N/D | -40 | N/D |  |
| 39 | Rac1 | Ottima | Imprecisione | N/D | -17 | 38 | N/D | 21 | N/D |  |
| 40 | Nh5 | Buona | Imprecisione | N/D | -42 | -20 | N/D | -62 | N/D |  |
| 41 | Qd1 | Migliore | Imprecisione | N/D | -2 | 62 | N/D | 60 | N/D |  |
| 42 | Nf6 | Buona | Imprecisione | N/D | 0 | -56 | N/D | -56 | N/D |  |
| 43 | Nh4 | Imprecisione | Imprecisione | N/D | -46 | 56 | N/D | 10 | N/D |  |
| 44 | Rc7 | Buona | Imprecisione | N/D | -38 | -2 | N/D | -40 | N/D |  |
| 45 | Qd2 | Ottima | Imprecisione | N/D | -9 | 25 | N/D | 16 | N/D |  |
| 46 | Nh7 | Buona | Imprecisione | N/D | -59 | -21 | N/D | -80 | N/D |  |
| 47 | Qc2 | Buona | Imprecisione | N/D | -72 | 100 | N/D | 28 | N/D |  |
| 48 | Nf6 | Migliore | Imprecisione | N/D | -7 | -30 | N/D | -37 | N/D |  |
| 49 | Kh1 | Buona | Imprecisione | N/D | -30 | 28 | N/D | -2 | N/D |  |
| 50 | Ne8 | Imprecisione | Imprecisione | N/D | -40 | 3 | N/D | -37 | N/D |  |
| 51 | Nf5 | Imprecisione | Imprecisione | N/D | -53 | 39 | N/D | -14 | N/D |  |
| 52 | Nxf5 | Migliore | Imprecisione | N/D | -17 | 17 | N/D | 0 | N/D |  |
| 53 | Bxf5 | Migliore | Imprecisione | N/D | 0 | 0 | N/D | 0 | N/D |  |
| 54 | a5 | Ottima | Imprecisione | N/D | -20 | 4 | N/D | -16 | N/D |  |
| 55 | Qb3 | Imprecisione | Errore | N/D | -90 | 17 | N/D | -73 | N/D |  |
| 56 | axb4 | Grande | Imprecisione | N/D | 23 | 82 | N/D | 105 | N/D | unsupported |
| 57 | axb4 | Migliore | Imprecisione | N/D | -4 | -100 | N/D | -104 | N/D |  |
| 58 | Rc4 | Ottima | Imprecisione | N/D | -4 | 94 | N/D | 90 | N/D |  |
| 59 | Na2 | Errore | Imprecisione | N/D | -53 | -59 | N/D | -112 | N/D |  |
| 60 | Nf6 | Migliore | Imprecisione | N/D | -2 | 118 | N/D | 116 | N/D |  |
| 61 | Bd3 | Ottima | Imprecisione | N/D | -47 | -114 | N/D | -161 | N/D |  |
| 62 | Qc6 | Imprecisione | Imprecisione | N/D | -50 | 150 | N/D | 100 | N/D |  |
| 63 | Qb2 | Migliore | Imprecisione | N/D | -5 | -112 | N/D | -117 | N/D |  |
| 64 | Qd7 | Buona | Imprecisione | N/D | -46 | 117 | N/D | 71 | N/D |  |
| 65 | Kg1 | Ottima | Imprecisione | N/D | -30 | -60 | N/D | -90 | N/D |  |
| 66 | Nh5 | Errore | Errore | N/D | -125 | 85 | N/D | -40 | N/D |  |
| 67 | Qd2 | Imprecisione | Errore | N/D | -83 | 62 | N/D | -21 | N/D |  |
| 68 | f5 | Ottima | Imprecisione | N/D | -17 | 30 | N/D | 13 | N/D |  |
| 69 | f4 | Imprecisione | Errore | N/D | -100 | -11 | N/D | -111 | N/D |  |
| 70 | Ng3 | Ottima | Imprecisione | N/D | -37 | 123 | N/D | 86 | N/D |  |
| 71 | Bxc4 | Buona | Imprecisione | N/D | -15 | -111 | N/D | -126 | N/D |  |
| 72 | dxc4 | Migliore | Imprecisione | N/D | 12 | 110 | N/D | 122 | N/D |  |
| 73 | Qb2 | Imprecisione | Imprecisione | N/D | 1 | -108 | N/D | -107 | N/D |  |
| 74 | Rf6 | Imprecisione | Imprecisione | N/D | -39 | 109 | N/D | 70 | N/D |  |
| 75 | Nc3 | Buona | Imprecisione | N/D | -12 | -89 | N/D | -101 | N/D |  |
| 76 | Ne4 | Grande | Imprecisione | N/D | -1 | 101 | N/D | 100 | N/D | unsupported |
| 77 | Re2 | Imprecisione | Imprecisione | N/D | -21 | -118 | N/D | -139 | N/D |  |
| 78 | Rg6 | Migliore | Imprecisione | N/D | -11 | 152 | N/D | 141 | N/D |  |
| 79 | Rd1 | Errore | Errore | N/D | -86 | -150 | N/D | -236 | N/D |  |
| 80 | Nxc3 | Grande | Imprecisione | N/D | -15 | 254 | N/D | 239 | N/D | unsupported |
| 81 | Qxc3 | Migliore | Imprecisione | N/D | -23 | -256 | N/D | -279 | N/D |  |
| 82 | Bf3 | Grande | Imprecisione | N/D | -12 | 265 | N/D | 253 | N/D | unsupported |
| 83 | Rde1 | Errore | Imprecisione | N/D | -31 | -251 | N/D | -282 | N/D |  |
| 84 | Bxe2 | Ottima | Imprecisione | N/D | -17 | 264 | N/D | 247 | N/D |  |
| 85 | Rxe2 | Migliore | Imprecisione | N/D | -19 | -246 | N/D | -265 | N/D |  |
| 86 | Qe7 | Imprecisione | Imprecisione | N/D | -27 | 272 | N/D | 245 | N/D |  |
| 87 | Qb2 | Imprecisione | Errore | N/D | -116 | -213 | N/D | -329 | N/D |  |
| 88 | Re6 | Migliore | Imprecisione | N/D | -14 | 323 | N/D | 309 | N/D |  |
| 89 | Kf2 | Migliore | Imprecisione | N/D | -4 | -305 | N/D | -309 | N/D |  |
| 90 | Re4 | Ottima | Imprecisione | N/D | -14 | 329 | N/D | 315 | N/D |  |
| 91 | Qa2 | Buona | Errore | N/D | -146 | -290 | N/D | -436 | N/D |  |
| 92 | Kf7 | Buona | Errore | N/D | -185 | 435 | N/D | 250 | N/D |  |
| 93 | g3 | Migliore | Imprecisione | N/D | -3 | -252 | N/D | -255 | N/D |  |
| 94 | Qb7 | Buona | Imprecisione | N/D | -13 | 260 | N/D | 247 | N/D |  |
| 95 | Qa3 | Migliore | Imprecisione | N/D | -7 | -235 | N/D | -242 | N/D |  |
| 96 | Re8 | Ottima | Imprecisione | N/D | -16 | 252 | N/D | 236 | N/D |  |
| 97 | Qc3 | Imprecisione | Imprecisione | N/D | -70 | -237 | N/D | -307 | N/D |  |
| 98 | Qh1 | Migliore | Buona | N/D | 45 | 283 | N/D | 328 | N/D |  |
| 99 | h4 | Ottima | Imprecisione | N/D | -22 | -331 | N/D | -353 | N/D |  |
| 100 | g5 | Buona | Imprecisione | N/D | -23 | 353 | N/D | 330 | N/D |  |
| 101 | Qe1 | Buona | Errore | N/D | -111 | -336 | N/D | -447 | N/D |  |
| 102 | Qh2+ | Migliore | Imprecisione | N/D | 0 | 439 | N/D | 439 | N/D |  |
| 103 | Kf1 | Migliore | Imprecisione | N/D | -20 | -447 | N/D | -467 | N/D |  |
| 104 | Qh3+ | Migliore | Imprecisione | N/D | -20 | 480 | N/D | 460 | N/D |  |
| 105 | Kg1 | Migliore | Imprecisione | N/D | -14 | -460 | N/D | -474 | N/D |  |
| 106 | Qg4 | Migliore | Imprecisione | N/D | -20 | 473 | N/D | 453 | N/D |  |
| 107 | hxg5 | Ottima | Imprecisione | N/D | -22 | -446 | N/D | -468 | N/D |  |
| 108 | Bxf4 | Buona | Errore | N/D | -91 | 501 | N/D | 410 | N/D |  |
| 109 | Bxf4 | Buona | Errore | N/D | -142 | -410 | N/D | -552 | N/D |  |
| 110 | Qxe2 | Buona | Errore | N/D | -123 | 565 | N/D | 442 | N/D |  |
| 111 | Qxe2 | Migliore | Imprecisione | N/D | -20 | -428 | N/D | -448 | N/D |  |
| 112 | Rxe2 | Migliore | Imprecisione | N/D | 19 | 437 | N/D | 456 | N/D |  |
| 113 | gxh6 | Ottima | Imprecisione | N/D | -2 | -451 | N/D | -453 | N/D |  |
| 114 | c3 | Ottima | Imprecisione | N/D | -7 | 478 | N/D | 471 | N/D |  |
| 115 | Kf1 | Migliore | Buona | N/D | 42 | -533 | N/D | -491 | N/D |  |
| 116 | Re4 | Ottima | Imprecisione | N/D | 6 | 521 | N/D | 527 | N/D |  |
| 117 | Bc1 | Ottima | Imprecisione | N/D | -61 | -521 | N/D | -582 | N/D |  |
| 118 | Kg6 | Ottima | Imprecisione | N/D | -26 | 586 | N/D | 560 | N/D |  |
| 119 | d5 | Migliore | Imprecisione | N/D | -7 | -552 | N/D | -559 | N/D |  |
| 120 | c2 | Migliore | Imprecisione | N/D | -46 | 604 | N/D | 558 | N/D |  |
| 121 | Bd2 | Buona | Imprecisione | N/D | -26 | -564 | N/D | -590 | N/D |  |
| 122 | Rxb4 | Migliore | Buona | N/D | 59 | 587 | N/D | 646 | N/D |  |
| 123 | d6 | Ottima | Imprecisione | N/D | -32 | -640 | N/D | -672 | N/D |  |
| 124 | Rd4 | Ottima | Imprecisione | N/D | -15 | 682 | N/D | 667 | N/D |  |
| 125 | Ke2 | Ottima | Imprecisione | N/D | 0 | -667 | N/D | -667 | N/D |  |
| 126 | Rxd6 | Migliore | Imprecisione | N/D | -7 | 671 | N/D | 664 | N/D |  |
| 127 | Ke3 | Ottima | Imprecisione | N/D | -39 | -681 | N/D | -720 | N/D |  |
| 128 | Kxh6 | Ottima | Imprecisione | N/D | -4 | 726 | N/D | 722 | N/D |  |
| 129 | Ke2+ | Ottima | Imprecisione | N/D | -18 | -713 | N/D | -731 | N/D |  |
| 130 | Kg6 | Ottima | Imprecisione | N/D | -75 | 799 | N/D | 724 | N/D |  |
| 131 | Ke1 | Ottima | Imprecisione | N/D | -76 | -751 | N/D | -827 | N/D |  |
| 132 | b4 | Ottima | Errore grave | N/D | -201 | 965 | N/D | 764 | N/D |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata |
|---|---|---|---|---|---|---|---|---|---|---|
| Buona | 0 | 0 | 0 | 19 | 6 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 0 | 0 | 3 | 34 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 0 | 0 | 0 | 39 | 0 | 1 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 0 | 11 | 4 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## Fool's Mate (sanity, separata dalla taratura)

Ply: 4; inclusi: 4; esclusi unici: 0.
Corrispondenza esatta: 25%; entro una classe: 25%.

Conteggi attesi:
- Migliore: 2
- Ottima: 0
- Buona: 0
- Imprecisione: 0
- Errore: 1
- Errore grave: 1
- Libro: 0
- Geniale: 0
- Grande: 0
- Mossa mancata: 0

Esclusioni: {"book":0,"unsupported":0,"suspect":0,"missing":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | f3 | Errore | Errore | N/D | -115 | 35 | N/D | -80 | N/D |  |
| 2 | e5 | Migliore | Imprecisione | N/D | -8 | 76 | N/D | 68 | N/D |  |
| 3 | g4 | Errore grave | Imprecisione | N/D | 0 | -66 | N/D | N/D | -1 |  |
| 4 | Qh4# | Migliore | Imprecisione | N/D | 0 | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata |
|---|---|---|---|---|---|---|---|---|---|---|
| Errore | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
