# Confronto QA

Classificazione per calo di probabilità (punti percentuali). Soglie iniziali non tarate sulle fixture: {"best":1,"excellent":3,"good":5,"inaccuracy":10,"mistake":20}. Le esclusioni possono sovrapporsi. Modello approssimato: sigmoid(cp/400), senza taglio dei centipawn. Matto vincente: 100%; perdente: 0%.

## Totale del gruppo (sanity esclusa)

Ply: 193; inclusi: 161; esclusi: 32.
Corrispondenza esatta: 44.72049689440994%; entro una classe: 85.71428571428571%.

| Categoria attesa | Totale | Inclusi | Esatti |
|---|---|---|---|
| Migliore | 56 | 56 | 45 |
| Ottima | 47 | 47 | 20 |
| Buona | 26 | 26 | 3 |
| Imprecisione | 24 | 24 | 4 |
| Errore | 9 | 8 | 0 |
| Errore grave | 0 | 0 | 0 |
| Libro | 19 | 0 | 0 |
| Geniale | 2 | 0 | 0 |
| Grande | 10 | 0 | 0 |
| Mossa mancata | 0 | 0 | 0 |
| Non valutabile | 0 | 0 | 0 |
| Forzata | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## game-1-chigorin-steinitz-1892: Chigorin vs Steinitz, 1892 (World Championship Rematch, Game 1)

Ply: 61; inclusi: 40; esclusi unici: 21.
Corrispondenza esatta: 37.5%; entro una classe: 80%.

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
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":12,"unsupported":8,"suspect":1,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | e5 | Libro | Migliore | 0.6862851101817502 | -11 | -28 | N/D | -39 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0.18706619898509746 | -3 | 40 | N/D | 37 | N/D | book |
| 4 | Nc6 | Libro | Migliore | 0.8106034252805261 | -13 | -32 | N/D | -45 | N/D | book |
| 5 | Bc4 | Libro | Ottima | 1.497780742521393 | -24 | 42 | N/D | 18 | N/D | book |
| 6 | Bc5 | Libro | Migliore | 0.8119488811144493 | -13 | -14 | N/D | -27 | N/D | book |
| 7 | b4 | Libro | Ottima | 2.935407582871341 | -47 | 40 | N/D | -7 | N/D | book |
| 8 | Bxb4 | Libro | Migliore | 0 | 32 | 0 | N/D | 32 | N/D | book |
| 9 | c3 | Libro | Ottima | 1.2459889697703064 | -20 | -35 | N/D | -55 | N/D | book |
| 10 | Ba5 | Libro | Ottima | 1.0621111007978246 | -17 | 23 | N/D | 6 | N/D | book |
| 11 | O-O | Libro | Ottima | 2.8062335325533816 | -45 | -13 | N/D | -58 | N/D | book |
| 12 | d6 | Libro | Ottima | 1.2454466105233708 | -20 | 58 | N/D | 38 | N/D | book |
| 13 | d4 | Migliore | Migliore | 0.374398892842015 | -6 | -29 | N/D | -35 | N/D |  |
| 14 | Bg4 | Migliore | Migliore | 0.31165955763864384 | -5 | 44 | N/D | 39 | N/D |  |
| 15 | Bb5 | Ottima | Ottima | 1.4928220594522479 | -24 | -43 | N/D | -67 | N/D |  |
| 16 | exd4 | Imprecisione | Ottima | 2.49193829361557 | -40 | 64 | N/D | 24 | N/D |  |
| 17 | cxd4 | Migliore | Migliore | 0 | 1 | -28 | N/D | -27 | N/D |  |
| 18 | Bd7 | Imprecisione | Buona | 3.8105810657659003 | -61 | 27 | N/D | -34 | N/D |  |
| 19 | Bb2 | Imprecisione | Ottima | 2.811573192314687 | -45 | 29 | N/D | -16 | N/D |  |
| 20 | Nce7 | Errore | Imprecisione | 6.230657645429072 | -100 | 16 | N/D | -84 | N/D |  |
| 21 | Bxd7+ | Migliore | Ottima | 1.1143272039338736 | -18 | 87 | N/D | 69 | N/D |  |
| 22 | Qxd7 | Migliore | Migliore | 0.6183126524080429 | -10 | -78 | N/D | -88 | N/D |  |
| 23 | Na3 | Ottima | Ottima | 1.9793803414763889 | -32 | 97 | N/D | 65 | N/D |  |
| 24 | Nh6 | Imprecisione | Buona | 4.921794889767039 | -80 | -58 | N/D | -138 | N/D |  |
| 25 | Nc4 | Grande | Ottima | 2.0153821562365115 | -33 | 138 | N/D | 105 | N/D | unsupported |
| 26 | Bb6 | Migliore | Migliore | 0 | 3 | -111 | N/D | -108 | N/D |  |
| 27 | a4 | Migliore | Migliore | 0 | 6 | 108 | N/D | 114 | N/D |  |
| 28 | c6 | Grande | Migliore | 0.7954939015017259 | -13 | -110 | N/D | -123 | N/D | unsupported |
| 29 | e5 | Migliore | Ottima | 2.4011955280125785 | -39 | 117 | N/D | 78 | N/D |  |
| 30 | d5 | Errore | Imprecisione | 9.136289911626955 | -152 | -77 | N/D | -229 | N/D |  |
| 31 | Nd6+ | Grande | Migliore | 0.2895203469582386 | -5 | 225 | N/D | 220 | N/D | unsupported |
| 32 | Kf8 | Migliore | Ottima | 1.154476639607016 | -20 | -217 | N/D | -237 | N/D |  |
| 33 | Ba3 | Migliore | Migliore | 0 | 10 | 237 | N/D | 247 | N/D |  |
| 34 | Kg8 | Ottima | Migliore | 0.45554721080686145 | -8 | -242 | N/D | -250 | N/D |  |
| 35 | Rb1 | Migliore | Ottima | 1.9705079237865242 | -34 | 238 | N/D | 204 | N/D |  |
| 36 | Nhf5 | Errore | Imprecisione | 8.37430706467278 | -156 | -236 | N/D | -392 | N/D |  |
| 37 | Nxf7 | Errore | Errore | 12.782005283277343 | -231 | 392 | N/D | 161 | N/D | suspect |
| 38 | Kxf7 | Migliore | Migliore | 0 | 21 | -185 | N/D | -164 | N/D |  |
| 39 | e6+ | Grande | Migliore | 0 | 18 | 195 | N/D | 213 | N/D | unsupported |
| 40 | Kxe6 | Migliore | Migliore | 0 | 0 | -213 | N/D | -213 | N/D |  |
| 41 | Ne5 | Migliore | Imprecisione | 6.716434173064689 | -114 | 250 | N/D | 136 | N/D |  |
| 42 | Qc8 | Imprecisione | Migliore | 0 | 1 | -158 | N/D | -157 | N/D |  |
| 43 | Re1 | Grande | Migliore | 0 | 39 | 162 | N/D | 201 | N/D | unsupported |
| 44 | Kf6 | Imprecisione | Buona | 4.208497151350238 | -74 | -210 | N/D | -284 | N/D |  |
| 45 | Qh5 | Grande | Migliore | 0.3804584340843409 | -7 | 306 | N/D | 299 | N/D | unsupported |
| 46 | g6 | Ottima | Migliore | 0.8874798515534299 | -17 | -336 | N/D | -353 | N/D |  |
| 47 | Bxe7+ | Imprecisione | Ottima | 1.1674570771445736 | -22 | 339 | N/D | 317 | N/D |  |
| 48 | Kxe7 | Imprecisione | Migliore | 0.7334583602208733 | -14 | -334 | N/D | -348 | N/D |  |
| 49 | Nxg6+ | Migliore | Migliore | 0 | 25 | 345 | N/D | 370 | N/D |  |
| 50 | Kf6 | Migliore | Ottima | 1.0371670903505936 | -20 | -341 | N/D | -361 | N/D |  |
| 51 | Nxh8 | Ottima | Imprecisione | 7.474324419093881 | -161 | 527 | N/D | 366 | N/D |  |
| 52 | Bxd4 | Buona | Imprecisione | 6.429969842240949 | -136 | -364 | N/D | -500 | N/D |  |
| 53 | Rb3 | Geniale | Ottima | 2.8837717058987966 | -66 | 526 | N/D | 460 | N/D | unsupported |
| 54 | Qd7 | Ottima | Buona | 3.4091189751427886 | -80 | -471 | N/D | -551 | N/D |  |
| 55 | Rf3 | Migliore | Ottima | 1.3164203339428249 | -31 | 529 | N/D | 498 | N/D |  |
| 56 | Rxh8 | Migliore | Migliore | 0.7335325734166953 | -18 | -533 | N/D | -551 | N/D |  |
| 57 | g4 | Migliore | Migliore | 0.12054333592270705 | -3 | 553 | N/D | 550 | N/D |  |
| 58 | Rg8 | Errore | Ottima | 2.586250068603274 | -62 | -495 | N/D | -557 | N/D |  |
| 59 | Qh6+ | Ottima | Ottima | 1.863190987872565 | -47 | 584 | N/D | 537 | N/D |  |
| 60 | Rg6 | Imprecisione | Errore | 10.576619584141994 | -336 | -537 | N/D | -873 | N/D |  |
| 61 | Rxf5+ | Geniale | Migliore | 0 | N/D | N/D | 8 | N/D | 7 | unsupported |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Migliore | 12 | 6 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 2 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 2 | 3 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 1 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## game-2-saintamant-staunton-1843: Saint Amant vs Staunton, 1843

Ply: 132; inclusi: 121; esclusi unici: 11.
Corrispondenza esatta: 47.107438016528924%; entro una classe: 87.60330578512396%.

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
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":7,"unsupported":4,"suspect":0,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | d4 | Libro | Migliore | 0.6241138248585965 | -10 | 35 | N/D | 25 | N/D | book |
| 2 | d5 | Libro | Migliore | 0.8741238208726854 | -14 | -18 | N/D | -32 | N/D | book |
| 3 | c4 | Libro | Migliore | 0.18719067363420772 | -3 | 34 | N/D | 31 | N/D | book |
| 4 | e6 | Libro | Migliore | 0.8113023869678826 | -13 | -24 | N/D | -37 | N/D | book |
| 5 | e3 | Libro | Ottima | 1.249154137902475 | -20 | 30 | N/D | 10 | N/D | book |
| 6 | c5 | Buona | Migliore | 0.5622548631622926 | -9 | -12 | N/D | -21 | N/D |  |
| 7 | Nc3 | Migliore | Migliore | 0.43735351823205315 | -7 | 18 | N/D | 11 | N/D |  |
| 8 | Nf6 | Libro | Migliore | 0 | 1 | -13 | N/D | -12 | N/D | book |
| 9 | Nf3 | Libro | Migliore | 0.31242270221503166 | -5 | 15 | N/D | 10 | N/D | book |
| 10 | Be7 | Ottima | Ottima | 1.3739665656071376 | -22 | -10 | N/D | -32 | N/D |  |
| 11 | Bd3 | Imprecisione | Buona | 3.1227351031943296 | -50 | 41 | N/D | -9 | N/D |  |
| 12 | b6 | Buona | Ottima | 2.4368565968333256 | -39 | 13 | N/D | -26 | N/D |  |
| 13 | O-O | Ottima | Migliore | 0.24962446712671893 | -4 | 33 | N/D | 29 | N/D |  |
| 14 | O-O | Ottima | Migliore | 0.1873240365012241 | -3 | -23 | N/D | -26 | N/D |  |
| 15 | b3 | Buona | Ottima | 2.2493955561582792 | -36 | 26 | N/D | -10 | N/D |  |
| 16 | Bb7 | Ottima | Migliore | 0.9374282302100578 | -15 | 13 | N/D | -2 | N/D |  |
| 17 | cxd5 | Migliore | Migliore | 0 | 5 | 3 | N/D | 8 | N/D |  |
| 18 | exd5 | Buona | Ottima | 2.18633071102885 | -35 | 2 | N/D | -33 | N/D |  |
| 19 | Qc2 | Buona | Ottima | 2.7474148363593742 | -44 | 43 | N/D | -1 | N/D |  |
| 20 | Nc6 | Migliore | Migliore | 0.6874867516648342 | -11 | 4 | N/D | -7 | N/D |  |
| 21 | a3 | Migliore | Migliore | 0 | 0 | 7 | N/D | 7 | N/D |  |
| 22 | a6 | Imprecisione | Ottima | 2.808441406322454 | -45 | -5 | N/D | -50 | N/D |  |
| 23 | Rd1 | Buona | Ottima | 2.308278253598395 | -37 | 51 | N/D | 14 | N/D |  |
| 24 | cxd4 | Migliore | Migliore | 0 | 2 | -26 | N/D | -24 | N/D |  |
| 25 | exd4 | Migliore | Migliore | 0.3122733863157201 | -5 | 24 | N/D | 19 | N/D |  |
| 26 | h6 | Ottima | Migliore | 0.811451906924654 | -13 | -22 | N/D | -35 | N/D |  |
| 27 | b4 | Ottima | Ottima | 1.686122063160178 | -27 | 35 | N/D | 8 | N/D |  |
| 28 | Bd6 | Migliore | Migliore | 0.24985851772796885 | -4 | -17 | N/D | -21 | N/D |  |
| 29 | Re1 | Migliore | Migliore | 0 | 0 | 14 | N/D | 14 | N/D |  |
| 30 | b5 | Ottima | Migliore | 0.12496693296198957 | -2 | -12 | N/D | -14 | N/D |  |
| 31 | h3 | Ottima | Migliore | 0 | 0 | 12 | N/D | 12 | N/D |  |
| 32 | Rc8 | Migliore | Migliore | 0.18745401157059804 | -3 | -11 | N/D | -14 | N/D |  |
| 33 | Qb3 | Ottima | Migliore | 0.4998638297638247 | -8 | 17 | N/D | 9 | N/D |  |
| 34 | Qc7 | Buona | Migliore | 0 | 0 | -17 | N/D | -17 | N/D |  |
| 35 | Bd2 | Ottima | Migliore | 0.062479464142040086 | -1 | 15 | N/D | 14 | N/D |  |
| 36 | Qb6 | Ottima | Migliore | 0.3748289603970112 | -6 | -14 | N/D | -20 | N/D |  |
| 37 | Be3 | Ottima | Migliore | 0.4373330205632464 | -7 | 19 | N/D | 12 | N/D |  |
| 38 | Ne7 | Ottima | Ottima | 1.3106419722687224 | -21 | -19 | N/D | -40 | N/D |  |
| 39 | Rac1 | Ottima | Ottima | 1.0610167944317794 | -17 | 38 | N/D | 21 | N/D |  |
| 40 | Nh5 | Buona | Ottima | 2.617520872229756 | -42 | -20 | N/D | -62 | N/D |  |
| 41 | Qd1 | Migliore | Migliore | 0.1242759862758347 | -2 | 62 | N/D | 60 | N/D |  |
| 42 | Nf6 | Buona | Migliore | 0 | 0 | -56 | N/D | -56 | N/D |  |
| 43 | Nh4 | Imprecisione | Ottima | 2.8693270658704084 | -46 | 56 | N/D | 10 | N/D |  |
| 44 | Rc7 | Buona | Ottima | 2.372919008310026 | -38 | -2 | N/D | -40 | N/D |  |
| 45 | Qd2 | Ottima | Migliore | 0.5621248843050042 | -9 | 25 | N/D | 16 | N/D |  |
| 46 | Nh7 | Buona | Buona | 3.6712011130234536 | -59 | -21 | N/D | -80 | N/D |  |
| 47 | Qc2 | Buona | Buona | 4.468364321940832 | -72 | 100 | N/D | 28 | N/D |  |
| 48 | Nf6 | Migliore | Migliore | 0.43673096105537046 | -7 | -30 | N/D | -37 | N/D |  |
| 49 | Kh1 | Buona | Ottima | 1.8742855062229502 | -30 | 28 | N/D | -2 | N/D |  |
| 50 | Ne8 | Imprecisione | Ottima | 2.4983516700075814 | -40 | 3 | N/D | -37 | N/D |  |
| 51 | Nf5 | Imprecisione | Buona | 3.3104815648447525 | -53 | 39 | N/D | -14 | N/D |  |
| 52 | Nxf5 | Migliore | Ottima | 1.0623401004963728 | -17 | 17 | N/D | 0 | N/D |  |
| 53 | Bxf5 | Migliore | Migliore | 0 | 0 | 0 | N/D | 0 | N/D |  |
| 54 | a5 | Ottima | Ottima | 1.2498646046840367 | -20 | 4 | N/D | -16 | N/D |  |
| 55 | Qb3 | Imprecisione | Imprecisione | 5.6122188217745785 | -90 | 17 | N/D | -73 | N/D |  |
| 56 | axb4 | Grande | Migliore | 0 | 23 | 82 | N/D | 105 | N/D | unsupported |
| 57 | axb4 | Migliore | Migliore | 0.24597909172311416 | -4 | -100 | N/D | -104 | N/D |  |
| 58 | Rc4 | Ottima | Migliore | 0.2467221893541427 | -4 | 94 | N/D | 90 | N/D |  |
| 59 | Na2 | Errore | Buona | 3.27379339502486 | -53 | -59 | N/D | -112 | N/D |  |
| 60 | Nf6 | Migliore | Migliore | 0.12236397483162964 | -2 | 118 | N/D | 116 | N/D |  |
| 61 | Bd3 | Ottima | Ottima | 2.8516551613864403 | -47 | -114 | N/D | -161 | N/D |  |
| 62 | Qc6 | Imprecisione | Buona | 3.0490099068271714 | -50 | 150 | N/D | 100 | N/D |  |
| 63 | Qb2 | Migliore | Migliore | 0.30618399240310845 | -5 | -112 | N/D | -117 | N/D |  |
| 64 | Qd7 | Buona | Ottima | 2.8349205445386993 | -46 | 117 | N/D | 71 | N/D |  |
| 65 | Kg1 | Ottima | Ottima | 1.8584045200870425 | -30 | -60 | N/D | -90 | N/D |  |
| 66 | Nh5 | Errore | Imprecisione | 7.790517561184595 | -125 | 85 | N/D | -40 | N/D |  |
| 67 | Qd2 | Imprecisione | Imprecisione | 5.179459138875125 | -83 | 62 | N/D | -21 | N/D |  |
| 68 | f5 | Ottima | Ottima | 1.061693097227434 | -17 | 30 | N/D | 13 | N/D |  |
| 69 | f4 | Imprecisione | Imprecisione | 6.205864260501226 | -100 | -11 | N/D | -111 | N/D |  |
| 70 | Ng3 | Ottima | Ottima | 2.273101934214694 | -37 | 123 | N/D | 86 | N/D |  |
| 71 | Bxc4 | Buona | Migliore | 0.917202351476254 | -15 | -111 | N/D | -126 | N/D |  |
| 72 | dxc4 | Migliore | Migliore | 0 | 12 | 110 | N/D | 122 | N/D |  |
| 73 | Qb2 | Imprecisione | Migliore | 0 | 1 | -108 | N/D | -107 | N/D |  |
| 74 | Rf6 | Imprecisione | Ottima | 2.4067860836281207 | -39 | 109 | N/D | 70 | N/D |  |
| 75 | Nc3 | Buona | Migliore | 0.7395091818055977 | -12 | -89 | N/D | -101 | N/D |  |
| 76 | Ne4 | Grande | Migliore | 0.06152392528471218 | -1 | 101 | N/D | 100 | N/D | unsupported |
| 77 | Re2 | Imprecisione | Ottima | 1.2791431759035854 | -21 | -118 | N/D | -139 | N/D |  |
| 78 | Rg6 | Migliore | Migliore | 0.6649412094807738 | -11 | 152 | N/D | 141 | N/D |  |
| 79 | Rd1 | Errore | Imprecisione | 5.0698545740332 | -86 | -150 | N/D | -236 | N/D |  |
| 80 | Nxc3 | Grande | Migliore | 0.8538193326776966 | -15 | 254 | N/D | 239 | N/D | unsupported |
| 81 | Qxc3 | Migliore | Ottima | 1.2879796510796293 | -23 | -256 | N/D | -279 | N/D |  |
| 82 | Bf3 | Grande | Migliore | 0.6765641685444801 | -12 | 265 | N/D | 253 | N/D | unsupported |
| 83 | Rde1 | Errore | Ottima | 1.7373023884714733 | -31 | -251 | N/D | -282 | N/D |  |
| 84 | Bxe2 | Ottima | Migliore | 0.9610639160976708 | -17 | 264 | N/D | 247 | N/D |  |
| 85 | Rxe2 | Migliore | Ottima | 1.0741230727484175 | -19 | -246 | N/D | -265 | N/D |  |
| 86 | Qe7 | Imprecisione | Ottima | 1.5227822665431767 | -27 | 272 | N/D | 245 | N/D |  |
| 87 | Qb2 | Imprecisione | Imprecisione | 6.470075458876224 | -116 | -213 | N/D | -329 | N/D |  |
| 88 | Re6 | Migliore | Migliore | 0.7515068099862354 | -14 | 323 | N/D | 309 | N/D |  |
| 89 | Kf2 | Migliore | Migliore | 0.2165181062663446 | -4 | -305 | N/D | -309 | N/D |  |
| 90 | Re4 | Ottima | Migliore | 0.7472482676576298 | -14 | 329 | N/D | 315 | N/D |  |
| 91 | Qa2 | Buona | Imprecisione | 7.467462215254283 | -146 | -290 | N/D | -436 | N/D |  |
| 92 | Kf7 | Buona | Imprecisione | 9.655579837958307 | -185 | 435 | N/D | 250 | N/D |  |
| 93 | g3 | Migliore | Migliore | 0.1698651568498466 | -3 | -252 | N/D | -255 | N/D |  |
| 94 | Qb7 | Buona | Migliore | 0.7360713383090078 | -13 | 260 | N/D | 247 | N/D |  |
| 95 | Qa3 | Migliore | Migliore | 0.40080683172093456 | -7 | -235 | N/D | -242 | N/D |  |
| 96 | Re8 | Ottima | Migliore | 0.9124316498342666 | -16 | 252 | N/D | 236 | N/D |  |
| 97 | Qc3 | Imprecisione | Buona | 3.904128961447001 | -70 | -237 | N/D | -307 | N/D |  |
| 98 | Qh1 | Migliore | Migliore | 0 | 45 | 283 | N/D | 328 | N/D |  |
| 99 | h4 | Ottima | Ottima | 1.151395588878562 | -22 | -331 | N/D | -353 | N/D |  |
| 100 | g5 | Buona | Ottima | 1.2043345170507758 | -23 | 353 | N/D | 330 | N/D |  |
| 101 | Qe1 | Buona | Imprecisione | 5.505948171949204 | -111 | -336 | N/D | -447 | N/D |  |
| 102 | Qh2+ | Migliore | Migliore | 0 | 0 | 439 | N/D | 439 | N/D |  |
| 103 | Kf1 | Migliore | Migliore | 0.916813401368316 | -20 | -447 | N/D | -467 | N/D |  |
| 104 | Qh3+ | Migliore | Migliore | 0.9013866549906546 | -20 | 480 | N/D | 460 | N/D |  |
| 105 | Kg1 | Migliore | Migliore | 0.6334708870686045 | -14 | -460 | N/D | -474 | N/D |  |
| 106 | Qg4 | Migliore | Migliore | 0.9097042541554745 | -20 | 473 | N/D | 453 | N/D |  |
| 107 | hxg5 | Ottima | Ottima | 1.0084925305517718 | -22 | -446 | N/D | -468 | N/D |  |
| 108 | Bxf4 | Buona | Buona | 4.178692918569482 | -91 | 501 | N/D | 410 | N/D |  |
| 109 | Bxf4 | Buona | Imprecisione | 6.3045606322322145 | -142 | -410 | N/D | -552 | N/D |  |
| 110 | Qxe2 | Buona | Imprecisione | 5.296417760510453 | -123 | 565 | N/D | 442 | N/D |  |
| 111 | Qxe2 | Migliore | Migliore | 0.9391800621472157 | -20 | -428 | N/D | -448 | N/D |  |
| 112 | Rxe2 | Migliore | Migliore | 0 | 19 | 437 | N/D | 456 | N/D |  |
| 113 | gxh6 | Ottima | Migliore | 0.0922732185435593 | -2 | -451 | N/D | -453 | N/D |  |
| 114 | c3 | Ottima | Migliore | 0.31361179134795636 | -7 | 478 | N/D | 471 | N/D |  |
| 115 | Kf1 | Migliore | Migliore | 0 | 42 | -533 | N/D | -491 | N/D |  |
| 116 | Re4 | Ottima | Migliore | 0 | 6 | 521 | N/D | 527 | N/D |  |
| 117 | Bc1 | Ottima | Ottima | 2.451131807565293 | -61 | -521 | N/D | -582 | N/D |  |
| 118 | Kg6 | Ottima | Ottima | 1.011233225190511 | -26 | 586 | N/D | 560 | N/D |  |
| 119 | d5 | Migliore | Migliore | 0.27958763456018 | -7 | -552 | N/D | -559 | N/D |  |
| 120 | c2 | Migliore | Ottima | 1.7671941733300778 | -46 | 604 | N/D | 558 | N/D |  |
| 121 | Bd2 | Buona | Ottima | 1.0050228464270616 | -26 | -564 | N/D | -590 | N/D |  |
| 122 | Rxb4 | Migliore | Migliore | 0 | 59 | 587 | N/D | 646 | N/D |  |
| 123 | d6 | Ottima | Ottima | 1.088614598062279 | -32 | -640 | N/D | -672 | N/D |  |
| 124 | Rd4 | Ottima | Migliore | 0.4944414461894864 | -15 | 682 | N/D | 667 | N/D |  |
| 125 | Ke2 | Ottima | Migliore | 0 | 0 | -667 | N/D | -667 | N/D |  |
| 126 | Rxd6 | Migliore | Migliore | 0.23352029922627526 | -7 | 671 | N/D | 664 | N/D |  |
| 127 | Ke3 | Ottima | Ottima | 1.2287967797096622 | -39 | -681 | N/D | -720 | N/D |  |
| 128 | Kxh6 | Ottima | Migliore | 0.12085918173022625 | -4 | 726 | N/D | 722 | N/D |  |
| 129 | Ke2+ | Ottima | Migliore | 0.5458345422502842 | -18 | -713 | N/D | -731 | N/D |  |
| 130 | Kg6 | Ottima | Ottima | 2.1172469764549673 | -75 | 799 | N/D | 724 | N/D |  |
| 131 | Ke1 | Ottima | Ottima | 2.0380281537094826 | -76 | -751 | N/D | -827 | N/D |  |
| 132 | b4 | Ottima | Buona | 4.675639016823563 | -201 | 965 | N/D | 764 | N/D |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Buona | 6 | 11 | 3 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 33 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 22 | 17 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 1 | 6 | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## game-3-fools-mate: Fool's Mate (sanity, separata dalla taratura)

Ply: 4; inclusi: 4; esclusi unici: 0.
Corrispondenza esatta: 75%; entro una classe: 100%.

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
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":0,"unsupported":0,"suspect":0,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | f3 | Errore | Imprecisione | 7.169505128407938 | -115 | 35 | N/D | -80 | N/D |  |
| 2 | e5 | Migliore | Migliore | 0.4959677368738369 | -8 | 76 | N/D | 68 | N/D |  |
| 3 | g4 | Errore grave | Errore grave | 45.884333184977194 | N/D | -66 | N/D | N/D | -1 |  |
| 4 | Qh4# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Errore | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
