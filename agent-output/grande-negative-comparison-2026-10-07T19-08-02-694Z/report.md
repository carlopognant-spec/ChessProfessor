# Grande — confronto con mosse simili non Grande

- totalPlies: 592
- eligible: 525
- excluded: 67
- exclusions: "reference Libro/Forzata/Geniale and delivered mate"
- sourceHashesUnchanged: true
- searchesExecuted: 0
- dataRole: "development and historical study; no independent validation"
- featuresAreLabelIndependent: true
- notes: ["Geometric attacks include pinned-piece attacks and do not prove a winning fork.","Material at 4 ply is one cached PV and is absent if the sequence is shorter; false feature values include unavailable horizons.","Local previous error uses current numerical classifier without book override, never previous Chess.com expected category.","Same-depth root gap is only partial MultiPV coverage; no uniqueness inference.","Counts are correlated within games; no statistical confidence or adoption claim."]

## development
Grande=14; non Grande=339; tra i negativi Migliore/Ottima=193.

| Caratteristica | Grande | Non Grande | Migliore/Ottima fra i negativi | Precisione se usata sola |
|---|---:|---:|---:|---:|
| capture | 7 | 81 | 50 | 8.0% |
| captureRookOrQueen | 4 | 13 | 8 | 23.5% |
| check | 4 | 28 | 12 | 12.5% |
| geometricDoubleAttack | 3 | 11 | 6 | 21.4% |
| kingAndQueenAttack | 1 | 2 | 1 | 33.3% |
| recapture | 1 | 23 | 17 | 4.2% |
| answerToCheck | 2 | 26 | 13 | 7.1% |
| afterLocalNumericalError | 9 | 17 | 7 | 34.6% |
| playedIsPv1 | 14 | 100 | 91 | 12.3% |
| mateSignal | 2 | 24 | 18 | 7.7% |
| gainPersistsAt4Ply | 11 | 103 | 78 | 9.6% |

## historical
Grande=10; non Grande=162; tra i negativi Migliore/Ottima=103.

| Caratteristica | Grande | Non Grande | Migliore/Ottima fra i negativi | Precisione se usata sola |
|---|---:|---:|---:|---:|
| capture | 2 | 35 | 25 | 5.4% |
| captureRookOrQueen | 0 | 6 | 4 | 0.0% |
| check | 2 | 7 | 6 | 22.2% |
| geometricDoubleAttack | 2 | 2 | 1 | 50.0% |
| kingAndQueenAttack | 1 | 0 | 0 | 100.0% |
| recapture | 0 | 14 | 11 | 0.0% |
| answerToCheck | 0 | 9 | 7 | 0.0% |
| afterLocalNumericalError | 2 | 1 | 1 | 66.7% |
| playedIsPv1 | 10 | 62 | 58 | 13.9% |
| mateSignal | 0 | 0 | 0 | n/d |
| gainPersistsAt4Ply | 7 | 55 | 38 | 11.3% |

## all
Grande=24; non Grande=501; tra i negativi Migliore/Ottima=296.

| Caratteristica | Grande | Non Grande | Migliore/Ottima fra i negativi | Precisione se usata sola |
|---|---:|---:|---:|---:|
| capture | 9 | 116 | 75 | 7.2% |
| captureRookOrQueen | 4 | 19 | 12 | 17.4% |
| check | 6 | 35 | 18 | 14.6% |
| geometricDoubleAttack | 5 | 13 | 7 | 27.8% |
| kingAndQueenAttack | 2 | 2 | 1 | 50.0% |
| recapture | 1 | 37 | 28 | 2.6% |
| answerToCheck | 2 | 35 | 20 | 5.4% |
| afterLocalNumericalError | 11 | 18 | 8 | 37.9% |
| playedIsPv1 | 24 | 162 | 149 | 12.9% |
| mateSignal | 2 | 24 | 18 | 7.7% |
| gainPersistsAt4Ply | 18 | 158 | 116 | 10.2% |

## Combinazioni descrittive

- pv1-after-error: Grande 11; non Grande 7.
- pv1-capture-major-after-error: Grande 3; non Grande 1.
- pv1-double-attack: Grande 5; non Grande 5.
- pv1-mate-signal: Grande 2; non Grande 6.

## Tutti i controesempi per caratteristica

| Caratteristica | Partita | Ply | SAN | Etichetta |
|---|---|---:|---|---|
| capture | personal-01 | 12 | Bxc3 | Buona |
| capture | personal-01 | 13 | Bxc3 | Migliore |
| capture | personal-01 | 32 | Bxf3 | Migliore |
| capture | personal-01 | 33 | gxh5 | Imprecisione |
| capture | personal-01 | 34 | Qxd4 | Errore grave |
| capture | personal-01 | 38 | Bxh5 | Buona |
| capture | personal-01 | 41 | Bxa8 | Migliore |
| capture | personal-01 | 42 | Qxa8 | Migliore |
| capture | personal-01 | 49 | Qxf6 | Migliore |
| capture | personal-02 | 13 | Nxe5 | Ottima |
| capture | personal-02 | 17 | Nxf7 | Errore grave |
| capture | personal-02 | 18 | Rxf7 | Migliore |
| capture | personal-02 | 22 | Kxf7 | Migliore |
| capture | personal-02 | 30 | Bxf2+ | Errore grave |
| capture | personal-02 | 39 | Nxd5 | Ottima |
| capture | personal-02 | 41 | Nxf6 | Migliore |
| capture | personal-02 | 42 | gxf6 | Migliore |
| capture | personal-02 | 43 | Rxf6+ | Ottima |
| capture | personal-02 | 45 | Rxa6 | Ottima |
| capture | personal-02 | 46 | Bxe4 | Imprecisione |
| capture | personal-02 | 51 | Qxf7+ | Mossa mancata |
| capture | personal-02 | 56 | Bxc2 | Migliore |
| capture | personal-02 | 65 | Rxa7+ | Ottima |
| capture | personal-02 | 72 | Rxh3 | Errore |
| capture | personal-03 | 11 | Bxf6 | Migliore |
| capture | personal-03 | 12 | Qxf6 | Migliore |
| capture | personal-03 | 20 | Qxd6 | Migliore |
| capture | personal-03 | 27 | Nxe5 | Mossa mancata |
| capture | personal-03 | 28 | Nxe5 | Mossa mancata |
| capture | personal-03 | 29 | Qxe5+ | Migliore |
| capture | personal-03 | 31 | Qxe7+ | Buona |
| capture | personal-03 | 35 | gxf4 | Ottima |
| capture | personal-03 | 38 | gxf4 | Migliore |
| capture | personal-03 | 43 | dxe6 | Errore |
| capture | personal-03 | 44 | Kxe6 | Mossa mancata |
| capture | personal-03 | 45 | Rxg8 | Imprecisione |
| capture | personal-03 | 46 | Rxg8 | Migliore |
| capture | personal-03 | 52 | Rxh2 | Ottima |
| capture | personal-03 | 60 | Kxb3 | Ottima |
| capture | personal-03 | 62 | Kxa4 | Ottima |
| capture | personal-03 | 73 | Kxf4 | Ottima |
| capture | personal-03 | 77 | Kxf2 | Migliore |
| capture | personal-03 | 80 | Qxd1 | Buona |
| capture | personal-03 | 90 | Qxd4 | Migliore |
| capture | personal-03 | 92 | Qxc5+ | Migliore |
| capture | personal-03 | 108 | Qxf8+ | Buona |
| capture | personal-03 | 109 | Kxf8 | Migliore |
| capture | personal-04 | 13 | Bxd6 | Migliore |
| capture | personal-04 | 14 | Qxd6 | Migliore |
| capture | personal-04 | 24 | hxg5 | Migliore |
| capture | personal-04 | 26 | Qxb2 | Buona |
| capture | personal-04 | 27 | Nxc4 | Migliore |
| capture | personal-04 | 31 | Nxb5 | Migliore |
| capture | personal-04 | 32 | cxb5 | Errore |
| capture | personal-04 | 33 | Bxb7 | Migliore |
| capture | personal-04 | 35 | Bxa8 | Migliore |
| capture | personal-04 | 39 | Qxb5 | Migliore |
| capture | personal-04 | 40 | Nxd4 | Errore |
| capture | personal-04 | 41 | Qxb8+ | Migliore |
| capture | personal-04 | 43 | Qxh8 | Buona |
| capture | personal-04 | 49 | Bxe4 | Buona |
| capture | personal-04 | 51 | Qxg7 | Buona |
| capture | personal-04 | 53 | Qxg5+ | Buona |
| capture | personal-05 | 9 | dxe5 | Migliore |
| capture | personal-05 | 11 | Bxc6 | Errore |
| capture | personal-05 | 12 | Nxf2 | Mossa mancata |
| capture | personal-05 | 13 | Bxd7+ | Errore |
| capture | personal-05 | 14 | Qxd7 | Mossa mancata |
| capture | personal-05 | 24 | Qxg5 | Errore grave |
| capture | personal-05 | 25 | Bxg5 | Migliore |
| capture | personal-05 | 31 | Bxg5 | Ottima |
| capture | personal-05 | 32 | Rxe5+ | Ottima |
| capture | personal-06 | 12 | Nxe5 | Migliore |
| capture | personal-06 | 14 | Bxd4 | Buona |
| capture | personal-06 | 15 | Qxd4 | Migliore |
| capture | personal-06 | 33 | Bxf6 | Migliore |
| capture | personal-06 | 34 | gxf6 | Errore |
| capture | personal-06 | 35 | Nxf6+ | Migliore |
| capture | personal-06 | 37 | Nxd7 | Migliore |
| capture | personal-06 | 38 | Nxd7 | Migliore |
| capture | personal-06 | 45 | gxh5 | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 16 | exd4 | Imprecisione |
| capture | game-1-chigorin-steinitz-1892 | 17 | cxd4 | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 21 | Bxd7+ | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 22 | Qxd7 | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 37 | Nxf7 | Errore |
| capture | game-1-chigorin-steinitz-1892 | 38 | Kxf7 | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 40 | Kxe6 | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 47 | Bxe7+ | Imprecisione |
| capture | game-1-chigorin-steinitz-1892 | 48 | Kxe7 | Imprecisione |
| capture | game-1-chigorin-steinitz-1892 | 49 | Nxg6+ | Migliore |
| capture | game-1-chigorin-steinitz-1892 | 51 | Nxh8 | Ottima |
| capture | game-1-chigorin-steinitz-1892 | 52 | Bxd4 | Buona |
| capture | game-1-chigorin-steinitz-1892 | 56 | Rxh8 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 17 | cxd5 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 18 | exd5 | Buona |
| capture | game-2-saintamant-staunton-1843 | 24 | cxd4 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 25 | exd4 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 52 | Nxf5 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 53 | Bxf5 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 71 | Bxc4 | Buona |
| capture | game-2-saintamant-staunton-1843 | 72 | dxc4 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 81 | Qxc3 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 84 | Bxe2 | Ottima |
| capture | game-2-saintamant-staunton-1843 | 85 | Rxe2 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 107 | hxg5 | Ottima |
| capture | game-2-saintamant-staunton-1843 | 108 | Bxf4 | Buona |
| capture | game-2-saintamant-staunton-1843 | 109 | Bxf4 | Buona |
| capture | game-2-saintamant-staunton-1843 | 110 | Qxe2 | Buona |
| capture | game-2-saintamant-staunton-1843 | 111 | Qxe2 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 113 | gxh6 | Ottima |
| capture | game-2-saintamant-staunton-1843 | 122 | Rxb4 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 126 | Rxd6 | Migliore |
| capture | game-2-saintamant-staunton-1843 | 128 | Kxh6 | Ottima |
| captureRookOrQueen | personal-01 | 41 | Bxa8 | Migliore |
| captureRookOrQueen | personal-02 | 51 | Qxf7+ | Mossa mancata |
| captureRookOrQueen | personal-03 | 31 | Qxe7+ | Buona |
| captureRookOrQueen | personal-03 | 45 | Rxg8 | Imprecisione |
| captureRookOrQueen | personal-03 | 46 | Rxg8 | Migliore |
| captureRookOrQueen | personal-03 | 77 | Kxf2 | Migliore |
| captureRookOrQueen | personal-03 | 108 | Qxf8+ | Buona |
| captureRookOrQueen | personal-03 | 109 | Kxf8 | Migliore |
| captureRookOrQueen | personal-04 | 31 | Nxb5 | Migliore |
| captureRookOrQueen | personal-04 | 35 | Bxa8 | Migliore |
| captureRookOrQueen | personal-04 | 43 | Qxh8 | Buona |
| captureRookOrQueen | personal-05 | 25 | Bxg5 | Migliore |
| captureRookOrQueen | personal-06 | 37 | Nxd7 | Migliore |
| captureRookOrQueen | game-1-chigorin-steinitz-1892 | 51 | Nxh8 | Ottima |
| captureRookOrQueen | game-2-saintamant-staunton-1843 | 71 | Bxc4 | Buona |
| captureRookOrQueen | game-2-saintamant-staunton-1843 | 84 | Bxe2 | Ottima |
| captureRookOrQueen | game-2-saintamant-staunton-1843 | 110 | Qxe2 | Buona |
| captureRookOrQueen | game-2-saintamant-staunton-1843 | 111 | Qxe2 | Migliore |
| captureRookOrQueen | game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore |
| check | personal-02 | 30 | Bxf2+ | Errore grave |
| check | personal-02 | 43 | Rxf6+ | Ottima |
| check | personal-02 | 47 | Bc3+ | Buona |
| check | personal-02 | 49 | Qf2+ | Migliore |
| check | personal-02 | 51 | Qxf7+ | Mossa mancata |
| check | personal-02 | 53 | Rf1+ | Ottima |
| check | personal-02 | 59 | Bf6+ | Buona |
| check | personal-02 | 61 | Bg5+ | Buona |
| check | personal-02 | 65 | Rxa7+ | Ottima |
| check | personal-02 | 69 | Ra6+ | Mossa mancata |
| check | personal-03 | 29 | Qxe5+ | Migliore |
| check | personal-03 | 31 | Qxe7+ | Buona |
| check | personal-03 | 41 | Re6+ | Errore grave |
| check | personal-03 | 48 | Rg1+ | Ottima |
| check | personal-03 | 82 | Qe1+ | Ottima |
| check | personal-03 | 84 | Qd1+ | Ottima |
| check | personal-03 | 86 | Qc2+ | Buona |
| check | personal-03 | 88 | Qd3+ | Buona |
| check | personal-03 | 92 | Qxc5+ | Migliore |
| check | personal-03 | 94 | Qg1+ | Mossa mancata |
| check | personal-03 | 108 | Qxf8+ | Buona |
| check | personal-04 | 41 | Qxb8+ | Migliore |
| check | personal-04 | 44 | Ne2+ | Imprecisione |
| check | personal-04 | 46 | Be4+ | Imprecisione |
| check | personal-04 | 53 | Qxg5+ | Buona |
| check | personal-05 | 13 | Bxd7+ | Errore |
| check | personal-05 | 32 | Rxe5+ | Ottima |
| check | personal-06 | 35 | Nxf6+ | Migliore |
| check | game-1-chigorin-steinitz-1892 | 21 | Bxd7+ | Migliore |
| check | game-1-chigorin-steinitz-1892 | 47 | Bxe7+ | Imprecisione |
| check | game-1-chigorin-steinitz-1892 | 49 | Nxg6+ | Migliore |
| check | game-1-chigorin-steinitz-1892 | 59 | Qh6+ | Ottima |
| check | game-2-saintamant-staunton-1843 | 102 | Qh2+ | Migliore |
| check | game-2-saintamant-staunton-1843 | 104 | Qh3+ | Migliore |
| check | game-2-saintamant-staunton-1843 | 129 | Ke2+ | Ottima |
| geometricDoubleAttack | personal-02 | 19 | Bc4 | Migliore |
| geometricDoubleAttack | personal-02 | 30 | Bxf2+ | Errore grave |
| geometricDoubleAttack | personal-02 | 43 | Rxf6+ | Ottima |
| geometricDoubleAttack | personal-03 | 29 | Qxe5+ | Migliore |
| geometricDoubleAttack | personal-04 | 26 | Qxb2 | Buona |
| geometricDoubleAttack | personal-04 | 46 | Be4+ | Imprecisione |
| geometricDoubleAttack | personal-05 | 12 | Nxf2 | Mossa mancata |
| geometricDoubleAttack | personal-05 | 13 | Bxd7+ | Errore |
| geometricDoubleAttack | personal-05 | 32 | Rxe5+ | Ottima |
| geometricDoubleAttack | personal-06 | 35 | Nxf6+ | Migliore |
| geometricDoubleAttack | personal-06 | 37 | Nxd7 | Migliore |
| geometricDoubleAttack | game-1-chigorin-steinitz-1892 | 49 | Nxg6+ | Migliore |
| geometricDoubleAttack | game-2-saintamant-staunton-1843 | 51 | Nf5 | Imprecisione |
| kingAndQueenAttack | personal-02 | 30 | Bxf2+ | Errore grave |
| kingAndQueenAttack | personal-06 | 35 | Nxf6+ | Migliore |
| recapture | personal-01 | 13 | Bxc3 | Migliore |
| recapture | personal-01 | 42 | Qxa8 | Migliore |
| recapture | personal-02 | 18 | Rxf7 | Migliore |
| recapture | personal-02 | 22 | Kxf7 | Migliore |
| recapture | personal-02 | 42 | gxf6 | Migliore |
| recapture | personal-02 | 43 | Rxf6+ | Ottima |
| recapture | personal-03 | 12 | Qxf6 | Migliore |
| recapture | personal-03 | 20 | Qxd6 | Migliore |
| recapture | personal-03 | 28 | Nxe5 | Mossa mancata |
| recapture | personal-03 | 29 | Qxe5+ | Migliore |
| recapture | personal-03 | 43 | dxe6 | Errore |
| recapture | personal-03 | 44 | Kxe6 | Mossa mancata |
| recapture | personal-03 | 46 | Rxg8 | Migliore |
| recapture | personal-03 | 109 | Kxf8 | Migliore |
| recapture | personal-04 | 14 | Qxd6 | Migliore |
| recapture | personal-04 | 32 | cxb5 | Errore |
| recapture | personal-05 | 14 | Qxd7 | Mossa mancata |
| recapture | personal-05 | 25 | Bxg5 | Migliore |
| recapture | personal-06 | 12 | Nxe5 | Migliore |
| recapture | personal-06 | 15 | Qxd4 | Migliore |
| recapture | personal-06 | 34 | gxf6 | Errore |
| recapture | personal-06 | 35 | Nxf6+ | Migliore |
| recapture | personal-06 | 38 | Nxd7 | Migliore |
| recapture | game-1-chigorin-steinitz-1892 | 17 | cxd4 | Migliore |
| recapture | game-1-chigorin-steinitz-1892 | 22 | Qxd7 | Migliore |
| recapture | game-1-chigorin-steinitz-1892 | 38 | Kxf7 | Migliore |
| recapture | game-1-chigorin-steinitz-1892 | 48 | Kxe7 | Imprecisione |
| recapture | game-2-saintamant-staunton-1843 | 18 | exd5 | Buona |
| recapture | game-2-saintamant-staunton-1843 | 25 | exd4 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 53 | Bxf5 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 72 | dxc4 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 81 | Qxc3 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 85 | Rxe2 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 109 | Bxf4 | Buona |
| recapture | game-2-saintamant-staunton-1843 | 111 | Qxe2 | Migliore |
| recapture | game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore |
| answerToCheck | personal-02 | 44 | Kg7 | Migliore |
| answerToCheck | personal-02 | 48 | Kf8 | Imprecisione |
| answerToCheck | personal-02 | 50 | Qf7 | Migliore |
| answerToCheck | personal-02 | 54 | Ke7 | Errore |
| answerToCheck | personal-02 | 60 | Kf7 | Imprecisione |
| answerToCheck | personal-02 | 62 | Kg7 | Buona |
| answerToCheck | personal-02 | 66 | Kg6 | Errore |
| answerToCheck | personal-02 | 70 | Kg7 | Buona |
| answerToCheck | personal-02 | 74 | Kf8 | Migliore |
| answerToCheck | personal-03 | 20 | Qxd6 | Migliore |
| answerToCheck | personal-03 | 30 | Qe7 | Buona |
| answerToCheck | personal-03 | 49 | Kd2 | Migliore |
| answerToCheck | personal-03 | 83 | Kf3 | Migliore |
| answerToCheck | personal-03 | 85 | Ke4 | Ottima |
| answerToCheck | personal-03 | 87 | Kf3 | Imprecisione |
| answerToCheck | personal-03 | 89 | Kg4 | Buona |
| answerToCheck | personal-03 | 93 | f5 | Ottima |
| answerToCheck | personal-03 | 95 | Kf6 | Imprecisione |
| answerToCheck | personal-03 | 109 | Kxf8 | Migliore |
| answerToCheck | personal-04 | 30 | Kf8 | Migliore |
| answerToCheck | personal-04 | 45 | Kg2 | Buona |
| answerToCheck | personal-04 | 47 | f3 | Ottima |
| answerToCheck | personal-04 | 54 | Kd7 | Errore |
| answerToCheck | personal-05 | 14 | Qxd7 | Mossa mancata |
| answerToCheck | personal-05 | 33 | Kd2 | Ottima |
| answerToCheck | personal-06 | 36 | Kg7 | Migliore |
| answerToCheck | game-1-chigorin-steinitz-1892 | 22 | Qxd7 | Migliore |
| answerToCheck | game-1-chigorin-steinitz-1892 | 32 | Kf8 | Migliore |
| answerToCheck | game-1-chigorin-steinitz-1892 | 40 | Kxe6 | Migliore |
| answerToCheck | game-1-chigorin-steinitz-1892 | 48 | Kxe7 | Imprecisione |
| answerToCheck | game-1-chigorin-steinitz-1892 | 50 | Kf6 | Migliore |
| answerToCheck | game-1-chigorin-steinitz-1892 | 60 | Rg6 | Imprecisione |
| answerToCheck | game-2-saintamant-staunton-1843 | 103 | Kf1 | Migliore |
| answerToCheck | game-2-saintamant-staunton-1843 | 105 | Kg1 | Migliore |
| answerToCheck | game-2-saintamant-staunton-1843 | 130 | Kg6 | Ottima |
| afterLocalNumericalError | personal-01 | 30 | Nh5 | Mossa mancata |
| afterLocalNumericalError | personal-01 | 31 | g4 | Errore |
| afterLocalNumericalError | personal-01 | 32 | Bxf3 | Migliore |
| afterLocalNumericalError | personal-01 | 35 | Bc3 | Mossa mancata |
| afterLocalNumericalError | personal-01 | 36 | Qd8 | Imprecisione |
| afterLocalNumericalError | personal-01 | 37 | Qe3 | Ottima |
| afterLocalNumericalError | personal-02 | 18 | Rxf7 | Migliore |
| afterLocalNumericalError | personal-03 | 27 | Nxe5 | Mossa mancata |
| afterLocalNumericalError | personal-03 | 28 | Nxe5 | Mossa mancata |
| afterLocalNumericalError | personal-03 | 29 | Qxe5+ | Migliore |
| afterLocalNumericalError | personal-03 | 45 | Rxg8 | Imprecisione |
| afterLocalNumericalError | personal-04 | 24 | hxg5 | Migliore |
| afterLocalNumericalError | personal-05 | 12 | Nxf2 | Mossa mancata |
| afterLocalNumericalError | personal-05 | 14 | Qxd7 | Mossa mancata |
| afterLocalNumericalError | personal-05 | 15 | Qe2 | Errore grave |
| afterLocalNumericalError | personal-05 | 25 | Bxg5 | Migliore |
| afterLocalNumericalError | personal-06 | 33 | Bxf6 | Migliore |
| afterLocalNumericalError | game-1-chigorin-steinitz-1892 | 38 | Kxf7 | Migliore |
| playedIsPv1 | personal-01 | 13 | Bxc3 | Migliore |
| playedIsPv1 | personal-01 | 14 | Nf6 | Migliore |
| playedIsPv1 | personal-01 | 16 | O-O | Ottima |
| playedIsPv1 | personal-01 | 20 | b6 | Ottima |
| playedIsPv1 | personal-01 | 22 | Bb7 | Migliore |
| playedIsPv1 | personal-01 | 26 | Re8 | Migliore |
| playedIsPv1 | personal-01 | 32 | Bxf3 | Migliore |
| playedIsPv1 | personal-01 | 39 | Be4 | Migliore |
| playedIsPv1 | personal-01 | 41 | Bxa8 | Migliore |
| playedIsPv1 | personal-01 | 42 | Qxa8 | Migliore |
| playedIsPv1 | personal-01 | 43 | Qg3 | Migliore |
| playedIsPv1 | personal-01 | 48 | f6 | Migliore |
| playedIsPv1 | personal-01 | 49 | Qxf6 | Migliore |
| playedIsPv1 | personal-02 | 9 | Nc3 | Migliore |
| playedIsPv1 | personal-02 | 10 | e5 | Migliore |
| playedIsPv1 | personal-02 | 12 | Bb4 | Migliore |
| playedIsPv1 | personal-02 | 18 | Rxf7 | Migliore |
| playedIsPv1 | personal-02 | 19 | Bc4 | Migliore |
| playedIsPv1 | personal-02 | 22 | Kxf7 | Migliore |
| playedIsPv1 | personal-02 | 23 | a3 | Migliore |
| playedIsPv1 | personal-02 | 24 | Bc5 | Migliore |
| playedIsPv1 | personal-02 | 26 | Bg4 | Migliore |
| playedIsPv1 | personal-02 | 27 | Qe1 | Migliore |
| playedIsPv1 | personal-02 | 41 | Nxf6 | Migliore |
| playedIsPv1 | personal-02 | 42 | gxf6 | Migliore |
| playedIsPv1 | personal-02 | 43 | Rxf6+ | Ottima |
| playedIsPv1 | personal-02 | 56 | Bxc2 | Migliore |
| playedIsPv1 | personal-02 | 62 | Kg7 | Buona |
| playedIsPv1 | personal-02 | 63 | Ra6 | Migliore |
| playedIsPv1 | personal-02 | 67 | Bh4 | Migliore |
| playedIsPv1 | personal-03 | 11 | Bxf6 | Migliore |
| playedIsPv1 | personal-03 | 12 | Qxf6 | Migliore |
| playedIsPv1 | personal-03 | 24 | g5 | Buona |
| playedIsPv1 | personal-03 | 29 | Qxe5+ | Migliore |
| playedIsPv1 | personal-03 | 35 | gxf4 | Ottima |
| playedIsPv1 | personal-03 | 37 | Re1 | Migliore |
| playedIsPv1 | personal-03 | 38 | gxf4 | Migliore |
| playedIsPv1 | personal-03 | 40 | Rhg8 | Ottima |
| playedIsPv1 | personal-03 | 46 | Rxg8 | Migliore |
| playedIsPv1 | personal-03 | 49 | Kd2 | Migliore |
| playedIsPv1 | personal-03 | 56 | Kc5 | Ottima |
| playedIsPv1 | personal-03 | 57 | Kd2 | Buona |
| playedIsPv1 | personal-03 | 63 | d4 | Migliore |
| playedIsPv1 | personal-03 | 72 | h4 | Migliore |
| playedIsPv1 | personal-03 | 73 | Kxf4 | Ottima |
| playedIsPv1 | personal-03 | 74 | h3 | Ottima |
| playedIsPv1 | personal-03 | 76 | h2 | Ottima |
| playedIsPv1 | personal-03 | 77 | Kxf2 | Migliore |
| playedIsPv1 | personal-03 | 78 | h1=Q | Migliore |
| playedIsPv1 | personal-03 | 80 | Qxd1 | Buona |
| playedIsPv1 | personal-03 | 83 | Kf3 | Migliore |
| playedIsPv1 | personal-03 | 89 | Kg4 | Buona |
| playedIsPv1 | personal-03 | 93 | f5 | Ottima |
| playedIsPv1 | personal-03 | 95 | Kf6 | Imprecisione |
| playedIsPv1 | personal-03 | 100 | a4 | Migliore |
| playedIsPv1 | personal-03 | 101 | Ke6 | Migliore |
| playedIsPv1 | personal-03 | 103 | f7 | Migliore |
| playedIsPv1 | personal-03 | 105 | Ke7 | Migliore |
| playedIsPv1 | personal-03 | 106 | a1=Q | Migliore |
| playedIsPv1 | personal-03 | 107 | f8=Q | Migliore |
| playedIsPv1 | personal-03 | 109 | Kxf8 | Migliore |
| playedIsPv1 | personal-03 | 111 | Kf7 | Migliore |
| playedIsPv1 | personal-03 | 115 | Kf5 | Ottima |
| playedIsPv1 | personal-03 | 118 | c3 | Migliore |
| playedIsPv1 | personal-03 | 120 | c2 | Migliore |
| playedIsPv1 | personal-03 | 127 | Kf3 | Migliore |
| playedIsPv1 | personal-03 | 131 | Kf3 | Migliore |
| playedIsPv1 | personal-04 | 11 | Bg2 | Migliore |
| playedIsPv1 | personal-04 | 13 | Bxd6 | Migliore |
| playedIsPv1 | personal-04 | 14 | Qxd6 | Migliore |
| playedIsPv1 | personal-04 | 18 | Bg6 | Migliore |
| playedIsPv1 | personal-04 | 19 | O-O | Migliore |
| playedIsPv1 | personal-04 | 24 | hxg5 | Migliore |
| playedIsPv1 | personal-04 | 27 | Nxc4 | Migliore |
| playedIsPv1 | personal-04 | 31 | Nxb5 | Migliore |
| playedIsPv1 | personal-04 | 33 | Bxb7 | Migliore |
| playedIsPv1 | personal-04 | 35 | Bxa8 | Migliore |
| playedIsPv1 | personal-04 | 39 | Qxb5 | Migliore |
| playedIsPv1 | personal-04 | 41 | Qxb8+ | Migliore |
| playedIsPv1 | personal-04 | 45 | Kg2 | Buona |
| playedIsPv1 | personal-04 | 49 | Bxe4 | Buona |
| playedIsPv1 | personal-04 | 54 | Kd7 | Errore |
| playedIsPv1 | personal-05 | 20 | O-O | Migliore |
| playedIsPv1 | personal-05 | 25 | Bxg5 | Migliore |
| playedIsPv1 | personal-05 | 33 | Kd2 | Ottima |
| playedIsPv1 | personal-05 | 35 | Re1 | Migliore |
| playedIsPv1 | personal-06 | 12 | Nxe5 | Migliore |
| playedIsPv1 | personal-06 | 15 | Qxd4 | Migliore |
| playedIsPv1 | personal-06 | 16 | d6 | Migliore |
| playedIsPv1 | personal-06 | 22 | Bg6 | Migliore |
| playedIsPv1 | personal-06 | 24 | h6 | Migliore |
| playedIsPv1 | personal-06 | 25 | Bh4 | Migliore |
| playedIsPv1 | personal-06 | 27 | Qf2 | Migliore |
| playedIsPv1 | personal-06 | 33 | Bxf6 | Migliore |
| playedIsPv1 | personal-06 | 35 | Nxf6+ | Migliore |
| playedIsPv1 | personal-06 | 36 | Kg7 | Migliore |
| playedIsPv1 | personal-06 | 37 | Nxd7 | Migliore |
| playedIsPv1 | personal-06 | 39 | Qg3 | Ottima |
| playedIsPv1 | personal-06 | 41 | f4 | Ottima |
| playedIsPv1 | personal-06 | 45 | gxh5 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 13 | d4 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 17 | cxd4 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 21 | Bxd7+ | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 22 | Qxd7 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 26 | Bb6 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 27 | a4 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 32 | Kf8 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 34 | Kg8 | Ottima |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 35 | Rb1 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 38 | Kxf7 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 40 | Kxe6 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 46 | g6 | Ottima |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 50 | Kf6 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 55 | Rf3 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 56 | Rxh8 | Migliore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 58 | Rg8 | Errore |
| playedIsPv1 | game-1-chigorin-steinitz-1892 | 59 | Qh6+ | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 14 | O-O | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 17 | cxd5 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 21 | a3 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 24 | cxd4 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 25 | exd4 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 26 | h6 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 28 | Bd6 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 29 | Re1 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 32 | Rc8 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 33 | Qb3 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 34 | Qc7 | Buona |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 35 | Bd2 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 37 | Be3 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 41 | Qd1 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 42 | Nf6 | Buona |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 48 | Nf6 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 52 | Nxf5 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 53 | Bxf5 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 58 | Rc4 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 60 | Nf6 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 63 | Qb2 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 72 | dxc4 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 78 | Rg6 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 81 | Qxc3 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 85 | Rxe2 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 88 | Re6 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 89 | Kf2 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 93 | g3 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 95 | Qa3 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 98 | Qh1 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 99 | h4 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 100 | g5 | Buona |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 102 | Qh2+ | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 103 | Kf1 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 104 | Qh3+ | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 107 | hxg5 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 111 | Qxe2 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 113 | gxh6 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 114 | c3 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 116 | Re4 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 123 | d6 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 130 | Kg6 | Ottima |
| playedIsPv1 | game-2-saintamant-staunton-1843 | 132 | b4 | Ottima |
| mateSignal | personal-02 | 49 | Qf2+ | Migliore |
| mateSignal | personal-02 | 67 | Bh4 | Migliore |
| mateSignal | personal-03 | 100 | a4 | Migliore |
| mateSignal | personal-03 | 102 | a3 | Migliore |
| mateSignal | personal-03 | 104 | a2 | Migliore |
| mateSignal | personal-03 | 106 | a1=Q | Migliore |
| mateSignal | personal-03 | 108 | Qxf8+ | Buona |
| mateSignal | personal-03 | 110 | Qe1 | Migliore |
| mateSignal | personal-03 | 112 | Ka3 | Ottima |
| mateSignal | personal-03 | 114 | c5 | Migliore |
| mateSignal | personal-03 | 116 | c4 | Migliore |
| mateSignal | personal-03 | 118 | c3 | Migliore |
| mateSignal | personal-03 | 120 | c2 | Migliore |
| mateSignal | personal-03 | 122 | c1=Q | Ottima |
| mateSignal | personal-03 | 124 | b5 | Ottima |
| mateSignal | personal-03 | 126 | b4 | Buona |
| mateSignal | personal-03 | 128 | b3 | Ottima |
| mateSignal | personal-03 | 130 | b2 | Buona |
| mateSignal | personal-03 | 132 | b1=Q | Migliore |
| mateSignal | personal-03 | 134 | Qec3 | Migliore |
| mateSignal | personal-04 | 49 | Bxe4 | Buona |
| mateSignal | personal-04 | 51 | Qxg7 | Buona |
| mateSignal | personal-04 | 53 | Qxg5+ | Buona |
| mateSignal | personal-04 | 55 | Rac1 | Migliore |
| gainPersistsAt4Ply | personal-01 | 13 | Bxc3 | Migliore |
| gainPersistsAt4Ply | personal-01 | 26 | Re8 | Migliore |
| gainPersistsAt4Ply | personal-01 | 29 | Qd2 | Errore |
| gainPersistsAt4Ply | personal-01 | 32 | Bxf3 | Migliore |
| gainPersistsAt4Ply | personal-01 | 33 | gxh5 | Imprecisione |
| gainPersistsAt4Ply | personal-01 | 38 | Bxh5 | Buona |
| gainPersistsAt4Ply | personal-01 | 39 | Be4 | Migliore |
| gainPersistsAt4Ply | personal-01 | 41 | Bxa8 | Migliore |
| gainPersistsAt4Ply | personal-01 | 42 | Qxa8 | Migliore |
| gainPersistsAt4Ply | personal-01 | 43 | Qg3 | Migliore |
| gainPersistsAt4Ply | personal-01 | 48 | f6 | Migliore |
| gainPersistsAt4Ply | personal-01 | 49 | Qxf6 | Migliore |
| gainPersistsAt4Ply | personal-02 | 13 | Nxe5 | Ottima |
| gainPersistsAt4Ply | personal-02 | 18 | Rxf7 | Migliore |
| gainPersistsAt4Ply | personal-02 | 19 | Bc4 | Migliore |
| gainPersistsAt4Ply | personal-02 | 22 | Kxf7 | Migliore |
| gainPersistsAt4Ply | personal-02 | 28 | Qe8 | Buona |
| gainPersistsAt4Ply | personal-02 | 33 | h3 | Buona |
| gainPersistsAt4Ply | personal-02 | 35 | g4 | Ottima |
| gainPersistsAt4Ply | personal-02 | 37 | Rd1 | Buona |
| gainPersistsAt4Ply | personal-02 | 39 | Nxd5 | Ottima |
| gainPersistsAt4Ply | personal-02 | 41 | Nxf6 | Migliore |
| gainPersistsAt4Ply | personal-02 | 43 | Rxf6+ | Ottima |
| gainPersistsAt4Ply | personal-02 | 45 | Rxa6 | Ottima |
| gainPersistsAt4Ply | personal-02 | 46 | Bxe4 | Imprecisione |
| gainPersistsAt4Ply | personal-02 | 49 | Qf2+ | Migliore |
| gainPersistsAt4Ply | personal-02 | 56 | Bxc2 | Migliore |
| gainPersistsAt4Ply | personal-02 | 58 | Rc8 | Migliore |
| gainPersistsAt4Ply | personal-02 | 63 | Ra6 | Migliore |
| gainPersistsAt4Ply | personal-02 | 65 | Rxa7+ | Ottima |
| gainPersistsAt4Ply | personal-02 | 67 | Bh4 | Migliore |
| gainPersistsAt4Ply | personal-03 | 5 | Nc3 | Buona |
| gainPersistsAt4Ply | personal-03 | 12 | Qxf6 | Migliore |
| gainPersistsAt4Ply | personal-03 | 17 | b3 | Imprecisione |
| gainPersistsAt4Ply | personal-03 | 20 | Qxd6 | Migliore |
| gainPersistsAt4Ply | personal-03 | 23 | g3 | Buona |
| gainPersistsAt4Ply | personal-03 | 25 | Qe2 | Buona |
| gainPersistsAt4Ply | personal-03 | 27 | Nxe5 | Mossa mancata |
| gainPersistsAt4Ply | personal-03 | 29 | Qxe5+ | Migliore |
| gainPersistsAt4Ply | personal-03 | 36 | Bg4 | Ottima |
| gainPersistsAt4Ply | personal-03 | 38 | gxf4 | Migliore |
| gainPersistsAt4Ply | personal-03 | 40 | Rhg8 | Ottima |
| gainPersistsAt4Ply | personal-03 | 44 | Kxe6 | Mossa mancata |
| gainPersistsAt4Ply | personal-03 | 46 | Rxg8 | Migliore |
| gainPersistsAt4Ply | personal-03 | 52 | Rxh2 | Ottima |
| gainPersistsAt4Ply | personal-03 | 58 | Kb4 | Buona |
| gainPersistsAt4Ply | personal-03 | 60 | Kxb3 | Ottima |
| gainPersistsAt4Ply | personal-03 | 62 | Kxa4 | Ottima |
| gainPersistsAt4Ply | personal-03 | 66 | c6 | Migliore |
| gainPersistsAt4Ply | personal-03 | 70 | Rf2 | Ottima |
| gainPersistsAt4Ply | personal-03 | 71 | Ke4 | Ottima |
| gainPersistsAt4Ply | personal-03 | 73 | Kxf4 | Ottima |
| gainPersistsAt4Ply | personal-03 | 76 | h2 | Ottima |
| gainPersistsAt4Ply | personal-03 | 78 | h1=Q | Migliore |
| gainPersistsAt4Ply | personal-03 | 80 | Qxd1 | Buona |
| gainPersistsAt4Ply | personal-03 | 88 | Qd3+ | Buona |
| gainPersistsAt4Ply | personal-03 | 90 | Qxd4 | Migliore |
| gainPersistsAt4Ply | personal-03 | 92 | Qxc5+ | Migliore |
| gainPersistsAt4Ply | personal-03 | 102 | a3 | Migliore |
| gainPersistsAt4Ply | personal-03 | 109 | Kxf8 | Migliore |
| gainPersistsAt4Ply | personal-03 | 118 | c3 | Migliore |
| gainPersistsAt4Ply | personal-03 | 120 | c2 | Migliore |
| gainPersistsAt4Ply | personal-03 | 122 | c1=Q | Ottima |
| gainPersistsAt4Ply | personal-03 | 130 | b2 | Buona |
| gainPersistsAt4Ply | personal-03 | 132 | b1=Q | Migliore |
| gainPersistsAt4Ply | personal-04 | 14 | Qxd6 | Migliore |
| gainPersistsAt4Ply | personal-04 | 24 | hxg5 | Migliore |
| gainPersistsAt4Ply | personal-04 | 25 | a3 | Migliore |
| gainPersistsAt4Ply | personal-04 | 27 | Nxc4 | Migliore |
| gainPersistsAt4Ply | personal-04 | 31 | Nxb5 | Migliore |
| gainPersistsAt4Ply | personal-04 | 33 | Bxb7 | Migliore |
| gainPersistsAt4Ply | personal-04 | 35 | Bxa8 | Migliore |
| gainPersistsAt4Ply | personal-04 | 37 | Qb3 | Ottima |
| gainPersistsAt4Ply | personal-04 | 39 | Qxb5 | Migliore |
| gainPersistsAt4Ply | personal-04 | 41 | Qxb8+ | Migliore |
| gainPersistsAt4Ply | personal-04 | 43 | Qxh8 | Buona |
| gainPersistsAt4Ply | personal-04 | 47 | f3 | Ottima |
| gainPersistsAt4Ply | personal-04 | 49 | Bxe4 | Buona |
| gainPersistsAt4Ply | personal-04 | 51 | Qxg7 | Buona |
| gainPersistsAt4Ply | personal-04 | 53 | Qxg5+ | Buona |
| gainPersistsAt4Ply | personal-04 | 55 | Rac1 | Migliore |
| gainPersistsAt4Ply | personal-05 | 9 | dxe5 | Migliore |
| gainPersistsAt4Ply | personal-05 | 12 | Nxf2 | Mossa mancata |
| gainPersistsAt4Ply | personal-05 | 14 | Qxd7 | Mossa mancata |
| gainPersistsAt4Ply | personal-05 | 19 | Ng5 | Imprecisione |
| gainPersistsAt4Ply | personal-05 | 21 | Nc3 | Ottima |
| gainPersistsAt4Ply | personal-05 | 25 | Bxg5 | Migliore |
| gainPersistsAt4Ply | personal-05 | 29 | Bf4 | Migliore |
| gainPersistsAt4Ply | personal-05 | 30 | g5 | Ottima |
| gainPersistsAt4Ply | personal-05 | 31 | Bxg5 | Ottima |
| gainPersistsAt4Ply | personal-05 | 32 | Rxe5+ | Ottima |
| gainPersistsAt4Ply | personal-06 | 10 | O-O | Ottima |
| gainPersistsAt4Ply | personal-06 | 12 | Nxe5 | Migliore |
| gainPersistsAt4Ply | personal-06 | 15 | Qxd4 | Migliore |
| gainPersistsAt4Ply | personal-06 | 33 | Bxf6 | Migliore |
| gainPersistsAt4Ply | personal-06 | 35 | Nxf6+ | Migliore |
| gainPersistsAt4Ply | personal-06 | 37 | Nxd7 | Migliore |
| gainPersistsAt4Ply | personal-06 | 38 | Nxd7 | Migliore |
| gainPersistsAt4Ply | personal-06 | 40 | Ne5 | Migliore |
| gainPersistsAt4Ply | personal-06 | 41 | f4 | Ottima |
| gainPersistsAt4Ply | personal-06 | 42 | Nc4 | Ottima |
| gainPersistsAt4Ply | personal-06 | 44 | h5 | Buona |
| gainPersistsAt4Ply | personal-06 | 45 | gxh5 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 17 | cxd4 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 22 | Qxd7 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 32 | Kf8 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 38 | Kxf7 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 40 | Kxe6 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 46 | g6 | Ottima |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 47 | Bxe7+ | Imprecisione |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 48 | Kxe7 | Imprecisione |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 49 | Nxg6+ | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 51 | Nxh8 | Ottima |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 52 | Bxd4 | Buona |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 54 | Qd7 | Ottima |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 56 | Rxh8 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 57 | g4 | Migliore |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 59 | Qh6+ | Ottima |
| gainPersistsAt4Ply | game-1-chigorin-steinitz-1892 | 60 | Rg6 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 7 | Nc3 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 11 | Bd3 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 13 | O-O | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 18 | exd5 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 19 | Qc2 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 25 | exd4 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 34 | Qc7 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 53 | Bxf5 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 58 | Rc4 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 65 | Kg1 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 67 | Qd2 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 69 | f4 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 71 | Bxc4 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 72 | dxc4 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 74 | Rf6 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 78 | Rg6 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 81 | Qxc3 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 84 | Bxe2 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 85 | Rxe2 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 86 | Qe7 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 94 | Qb7 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 97 | Qc3 | Imprecisione |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 102 | Qh2+ | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 103 | Kf1 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 104 | Qh3+ | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 106 | Qg4 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 108 | Bxf4 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 110 | Qxe2 | Buona |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 111 | Qxe2 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 113 | gxh6 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 118 | Kg6 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 120 | c2 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 122 | Rxb4 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 124 | Rd4 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 126 | Rxd6 | Migliore |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 128 | Kxh6 | Ottima |
| gainPersistsAt4Ply | game-2-saintamant-staunton-1843 | 132 | b4 | Ottima |

Nessuna regola o soglia adattata ai conteggi. Le proprietà non equivalgono a motivazione certa di Chess.com. Test sintetici delle feature eseguiti separatamente; suite app/build/browser NON ESEGUITI. .env e Partite/7–10 non letti. App/cache/file precedenti intatti. Nessun commit/push.
