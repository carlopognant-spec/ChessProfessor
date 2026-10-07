# Studio delle mosse Grande — P1–P6 e due storiche

Fonti: annotazioni fixture e cache Stockfish 19 large/200k. È studio descrittivo dello sviluppo e dei riferimenti storici, non validazione indipendente.
[Definizione pubblica Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc): mossa decisiva per l’esito, anche unica buona mossa; criterio più generoso per principianti. Non pubblica l’algoritmo completo.
Una cattura/forchetta/scacco o un segnale di matto è un fatto o candidato motivo, non la spiegazione certa dell’etichetta. Attacchi geometrici non garantiscono guadagno: pezzi inchiodati, risposte e scambi richiedono verifica. PV legalmente ripercorsa non prova l’esito contro tutte le difese.
Le cinque radici possono avere depth diverse e non coprono tutte le legali: non sono prova di unicità. Score normalizzati al giocatore salvo childRaw indicati in JSON.

- cases: 24
- development: 14
- historical: 10
- captures: 9
- checks: 6
- geometricForks: 5
- mateSignals: 2
- illegalCachedPv: 0
- sourceHashesUnchanged: true
- searchesExecuted: 0

| Partita | Mossa | Cattura | Scacco | Bersagli del pezzo mosso | Matto segnalato | Giocata PV1 |
|---|---|---|---|---|---|---|
| personal-01 | 23.Qxc7 | p | false | pa7, nd7, pb6 | false | true |
| personal-01 | 24.Qe5 | — | false | pe6, pg5 | false | true |
| personal-02 | 11.Bxf7 | r | false | — | false | true |
| personal-02 | 16.Rxf2 | b | false | nf6 | false | true |
| personal-02 | 37.Rd7+ | — | true | kg7 | true | true |
| personal-03 | 10.Nxd6+ | b | true | bc8, ke8, pb7 | false | true |
| personal-03 | 21...Bxe6 | r | false | pd5 | false | true |
| personal-04 | 11...Qb4 | — | false | pb2 | false | true |
| personal-04 | 15.Nd6+ | — | true | ke8, pb7, pf7, qb5 | false | true |
| personal-05 | 8...Nxh1 | r | false | — | false | true |
| personal-05 | 14.Qxa8 | r | false | bc8, pa7 | false | true |
| personal-05 | 19.Bh6+ | — | true | kf8 | true | true |
| personal-06 | 7.d4 | — | false | bc5, ne5 | false | true |
| personal-06 | 16.Nd5 | — | false | nf6, pb4 | false | true |
| game-1-chigorin-steinitz-1892 | 13.Nc4 | — | false | pd6, ba5 | false | true |
| game-1-chigorin-steinitz-1892 | 14...c6 | — | false | — | false | true |
| game-1-chigorin-steinitz-1892 | 16.Nd6+ | — | true | ke8, pb7, pf7 | false | true |
| game-1-chigorin-steinitz-1892 | 20.e6+ | — | true | qd7, kf7 | false | true |
| game-1-chigorin-steinitz-1892 | 22.Re1 | — | false | — | false | true |
| game-1-chigorin-steinitz-1892 | 23.Qh5 | — | false | ph7, nf5 | false | true |
| game-2-saintamant-staunton-1843 | 28...axb4 | p | false | pa3, nc3 | false | true |
| game-2-saintamant-staunton-1843 | 38...Ne4 | — | false | nc3 | false | true |
| game-2-saintamant-staunton-1843 | 40...Nxc3 | n | false | re2, rd1 | false | true |
| game-2-saintamant-staunton-1843 | 41...Bf3 | — | false | re2, pg2 | false | true |

## personal-01, 23.Qxc7 (ply 45)

FEN prima: `q3r1k1/p1pn1p2/1p2p2p/6pb/P1P5/2B3QP/1P3P2/R3R1K1 w - - 0 23`
FEN dopo: `q3r1k1/p1Qn1p2/1p2p2p/6pb/P1P5/2B4P/1P3P2/R3R1K1 b - - 0 23`
Mossa precedente: g5 (Errore). Scacco prima: false. Materiale relativo: 0 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura p, scacco false; bersagli geometrici pa7, nd7, pb6. Radici cache 5/43.
Sequenza realmente giocata intorno alla mossa: Bxa8 Qxa8 Qg3 g5 Qxc7 Nf8 Qe5 f6 Qxf6 Nd7 Qg7#.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Qd8 Qxa7 Kh7 Rad1 Bxd1 Rxd1 Re7 Qb7 f6 b4 Ne5 Qe4+; eval dal giocatore 317 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Qxc7 | 265 | 12 | Qxc7 Qc8 Qd6 Qb7 a5 Kh7 Re3 Nc5 Qe5 Rg8 a6 Qc8 |
| 2 | h4 | 147 | 12 | h4 Qf3 Re3 Qxg3+ Rxg3 Nc5 hxg5 Ne4 Rh3 Bg4 Rxh6 Nxc3 |
| 3 | Re3 | 88 | 12 | Re3 e5 h4 Kh7 hxg5 Rg8 f4 exf4 Qxf4 Rxg5+ Rg3 Qf3 |
| 4 | f4 | 89 | 11 | f4 Qf3 Qxf3 Bxf3 a5 |
| 5 | a5 | 81 | 11 | a5 Qc6 axb6 axb6 Ra7 e5 Qd3 Bf3 b4 g4 hxg4 Bxg4 |

## personal-01, 24.Qe5 (ply 47)

FEN prima: `q3rnk1/p1Q2p2/1p2p2p/6pb/P1P5/2B4P/1P3P2/R3R1K1 w - - 1 24`
FEN dopo: `q3rnk1/p4p2/1p2p2p/4Q1pb/P1P5/2B4P/1P3P2/R3R1K1 b - - 2 24`
Mossa precedente: Nf8 (Errore). Scacco prima: false. Materiale relativo: 1 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici pe6, pg5. Radici cache 5/47.
Sequenza realmente giocata intorno alla mossa: Qg3 g5 Qxc7 Nf8 Qe5 f6 Qxf6 Nd7 Qg7#.
Linea dopo la giocata (difesa avversaria/PV1 salvata): f6 Qxf6 e5 Rxe5 Rxe5 Qxe5 Ne6 Qxe6+ Kf8 Qf6+ Bf7 Qxh6+; eval dal giocatore 1197 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Qe5 | 1189 | 16 | Qe5 f6 Qxf6 e5 Rxe5 Rxe5 Bxe5 Qb7 Qh8+ Kf7 Qg7+ Ke8 |
| 2 | a5 | 275 | 15 | a5 Qb8 Be5 Qxc7 Bxc7 Ng6 b4 Nh4 Rec1 Nf3+ Kg2 Nh4+ |
| 3 | a5 | 290 | 16 | a5 Qb8 Be5 Qxc7 Bxc7 Rc8 axb6 axb6 Ra7 Ng6 Rea1 Kh7 |
| 4 | Red1 | 21 | 15 | Red1 Qf3 Qe5 f6 Qxf6 Qxf6 Bxf6 Bxd1 Rxd1 e5 Rd8 Rxd8 |
| 5 | f3 | 0 | 15 | f3 Qxf3 Qe5 f6 Qxf6 Qg3+ Kf1 Qxh3+ Kg1 Qg3+ Kf1 |

## personal-02, 11.Bxf7 (ply 21)

FEN prima: `r1bq1k2/pp3rpp/n2p1n2/8/1bB1P3/2N5/PPPB1PPP/R2QK2R w KQ - 2 11`
FEN dopo: `r1bq1k2/pp3Bpp/n2p1n2/8/1b2P3/2N5/PPPB1PPP/R2QK2R b KQ - 0 11`
Mossa precedente: Kf8 (Errore grave). Scacco prima: false. Materiale relativo: -1 → 4 (unità convenzionali 1/3/3/5/9).
Fatti: cattura r, scacco false; bersagli geometrici nessuno. Radici cache 5/42.
Sequenza realmente giocata intorno alla mossa: Nxf7 Rxf7 Bc4 Kf8 Bxf7 Kxf7 a3 Bc5 O-O Bg4 Qe1.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kxf7 a3 Ba5 Qe2 Bd7 O-O-O Rc8 Nd5 Bg4 f3 Be6 Nxf6; eval dal giocatore 82 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Bxf7 | 76 | 13 | Bxf7 Kxf7 a3 Bc5 Bg5 Be6 Qd2 Rc8 O-O h6 Bh4 Kg8 |
| 2 | a3 | -138 | 13 | a3 Bxc3 Bxc3 d5 e5 Bg4 f3 dxc4 Qxd8+ Rxd8 exf6 Bf5 |
| 3 | O-O | -162 | 13 | O-O Rc7 Be2 Be6 a3 Bxc3 Bxc3 Bc4 Bxc4 |
| 4 | f3 | -178 | 13 | f3 Rc7 Qe2 Qe7 |
| 5 | Qe2 | -213 | 13 | Qe2 d5 Nxd5 Bxd2+ Qxd2 b5 Bd3 Nxd5 exd5 Re7+ Kd1 Qxd5 |

## personal-02, 16.Rxf2 (ply 31)

FEN prima: `r3q3/pp3kpp/n2p1n2/8/1P2P1b1/P1N5/2PB1bPP/R3QRK1 w - - 0 16`
FEN dopo: `r3q3/pp3kpp/n2p1n2/8/1P2P1b1/P1N5/2PB1RPP/R3Q1K1 b - - 0 16`
Mossa precedente: Bxf2+ (Errore grave). Scacco prima: true. Materiale relativo: 0 → 3 (unità convenzionali 1/3/3/5/9).
Fatti: cattura b, scacco false; bersagli geometrici nf6. Radici cache 4/4.
Sequenza realmente giocata intorno alla mossa: Qe1 Qe8 b4 Bxf2+ Rxf2 b5 h3 Bh5 g4 Bg6 Rd1.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Nc7 h3 Bd7 Bf4 Qe6 Rd1 Nb5 Nxb5 Bxb5 Bxd6 Re8 e5; eval dal giocatore 751 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Rxf2 | 764 | 15 | Rxf2 Nc7 h3 Bd7 Bg5 h6 Bxf6 gxf6 Rd1 Kg7 Nd5 Nxd5 |
| 2 | Qxf2 | 733 | 15 | Qxf2 Nc7 Qh4 Kg8 Bg5 Nxe4 Nxe4 Qxe4 Rae1 Re8 Rxe4 |
| 3 | Kxf2 | 670 | 15 | Kxf2 Nc7 Kg1 Kg8 Qg3 Qe6 h3 Bh5 Qd3 Rc8 |
| 4 | Kh1 | -712 | 14 | Kh1 Bxe1 Raxe1 Nc7 h3 Be6 Rxf6+ gxf6 Nd5 Bxd5 exd5 |

## personal-02, 37.Rd7+ (ply 73)

FEN prima: `8/6k1/R6p/1p6/1P1R2PB/P6r/2b5/6K1 w - - 0 37`
FEN dopo: `8/3R2k1/R6p/1p6/1P4PB/P6r/2b5/6K1 b - - 1 37`
Mossa precedente: Rxh3 (Errore). Scacco prima: false. Materiale relativo: 6 → 6 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco true; bersagli geometrici kg7. Radici cache 5/33.
Sequenza realmente giocata intorno alla mossa: Ra6+ Kg7 Rd4 Rxh3 Rd7+ Kf8 Ra8#.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kg8 Ra8#; eval dal giocatore M1 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Rd7+ | M2 | 17 | Rd7+ Kg8 Ra8# |
| 2 | Ra7+ | M2 | 17 | Ra7+ Kg6 Rd6# |
| 3 | Bf6+ | M5 | 17 | Bf6+ Kg8 Rd8+ Kf7 Rd7+ Ke8 Re7+ Kd8 Ra8# |
| 4 | Rd8 | 874 | 16 | Rd8 Rf3 Rd7+ Kg8 Bf6 Be4 Be5 Rf7 Rd8+ Rf8 Rxf8+ Kxf8 |
| 5 | Kf2 | 815 | 16 | Kf2 Rd3 Bf6+ Kh7 Ra7+ Kg8 Rxd3 Bxd3 Be5 Kf8 Bd4 |

## personal-03, 10.Nxd6+ (ply 19)

FEN prima: `rnb1k2r/1pp3p1/p2b1q1p/1N1Pp3/5p2/1P1P1N2/P1P2PPP/R2QKB1R w KQkq - 0 10`
FEN dopo: `rnb1k2r/1pp3p1/p2N1q1p/3Pp3/5p2/1P1P1N2/P1P2PPP/R2QKB1R b KQkq - 0 10`
Mossa precedente: a6 (Imprecisione). Scacco prima: false. Materiale relativo: 1 → 4 (unità convenzionali 1/3/3/5/9).
Fatti: cattura b, scacco true; bersagli geometrici bc8, ke8, pb7. Radici cache 5/32.
Sequenza realmente giocata intorno alla mossa: Nb5 f4 b3 a6 Nxd6+ Qxd6 c4 Nd7 g3 g5 Qe2.
Linea dopo la giocata (difesa avversaria/PV1 salvata): cxd6 Be2 O-O O-O Bf5 Nd2 Nd7 Re1 Rac8 a4 Qg6 Bh5; eval dal giocatore 100 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nxd6+ | 118 | 15 | Nxd6+ cxd6 Nd2 Bf5 Be2 O-O O-O Nd7 Bg4 g6 Rc1 Qg7 |
| 2 | Nxc7+ | -458 | 14 | Nxc7+ Bxc7 Be2 O-O O-O Bf5 Nd2 Bb6 |
| 3 | Nxc7+ | -460 | 15 | Nxc7+ Bxc7 Be2 Bf5 O-O Nd7 Nd2 O-O Bg4 Bb6 Ne4 Qg6 |
| 4 | Nc3 | -576 | 14 | Nc3 Bb4 Qd2 e4 d4 exf3 gxf3 O-O O-O-O Kh8 Qd3 |
| 5 | Qe2 | -608 | 14 | Qe2 axb5 d4 Nd7 Qe4 Kd8 Bxb5 Bb4+ Kd1 exd4 Qe6 g6 |

## personal-03, 21...Bxe6 (ply 42)

FEN prima: `r5r1/1pp5/p3Rk1p/3P4/2P2pb1/1P1P4/P4P1P/2K2BR1 b - - 3 21`
FEN dopo: `r5r1/1pp5/p3bk1p/3P4/2P2p2/1P1P4/P4P1P/2K2BR1 w - - 0 22`
Mossa precedente: Re6+ (Errore grave). Scacco prima: true. Materiale relativo: -2 → 3 (unità convenzionali 1/3/3/5/9).
Fatti: cattura r, scacco false; bersagli geometrici pd5. Radici cache 5/5.
Sequenza realmente giocata intorno alla mossa: gxf4 Rg1 Rhg8 Re6+ Bxe6 dxe6 Kxe6 Rxg8 Rxg8 Be2 Rg1+.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Rg2 Rxg2 Bxg2 Rg8 Bf1 Bg4 Kd2 Kg5 Kc3 Kh4 Kd4 Bd7; eval dal giocatore 624 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Bxe6 | 608 | 16 | Bxe6 Rxg8 Bxg8 Bg2 Rf8 Bf3 b5 h4 bxc4 bxc4 Bf7 Kd2 |
| 2 | Kf7 | -608 | 16 | Kf7 Re4 Bf5 Rxg8 Rxg8 Rxf4 Kg6 Kd2 Kf6 Rf3 Rg1 Be2 |
| 3 | Kf5 | -678 | 16 | Kf5 d4 Rae8 Bd3+ Kg5 Rxe8 Rxe8 h3 h5 hxg4 hxg4 Kd2 |
| 4 | Kg5 | -725 | 16 | Kg5 f3 Rge8 Rxg4+ Kh5 Rg1 Rxe6 dxe6 Rd8 |
| 5 | Kg7 | -772 | 16 | Kg7 Rxg4+ Kh7 Rxg8 Kxg8 Kb2 Re8 Bh3 |

## personal-04, 11...Qb4 (ply 22)

FEN prima: `rn2k2r/pp2npp1/2pqp1bp/4P1N1/2pP4/6P1/PP3PBP/RN1Q1RK1 b kq - 0 11`
FEN dopo: `rn2k2r/pp2npp1/2p1p1bp/4P1N1/1qpP4/6P1/PP3PBP/RN1Q1RK1 w kq - 1 12`
Mossa precedente: e5 (Errore). Scacco prima: false. Materiale relativo: 1 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici pb2. Radici cache 5/39.
Sequenza realmente giocata intorno alla mossa: Bg6 O-O h6 e5 Qb4 Nd2 hxg5 a3 Qxb2 Nxc4 Qb5.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Nf3 Qxb2 Qd2 Qxd2 Nfxd2 b5 a4 Nd5 axb5 cxb5 Bxd5 exd5; eval dal giocatore 272 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Qb4 | 280 | 13 | Qb4 Nf3 Qxb2 Qd2 Qxa1 Nc3 Qxf1+ Bxf1 b5 Nh4 |
| 2 | Qc7 | 83 | 13 | Qc7 Ne4 O-O Nbd2 b5 Rc1 Rd8 Nd6 Qb6 N2e4 |
| 3 | Qd7 | 85 | 12 | Qd7 Ne4 O-O Na3 b5 Nxb5 cxb5 Nc5 Qd8 Bxa8 Nbc6 Bb7 |
| 4 | Qd7 | 61 | 13 | Qd7 Ne4 O-O Na3 b5 Nxb5 cxb5 Nc5 Qd8 Bxa8 Nbc6 Bb7 |
| 5 | Bc2 | -647 | 12 | Bc2 Qxc2 Qxd4 Nf3 Qd3 Qd2 O-O |

## personal-04, 15.Nd6+ (ply 29)

FEN prima: `rn2k2r/pp2npp1/2p1p1b1/1q2P1p1/2NP4/P5P1/5PBP/R2Q1RK1 w kq - 1 15`
FEN dopo: `rn2k2r/pp2npp1/2pNp1b1/1q2P1p1/3P4/P5P1/5PBP/R2Q1RK1 b kq - 2 15`
Mossa precedente: Qb5 (Errore grave). Scacco prima: false. Materiale relativo: -4 → -4 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco true; bersagli geometrici ke8, pb7, pf7, qb5. Radici cache 5/36.
Sequenza realmente giocata intorno alla mossa: a3 Qxb2 Nxc4 Qb5 Nd6+ Kf8 Nxb5 cxb5 Bxb7 Nbc6 Bxa8.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kd7 Nxb5 cxb5 Bxb7 Nbc6 Bxa8 Rxa8 f3 Ke8 Rf2 a6; eval dal giocatore 715 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nd6+ | 661 | 15 | Nd6+ Kd7 Nxb5 cxb5 a4 b4 Bxb7 Nbc6 d5 exd5 Bxc6+ Kxc6 |
| 2 | Rc1 | -472 | 15 | Rc1 O-O Nd6 Qb6 Be4 Nd7 Rb1 Qd8 Bxg6 Nxg6 Rxb7 Rb8 |
| 3 | Rc1 | -476 | 14 | Rc1 O-O Qd2 Nd7 Nd6 Qa6 Qxg5 Nc8 h4 Nxd6 h5 |
| 4 | Qe2 | -559 | 14 | Qe2 O-O Rfc1 Nd7 Qd2 Qa6 Qxg5 f6 Qg4 |
| 5 | Qb1 | -676 | 14 | Qb1 Qxb1 Nd6+ Kf8 Raxb1 Bxb1 Rxb1 b6 Rb3 g4 f3 g6 |

## personal-05, 8...Nxh1 (ply 16)

FEN prima: `r1b1k2r/pppq1ppp/8/2b1P3/8/5N2/PPP1QnPP/RNB1K2R b KQkq - 1 8`
FEN dopo: `r1b1k2r/pppq1ppp/8/2b1P3/8/5N2/PPP1Q1PP/RNB1K2n w Qkq - 0 9`
Mossa precedente: Qe2 (Errore grave). Scacco prima: false. Materiale relativo: 0 → 5 (unità convenzionali 1/3/3/5/9).
Fatti: cattura r, scacco false; bersagli geometrici nessuno. Radici cache 5/47.
Sequenza realmente giocata intorno alla mossa: Nxf2 Bxd7+ Qxd7 Qe2 Nxh1 Qc4 b6 Ng5 O-O Nc3 Qe7.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Nc3 O-O Be3 Bxe3 Qxe3 Kh8 Rd1 Qf5 Ne4 b5 Neg5 Bb7; eval dal giocatore 635 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nxh1 | 684 | 15 | Nxh1 Nc3 O-O Be3 Bxe3 Qxe3 Re8 Ne4 b6 a3 Ba6 Qg5 |
| 2 | b6 | 128 | 15 | b6 O-O Ne4+ Kh1 Bb7 Nbd2 Nxd2 |
| 3 | Qc6 | 92 | 15 | Qc6 O-O Nd3+ Kh1 Nxc1 Rxc1 Bg4 Nc3 O-O-O Rf1 Rhe8 h3 |
| 4 | Qg4 | 32 | 15 | Qg4 O-O Ne4+ Be3 b6 Bxc5 Nxc5 h3 Qg6 Nh4 Qe4 Qxe4 |
| 5 | O-O | 28 | 15 | O-O Rf1 Ng4 Nc3 Bd4 h3 Bxc3+ bxc3 |

## personal-05, 14.Qxa8 (ply 27)

FEN prima: `r1b2rk1/p1p2ppp/1p6/2b1P1B1/4Q3/2N5/PPP2nPP/R3K3 w Q - 1 14`
FEN dopo: `Q1b2rk1/p1p2ppp/1p6/2b1P1B1/8/2N5/PPP2nPP/R3K3 b Q - 0 14`
Mossa precedente: Nf2 (Errore). Scacco prima: false. Materiale relativo: 1 → 6 (unità convenzionali 1/3/3/5/9).
Fatti: cattura r, scacco false; bersagli geometrici bc8, pa7. Radici cache 5/48.
Sequenza realmente giocata intorno alla mossa: Qe4 Qxg5 Bxg5 Nf2 Qxa8 Re8 Bf4 g5 Bxg5 Rxe5+ Kd2.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Bf5 Qxa7 f6 Bh4 Ng4 O-O-O Ne3 Bf2 Nxc2 Bxc5; eval dal giocatore 623 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Qxa8 | 632 | 14 | Qxa8 Bf5 Qxa7 Bxc2 Qxc7 Re8 Nd5 Rxe5+ Qxe5 Nd3+ Kd2 Nxe5 |
| 2 | Qf3 | 199 | 14 | Qf3 Bg4 Qf4 f6 exf6 Rae8+ Kf1 Be6 b4 |
| 3 | Qf4 | 168 | 14 | Qf4 Ng4 Nd5 Re8 O-O-O h6 Bh4 c6 Ne7+ Rxe7 |
| 4 | Qc6 | 132 | 13 | Qc6 Bf5 Kd2 Ng4 Re1 Rae8 Qf3 Bd7 Bf4 Bd4 Qd3 c5 |
| 5 | Qa4 | 127 | 13 | Qa4 Bf5 Bh4 Ng4 O-O-O Nxe5 Qf4 Ng6 Qxf5 Nxh4 Qf4 Nxg2 |

## personal-05, 19.Bh6+ (ply 37)

FEN prima: `Q1b1rk2/p1p2p1p/1p6/2b3B1/8/2N5/PPPK1nPP/4R3 w - - 4 19`
FEN dopo: `Q1b1rk2/p1p2p1p/1p5B/2b5/8/2N5/PPPK1nPP/4R3 b - - 5 19`
Mossa precedente: Kf8 (Errore). Scacco prima: false. Materiale relativo: 6 → 6 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco true; bersagli geometrici kf8. Radici cache 5/45.
Sequenza realmente giocata intorno alla mossa: Kd2 Re8 Re1 Kf8 Bh6+.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kg8 Rxe8+ Bf8 Rxf8#; eval dal giocatore M2 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Bh6+ | M3 | 15 | Bh6+ Kg8 Rxe8+ Bf8 Rxf8# |
| 2 | Rxe8+ | 1537 | 15 | Rxe8+ Kg7 Rxc8 h5 Rg8+ Kh7 Rh8+ Kg6 Qg8+ Kf5 Qxf7+ Kxg5 |
| 3 | b4 | 932 | 14 | b4 Rxe1 Kxe1 Kg7 bxc5 Nd3+ cxd3 Be6 Qf3 bxc5 Qf6+ Kg8 |
| 4 | h4 | 916 | 14 | h4 Rxe1 Qxc8+ Kg7 Kxe1 h5 Qxc7 Ng4 Ke2 Bf2 Bf4 Bxh4 |
| 5 | a3 | 896 | 14 | a3 Rxe1 Bh6+ Ke7 Qxc8 Re6 Qxc7+ Ke8 |

## personal-06, 7.d4 (ply 13)

FEN prima: `r1bq1rk1/pppp1ppp/5n2/2b1n3/4P3/2N3P1/PPPP1PBP/R1BQK2R w KQ - 0 7`
FEN dopo: `r1bq1rk1/pppp1ppp/5n2/2b1n3/3PP3/2N3P1/PPP2PBP/R1BQK2R b KQ - 0 7`
Mossa precedente: Nxe5 (Migliore). Scacco prima: false. Materiale relativo: -2 → -2 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici bc5, ne5. Radici cache 5/29.
Sequenza realmente giocata intorno alla mossa: Bg2 O-O Nxe5 Nxe5 d4 Bxd4 Qxd4 d6 O-O Bg4 f3.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Bd6 dxe5 Bxe5 Qd3 Re8 O-O Bxc3 bxc3 d6 c4 Nd7 Bb2; eval dal giocatore 13 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | d4 | 25 | 15 | d4 Bd6 dxe5 Bxe5 O-O Re8 Na4 b5 Nc5 d6 Nd3 Bb7 |
| 2 | Ne2 | -426 | 15 | Ne2 Bb6 d4 Nc6 a4 a5 c3 d5 e5 Ne8 Qb3 |
| 3 | O-O | -422 | 14 | O-O Nc6 Ne2 Bb6 d4 d6 h3 a5 Bg5 |
| 4 | a4 | -446 | 14 | a4 Nc6 Ne2 a5 d4 Bb6 c3 d6 h3 Re8 Qc2 |
| 5 | h3 | -462 | 14 | h3 Nc6 O-O Re8 Kh1 Bb6 a4 a5 f4 d6 d3 |

## personal-06, 16.Nd5 (ply 31)

FEN prima: `r2q1rk1/p4pp1/3p1nbp/2p1n3/Pp2P1PB/2N2P2/1PP2QBP/R4RK1 w - - 0 16`
FEN dopo: `r2q1rk1/p4pp1/3p1nbp/2pNn3/Pp2P1PB/5P2/1PP2QBP/R4RK1 b - - 1 16`
Mossa precedente: b4 (Buona). Scacco prima: false. Materiale relativo: 0 → 0 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici nf6, pb4. Radici cache 5/34.
Sequenza realmente giocata intorno alla mossa: Qf2 b5 a4 b4 Nd5 Qd7 Bxf6 gxf6 Nxf6+ Kg7 Nxd7.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Ned7 Rad1 Qa5 Ne3 Rae8 Rxd6 Re6 Qd2 Ne5 b3; eval dal giocatore 422 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nd5 | 429 | 14 | Nd5 Ned7 Rfd1 Re8 Rd2 Qc8 Nxf6+ Nxf6 Rxd6 |
| 2 | Nd1 | 217 | 14 | Nd1 d5 Qg3 Ned7 e5 Bxc2 Ne3 g5 Bxg5 hxg5 Nxc2 Nh7 |
| 3 | Bxf6 | 173 | 14 | Bxf6 Qxf6 Nd5 Qd8 Rad1 f6 f4 Nc6 e5 fxe5 f5 Rb8 |
| 4 | Ne2 | 129 | 14 | Ne2 d5 Rad1 d4 g5 hxg5 Bxg5 Re8 c3 Nc4 b3 Ne3 |
| 5 | Na2 | 90 | 13 | Na2 Bh7 h3 Qe7 f4 Ng6 |

## game-1-chigorin-steinitz-1892, 13.Nc4 (ply 25)

FEN prima: `r3k2r/pppqnppp/3p3n/b7/3PP3/N4N2/PB3PPP/R2Q1RK1 w kq - 2 13`
FEN dopo: `r3k2r/pppqnppp/3p3n/b7/2NPP3/5N2/PB3PPP/R2Q1RK1 b kq - 3 13`
Mossa precedente: Nh6 (Imprecisione). Scacco prima: false. Materiale relativo: -1 → -1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici pd6, ba5. Radici cache 5/30.
Sequenza realmente giocata intorno alla mossa: Bxd7+ Qxd7 Na3 Nh6 Nc4 Bb6 a4 c6 e5 d5 Nd6+.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Bb6 a4 c6 Ba3 Bc7 e5 Nhf5 g4 b5 Ncd2 Nh6 h3; eval dal giocatore 107 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nc4 | 134 | 12 | Nc4 Bb6 a4 c6 Ba3 Bc7 e5 dxe5 Nfxe5 Qe6 Qb3 O-O |
| 2 | Qb3 | 58 | 11 | Qb3 b5 Nxb5 O-O Bc3 Bb6 Rfe1 Rab8 a4 a6 Na3 d5 |
| 3 | Rb1 | 42 | 11 | Rb1 Bb6 Nc4 O-O a4 d5 Nfe5 Qd8 a5 dxc4 Nxc4 f6 |
| 4 | Bc1 | 27 | 11 | Bc1 b5 Bxh6 gxh6 Nc2 f5 e5 O-O a4 bxa4 |
| 5 | Qd3 | 18 | 11 | Qd3 Bb6 Nc4 O-O a4 c6 Bc1 Ng4 Ba3 |

## game-1-chigorin-steinitz-1892, 14...c6 (ply 28)

FEN prima: `r3k2r/pppqnppp/1b1p3n/8/P1NPP3/5N2/1B3PPP/R2Q1RK1 b kq - 0 14`
FEN dopo: `r3k2r/pp1qnppp/1bpp3n/8/P1NPP3/5N2/1B3PPP/R2Q1RK1 w kq - 0 15`
Mossa precedente: a4 (Migliore). Scacco prima: false. Materiale relativo: 1 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici nessuno. Radici cache 5/39.
Sequenza realmente giocata intorno alla mossa: Nh6 Nc4 Bb6 a4 c6 e5 d5 Nd6+ Kf8 Ba3 Kg8.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Ba3 Bc7 e5 dxe5 Ncxe5 Bxe5 Nxe5 Qc7 Bxe7 Qxe7 Re1 O-O; eval dal giocatore -176 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | c6 | -110 | 12 | c6 e5 dxe5 Ba3 O-O a5 Bc7 dxe5 Qxd1 Rfxd1 |
| 2 | a6 | -205 | 12 | a6 Nxb6 cxb6 d5 O-O Nd4 Ng6 Qb3 Rac8 f3 Ne5 Bc1 |
| 3 | a5 | -297 | 12 | a5 Nxb6 cxb6 d5 O-O Nd4 Ng6 Qb3 Rfe8 Rae1 f6 f4 |
| 4 | f5 | -335 | 12 | f5 a5 fxe4 Ng5 Qb5 Qc1 d5 Ne5 Bxa5 Rxa5 Qxa5 Ne6 |
| 5 | d5 | -395 | 12 | d5 exd5 Qxd5 Ne3 Qa5 Ba3 Ng6 Re1 |

## game-1-chigorin-steinitz-1892, 16.Nd6+ (ply 31)

FEN prima: `r3k2r/pp1qnppp/1bp4n/3pP3/P1NP4/5N2/1B3PPP/R2Q1RK1 w kq - 0 16`
FEN dopo: `r3k2r/pp1qnppp/1bpN3n/3pP3/P2P4/5N2/1B3PPP/R2Q1RK1 b kq - 1 16`
Mossa precedente: d5 (Errore). Scacco prima: false. Materiale relativo: -1 → -1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco true; bersagli geometrici ke8, pb7, pf7. Radici cache 5/33.
Sequenza realmente giocata intorno alla mossa: a4 c6 e5 d5 Nd6+ Kf8 Ba3 Kg8 Rb1 Nhf5 Nxf7.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kf8 a5 Bd8 a6 b6 Ba3 Ng6 Qc2 Be7 Rac1; eval dal giocatore 397 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nd6+ | 303 | 15 | Nd6+ Kf8 a5 Bd8 a6 bxa6 Ba3 Ng6 Rb1 Bb6 Qc2 Kg8 |
| 2 | e6 | 117 | 14 | e6 Qd8 Nce5 O-O Ng5 f6 Nef7 Nxf7 exf7+ Rxf7 Nxf7 Kxf7 |
| 3 | Nxb6 | 50 | 14 | Nxb6 axb6 Bc1 Nhf5 g4 Nh6 h3 O-O Re1 c5 Rb1 |
| 4 | Ncd2 | -15 | 14 | Ncd2 O-O Nb3 Ng6 a5 Bd8 h3 Nf5 Ba3 |
| 5 | Ne3 | -15 | 14 | Ne3 O-O Ba3 Rfc8 a5 Bd8 h3 Nef5 |

## game-1-chigorin-steinitz-1892, 20.e6+ (ply 39)

FEN prima: `r6r/pp1qnkpp/1bp5/3pPn2/P2P4/B4N2/5PPP/1R1Q1RK1 w - - 0 20`
FEN dopo: `r6r/pp1qnkpp/1bp1P3/3p1n2/P2P4/B4N2/5PPP/1R1Q1RK1 b - - 0 20`
Mossa precedente: Kxf7 (Migliore). Scacco prima: false. Materiale relativo: -3 → -3 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco true; bersagli geometrici qd7, kf7. Radici cache 5/32.
Sequenza realmente giocata intorno alla mossa: Rb1 Nhf5 Nxf7 Kxf7 e6+ Kxe6 Ne5 Qc8 Re1 Kf6 Qh5.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Kxe6 Re1+ Kf6 Bxe7+ Nxe7 Ne5 Qc7 g4 g6 Qf3+ Nf5 gxf5; eval dal giocatore 220 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | e6+ | 186 | 11 | e6+ Kxe6 Re1+ Kf6 Bxe7+ Nxe7 Ne5 Qc7 g4 Rae8 Qf3+ Ke6 |
| 2 | g4 | 83 | 11 | g4 h6 Kh1 Rhe8 gxf5 Qxf5 a5 Bxa5 Rxb7 Rab8 e6+ Qxe6 |
| 3 | Re1 | 50 | 10 | Re1 Kg8 g4 Nh6 e6 Qc7 Ne5 Ng6 Re3 Re8 a5 Bxa5 |
| 4 | Kh1 | 37 | 10 | Kh1 h6 |
| 5 | a5 | 28 | 10 | a5 Bxa5 e6+ Kxe6 g4 Qc7 Qe2+ Kd7 Ne5+ Kc8 gxf5 Nxf5 |

## game-1-chigorin-steinitz-1892, 22.Re1 (ply 43)

FEN prima: `r1q4r/pp2n1pp/1bp1k3/3pNn2/P2P4/B7/5PPP/1R1Q1RK1 w - - 2 22`
FEN dopo: `r1q4r/pp2n1pp/1bp1k3/3pNn2/P2P4/B7/5PPP/1R1QR1K1 b - - 3 22`
Mossa precedente: Qc8 (Imprecisione). Scacco prima: false. Materiale relativo: -4 → -4 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici nessuno. Radici cache 5/40.
Sequenza realmente giocata intorno alla mossa: e6+ Kxe6 Ne5 Qc8 Re1 Kf6 Qh5 g6 Bxe7+ Kxe7 Nxg6+.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Ba5 Qh5 Rf8 g4 Bxe1 Rxe1 Nd6 Ng6+ Ne4 Nxe7 Qd8 Qe5+; eval dal giocatore 264 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Re1 | 264 | 12 | Re1 Ba5 Qh5 Qe8 Qf3 Bxe1 Rxe1 Rc8 |
| 2 | Rxb6 | 4 | 11 | Rxb6 axb6 Re1 Kf6 |
| 3 | Qe2 | -1 | 11 | Qe2 Kf6 Rfe1 h5 Bxe7+ Kxe7 Ng6+ Kf6 Nxh8 |
| 4 | g4 | -26 | 11 | g4 Bxd4 gxf5+ Nxf5 Re1 Bxe5 f4 Kf7 Rxe5 Rb8 Qg4 g6 |
| 5 | Qh5 | -68 | 11 | Qh5 g6 Qg5 h6 Qg4 Kf6 Bxe7+ Nxe7 Nd7+ Kg7 Qe6 Ng8 |

## game-1-chigorin-steinitz-1892, 23.Qh5 (ply 45)

FEN prima: `r1q4r/pp2n1pp/1bp2k2/3pNn2/P2P4/B7/5PPP/1R1QR1K1 w - - 4 23`
FEN dopo: `r1q4r/pp2n1pp/1bp2k2/3pNn1Q/P2P4/B7/5PPP/1R2R1K1 b - - 5 23`
Mossa precedente: Kf6 (Imprecisione). Scacco prima: false. Materiale relativo: -4 → -4 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici ph7, nf5. Radici cache 5/43.
Sequenza realmente giocata intorno alla mossa: Ne5 Qc8 Re1 Kf6 Qh5 g6 Bxe7+ Kxe7 Nxg6+ Kf6 Nxh8.
Linea dopo la giocata (difesa avversaria/PV1 salvata): g6 Ng4+ Kf7 Rxe7+ Nxe7 Nh6+ Ke8 Qe5 c5 Qxh8+ Kd7 Qxh7; eval dal giocatore 383 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Qh5 | 404 | 12 | Qh5 g6 Bxe7+ Kxe7 Nxg6+ Kf6 Nxh8 Qxh8 a5 Bxa5 Rxb7 Qg8 |
| 2 | g4 | 180 | 12 | g4 g6 Qf3 Re8 Bxe7+ Rxe7 gxf5 Qxf5 Ng4+ Kg5 Qxf5+ gxf5 |
| 3 | a5 | 167 | 11 | a5 Bxa5 Qh5 Ng6 g4 Bxe1 Rxe1 Nxd4 |
| 4 | a5 | 145 | 12 | a5 Bxa5 Bxe7+ Kxe7 Nxc6+ Kf6 Nxa5 Re8 Qf3 Rxe1+ Rxe1 b6 |
| 5 | Bxe7+ | 71 | 11 | Bxe7+ Kxe7 g4 Nh4 Ng6+ Kf7 Nxh4 Re8 Rxe8 Kxe8 |

## game-2-saintamant-staunton-1843, 28...axb4 (ply 56)

FEN prima: `4nrk1/1br2pp1/1q1b3p/pp1p1B2/1P1P4/PQN1B2P/5PP1/2R1R2K b - - 1 28`
FEN dopo: `4nrk1/1br2pp1/1q1b3p/1p1p1B2/1p1P4/PQN1B2P/5PP1/2R1R2K w - - 0 29`
Mossa precedente: Qb3 (Imprecisione). Scacco prima: false. Materiale relativo: 0 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura p, scacco false; bersagli geometrici pa3, nc3. Radici cache 5/31.
Sequenza realmente giocata intorno alla mossa: Nxf5 Bxf5 a5 Qb3 axb4 axb4 Rc4 Na2 Nf6 Bd3 Qc6.
Linea dopo la giocata (difesa avversaria/PV1 salvata): axb4 Rc4 Bd3 Rxb4 Qc2 Nf6 Qe2 Bc6 Na2 Rb3 Qc2 Rxd3; eval dal giocatore 47 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | axb4 | 54 | 13 | axb4 axb4 Rc4 Bd3 Rxb4 Qd1 Nf6 Qd2 Ra8 Kg1 Ne4 Qe2 |
| 2 | Bc6 | -65 | 13 | Bc6 bxa5 Qxa5 Nxd5 Bxd5 Qxd5 Bxa3 Rb1 Nf6 Qxb5 Qxb5 Rxb5 |
| 3 | a4 | -74 | 13 | a4 Qa2 Nf6 Qd2 Re8 Red1 Rc4 Bd3 Bb8 Bxc4 dxc4 Bf4 |
| 4 | Rc4 | -108 | 13 | Rc4 bxa5 Qxa5 Nxb5 Ba6 Nxd6 Nxd6 Bb1 Rfc8 Kh2 Ne4 Qb2 |
| 5 | Rc6 | -124 | 12 | Rc6 bxa5 Qxa5 Nxb5 Ba6 a4 Rc4 Ra1 Rb4 Bd2 Rxb3 Bxa5 |

## game-2-saintamant-staunton-1843, 38...Ne4 (ply 76)

FEN prima: `6k1/1b1q2p1/3b1r1p/1p3p2/1PpP1P2/2N1B1nP/1Q4P1/2R1R1K1 b - - 3 38`
FEN dopo: `6k1/1b1q2p1/3b1r1p/1p3p2/1PpPnP2/2N1B2P/1Q4P1/2R1R1K1 w - - 4 39`
Mossa precedente: Nc3 (Buona). Scacco prima: false. Materiale relativo: -2 → -2 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici nc3. Radici cache 5/40.
Sequenza realmente giocata intorno alla mossa: dxc4 Qb2 Rf6 Nc3 Ne4 Re2 Rg6 Rd1 Nxc3 Qxc3 Bf3.
Linea dopo la giocata (difesa avversaria/PV1 salvata): d5 Nxc3 Qxc3 Bxd5 Rcd1 Bb7 Bc5 Qc6 Qf3 Bxc5+ bxc5 Qxc5+; eval dal giocatore 109 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Ne4 | 84 | 12 | Ne4 d5 Nxc3 Qxc3 Bxd5 Rcd1 Qc6 Re2 |
| 2 | Nh5 | 64 | 12 | Nh5 d5 Nxf4 Bxf4 Bxf4 Rcd1 Bg3 Re2 Bc7 Qc2 |
| 3 | Rg6 | 33 | 12 | Rg6 d5 Nh5 Rcd1 Kh7 Bc1 Nxf4 Bxf4 Bxf4 Qe2 |
| 4 | Be4 | 32 | 12 | Be4 d5 Rg6 Ra1 Qe7 Ra6 Nh5 Bc1 Qh4 Rxe4 Bc5+ |
| 5 | Kh7 | 28 | 11 | Kh7 d5 Rg6 Rcd1 Nh5 Bc1 Nxf4 Bxf4 Bxf4 Qc2 |

## game-2-saintamant-staunton-1843, 40...Nxc3 (ply 80)

FEN prima: `6k1/1b1q2p1/3b2rp/1p3p2/1PpPnP2/2N1B2P/1Q2R1P1/3R2K1 b - - 7 40`
FEN dopo: `6k1/1b1q2p1/3b2rp/1p3p2/1PpP1P2/2n1B2P/1Q2R1P1/3R2K1 w - - 0 41`
Mossa precedente: Rd1 (Errore). Scacco prima: false. Materiale relativo: -2 → 1 (unità convenzionali 1/3/3/5/9).
Fatti: cattura n, scacco false; bersagli geometrici re2, rd1. Radici cache 5/39.
Sequenza realmente giocata intorno alla mossa: Ne4 Re2 Rg6 Rd1 Nxc3 Qxc3 Bf3 Rde1 Bxe2 Rxe2 Qe7.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Qxc3 Bf3 Rdd2 Bxe2 Rxe2 Re6 d5 Re4 Ra2 Qe7 Bd2 Qf7; eval dal giocatore 354 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Nxc3 | 328 | 14 | Nxc3 Qxc3 Bf3 Rdd2 Bxe2 Rxe2 Re6 d5 Re4 Ra2 Qe7 Bd2 |
| 2 | Ng3 | 66 | 13 | Ng3 Ree1 Be4 Bc1 Nh5 Nxe4 fxe4 Rxe4 Qxh3 |
| 3 | Ng3 | 53 | 14 | Ng3 Ree1 Be4 d5 Nh5 Nxe4 fxe4 g4 Bxf4 Qd2 Bb8 |
| 4 | Qf7 | 16 | 13 | Qf7 Nxb5 Bd5 Kh2 Kh7 Nxd6 Rxd6 Qc2 c3 Bc1 Qe7 Rd3 |
| 5 | Nf6 | -2 | 13 | Nf6 d5 Nh5 Rf2 Rg3 Bc1 Qe7 Nxb5 Bxb4 |

## game-2-saintamant-staunton-1843, 41...Bf3 (ply 82)

FEN prima: `6k1/1b1q2p1/3b2rp/1p3p2/1PpP1P2/2Q1B2P/4R1P1/3R2K1 b - - 0 41`
FEN dopo: `6k1/3q2p1/3b2rp/1p3p2/1PpP1P2/2Q1Bb1P/4R1P1/3R2K1 w - - 1 42`
Mossa precedente: Qxc3 (Migliore). Scacco prima: false. Materiale relativo: -2 → -2 (unità convenzionali 1/3/3/5/9).
Fatti: cattura nessuna, scacco false; bersagli geometrici re2, pg2. Radici cache 5/35.
Sequenza realmente giocata intorno alla mossa: Rg6 Rd1 Nxc3 Qxc3 Bf3 Rde1 Bxe2 Rxe2 Qe7 Qb2 Re6.
Linea dopo la giocata (difesa avversaria/PV1 salvata): Rdd2 Qe7 d5 Bxe2 Rxe2 Bxb4 Qe5 Qd7 Bd4 Bd6 Qe8+ Qxe8; eval dal giocatore 326 cp/mate.

| PV | Mossa | cp/mate dal giocatore | Depth | Primi 12 ply SAN |
|---:|---|---:|---:|---|
| 1 | Bf3 | 353 | 14 | Bf3 Rde1 Bxe2 Rxe2 Re6 d5 Re4 Ra2 Qe7 Bd2 Qb7 Qa1 |
| 2 | Qe6 | 162 | 13 | Qe6 Rf1 Qd5 Rff2 Rg3 Qd2 h5 Qe1 h4 Bd2 Qxd4 Re8+ |
| 3 | Bd5 | 154 | 13 | Bd5 Bd2 h5 Rf1 Be4 Be1 |
| 4 | Be4 | 154 | 13 | Be4 Rde1 Qb7 Kh2 h5 Rg1 |
| 5 | Qf7 | 122 | 13 | Qf7 Kh2 Qd5 Rg1 Qe4 Qe1 Bxf4+ Bxf4 Qxf4+ g3 Qxd4 Qf2 |

Nessuna nuova ricerca, modifica a soglie/classificatore o attivazione di categorie. .env e Partite/7–10 non letti. Test/build/browser NON ESEGUITI; replay chess.js e hash realmente eseguiti. Nessun commit/push. STOP.
