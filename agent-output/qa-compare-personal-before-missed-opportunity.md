# Confronto QA

Classificazione per calo di probabilità (punti percentuali). Soglie iniziali non tarate sulle fixture: {"best":1,"excellent":3,"good":5,"inaccuracy":10,"mistake":20}. Le esclusioni possono sovrapporsi. Modello approssimato: sigmoid(cp/400), senza taglio dei centipawn. Matto vincente: 100%; perdente: 0%.

Mossa giocata valutata dalla stessa ricerca MultiPV quando presente a pari profondità; altrimenti analisi indipendente della posizione successiva. Una mossa diversa dalla PV principale riceve al massimo Ottima, salvo matto dato. Senza identità UCI/PV si conserva il criterio precedente.

## Totale del gruppo (sanity esclusa)

Ply: 399; inclusi: 332; esclusi: 67.
Corrispondenza esatta: 52.10843373493976%; entro una classe: 90.36144578313252%.

| Categoria attesa | Totale | Inclusi | Esatti |
|---|---|---|---|
| Migliore | 122 | 122 | 80 |
| Ottima | 74 | 74 | 51 |
| Buona | 68 | 68 | 23 |
| Imprecisione | 33 | 33 | 9 |
| Errore | 27 | 27 | 5 |
| Errore grave | 8 | 8 | 5 |
| Libro | 39 | 0 | 0 |
| Geniale | 1 | 0 | 0 |
| Grande | 14 | 0 | 0 |
| Mossa mancata | 10 | 0 | 0 |
| Non valutabile | 0 | 0 | 0 |
| Forzata | 3 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":34,"independent-position":16,"checkmate":1}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 51 | Qg7# | Matto dato. |

## personal-01: BUMCestinait0 vs boyjonbum, 2026.10.01

Ply: 51; inclusi: 40; esclusi unici: 11.
Corrispondenza esatta: 55%; entro una classe: 100%.

Conteggi attesi:
- Migliore: 13
- Ottima: 10
- Buona: 7
- Imprecisione: 4
- Errore: 5
- Errore grave: 1
- Libro: 7
- Geniale: 0
- Grande: 2
- Mossa mancata: 2
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":7,"unsupported":4,"suspect":0,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | d5 | Libro | Ottima | 2.8005929546392307 | -45 | -28 | N/D | -73 | N/D | book |
| 3 | exd5 | Libro | Migliore | 0 | 0 | 86 | N/D | 86 | N/D | book |
| 4 | Qxd5 | Libro | Ottima | 0.49700479184333624 | -8 | -58 | N/D | -66 | N/D | book |
| 5 | Nc3 | Libro | Migliore | 0 | 0 | 74 | N/D | 74 | N/D | book |
| 6 | Qd8 | Libro | Migliore | 0 | 0 | -71 | N/D | -71 | N/D | book |
| 7 | d4 | Libro | Migliore | 0 | 0 | 76 | N/D | 76 | N/D | book |
| 8 | e6 | Ottima | Ottima | 0 | 0 | -75 | N/D | -75 | N/D |  |
| 9 | Nf3 | Ottima | Migliore | 0 | 0 | 82 | N/D | 82 | N/D |  |
| 10 | Bb4 | Buona | Ottima | 1.2345941234862046 | -20 | -79 | N/D | -99 | N/D |  |
| 11 | Bd2 | Ottima | Ottima | 0.8010137941604434 | -13 | 102 | N/D | 89 | N/D |  |
| 12 | Bxc3 | Buona | Ottima | 1.410328070635386 | -23 | -99 | N/D | -122 | N/D |  |
| 13 | Bxc3 | Migliore | Migliore | 0 | 0 | 120 | N/D | 120 | N/D |  |
| 14 | Nf6 | Migliore | Migliore | 0 | 0 | -103 | N/D | -103 | N/D |  |
| 15 | h3 | Buona | Ottima | 2.5922042703897086 | -42 | 110 | N/D | 68 | N/D |  |
| 16 | O-O | Ottima | Migliore | 0 | 0 | -64 | N/D | -64 | N/D |  |
| 17 | Bd3 | Migliore | Ottima | 0.06198948392019954 | -1 | 73 | N/D | 72 | N/D |  |
| 18 | h6 | Imprecisione | Buona | 4.183170145429016 | -68 | -65 | N/D | -133 | N/D |  |
| 19 | O-O | Buona | Buona | 4.225864387145995 | -69 | 147 | N/D | 78 | N/D |  |
| 20 | b6 | Ottima | Migliore | 0 | 0 | -76 | N/D | -76 | N/D |  |
| 21 | Re1 | Ottima | Ottima | 0.12366402669833354 | -2 | 84 | N/D | 82 | N/D |  |
| 22 | Bb7 | Migliore | Migliore | 0 | 0 | -81 | N/D | -81 | N/D |  |
| 23 | a4 | Ottima | Ottima | 2.110721754277023 | -34 | 82 | N/D | 48 | N/D |  |
| 24 | Qd5 | Buona | Buona | 4.268672103724164 | -69 | -44 | N/D | -113 | N/D |  |
| 25 | Bb4 | Buona | Ottima | 0.9859984662609067 | -16 | 103 | N/D | 87 | N/D |  |
| 26 | Re8 | Migliore | Ottima | 0.12349955569406212 | -2 | -87 | N/D | -89 | N/D |  |
| 27 | c4 | Ottima | Ottima | 1.178528375758392 | -19 | 79 | N/D | 60 | N/D |  |
| 28 | Qd8 | Imprecisione | Buona | 4.554560885744996 | -74 | -60 | N/D | -134 | N/D |  |
| 29 | Qd2 | Errore | Errore | 12.945661233898193 | -209 | 151 | N/D | -58 | N/D |  |
| 30 | Nh5 | Mossa mancata | Errore | 11.03837566084051 | -178 | 40 | N/D | -138 | N/D | unsupported |
| 31 | g4 | Errore | Imprecisione | 9.870420261571578 | -159 | 127 | N/D | -32 | N/D |  |
| 32 | Bxf3 | Migliore | Migliore | 0 | 0 | -2 | N/D | -2 | N/D |  |
| 33 | gxh5 | Imprecisione | Buona | 4.542655058228551 | -73 | -12 | N/D | -85 | N/D |  |
| 34 | Qxd4 | Errore grave | Errore grave | 38.606608478201984 | -685 | 157 | N/D | -528 | N/D |  |
| 35 | Bc3 | Mossa mancata | Errore grave | 27.833198182292552 | -513 | 535 | N/D | 22 | N/D | unsupported |
| 36 | Qd8 | Imprecisione | Buona | 3.120937337375623 | -50 | 0 | N/D | -50 | N/D |  |
| 37 | Qe3 | Ottima | Migliore | 0 | 0 | 55 | N/D | 55 | N/D |  |
| 38 | Bxh5 | Buona | Buona | 3.175225231042705 | -51 | -22 | N/D | -73 | N/D |  |
| 39 | Be4 | Migliore | Migliore | 0 | 0 | 73 | N/D | 73 | N/D |  |
| 40 | Nd7 | Ottima | Ottima | 1.1727073023717671 | -19 | -80 | N/D | -99 | N/D |  |
| 41 | Bxa8 | Migliore | Migliore | 0 | 0 | 94 | N/D | 94 | N/D |  |
| 42 | Qxa8 | Migliore | Migliore | 0 | 0 | -83 | N/D | -83 | N/D |  |
| 43 | Qg3 | Migliore | Migliore | 0 | 0 | 75 | N/D | 75 | N/D |  |
| 44 | g5 | Errore | Imprecisione | 7.139849924246599 | -117 | -61 | N/D | -178 | N/D |  |
| 45 | Qxc7 | Grande | Migliore | 0 | 0 | 214 | N/D | 214 | N/D | unsupported |
| 46 | Nf8 | Errore | Errore grave | 24.677335605684096 | -562 | -204 | N/D | -766 | N/D |  |
| 47 | Qe5 | Grande | Migliore | 0 | 0 | 729 | N/D | 729 | N/D | unsupported |
| 48 | f6 | Migliore | Migliore | 0 | 0 | -929 | N/D | -929 | N/D |  |
| 49 | Qxf6 | Migliore | Migliore | 0 | 0 | 911 | N/D | 911 | N/D |  |
| 50 | Nd7 | Errore | Imprecisione | 6.978478287658009 | N/D | -1036 | N/D | N/D | -1 |  |
| 51 | Qg7# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 4 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 11 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 0 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":55,"independent-position":19,"checkmate":1}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 49 | Qf2+ | Matto vincente: 10 → 10 mosse (distanza invariata). |
| 50 | Qf7 | Matto subito: 9 → 9 mosse (distanza invariata). |
| 68 | Rc3 | Matto subito: 9 → 1 mosse (anticipato). Stime da analisi separate. |
| 73 | Rd7+ | Matto vincente: 2 → 2 mosse (distanza invariata). |
| 74 | Kf8 | Matto subito: 1 → 1 mosse (distanza invariata). |
| 75 | Ra8# | Matto dato. |

## personal-02: BUMCestinait0 vs skui1, 2026.10.03

Ply: 75; inclusi: 64; esclusi unici: 11.
Corrispondenza esatta: 46.875%; entro una classe: 89.0625%.

Conteggi attesi:
- Migliore: 21
- Ottima: 10
- Buona: 16
- Imprecisione: 9
- Errore: 5
- Errore grave: 3
- Libro: 5
- Geniale: 0
- Grande: 3
- Mossa mancata: 2
- Non valutabile: 0
- Forzata: 1

Esclusioni: {"book":5,"unsupported":5,"suspect":0,"missing":0,"forced":1}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | c5 | Libro | Migliore | 0 | 0 | -28 | N/D | -28 | N/D | book |
| 3 | d4 | Libro | Ottima | 1.9357265776787536 | -31 | 38 | N/D | 7 | N/D | book |
| 4 | cxd4 | Libro | Migliore | 0 | 0 | 0 | N/D | 0 | N/D | book |
| 5 | Qxd4 | Libro | Ottima | 0.9374545931409184 | -15 | 11 | N/D | -4 | N/D | book |
| 6 | Na6 | Imprecisione | Imprecisione | 7.442854888130862 | -120 | -1 | N/D | -121 | N/D |  |
| 7 | Qd1 | Buona | Imprecisione | 5.502420716044476 | -89 | 124 | N/D | 35 | N/D |  |
| 8 | Nf6 | Ottima | Ottima | 0.5581483834385781 | -9 | -66 | N/D | -75 | N/D |  |
| 9 | Nc3 | Migliore | Migliore | 0 | 0 | 65 | N/D | 65 | N/D |  |
| 10 | e5 | Migliore | Migliore | 0 | 0 | -62 | N/D | -62 | N/D |  |
| 11 | Nf3 | Buona | Ottima | 1.55540798256103 | -25 | 66 | N/D | 41 | N/D |  |
| 12 | Bb4 | Migliore | Migliore | 0 | 0 | -35 | N/D | -35 | N/D |  |
| 13 | Nxe5 | Ottima | Migliore | 0 | 0 | 39 | N/D | 39 | N/D |  |
| 14 | O-O | Ottima | Migliore | 0 | 0 | -26 | N/D | -26 | N/D |  |
| 15 | Bd2 | Buona | Buona | 3.8730374757630024 | -62 | 33 | N/D | -29 | N/D |  |
| 16 | d6 | Buona | Imprecisione | 7.351371336377061 | -118 | 29 | N/D | -89 | N/D |  |
| 17 | Nxf7 | Errore grave | Errore | 17.10108539645207 | -277 | 99 | N/D | -178 | N/D |  |
| 18 | Rxf7 | Migliore | Migliore | 0 | 0 | 247 | N/D | 247 | N/D |  |
| 19 | Bc4 | Migliore | Migliore | 0 | 0 | -224 | N/D | -224 | N/D |  |
| 20 | Kf8 | Errore grave | Errore | 18.345381989713548 | -301 | 245 | N/D | -56 | N/D |  |
| 21 | Bxf7 | Grande | Migliore | 0 | 0 | 66 | N/D | 66 | N/D | unsupported |
| 22 | Kxf7 | Migliore | Migliore | 0 | 0 | -68 | N/D | -68 | N/D |  |
| 23 | a3 | Migliore | Migliore | 0 | 0 | 65 | N/D | 65 | N/D |  |
| 24 | Bc5 | Migliore | Ottima | 0 | 0 | -75 | N/D | -75 | N/D |  |
| 25 | O-O | Buona | Buona | 3.7369434165539284 | -60 | 74 | N/D | 14 | N/D |  |
| 26 | Bg4 | Migliore | Migliore | 0 | 0 | -25 | N/D | -25 | N/D |  |
| 27 | Qe1 | Migliore | Migliore | 0 | 0 | 47 | N/D | 47 | N/D |  |
| 28 | Qe8 | Buona | Buona | 3.039226837614084 | -49 | -44 | N/D | -93 | N/D |  |
| 29 | b4 | Imprecisione | Imprecisione | 6.408853761696632 | -103 | 96 | N/D | -7 | N/D |  |
| 30 | Bxf2+ | Errore grave | Errore grave | 27.988562900072576 | -506 | 0 | N/D | -506 | N/D |  |
| 31 | Rxf2 | Grande | Migliore | 0 | 0 | 556 | N/D | 556 | N/D | unsupported |
| 32 | b5 | Imprecisione | Ottima | 2.5201706090077796 | -63 | -523 | N/D | -586 | N/D |  |
| 33 | h3 | Buona | Ottima | 0.8229222418116522 | -22 | 609 | N/D | 587 | N/D |  |
| 34 | Bh5 | Buona | Ottima | 1.4530451573202403 | -38 | -565 | N/D | -603 | N/D |  |
| 35 | g4 | Ottima | Ottima | 0.03719783220599293 | -1 | 602 | N/D | 601 | N/D |  |
| 36 | Bg6 | Errore | Ottima | 0.5311526219990176 | -14 | -582 | N/D | -596 | N/D |  |
| 37 | Rd1 | Buona | Imprecisione | 6.73182341732238 | -167 | 633 | N/D | 466 | N/D |  |
| 38 | d5 | Buona | Buona | 3.9296384627309027 | -96 | -491 | N/D | -587 | N/D |  |
| 39 | Nxd5 | Ottima | Ottima | 0.7623621141963244 | -20 | 596 | N/D | 576 | N/D |  |
| 40 | Kf8 | Imprecisione | Buona | 4.388558841554735 | -125 | -575 | N/D | -700 | N/D |  |
| 41 | Nxf6 | Migliore | Ottima | 0.7904208830087689 | -25 | 711 | N/D | 686 | N/D |  |
| 42 | gxf6 | Migliore | Migliore | 0 | 0 | -629 | N/D | -629 | N/D |  |
| 43 | Rxf6+ | Ottima | Ottima | 0.22092108272722122 | -7 | 703 | N/D | 696 | N/D |  |
| 44 | Kg7 | Migliore | Migliore | 0 | 0 | -688 | N/D | -688 | N/D |  |
| 45 | Rxa6 | Ottima | Migliore | 0 | 0 | 741 | N/D | 741 | N/D |  |
| 46 | Bxe4 | Imprecisione | Imprecisione | 6.965246145102534 | -285 | -699 | N/D | -984 | N/D |  |
| 47 | Bc3+ | Buona | Ottima | 2.5371513287882563 | -119 | 966 | N/D | 847 | N/D |  |
| 48 | Kf8 | Imprecisione | Buona | 4.899295765916836 | -265 | -847 | N/D | -1112 | N/D |  |
| 49 | Qf2+ | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 10 |  |
| 50 | Qf7 | Migliore | Migliore | 0 | N/D | N/D | -9 | N/D | -9 |  |
| 51 | Qxf7+ | Mossa mancata | Errore | 14.246080221548796 | N/D | N/D | 8 | 718 | N/D | unsupported |
| 52 | Kxf7 | Forzata | Migliore | 0 | 0 | -697 | N/D | -697 | N/D | forced |
| 53 | Rf1+ | Ottima | Migliore | 0 | 0 | 870 | N/D | 870 | N/D |  |
| 54 | Ke7 | Errore | Ottima | 0.2725076027140713 | -14 | -943 | N/D | -957 | N/D |  |
| 55 | Rf4 | Buona | Imprecisione | 5.89829643253994 | -241 | 960 | N/D | 719 | N/D |  |
| 56 | Bxc2 | Migliore | Migliore | 0 | 0 | -701 | N/D | -701 | N/D |  |
| 57 | Rh6 | Ottima | Buona | 3.9375628794544038 | -115 | 710 | N/D | 595 | N/D |  |
| 58 | Rc8 | Migliore | Ottima | 0.8164115714725334 | -22 | -592 | N/D | -614 | N/D |  |
| 59 | Bf6+ | Buona | Ottima | 0.8230848461369233 | -23 | 637 | N/D | 614 | N/D |  |
| 60 | Kf7 | Imprecisione | Ottima | 0.18539784690932148 | -5 | -601 | N/D | -606 | N/D |  |
| 61 | Bg5+ | Buona | Ottima | 0.20410560030338365 | -6 | 659 | N/D | 653 | N/D |  |
| 62 | Kg7 | Buona | Ottima | 1.5503555944732321 | -45 | -626 | N/D | -671 | N/D |  |
| 63 | Ra6 | Migliore | Ottima | 1.3189553286480193 | -39 | 679 | N/D | 640 | N/D |  |
| 64 | h6 | Errore | Buona | 3.3716010622408517 | -113 | -675 | N/D | -788 | N/D |  |
| 65 | Rxa7+ | Ottima | Ottima | 0.48244678981519407 | -18 | 798 | N/D | 780 | N/D |  |
| 66 | Kg6 | Errore | Buona | 3.9286559641770302 | -166 | -772 | N/D | -938 | N/D |  |
| 67 | Bh4 | Migliore | Migliore | 0 | 0 | 1373 | N/D | 1373 | N/D |  |
| 68 | Rc3 | Imprecisione | Ottima | 0 | N/D | N/D | -9 | N/D | -1 |  |
| 69 | Ra6+ | Mossa mancata | Errore | 11.634569909472336 | N/D | N/D | 1 | 811 | N/D | unsupported |
| 70 | Kg7 | Buona | Ottima | 2.3655251572450813 | -108 | -839 | N/D | -947 | N/D |  |
| 71 | Rd4 | Imprecisione | Errore | 13.95229605086069 | -720 | 1346 | N/D | 626 | N/D |  |
| 72 | Rxh3 | Errore | Errore | 16.903245511688773 | N/D | -637 | N/D | N/D | -2 |  |
| 73 | Rd7+ | Grande | Migliore | 0 | N/D | N/D | 2 | N/D | 2 | unsupported |
| 74 | Kf8 | Migliore | Ottima | 0 | N/D | N/D | -1 | N/D | -1 |  |
| 75 | Ra8# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Imprecisione | 0 | 3 | 2 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 8 | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 4 | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 16 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 2 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":102,"independent-position":33,"checkmate":1}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 103 | f7 | Matto subito: 10 → 10 mosse (distanza invariata). |
| 104 | a2 | Matto vincente: 10 → 10 mosse (distanza invariata). |
| 105 | Ke7 | Matto subito: 9 → 9 mosse (distanza invariata). |
| 106 | a1=Q | Matto vincente: 5 → 5 mosse (distanza invariata). |
| 107 | f8=Q | Matto subito: 4 → 4 mosse (distanza invariata). |
| 116 | c4 | Matto vincente: 13 → 14 mosse (rallentato). |
| 117 | Kf4 | Matto subito: 13 → 12 mosse (anticipato). |
| 118 | c3 | Matto vincente: 10 → 10 mosse (distanza invariata). |
| 119 | Kf3 | Matto subito: 8 → 7 mosse (anticipato). |
| 120 | c2 | Matto vincente: 6 → 6 mosse (distanza invariata). |
| 121 | Kg2 | Matto subito: 5 → 4 mosse (anticipato). |
| 122 | c1=Q | Matto vincente: 3 → 4 mosse (rallentato). |
| 123 | Kh2 | Matto subito: 3 → 2 mosse (anticipato). |
| 124 | b5 | Matto vincente: 2 → 3 mosse (rallentato). Stime da analisi separate. |
| 125 | Kg2 | Matto subito: 2 → 2 mosse (distanza invariata). |
| 126 | b4 | Matto vincente: 2 → 4 mosse (rallentato). Stime da analisi separate. |
| 127 | Kf3 | Matto subito: 3 → 3 mosse (distanza invariata). |
| 128 | b3 | Matto vincente: 3 → 4 mosse (rallentato). Stime da analisi separate. |
| 129 | Kg2 | Matto subito: 3 → 2 mosse (anticipato). |
| 130 | b2 | Matto vincente: 2 → 4 mosse (rallentato). Stime da analisi separate. |
| 131 | Kf3 | Matto subito: 3 → 3 mosse (distanza invariata). |
| 132 | b1=Q | Matto vincente: 3 → 3 mosse (distanza invariata). |
| 133 | Kg2 | Matto subito: 2 → 2 mosse (distanza invariata). |
| 134 | Qec3 | Matto vincente: 2 → 2 mosse (distanza invariata). Stime da analisi separate. |
| 135 | Kf2 | Matto subito: 1 → 1 mosse (distanza invariata). |
| 136 | Qbc2# | Matto dato. |

## personal-03: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 136; inclusi: 125; esclusi unici: 11.
Corrispondenza esatta: 49.6%; entro una classe: 91.2%.

Conteggi attesi:
- Migliore: 50
- Ottima: 35
- Buona: 23
- Imprecisione: 12
- Errore: 4
- Errore grave: 1
- Libro: 4
- Geniale: 0
- Grande: 2
- Mossa mancata: 4
- Non valutabile: 0
- Forzata: 1

Esclusioni: {"book":4,"unsupported":6,"suspect":0,"missing":0,"forced":1}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | d5 | Libro | Ottima | 2.8005929546392307 | -45 | -28 | N/D | -73 | N/D | book |
| 3 | exd5 | Libro | Migliore | 0 | 0 | 86 | N/D | 86 | N/D | book |
| 4 | e5 | Libro | Buona | 3.397240515004057 | -55 | -58 | N/D | -113 | N/D | book |
| 5 | Nc3 | Buona | Ottima | 2.886213088116385 | -47 | 129 | N/D | 82 | N/D |  |
| 6 | f5 | Errore | Imprecisione | 5.59058804772069 | -92 | -86 | N/D | -178 | N/D |  |
| 7 | d3 | Imprecisione | Buona | 4.364153240663404 | -72 | 175 | N/D | 103 | N/D |  |
| 8 | Nf6 | Ottima | Ottima | 0.18479784223232598 | -3 | -95 | N/D | -98 | N/D |  |
| 9 | Bg5 | Imprecisione | Buona | 4.028948329969662 | -65 | 103 | N/D | 38 | N/D |  |
| 10 | h6 | Ottima | Migliore | 0 | 0 | -30 | N/D | -30 | N/D |  |
| 11 | Bxf6 | Migliore | Migliore | 0 | 0 | 45 | N/D | 45 | N/D |  |
| 12 | Qxf6 | Migliore | Migliore | 0 | 0 | -68 | N/D | -68 | N/D |  |
| 13 | Nf3 | Ottima | Ottima | 1.6199529753921915 | -26 | 57 | N/D | 31 | N/D |  |
| 14 | Bd6 | Migliore | Ottima | 0.9349545215806887 | -15 | -34 | N/D | -49 | N/D |  |
| 15 | Nb5 | Ottima | Ottima | 0.7475118908378708 | -12 | 52 | N/D | 40 | N/D |  |
| 16 | f4 | Imprecisione | Buona | 4.6382154491191425 | -75 | -42 | N/D | -117 | N/D |  |
| 17 | b3 | Imprecisione | Imprecisione | 6.4470665799594595 | -104 | 118 | N/D | 14 | N/D |  |
| 18 | a6 | Imprecisione | Buona | 3.922220706147356 | -63 | -15 | N/D | -78 | N/D |  |
| 19 | Nxd6+ | Grande | Migliore | 0 | 0 | 77 | N/D | 77 | N/D | unsupported |
| 20 | Qxd6 | Migliore | Ottima | 2.9490254836271603 | -48 | -80 | N/D | -128 | N/D |  |
| 21 | c4 | Buona | Buona | 3.4033113479257415 | -55 | 106 | N/D | 51 | N/D |  |
| 22 | Nd7 | Imprecisione | Imprecisione | 5.169026076956612 | -84 | -55 | N/D | -139 | N/D |  |
| 23 | g3 | Buona | Buona | 4.746568245455496 | -77 | 130 | N/D | 53 | N/D |  |
| 24 | g5 | Buona | Ottima | 2.450296800734497 | -40 | -93 | N/D | -133 | N/D |  |
| 25 | Qe2 | Buona | Ottima | 2.0146201543388975 | -33 | 139 | N/D | 106 | N/D |  |
| 26 | Qc5 | Errore | Errore | 10.183540517326872 | -174 | -114 | N/D | -288 | N/D |  |
| 27 | Nxe5 | Mossa mancata | Errore | 12.421185838324067 | -211 | 294 | N/D | 83 | N/D | unsupported |
| 28 | Nxe5 | Mossa mancata | Errore | 13.572976612035593 | -233 | -88 | N/D | -321 | N/D | unsupported |
| 29 | Qxe5+ | Migliore | Migliore | 0 | 0 | 321 | N/D | 321 | N/D |  |
| 30 | Qe7 | Buona | Buona | 3.3786339601818316 | -65 | -316 | N/D | -381 | N/D |  |
| 31 | Qxe7+ | Buona | Ottima | 1.8667941922026365 | -36 | 369 | N/D | 333 | N/D |  |
| 32 | Kxe7 | Forzata | Migliore | 0 | 0 | -341 | N/D | -341 | N/D | forced |
| 33 | O-O-O | Buona | Buona | 4.10070005937383 | -76 | 348 | N/D | 272 | N/D |  |
| 34 | Kf6 | Buona | Buona | 3.5092120360288357 | -65 | -277 | N/D | -342 | N/D |  |
| 35 | gxf4 | Ottima | Ottima | 0.580610749444388 | -11 | 339 | N/D | 328 | N/D |  |
| 36 | Bg4 | Ottima | Migliore | 0 | 0 | -327 | N/D | -327 | N/D |  |
| 37 | Re1 | Migliore | Migliore | 0 | 0 | 326 | N/D | 326 | N/D |  |
| 38 | gxf4 | Migliore | Ottima | 0.998889375627654 | -19 | -328 | N/D | -347 | N/D |  |
| 39 | Rg1 | Migliore | Ottima | 0.15469273021262442 | -3 | 358 | N/D | 355 | N/D |  |
| 40 | Rhg8 | Ottima | Ottima | 1.4008679243233735 | -27 | -337 | N/D | -364 | N/D |  |
| 41 | Re6+ | Errore grave | Errore grave | 48.73088108571745 | -856 | 371 | N/D | -485 | N/D |  |
| 42 | Bxe6 | Grande | Migliore | 0 | 0 | 488 | N/D | 488 | N/D | unsupported |
| 43 | dxe6 | Errore | Imprecisione | 9.05913456367762 | -254 | -502 | N/D | -756 | N/D |  |
| 44 | Kxe6 | Mossa mancata | Errore grave | 20.112227344436107 | -477 | 756 | N/D | 279 | N/D | unsupported |
| 45 | Rxg8 | Imprecisione | Imprecisione | 6.291633681624742 | -121 | -287 | N/D | -408 | N/D |  |
| 46 | Rxg8 | Migliore | Migliore | 0 | 0 | 410 | N/D | 410 | N/D |  |
| 47 | Be2 | Ottima | Ottima | 2.7131703964045792 | -58 | -412 | N/D | -470 | N/D |  |
| 48 | Rg1+ | Ottima | Ottima | 2.914587878852559 | -64 | 494 | N/D | 430 | N/D |  |
| 49 | Kd2 | Migliore | Migliore | 0 | 0 | -440 | N/D | -440 | N/D |  |
| 50 | Rg2 | Ottima | Ottima | 0.04616611810472904 | -1 | 452 | N/D | 451 | N/D |  |
| 51 | f3 | Buona | Buona | 4.476318703041351 | -100 | -425 | N/D | -525 | N/D |  |
| 52 | Rxh2 | Ottima | Ottima | 0.3332290072727062 | -8 | 531 | N/D | 523 | N/D |  |
| 53 | a4 | Imprecisione | Ottima | 1.1931349454768536 | -29 | -521 | N/D | -550 | N/D |  |
| 54 | Kd6 | Buona | Ottima | 2.4811929481453388 | -60 | 562 | N/D | 502 | N/D |  |
| 55 | Ke1 | Imprecisione | Buona | 3.673220654141332 | -90 | -496 | N/D | -586 | N/D |  |
| 56 | Kc5 | Ottima | Ottima | 0.3497697770051933 | -9 | 578 | N/D | 569 | N/D |  |
| 57 | Kd2 | Buona | Ottima | 0.15366251263045638 | -4 | -579 | N/D | -583 | N/D |  |
| 58 | Kb4 | Buona | Ottima | 2.2323584224323567 | -57 | 597 | N/D | 540 | N/D |  |
| 59 | Ke1 | Buona | Ottima | 1.2925308847284156 | -32 | -532 | N/D | -564 | N/D |  |
| 60 | Kxb3 | Ottima | Ottima | 1.2687268789155492 | -33 | 597 | N/D | 564 | N/D |  |
| 61 | c5 | Ottima | Buona | 3.0060774712018343 | -78 | -540 | N/D | -618 | N/D |  |
| 62 | Kxa4 | Ottima | Ottima | 1.879266965981996 | -50 | 620 | N/D | 570 | N/D |  |
| 63 | d4 | Migliore | Ottima | 1.1542779881667131 | -30 | -565 | N/D | -595 | N/D |  |
| 64 | Kb4 | Ottima | Migliore | 0 | 0 | 592 | N/D | 592 | N/D |  |
| 65 | Kd2 | Buona | Ottima | 1.13307467942248 | -33 | -634 | N/D | -667 | N/D |  |
| 66 | c6 | Migliore | Ottima | 1.7424330154282353 | -51 | 679 | N/D | 628 | N/D |  |
| 67 | Kd3 | Migliore | Ottima | 0.3795781489466743 | -11 | -642 | N/D | -653 | N/D |  |
| 68 | h5 | Migliore | Buona | 3.3008253214313 | -89 | 648 | N/D | 559 | N/D |  |
| 69 | Bd1 | Ottima | Migliore | 0 | 0 | -582 | N/D | -582 | N/D |  |
| 70 | Rf2 | Ottima | Ottima | 1.011044996272481 | -28 | 634 | N/D | 606 | N/D |  |
| 71 | Ke4 | Ottima | Ottima | 2.199820777669706 | -63 | -609 | N/D | -672 | N/D |  |
| 72 | h4 | Migliore | Ottima | 1.9213611898633798 | -56 | 679 | N/D | 623 | N/D |  |
| 73 | Kxf4 | Ottima | Ottima | 0.8227627343161764 | -26 | -685 | N/D | -711 | N/D |  |
| 74 | h3 | Ottima | Buona | 3.6384692919046446 | -109 | 722 | N/D | 613 | N/D |  |
| 75 | Kg3 | Migliore | Ottima | 2.58738505345516 | -78 | -632 | N/D | -710 | N/D |  |
| 76 | h2 | Ottima | Ottima | 2.4777942615784476 | -78 | 735 | N/D | 657 | N/D |  |
| 77 | Kxf2 | Migliore | Migliore | 0 | 0 | -621 | N/D | -621 | N/D |  |
| 78 | h1=Q | Migliore | Migliore | 0 | 0 | 641 | N/D | 641 | N/D |  |
| 79 | Ke3 | Errore | Migliore | 0 | 0 | -631 | N/D | -631 | N/D |  |
| 80 | Qxd1 | Buona | Migliore | 0 | 0 | 792 | N/D | 792 | N/D |  |
| 81 | f4 | Buona | Migliore | 0 | 0 | -1062 | N/D | -1062 | N/D |  |
| 82 | Qe1+ | Ottima | Errore | 10.948195572229292 | -2839 | 3677 | N/D | 838 | N/D |  |
| 83 | Kf3 | Migliore | Migliore | 0 | 0 | -1038 | N/D | -1038 | N/D |  |
| 84 | Qd1+ | Ottima | Ottima | 0 | 0 | 1079 | N/D | 1079 | N/D |  |
| 85 | Ke4 | Ottima | Migliore | 0 | 0 | -1084 | N/D | -1084 | N/D |  |
| 86 | Qc2+ | Buona | Errore | 11.934305161486058 | -598 | 1260 | N/D | 662 | N/D |  |
| 87 | Kf3 | Imprecisione | Errore | 11.166631986004314 | -563 | -680 | N/D | -1243 | N/D |  |
| 88 | Qd3+ | Buona | Migliore | 0 | 0 | 3723 | N/D | 3723 | N/D |  |
| 89 | Kg4 | Buona | Migliore | 0 | 0 | -3729 | N/D | -3729 | N/D |  |
| 90 | Qxd4 | Migliore | Ottima | 0 | 0 | 3737 | N/D | 3737 | N/D |  |
| 91 | Kg5 | Migliore | Migliore | 0 | 0 | -3737 | N/D | -3737 | N/D |  |
| 92 | Qxc5+ | Migliore | Ottima | 0 | 0 | 3737 | N/D | 3737 | N/D |  |
| 93 | f5 | Ottima | Ottima | 0 | 0 | -3777 | N/D | -3777 | N/D |  |
| 94 | Qg1+ | Mossa mancata | Ottima | 0.0030167027752159292 | -129 | 3777 | N/D | 3648 | N/D | unsupported |
| 95 | Kf6 | Imprecisione | Ottima | 0.002006053276894335 | -81 | -3648 | N/D | -3729 | N/D |  |
| 96 | Qf2 | Ottima | Ottima | 0.0020060532768817474 | -81 | 3729 | N/D | 3648 | N/D |  |
| 97 | Ke5 | Imprecisione | Ottima | 0.0014225137638985517 | -56 | -3650 | N/D | -3706 | N/D |  |
| 98 | a5 | Migliore | Migliore | 0 | 0 | 3718 | N/D | 3718 | N/D |  |
| 99 | f6 | Migliore | Migliore | 0 | 0 | -3729 | N/D | -3729 | N/D |  |
| 100 | a4 | Migliore | Ottima | 0 | 0 | 3718 | N/D | 3718 | N/D |  |
| 101 | Ke6 | Migliore | Ottima | 0.0002077122266286194 | -47 | -4354 | N/D | -4401 | N/D |  |
| 102 | a3 | Migliore | Migliore | 0 | 0 | 4414 | N/D | 4414 | N/D |  |
| 103 | f7 | Migliore | Ottima | 0 | N/D | N/D | -10 | N/D | -10 |  |
| 104 | a2 | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 10 |  |
| 105 | Ke7 | Migliore | Migliore | 0 | N/D | N/D | -9 | N/D | -9 |  |
| 106 | a1=Q | Migliore | Migliore | 0 | N/D | N/D | 5 | N/D | 5 |  |
| 107 | f8=Q | Migliore | Migliore | 0 | N/D | N/D | -4 | N/D | -4 |  |
| 108 | Qxf8+ | Buona | Ottima | 0.008871436615898176 | N/D | N/D | 4 | 3732 | N/D |  |
| 109 | Kxf8 | Migliore | Migliore | 0 | 0 | -4290 | N/D | -4290 | N/D |  |
| 110 | Qe1 | Migliore | Ottima | 0.00045310486058713906 | -89 | 4366 | N/D | 4277 | N/D |  |
| 111 | Kf7 | Migliore | Migliore | 0 | 0 | -4360 | N/D | -4360 | N/D |  |
| 112 | Ka3 | Ottima | Ottima | 0.00017798549933889518 | -37 | 4362 | N/D | 4325 | N/D |  |
| 113 | Kf6 | Migliore | Ottima | 0.00020843118946707134 | -43 | -4319 | N/D | -4362 | N/D |  |
| 114 | c5 | Migliore | Ottima | 0.00009874747638471959 | -21 | 4363 | N/D | 4342 | N/D |  |
| 115 | Kf5 | Ottima | Migliore | 0 | 0 | -4326 | N/D | -4326 | N/D |  |
| 116 | c4 | Migliore | Ottima | 0 | N/D | N/D | 13 | N/D | 14 |  |
| 117 | Kf4 | Migliore | Ottima | 0 | N/D | N/D | -13 | N/D | -12 |  |
| 118 | c3 | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 10 |  |
| 119 | Kf3 | Migliore | Ottima | 0 | N/D | N/D | -8 | N/D | -7 |  |
| 120 | c2 | Migliore | Migliore | 0 | N/D | N/D | 6 | N/D | 6 |  |
| 121 | Kg2 | Ottima | Ottima | 0 | N/D | N/D | -5 | N/D | -4 |  |
| 122 | c1=Q | Ottima | Ottima | 0 | N/D | N/D | 3 | N/D | 4 |  |
| 123 | Kh2 | Ottima | Ottima | 0 | N/D | N/D | -3 | N/D | -2 |  |
| 124 | b5 | Ottima | Ottima | 0 | N/D | N/D | 2 | N/D | 2 |  |
| 125 | Kg2 | Migliore | Ottima | 0 | N/D | N/D | -2 | N/D | -2 |  |
| 126 | b4 | Buona | Ottima | 0 | N/D | N/D | 2 | N/D | 3 |  |
| 127 | Kf3 | Migliore | Migliore | 0 | N/D | N/D | -3 | N/D | -3 |  |
| 128 | b3 | Ottima | Ottima | 0 | N/D | N/D | 3 | N/D | 3 |  |
| 129 | Kg2 | Ottima | Ottima | 0 | N/D | N/D | -3 | N/D | -2 |  |
| 130 | b2 | Buona | Ottima | 0 | N/D | N/D | 2 | N/D | 3 |  |
| 131 | Kf3 | Migliore | Migliore | 0 | N/D | N/D | -3 | N/D | -3 |  |
| 132 | b1=Q | Migliore | Migliore | 0 | N/D | N/D | 3 | N/D | 3 |  |
| 133 | Kg2 | Migliore | Ottima | 0 | N/D | N/D | -2 | N/D | -2 |  |
| 134 | Qec3 | Migliore | Ottima | 0 | N/D | N/D | 2 | N/D | 1 |  |
| 135 | Kf2 | Migliore | Ottima | 0 | N/D | N/D | -1 | N/D | -1 |  |
| 136 | Qbc2# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Buona | 4 | 12 | 6 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 1 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 3 | 5 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 6 | 26 | 2 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 25 | 24 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":38,"independent-position":17}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 50 | Ne2 | Matto subito: 6 → 3 mosse (anticipato). Stime da analisi separate. |
| 53 | Qxg5+ | Matto vincente: 6 → 9 mosse (rallentato). |
| 54 | Kd7 | Matto subito: 8 → 6 mosse (anticipato). |
| 55 | Rac1 | Matto vincente: 5 → 8 mosse (rallentato). Stime da analisi separate. |

## personal-04: ProprioI0 vs BUMCestinait0, 2026.10.04

Ply: 55; inclusi: 46; esclusi unici: 9.
Corrispondenza esatta: 56.52173913043478%; entro una classe: 76.08695652173913%.

Conteggi attesi:
- Migliore: 17
- Ottima: 7
- Buona: 10
- Imprecisione: 4
- Errore: 7
- Errore grave: 1
- Libro: 6
- Geniale: 0
- Grande: 2
- Mossa mancata: 0
- Non valutabile: 0
- Forzata: 1

Esclusioni: {"book":6,"unsupported":2,"suspect":0,"missing":0,"forced":1}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | d4 | Libro | Ottima | 1.49864872070673 | -24 | 35 | N/D | 11 | N/D | book |
| 2 | c6 | Libro | Ottima | 1.373108553208513 | -22 | -18 | N/D | -40 | N/D | book |
| 3 | c4 | Libro | Ottima | 0.8726836798297666 | -14 | 48 | N/D | 34 | N/D | book |
| 4 | d5 | Libro | Migliore | 0 | 0 | -30 | N/D | -30 | N/D | book |
| 5 | Nf3 | Libro | Ottima | 0.5615667822699288 | -9 | 37 | N/D | 28 | N/D | book |
| 6 | dxc4 | Libro | Ottima | 1.933232020507547 | -31 | -21 | N/D | -52 | N/D | book |
| 7 | g3 | Ottima | Ottima | 2.4944278278248966 | -40 | 56 | N/D | 16 | N/D |  |
| 8 | Bf5 | Buona | Ottima | 2.929513901839409 | -47 | -16 | N/D | -63 | N/D |  |
| 9 | Bf4 | Buona | Buona | 3.5509751537632805 | -57 | 71 | N/D | 14 | N/D |  |
| 10 | e6 | Migliore | Migliore | 0 | 0 | -18 | N/D | -18 | N/D |  |
| 11 | Bg2 | Migliore | Ottima | 0.2499678414760731 | -4 | 11 | N/D | 7 | N/D |  |
| 12 | Bd6 | Ottima | Ottima | 2.2480717557220253 | -36 | -3 | N/D | -39 | N/D |  |
| 13 | Bxd6 | Migliore | Migliore | 0 | 0 | 75 | N/D | 75 | N/D |  |
| 14 | Qxd6 | Migliore | Migliore | 0 | 0 | -55 | N/D | -55 | N/D |  |
| 15 | Ng5 | Imprecisione | Imprecisione | 7.85832187081637 | -126 | 57 | N/D | -69 | N/D |  |
| 16 | Ne7 | Ottima | Ottima | 0.06214390421095395 | -1 | 61 | N/D | 60 | N/D |  |
| 17 | e4 | Buona | Ottima | 1.6727950721355578 | -27 | -61 | N/D | -88 | N/D |  |
| 18 | Bg6 | Migliore | Migliore | 0 | 0 | 98 | N/D | 98 | N/D |  |
| 19 | O-O | Migliore | Migliore | 0 | 0 | -89 | N/D | -89 | N/D |  |
| 20 | h6 | Ottima | Ottima | 0.3693136995000734 | -6 | 102 | N/D | 96 | N/D |  |
| 21 | e5 | Errore | Ottima | 2.322806824366702 | -38 | -100 | N/D | -138 | N/D |  |
| 22 | Qb4 | Grande | Migliore | 0 | 0 | 234 | N/D | 234 | N/D | unsupported |
| 23 | Nd2 | Imprecisione | Errore | 10.301650413435931 | -184 | -172 | N/D | -356 | N/D |  |
| 24 | hxg5 | Migliore | Migliore | 0 | 0 | 381 | N/D | 381 | N/D |  |
| 25 | a3 | Migliore | Migliore | 0 | 0 | -364 | N/D | -364 | N/D |  |
| 26 | Qxb2 | Buona | Buona | 3.8832460717735384 | -74 | 376 | N/D | 302 | N/D |  |
| 27 | Nxc4 | Migliore | Migliore | 0 | 0 | -285 | N/D | -285 | N/D |  |
| 28 | Qb5 | Errore grave | Errore grave | 45.785428863200686 | -806 | 290 | N/D | -516 | N/D |  |
| 29 | Nd6+ | Grande | Migliore | 0 | 0 | 471 | N/D | 471 | N/D | unsupported |
| 30 | Kf8 | Migliore | Ottima | 2.7485380137355215 | -67 | -504 | N/D | -571 | N/D |  |
| 31 | Nxb5 | Migliore | Migliore | 0 | 0 | 563 | N/D | 563 | N/D |  |
| 32 | cxb5 | Errore | Ottima | 0 | 0 | -566 | N/D | -566 | N/D |  |
| 33 | Bxb7 | Migliore | Migliore | 0 | 0 | 574 | N/D | 574 | N/D |  |
| 34 | Nbc6 | Migliore | Migliore | 0 | 0 | -572 | N/D | -572 | N/D |  |
| 35 | Bxa8 | Migliore | Migliore | 0 | 0 | 574 | N/D | 574 | N/D |  |
| 36 | Nb8 | Buona | Buona | 3.5346919294197114 | -105 | -610 | N/D | -715 | N/D |  |
| 37 | Qb3 | Ottima | Ottima | 1.925788467609757 | -60 | 720 | N/D | 660 | N/D |  |
| 38 | Nf5 | Errore | Buona | 3.0076189038630714 | -96 | -656 | N/D | -752 | N/D |  |
| 39 | Qxb5 | Migliore | Migliore | 0 | 0 | 783 | N/D | 783 | N/D |  |
| 40 | Nxd4 | Errore | Buona | 4.101855311872928 | -186 | -798 | N/D | -984 | N/D |  |
| 41 | Qxb8+ | Migliore | Migliore | 0 | 0 | 1107 | N/D | 1107 | N/D |  |
| 42 | Ke7 | Forzata | Migliore | 0 | 0 | -1472 | N/D | -1472 | N/D | forced |
| 43 | Qxh8 | Buona | Buona | 4.443177990130131 | -680 | 1818 | N/D | 1138 | N/D |  |
| 44 | Ne2+ | Imprecisione | Ottima | 1.495555072030709 | -123 | -1107 | N/D | -1230 | N/D |  |
| 45 | Kg2 | Buona | Migliore | 0 | 0 | 1217 | N/D | 1217 | N/D |  |
| 46 | Be4+ | Imprecisione | Ottima | 2.24227773650627 | N/D | -1510 | N/D | N/D | -5 |  |
| 47 | f3 | Ottima | Imprecisione | 5.598807906182168 | N/D | N/D | 5 | 1130 | N/D |  |
| 48 | Nd4 | Errore | Buona | 3.365831894631952 | -241 | -989 | N/D | -1230 | N/D |  |
| 49 | Bxe4 | Buona | Buona | 4.554237656394788 | N/D | N/D | 9 | 1217 | N/D |  |
| 50 | Ne2 | Errore | Ottima | 0 | N/D | N/D | -6 | N/D | -3 |  |
| 51 | Qxg7 | Buona | Ottima | 2.633931962528324 | N/D | N/D | 3 | 1444 | N/D |  |
| 52 | Nc3 | Ottima | Migliore | 0 | 0 | -1668 | N/D | -1668 | N/D |  |
| 53 | Qxg5+ | Buona | Ottima | 0 | N/D | N/D | 6 | N/D | 9 |  |
| 54 | Kd7 | Errore | Ottima | 0 | N/D | N/D | -8 | N/D | -6 |  |
| 55 | Rac1 | Migliore | Ottima | 0 | N/D | N/D | 5 | N/D | 7 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 1 | 5 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 1 | 4 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 14 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":27,"independent-position":10}

Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):

| ply | SAN | Osservazione |
|---|---|---|
| 37 | Bh6+ | Matto vincente: 3 → 3 mosse (distanza invariata). |

## personal-05: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 37; inclusi: 24; esclusi unici: 13.
Corrispondenza esatta: 45.833333333333336%; entro una classe: 95.83333333333333%.

Conteggi attesi:
- Migliore: 5
- Ottima: 6
- Buona: 4
- Imprecisione: 3
- Errore: 4
- Errore grave: 2
- Libro: 8
- Geniale: 0
- Grande: 3
- Mossa mancata: 2
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":8,"unsupported":5,"suspect":0,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | e5 | Libro | Ottima | 0.06242073767916412 | -1 | -28 | N/D | -29 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0 | 0 | 40 | N/D | 40 | N/D | book |
| 4 | Nc6 | Libro | Migliore | 0 | 0 | -32 | N/D | -32 | N/D | book |
| 5 | Bb5 | Libro | Ottima | 0.18702006038614494 | -3 | 42 | N/D | 39 | N/D | book |
| 6 | Nf6 | Libro | Ottima | 0.9963757679274488 | -16 | -40 | N/D | -56 | N/D | book |
| 7 | d4 | Libro | Ottima | 1.437104069706019 | -23 | 23 | N/D | 0 | N/D | book |
| 8 | Nxe4 | Libro | Ottima | 2.3740196579705386 | -38 | 7 | N/D | -31 | N/D | book |
| 9 | dxe5 | Migliore | Ottima | 0.49919671254103903 | -8 | 36 | N/D | 28 | N/D |  |
| 10 | Bc5 | Buona | Ottima | 2.2394067581779975 | -36 | -36 | N/D | -72 | N/D |  |
| 11 | Bxc6 | Errore | Errore | 11.862974701569968 | -191 | 64 | N/D | -127 | N/D |  |
| 12 | Nxf2 | Mossa mancata | Imprecisione | 7.871486246013404 | -127 | 127 | N/D | 0 | N/D | unsupported |
| 13 | Bxd7+ | Errore | Errore grave | 20.346044220913633 | -335 | 70 | N/D | -265 | N/D |  |
| 14 | Qxd7 | Mossa mancata | Imprecisione | 8.530234742125586 | -144 | 254 | N/D | 110 | N/D | unsupported |
| 15 | Qe2 | Errore grave | Errore | 15.480182164614176 | -274 | -110 | N/D | -384 | N/D |  |
| 16 | Nxh1 | Grande | Migliore | 0 | 0 | 393 | N/D | 393 | N/D | unsupported |
| 17 | Qc4 | Imprecisione | Imprecisione | 8.972664082082996 | -208 | -398 | N/D | -606 | N/D |  |
| 18 | b6 | Buona | Imprecisione | 5.292201201417523 | -129 | 602 | N/D | 473 | N/D |  |
| 19 | Ng5 | Imprecisione | Buona | 4.1677329592690215 | -106 | -513 | N/D | -619 | N/D |  |
| 20 | O-O | Migliore | Ottima | 1.0973708972867091 | -30 | 627 | N/D | 597 | N/D |  |
| 21 | Nc3 | Ottima | Migliore | 0 | 0 | -615 | N/D | -615 | N/D |  |
| 22 | Qe7 | Imprecisione | Imprecisione | 8.318534436851388 | -199 | 624 | N/D | 425 | N/D |  |
| 23 | Qe4 | Buona | Ottima | 1.5846061555788493 | -34 | -427 | N/D | -461 | N/D |  |
| 24 | Qxg5 | Errore grave | Errore grave | 45.04845547242078 | -787 | 490 | N/D | -297 | N/D |  |
| 25 | Bxg5 | Migliore | Migliore | 0 | 0 | 336 | N/D | 336 | N/D |  |
| 26 | Nf2 | Errore | Buona | 4.082212316063993 | -81 | -337 | N/D | -418 | N/D |  |
| 27 | Qxa8 | Grande | Migliore | 0 | 0 | 395 | N/D | 395 | N/D | unsupported |
| 28 | Re8 | Ottima | Buona | 3.231821078799002 | -72 | -437 | N/D | -509 | N/D |  |
| 29 | Bf4 | Migliore | Ottima | 0 | 0 | 505 | N/D | 505 | N/D |  |
| 30 | g5 | Ottima | Ottima | 2.893700976930755 | -68 | -478 | N/D | -546 | N/D |  |
| 31 | Bxg5 | Ottima | Ottima | 2.7927461938033193 | -66 | 549 | N/D | 483 | N/D |  |
| 32 | Rxe5+ | Ottima | Ottima | 0.5286012832166342 | -13 | -537 | N/D | -550 | N/D |  |
| 33 | Kd2 | Ottima | Ottima | 0.6818489969260821 | -16 | 519 | N/D | 503 | N/D |  |
| 34 | Re8 | Buona | Ottima | 2.3194107179733163 | -60 | -547 | N/D | -607 | N/D |  |
| 35 | Re1 | Migliore | Migliore | 0 | 0 | 634 | N/D | 634 | N/D |  |
| 36 | Kf8 | Errore | Errore | 18.429726028236704 | N/D | -595 | N/D | N/D | -3 |  |
| 37 | Bh6+ | Grande | Migliore | 0 | N/D | N/D | 3 | N/D | 3 | unsupported |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Migliore | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 3 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 1 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 1 | 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

Fonti delle valutazioni: {"root-pv":36,"independent-position":9}

## personal-06: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 45; inclusi: 33; esclusi unici: 12.
Corrispondenza esatta: 66.66666666666667%; entro una classe: 93.93939393939394%.

Conteggi attesi:
- Migliore: 16
- Ottima: 6
- Buona: 8
- Imprecisione: 1
- Errore: 2
- Errore grave: 0
- Libro: 9
- Geniale: 1
- Grande: 2
- Mossa mancata: 0
- Non valutabile: 0
- Forzata: 0

Esclusioni: {"book":9,"unsupported":3,"suspect":0,"missing":0,"forced":0}

| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | e4 | Libro | Migliore | 0 | 0 | 35 | N/D | 35 | N/D | book |
| 2 | e5 | Libro | Ottima | 0.06242073767916412 | -1 | -28 | N/D | -29 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0 | 0 | 40 | N/D | 40 | N/D | book |
| 4 | Nf6 | Libro | Ottima | 1.246496623173704 | -20 | -32 | N/D | -52 | N/D | book |
| 5 | Nc3 | Libro | Ottima | 2.2466683281251343 | -36 | 47 | N/D | 11 | N/D | book |
| 6 | Nc6 | Libro | Migliore | 0 | 0 | -10 | N/D | -10 | N/D | book |
| 7 | g3 | Libro | Ottima | 2.3120797489174114 | -37 | 17 | N/D | -20 | N/D | book |
| 8 | Bc5 | Libro | Ottima | 0.31234949625496 | -5 | 20 | N/D | 15 | N/D | book |
| 9 | Bg2 | Libro | Migliore | 0 | 0 | -10 | N/D | -10 | N/D | book |
| 10 | O-O | Ottima | Ottima | 1.62485444308606 | -26 | 12 | N/D | -14 | N/D |  |
| 11 | Nxe5 | Geniale | Migliore | 0 | 0 | 50 | N/D | 50 | N/D | unsupported |
| 12 | Nxe5 | Migliore | Migliore | 0 | 0 | 3 | N/D | 3 | N/D |  |
| 13 | d4 | Grande | Migliore | 0 | 0 | -9 | N/D | -9 | N/D | unsupported |
| 14 | Bxd4 | Buona | Imprecisione | 6.078512386017448 | -98 | -15 | N/D | -113 | N/D |  |
| 15 | Qxd4 | Migliore | Migliore | 0 | 0 | 72 | N/D | 72 | N/D |  |
| 16 | d6 | Migliore | Migliore | 0 | 0 | -91 | N/D | -91 | N/D |  |
| 17 | O-O | Ottima | Ottima | 1.9813288334875279 | -32 | 93 | N/D | 61 | N/D |  |
| 18 | Bg4 | Errore | Imprecisione | 8.728838198279515 | -143 | -45 | N/D | -188 | N/D |  |
| 19 | f3 | Buona | Buona | 3.6541865445885113 | -61 | 195 | N/D | 134 | N/D |  |
| 20 | Bh5 | Buona | Buona | 4.183102026722979 | -70 | -134 | N/D | -204 | N/D |  |
| 21 | g4 | Migliore | Migliore | 0 | 0 | 210 | N/D | 210 | N/D |  |
| 22 | Bg6 | Migliore | Ottima | 0 | 0 | -204 | N/D | -204 | N/D |  |
| 23 | Bg5 | Migliore | Ottima | 1.1792298329093787 | -20 | 204 | N/D | 184 | N/D |  |
| 24 | h6 | Migliore | Ottima | 0.9388333495175871 | -16 | -194 | N/D | -210 | N/D |  |
| 25 | Bh4 | Migliore | Migliore | 0 | 0 | 217 | N/D | 217 | N/D |  |
| 26 | c5 | Buona | Ottima | 0.11600377423833796 | -2 | -219 | N/D | -221 | N/D |  |
| 27 | Qf2 | Migliore | Migliore | 0 | 0 | 229 | N/D | 229 | N/D |  |
| 28 | b5 | Buona | Buona | 3.982339373238136 | -72 | -246 | N/D | -318 | N/D |  |
| 29 | a4 | Imprecisione | Buona | 3.2287749329730664 | -59 | 324 | N/D | 265 | N/D |  |
| 30 | b4 | Buona | Buona | 3.414969358599451 | -61 | -237 | N/D | -298 | N/D |  |
| 31 | Nd5 | Grande | Migliore | 0 | 0 | 322 | N/D | 322 | N/D | unsupported |
| 32 | Qd7 | Buona | Errore | 13.473312802367706 | -298 | -317 | N/D | -615 | N/D |  |
| 33 | Bxf6 | Migliore | Migliore | 0 | 0 | 544 | N/D | 544 | N/D |  |
| 34 | gxf6 | Errore | Buona | 4.999833461452449 | -145 | -576 | N/D | -721 | N/D |  |
| 35 | Nxf6+ | Migliore | Migliore | 0 | 0 | 714 | N/D | 714 | N/D |  |
| 36 | Kg7 | Migliore | Migliore | 0 | 0 | -656 | N/D | -656 | N/D |  |
| 37 | Nxd7 | Migliore | Migliore | 0 | 0 | 638 | N/D | 638 | N/D |  |
| 38 | Nxd7 | Migliore | Migliore | 0 | 0 | -660 | N/D | -660 | N/D |  |
| 39 | Qg3 | Ottima | Ottima | 0.9177308046428467 | -27 | 670 | N/D | 643 | N/D |  |
| 40 | Ne5 | Migliore | Ottima | 1.1716611706739155 | -35 | -648 | N/D | -683 | N/D |  |
| 41 | f4 | Ottima | Migliore | 0 | 0 | 679 | N/D | 679 | N/D |  |
| 42 | Nc4 | Ottima | Ottima | 0.2671083769027305 | -8 | -663 | N/D | -671 | N/D |  |
| 43 | Rfd1 | Ottima | Ottima | 1.6696375792639273 | -50 | 692 | N/D | 642 | N/D |  |
| 44 | h5 | Buona | Buona | 3.487451635654895 | -111 | -647 | N/D | -758 | N/D |  |
| 45 | gxh5 | Migliore | Migliore | 0 | 0 | 758 | N/D | 758 | N/D |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 1 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 12 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 1 | 5 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
