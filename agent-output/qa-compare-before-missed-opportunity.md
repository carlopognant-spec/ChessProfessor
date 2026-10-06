# Confronto QA

Classificazione per calo di probabilità (punti percentuali). Soglie iniziali non tarate sulle fixture: {"best":1,"excellent":3,"good":5,"inaccuracy":10,"mistake":20}. Le esclusioni possono sovrapporsi. Modello approssimato: sigmoid(cp/400), senza taglio dei centipawn. Matto vincente: 100%; perdente: 0%.

Mossa giocata valutata dalla stessa ricerca MultiPV quando presente a pari profondità; altrimenti analisi indipendente della posizione successiva. Una mossa diversa dalla PV principale riceve al massimo Ottima, salvo matto dato. Senza identità UCI/PV si conserva il criterio precedente.

## Totale del gruppo (sanity esclusa)

Ply: 193; inclusi: 161; esclusi: 32.
Corrispondenza esatta: 50.93167701863354%; entro una classe: 86.33540372670808%.

| Categoria attesa | Totale | Inclusi | Esatti |
|---|---|---|---|
| Migliore | 56 | 56 | 45 |
| Ottima | 47 | 47 | 30 |
| Buona | 26 | 26 | 2 |
| Imprecisione | 24 | 24 | 4 |
| Errore | 9 | 8 | 1 |
| Errore grave | 0 | 0 | 0 |
| Libro | 19 | 0 | 0 |
| Geniale | 2 | 0 | 0 |
| Grande | 10 | 0 | 0 |
| Mossa mancata | 0 | 0 | 0 |
| Non valutabile | 0 | 0 | 0 |
| Forzata | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":56,"independent-position":5}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 61 | Rxf5+ | Matto vincente: 8 → 8 mosse (distanza invariata). |

## game-1-chigorin-steinitz-1892: Chigorin vs Steinitz, 1892 (World Championship Rematch, Game 1)

Ply: 61; inclusi: 40; esclusi unici: 21.
Corrispondenza esatta: 52.5%; entro una classe: 82.5%.

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
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | e5 | Libro | Ottima | 0.06242073767916412 | -1 | -28 | N/D | -29 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0 | 0 | 40 | N/D | 40 | N/D | book |
| 4 | Nc6 | Libro | Migliore | 0 | 0 | -32 | N/D | -32 | N/D | book |
| 5 | Bc4 | Libro | Ottima | 1.123040775265871 | -18 | 42 | N/D | 24 | N/D | book |
| 6 | Bc5 | Libro | Ottima | 0.7495174181832154 | -12 | -14 | N/D | -26 | N/D | book |
| 7 | b4 | Libro | Ottima | 2.935407582871341 | -47 | 40 | N/D | -7 | N/D | book |
| 8 | Bxb4 | Libro | Migliore | 0 | 0 | 0 | N/D | 0 | N/D | book |
| 9 | c3 | Libro | Migliore | 0 | 0 | -35 | N/D | -35 | N/D | book |
| 10 | Ba5 | Libro | Migliore | 0 | 0 | 23 | N/D | 23 | N/D | book |
| 11 | O-O | Libro | Buona | 3.2411554367528406 | -52 | -13 | N/D | -65 | N/D | book |
| 12 | d6 | Libro | Ottima | 0.49772468580384643 | -8 | 58 | N/D | 50 | N/D | book |
| 13 | d4 | Migliore | Migliore | 0 | 0 | -29 | N/D | -29 | N/D |  |
| 14 | Bg4 | Migliore | Migliore | 0 | 0 | 44 | N/D | 44 | N/D |  |
| 15 | Bb5 | Ottima | Migliore | 0 | 0 | -43 | N/D | -43 | N/D |  |
| 16 | exd4 | Imprecisione | Ottima | 2.49193829361557 | -40 | 64 | N/D | 24 | N/D |  |
| 17 | cxd4 | Migliore | Migliore | 0 | 0 | -28 | N/D | -28 | N/D |  |
| 18 | Bd7 | Imprecisione | Buona | 3.7481905405833515 | -60 | 27 | N/D | -33 | N/D |  |
| 19 | Bb2 | Imprecisione | Ottima | 2.811573192314687 | -45 | 29 | N/D | -16 | N/D |  |
| 20 | Nce7 | Errore | Imprecisione | 5.983266419244337 | -96 | 16 | N/D | -80 | N/D |  |
| 21 | Bxd7+ | Migliore | Migliore | 0 | 0 | 87 | N/D | 87 | N/D |  |
| 22 | Qxd7 | Migliore | Migliore | 0 | 0 | -78 | N/D | -78 | N/D |  |
| 23 | Na3 | Ottima | Ottima | 1.111451358721971 | -18 | 97 | N/D | 79 | N/D |  |
| 24 | Nh6 | Imprecisione | Buona | 4.921794889767039 | -80 | -58 | N/D | -138 | N/D |  |
| 25 | Nc4 | Grande | Migliore | 0 | 0 | 138 | N/D | 138 | N/D | unsupported |
| 26 | Bb6 | Migliore | Ottima | 0.9781653090587428 | -16 | -111 | N/D | -127 | N/D |  |
| 27 | a4 | Migliore | Migliore | 0 | 0 | 108 | N/D | 108 | N/D |  |
| 28 | c6 | Grande | Migliore | 0 | 0 | -110 | N/D | -110 | N/D | unsupported |
| 29 | e5 | Migliore | Ottima | 2.153679455591817 | -35 | 117 | N/D | 82 | N/D |  |
| 30 | d5 | Errore | Errore | 10.053393710212461 | -168 | -77 | N/D | -245 | N/D |  |
| 31 | Nd6+ | Grande | Migliore | 0 | 0 | 225 | N/D | 225 | N/D | unsupported |
| 32 | Kf8 | Migliore | Migliore | 0 | 0 | -217 | N/D | -217 | N/D |  |
| 33 | Ba3 | Migliore | Migliore | 0 | 0 | 237 | N/D | 237 | N/D |  |
| 34 | Kg8 | Ottima | Migliore | 0 | 0 | -242 | N/D | -242 | N/D |  |
| 35 | Rb1 | Migliore | Migliore | 0 | 0 | 238 | N/D | 238 | N/D |  |
| 36 | Nhf5 | Errore | Imprecisione | 8.37430706467278 | -156 | -236 | N/D | -392 | N/D |  |
| 37 | Nxf7 | Errore | Errore | 12.782005283277343 | -231 | 392 | N/D | 161 | N/D | suspect |
| 38 | Kxf7 | Migliore | Migliore | 0 | 0 | -185 | N/D | -185 | N/D |  |
| 39 | e6+ | Grande | Migliore | 0 | 0 | 195 | N/D | 195 | N/D | unsupported |
| 40 | Kxe6 | Migliore | Migliore | 0 | 0 | -213 | N/D | -213 | N/D |  |
| 41 | Ne5 | Migliore | Imprecisione | 8.426195970059991 | -142 | 250 | N/D | 108 | N/D |  |
| 42 | Qc8 | Imprecisione | Buona | 3.3162759824058363 | -56 | -158 | N/D | -214 | N/D |  |
| 43 | Re1 | Grande | Migliore | 0 | 0 | 162 | N/D | 162 | N/D | unsupported |
| 44 | Kf6 | Imprecisione | Buona | 4.208497151350238 | -74 | -210 | N/D | -284 | N/D |  |
| 45 | Qh5 | Grande | Migliore | 0 | 0 | 306 | N/D | 306 | N/D | unsupported |
| 46 | g6 | Ottima | Migliore | 0 | 0 | -336 | N/D | -336 | N/D |  |
| 47 | Bxe7+ | Imprecisione | Ottima | 1.32857209585725 | -25 | 339 | N/D | 314 | N/D |  |
| 48 | Kxe7 | Imprecisione | Ottima | 0.8373913441128977 | -16 | -334 | N/D | -350 | N/D |  |
| 49 | Nxg6+ | Migliore | Migliore | 0 | 0 | 345 | N/D | 345 | N/D |  |
| 50 | Kf6 | Migliore | Migliore | 0 | 0 | -341 | N/D | -341 | N/D |  |
| 51 | Nxh8 | Ottima | Imprecisione | 9.71889572161212 | -204 | 527 | N/D | 323 | N/D |  |
| 52 | Bxd4 | Buona | Imprecisione | 8.153788431836443 | -177 | -364 | N/D | -541 | N/D |  |
| 53 | Rb3 | Geniale | Buona | 4.1854650670436815 | -94 | 526 | N/D | 432 | N/D | unsupported |
| 54 | Qd7 | Ottima | Ottima | 2.716849132170887 | -63 | -471 | N/D | -534 | N/D |  |
| 55 | Rf3 | Migliore | Migliore | 0 | 0 | 529 | N/D | 529 | N/D |  |
| 56 | Rxh8 | Migliore | Migliore | 0 | 0 | -533 | N/D | -533 | N/D |  |
| 57 | g4 | Migliore | Migliore | 0 | 0 | 553 | N/D | 553 | N/D |  |
| 58 | Rg8 | Errore | Migliore | 0 | 0 | -495 | N/D | -495 | N/D |  |
| 59 | Qh6+ | Ottima | Ottima | 1.863190987872565 | -47 | 584 | N/D | 537 | N/D |  |
| 60 | Rg6 | Imprecisione | Imprecisione | 8.789631307042765 | -263 | -537 | N/D | -800 | N/D |  |
| 61 | Rxf5+ | Geniale | Migliore | 0 | N/D | N/D | 8 | N/D | 8 | unsupported |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Migliore | 16 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 3 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 4 | 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 1 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":105,"independent-position":27}

## game-2-saintamant-staunton-1843: Saint Amant vs Staunton, 1843

Ply: 132; inclusi: 121; esclusi unici: 11.
Corrispondenza esatta: 50.413223140495866%; entro una classe: 87.60330578512396%.

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
| 1 | d4 | Libro | Ottima | 1.49864872070673 | -24 | 35 | N/D | 11 | N/D | book |
| 2 | d5 | Libro | Ottima | 0.4371813776160749 | -7 | -18 | N/D | -25 | N/D | book |
| 3 | c4 | Libro | Migliore | 0 | 0 | 34 | N/D | 34 | N/D | book |
| 4 | e6 | Libro | Migliore | 0 | 0 | -24 | N/D | -24 | N/D | book |
| 5 | e3 | Libro | Ottima | 0.6868448122282378 | -11 | 30 | N/D | 19 | N/D | book |
| 6 | c5 | Buona | Ottima | 0.5622548631622926 | -9 | -12 | N/D | -21 | N/D |  |
| 7 | Nc3 | Migliore | Ottima | 0.12494350668892373 | -2 | 18 | N/D | 16 | N/D |  |
| 8 | Nf6 | Libro | Migliore | 0 | 0 | -13 | N/D | -13 | N/D | book |
| 9 | Nf3 | Libro | Migliore | 0 | 0 | 15 | N/D | 15 | N/D | book |
| 10 | Be7 | Ottima | Ottima | 1.3739665656071376 | -22 | -10 | N/D | -32 | N/D |  |
| 11 | Bd3 | Imprecisione | Buona | 3.1227351031943296 | -50 | 41 | N/D | -9 | N/D |  |
| 12 | b6 | Buona | Ottima | 2.4368565968333256 | -39 | 13 | N/D | -26 | N/D |  |
| 13 | O-O | Ottima | Ottima | 0.3120452048058886 | -5 | 33 | N/D | 28 | N/D |  |
| 14 | O-O | Ottima | Migliore | 0 | 0 | -23 | N/D | -23 | N/D |  |
| 15 | b3 | Buona | Ottima | 1.2494351372990486 | -20 | 26 | N/D | 6 | N/D |  |
| 16 | Bb7 | Ottima | Ottima | 1.062426407313577 | -17 | 13 | N/D | -4 | N/D |  |
| 17 | cxd5 | Migliore | Migliore | 0 | 0 | 3 | N/D | 3 | N/D |  |
| 18 | exd5 | Buona | Ottima | 1.5621038092900053 | -25 | 2 | N/D | -23 | N/D |  |
| 19 | Qc2 | Buona | Ottima | 2.7474148363593742 | -44 | 43 | N/D | -1 | N/D |  |
| 20 | Nc6 | Migliore | Migliore | 0 | 0 | 4 | N/D | 4 | N/D |  |
| 21 | a3 | Migliore | Migliore | 0 | 0 | 7 | N/D | 7 | N/D |  |
| 22 | a6 | Imprecisione | Ottima | 2.808441406322454 | -45 | -5 | N/D | -50 | N/D |  |
| 23 | Rd1 | Buona | Ottima | 1.870990323398103 | -30 | 51 | N/D | 21 | N/D |  |
| 24 | cxd4 | Migliore | Migliore | 0 | 0 | -26 | N/D | -26 | N/D |  |
| 25 | exd4 | Migliore | Migliore | 0 | 0 | 24 | N/D | 24 | N/D |  |
| 26 | h6 | Ottima | Ottima | 0.811451906924654 | -13 | -22 | N/D | -35 | N/D |  |
| 27 | b4 | Ottima | Ottima | 1.3736769065340715 | -22 | 35 | N/D | 13 | N/D |  |
| 28 | Bd6 | Migliore | Migliore | 0 | 0 | -17 | N/D | -17 | N/D |  |
| 29 | Re1 | Migliore | Ottima | 0.18745401157060915 | -3 | 14 | N/D | 11 | N/D |  |
| 30 | b5 | Ottima | Migliore | 0 | 0 | -12 | N/D | -12 | N/D |  |
| 31 | h3 | Ottima | Migliore | 0 | 0 | 12 | N/D | 12 | N/D |  |
| 32 | Rc8 | Migliore | Migliore | 0 | 0 | -11 | N/D | -11 | N/D |  |
| 33 | Qb3 | Ottima | Ottima | 0.18742941247233968 | -3 | 17 | N/D | 14 | N/D |  |
| 34 | Qc7 | Buona | Ottima | 0.24985851772796885 | -4 | -17 | N/D | -21 | N/D |  |
| 35 | Bd2 | Ottima | Migliore | 0 | 0 | 15 | N/D | 15 | N/D |  |
| 36 | Qb6 | Ottima | Ottima | 0 | 0 | -14 | N/D | -14 | N/D |  |
| 37 | Be3 | Ottima | Migliore | 0 | 0 | 19 | N/D | 19 | N/D |  |
| 38 | Ne7 | Ottima | Ottima | 1.3106419722687224 | -21 | -19 | N/D | -40 | N/D |  |
| 39 | Rac1 | Ottima | Ottima | 1.373348724659551 | -22 | 38 | N/D | 16 | N/D |  |
| 40 | Nh5 | Buona | Ottima | 2.617520872229756 | -42 | -20 | N/D | -62 | N/D |  |
| 41 | Qd1 | Migliore | Ottima | 0.062132082064880745 | -1 | 62 | N/D | 61 | N/D |  |
| 42 | Nf6 | Buona | Migliore | 0 | 0 | -56 | N/D | -56 | N/D |  |
| 43 | Nh4 | Imprecisione | Ottima | 2.8693270658704084 | -46 | 56 | N/D | 10 | N/D |  |
| 44 | Rc7 | Buona | Ottima | 2.372919008310026 | -38 | -2 | N/D | -40 | N/D |  |
| 45 | Qd2 | Ottima | Migliore | 0 | 0 | 25 | N/D | 25 | N/D |  |
| 46 | Nh7 | Buona | Buona | 3.6712011130234536 | -59 | -21 | N/D | -80 | N/D |  |
| 47 | Qc2 | Buona | Buona | 4.468364321940832 | -72 | 100 | N/D | 28 | N/D |  |
| 48 | Nf6 | Migliore | Migliore | 0 | 0 | -30 | N/D | -30 | N/D |  |
| 49 | Kh1 | Buona | Ottima | 1.8742855062229502 | -30 | 28 | N/D | -2 | N/D |  |
| 50 | Ne8 | Imprecisione | Ottima | 2.4983516700075814 | -40 | 3 | N/D | -37 | N/D |  |
| 51 | Nf5 | Imprecisione | Buona | 3.3104815648447525 | -53 | 39 | N/D | -14 | N/D |  |
| 52 | Nxf5 | Migliore | Migliore | 0 | 0 | 17 | N/D | 17 | N/D |  |
| 53 | Bxf5 | Migliore | Migliore | 0 | 0 | 0 | N/D | 0 | N/D |  |
| 54 | a5 | Ottima | Ottima | 0.9999416717495324 | -16 | 4 | N/D | -12 | N/D |  |
| 55 | Qb3 | Imprecisione | Imprecisione | 5.6122188217745785 | -90 | 17 | N/D | -73 | N/D |  |
| 56 | axb4 | Grande | Migliore | 0 | 0 | 82 | N/D | 82 | N/D | unsupported |
| 57 | axb4 | Migliore | Migliore | 0 | 0 | -100 | N/D | -100 | N/D |  |
| 58 | Rc4 | Ottima | Migliore | 0 | 0 | 94 | N/D | 94 | N/D |  |
| 59 | Na2 | Errore | Buona | 3.3350735392854824 | -54 | -59 | N/D | -113 | N/D |  |
| 60 | Nf6 | Migliore | Migliore | 0 | 0 | 118 | N/D | 118 | N/D |  |
| 61 | Bd3 | Ottima | Ottima | 2.0083140560102466 | -33 | -114 | N/D | -147 | N/D |  |
| 62 | Qc6 | Imprecisione | Ottima | 2.0670467022551153 | -34 | 150 | N/D | 116 | N/D |  |
| 63 | Qb2 | Migliore | Migliore | 0 | 0 | -112 | N/D | -112 | N/D |  |
| 64 | Qd7 | Buona | Ottima | 1.597710394100682 | -26 | 117 | N/D | 91 | N/D |  |
| 65 | Kg1 | Ottima | Ottima | 0.9927772799339707 | -16 | -60 | N/D | -76 | N/D |  |
| 66 | Nh5 | Errore | Imprecisione | 7.790517561184595 | -125 | 85 | N/D | -40 | N/D |  |
| 67 | Qd2 | Imprecisione | Buona | 4.804650672816874 | -77 | 62 | N/D | -15 | N/D |  |
| 68 | f5 | Ottima | Ottima | 1.061693097227434 | -17 | 30 | N/D | 13 | N/D |  |
| 69 | f4 | Imprecisione | Imprecisione | 6.205864260501226 | -100 | -11 | N/D | -111 | N/D |  |
| 70 | Ng3 | Ottima | Ottima | 2.273101934214694 | -37 | 123 | N/D | 86 | N/D |  |
| 71 | Bxc4 | Buona | Ottima | 0.7952051762499801 | -13 | -111 | N/D | -124 | N/D |  |
| 72 | dxc4 | Migliore | Migliore | 0 | 0 | 110 | N/D | 110 | N/D |  |
| 73 | Qb2 | Imprecisione | Ottima | 1.527463576262511 | -25 | -108 | N/D | -133 | N/D |  |
| 74 | Rf6 | Imprecisione | Ottima | 1.0458693474804548 | -17 | 109 | N/D | 92 | N/D |  |
| 75 | Nc3 | Buona | Ottima | 0.677985256520891 | -11 | -89 | N/D | -100 | N/D |  |
| 76 | Ne4 | Grande | Migliore | 0 | 0 | 101 | N/D | 101 | N/D | unsupported |
| 77 | Re2 | Imprecisione | Ottima | 1.5820661378830259 | -26 | -118 | N/D | -144 | N/D |  |
| 78 | Rg6 | Migliore | Migliore | 0 | 0 | 152 | N/D | 152 | N/D |  |
| 79 | Rd1 | Errore | Imprecisione | 5.0698545740332 | -86 | -150 | N/D | -236 | N/D |  |
| 80 | Nxc3 | Grande | Migliore | 0 | 0 | 254 | N/D | 254 | N/D | unsupported |
| 81 | Qxc3 | Migliore | Migliore | 0 | 0 | -256 | N/D | -256 | N/D |  |
| 82 | Bf3 | Grande | Migliore | 0 | 0 | 265 | N/D | 265 | N/D | unsupported |
| 83 | Rde1 | Errore | Ottima | 0.9020762666431537 | -16 | -251 | N/D | -267 | N/D |  |
| 84 | Bxe2 | Ottima | Ottima | 1.0179864206812161 | -18 | 264 | N/D | 246 | N/D |  |
| 85 | Rxe2 | Migliore | Migliore | 0 | 0 | -246 | N/D | -246 | N/D |  |
| 86 | Qe7 | Imprecisione | Ottima | 2.209624420278933 | -39 | 272 | N/D | 233 | N/D |  |
| 87 | Qb2 | Imprecisione | Imprecisione | 6.470075458876224 | -116 | -213 | N/D | -329 | N/D |  |
| 88 | Re6 | Migliore | Migliore | 0 | 0 | 323 | N/D | 323 | N/D |  |
| 89 | Kf2 | Migliore | Migliore | 0 | 0 | -305 | N/D | -305 | N/D |  |
| 90 | Re4 | Ottima | Migliore | 0 | 0 | 329 | N/D | 329 | N/D |  |
| 91 | Qa2 | Buona | Imprecisione | 7.467462215254283 | -146 | -290 | N/D | -436 | N/D |  |
| 92 | Kf7 | Buona | Imprecisione | 9.655579837958307 | -185 | 435 | N/D | 250 | N/D |  |
| 93 | g3 | Migliore | Migliore | 0 | 0 | -252 | N/D | -252 | N/D |  |
| 94 | Qb7 | Buona | Ottima | 0.6223541876663963 | -11 | 260 | N/D | 249 | N/D |  |
| 95 | Qa3 | Migliore | Migliore | 0 | 0 | -235 | N/D | -235 | N/D |  |
| 96 | Re8 | Ottima | Ottima | 0.569006963475871 | -10 | 252 | N/D | 242 | N/D |  |
| 97 | Qc3 | Imprecisione | Ottima | 0.8550906227111466 | -15 | -237 | N/D | -252 | N/D |  |
| 98 | Qh1 | Migliore | Migliore | 0 | 0 | 283 | N/D | 283 | N/D |  |
| 99 | h4 | Ottima | Migliore | 0 | 0 | -331 | N/D | -331 | N/D |  |
| 100 | g5 | Buona | Migliore | 0 | 0 | 353 | N/D | 353 | N/D |  |
| 101 | Qe1 | Buona | Imprecisione | 6.058876952786818 | -123 | -336 | N/D | -459 | N/D |  |
| 102 | Qh2+ | Migliore | Migliore | 0 | 0 | 439 | N/D | 439 | N/D |  |
| 103 | Kf1 | Migliore | Migliore | 0 | 0 | -447 | N/D | -447 | N/D |  |
| 104 | Qh3+ | Migliore | Migliore | 0 | 0 | 480 | N/D | 480 | N/D |  |
| 105 | Kg1 | Migliore | Ottima | 0.09120850396199531 | -2 | -460 | N/D | -462 | N/D |  |
| 106 | Qg4 | Migliore | Ottima | 2.2229004028259114 | -48 | 473 | N/D | 425 | N/D |  |
| 107 | hxg5 | Ottima | Ottima | 1.988216897540085 | -44 | -446 | N/D | -490 | N/D |  |
| 108 | Bxf4 | Buona | Imprecisione | 5.36105523420246 | -115 | 501 | N/D | 386 | N/D |  |
| 109 | Bxf4 | Buona | Imprecisione | 5.572109680270596 | -124 | -410 | N/D | -534 | N/D |  |
| 110 | Qxe2 | Buona | Errore | 11.794128893828482 | -252 | 565 | N/D | 313 | N/D |  |
| 111 | Qxe2 | Migliore | Migliore | 0 | 0 | -428 | N/D | -428 | N/D |  |
| 112 | Rxe2 | Migliore | Migliore | 0 | 0 | 437 | N/D | 437 | N/D |  |
| 113 | gxh6 | Ottima | Migliore | 0 | 0 | -451 | N/D | -451 | N/D |  |
| 114 | c3 | Ottima | Ottima | 1.0873666701814555 | -24 | 478 | N/D | 454 | N/D |  |
| 115 | Kf1 | Migliore | Migliore | 0 | 0 | -533 | N/D | -533 | N/D |  |
| 116 | Re4 | Ottima | Migliore | 0 | 0 | 521 | N/D | 521 | N/D |  |
| 117 | Bc1 | Ottima | Ottima | 2.451131807565293 | -61 | -521 | N/D | -582 | N/D |  |
| 118 | Kg6 | Ottima | Ottima | 0.42290072577235716 | -11 | 586 | N/D | 575 | N/D |  |
| 119 | d5 | Migliore | Ottima | 1.595889375865095 | -41 | -552 | N/D | -593 | N/D |  |
| 120 | c2 | Migliore | Buona | 3.196669212744896 | -81 | 604 | N/D | 523 | N/D |  |
| 121 | Bd2 | Buona | Ottima | 1.0050228464270616 | -26 | -564 | N/D | -590 | N/D |  |
| 122 | Rxb4 | Migliore | Ottima | 0.3063717574555258 | -8 | 587 | N/D | 579 | N/D |  |
| 123 | d6 | Ottima | Ottima | 1.088614598062279 | -32 | -640 | N/D | -672 | N/D |  |
| 124 | Rd4 | Ottima | Migliore | 0 | 0 | 682 | N/D | 682 | N/D |  |
| 125 | Ke2 | Ottima | Ottima | 0.03335995961458449 | -1 | -667 | N/D | -668 | N/D |  |
| 126 | Rxd6 | Migliore | Migliore | 0 | 0 | 671 | N/D | 671 | N/D |  |
| 127 | Ke3 | Ottima | Ottima | 1.2287967797096622 | -39 | -681 | N/D | -720 | N/D |  |
| 128 | Kxh6 | Ottima | Ottima | 0.5196789330044971 | -17 | 726 | N/D | 709 | N/D |  |
| 129 | Ke2+ | Ottima | Ottima | 0.5458345422502842 | -18 | -713 | N/D | -731 | N/D |  |
| 130 | Kg6 | Ottima | Ottima | 2.4529053197063666 | -86 | 799 | N/D | 713 | N/D |  |
| 131 | Ke1 | Ottima | Ottima | 2.0380281537094826 | -76 | -751 | N/D | -827 | N/D |  |
| 132 | b4 | Ottima | Buona | 4.675639016823563 | -201 | 965 | N/D | 764 | N/D |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Buona | 2 | 15 | 2 | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 29 | 7 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 12 | 27 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 9 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"independent-position":2,"root-pv":1,"checkmate":1}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 4 | Qh4# | Matto dato. |

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
| 2 | e5 | Migliore | Migliore | 0 | 0 | 76 | N/D | 76 | N/D |  |
| 3 | g4 | Errore grave | Errore grave | 45.884333184977194 | N/D | -66 | N/D | N/D | -1 |  |
| 4 | Qh4# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Errore | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
