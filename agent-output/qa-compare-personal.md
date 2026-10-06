# Confronto QA

Classificazione per calo di probabilità (punti percentuali). Soglie iniziali non tarate sulle fixture: {"best":1,"excellent":3,"good":5,"inaccuracy":10,"mistake":20}. Le esclusioni possono sovrapporsi. Modello esistente: sigmoid(cp/400), cp limitato a ±1000. Matto vincente: 100%; perdente: 0%.

## Totale del gruppo (sanity esclusa)

Ply: 399; inclusi: 332; esclusi: 67.
Corrispondenza esatta: 52.40963855421687%; entro una classe: 87.65060240963855%.

| Categoria attesa | Totale | Inclusi | Esatti |
|---|---|---|---|
| Migliore | 122 | 122 | 105 |
| Ottima | 74 | 74 | 25 |
| Buona | 68 | 68 | 20 |
| Imprecisione | 33 | 33 | 13 |
| Errore | 27 | 27 | 5 |
| Errore grave | 8 | 8 | 6 |
| Libro | 39 | 0 | 0 |
| Geniale | 1 | 0 | 0 |
| Grande | 14 | 0 | 0 |
| Mossa mancata | 10 | 0 | 0 |
| Non valutabile | 0 | 0 | 0 |
| Forzata | 3 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-01: BUMCestinait0 vs boyjonbum, 2026.10.01

Ply: 51; inclusi: 40; esclusi unici: 11.
Corrispondenza esatta: 57.5%; entro una classe: 97.5%.

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
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | d5 | Libro | Ottima | 2.8005929546392307 | -45 | -28 | N/D | -73 | N/D | book |
| 3 | exd5 | Libro | Ottima | 1.6114057807368742 | -26 | 86 | N/D | 60 | N/D | book |
| 4 | Qxd5 | Libro | Migliore | 0.6831760492515104 | -11 | -58 | N/D | -69 | N/D | book |
| 5 | Nc3 | Libro | Migliore | 0.3100160321469758 | -5 | 74 | N/D | 69 | N/D | book |
| 6 | Qd8 | Libro | Migliore | 0.30987597252160604 | -5 | -71 | N/D | -76 | N/D | book |
| 7 | d4 | Libro | Migliore | 0.3098759725216227 | -5 | 76 | N/D | 71 | N/D | book |
| 8 | e6 | Ottima | Migliore | 0.12387856521825502 | -2 | -75 | N/D | -77 | N/D |  |
| 9 | Nf3 | Ottima | Migliore | 0.18561402060084387 | -3 | 82 | N/D | 79 | N/D |  |
| 10 | Bb4 | Buona | Ottima | 1.2345941234862046 | -20 | -79 | N/D | -99 | N/D |  |
| 11 | Bd2 | Ottima | Migliore | 0.8010137941604434 | -13 | 102 | N/D | 89 | N/D |  |
| 12 | Bxc3 | Buona | Ottima | 1.410328070635386 | -23 | -99 | N/D | -122 | N/D |  |
| 13 | Bxc3 | Migliore | Migliore | 0.9806225008629821 | -16 | 120 | N/D | 104 | N/D |  |
| 14 | Nf6 | Migliore | Migliore | 0 | 2 | -103 | N/D | -101 | N/D |  |
| 15 | h3 | Buona | Ottima | 2.5922042703897086 | -42 | 110 | N/D | 68 | N/D |  |
| 16 | O-O | Ottima | Migliore | 0.8681224027568601 | -14 | -64 | N/D | -78 | N/D |  |
| 17 | Bd3 | Migliore | Migliore | 0.6204981314422597 | -10 | 73 | N/D | 63 | N/D |  |
| 18 | h6 | Imprecisione | Buona | 4.183170145429016 | -68 | -65 | N/D | -133 | N/D |  |
| 19 | O-O | Buona | Buona | 4.225864387145995 | -69 | 147 | N/D | 78 | N/D |  |
| 20 | b6 | Ottima | Migliore | 0.49502914312359314 | -8 | -76 | N/D | -84 | N/D |  |
| 21 | Re1 | Ottima | Migliore | 0.061824023162526665 | -1 | 84 | N/D | 83 | N/D |  |
| 22 | Bb7 | Migliore | Migliore | 0 | 3 | -81 | N/D | -78 | N/D |  |
| 23 | a4 | Ottima | Ottima | 2.110721754277023 | -34 | 82 | N/D | 48 | N/D |  |
| 24 | Qd5 | Buona | Buona | 4.268672103724164 | -69 | -44 | N/D | -113 | N/D |  |
| 25 | Bb4 | Buona | Migliore | 0.9859984662609067 | -16 | 103 | N/D | 87 | N/D |  |
| 26 | Re8 | Migliore | Migliore | 0 | 3 | -87 | N/D | -84 | N/D |  |
| 27 | c4 | Ottima | Ottima | 1.178528375758392 | -19 | 79 | N/D | 60 | N/D |  |
| 28 | Qd8 | Imprecisione | Buona | 4.979384549558535 | -81 | -60 | N/D | -141 | N/D |  |
| 29 | Qd2 | Errore | Errore | 12.945661233898193 | -209 | 151 | N/D | -58 | N/D |  |
| 30 | Nh5 | Mossa mancata | Errore | 11.03837566084051 | -178 | 40 | N/D | -138 | N/D | unsupported |
| 31 | g4 | Errore | Imprecisione | 9.870420261571578 | -159 | 127 | N/D | -32 | N/D |  |
| 32 | Bxf3 | Migliore | Migliore | 0.06249938151472456 | -1 | -2 | N/D | -3 | N/D |  |
| 33 | gxh5 | Imprecisione | Imprecisione | 8.516716240344934 | -138 | -12 | N/D | -150 | N/D |  |
| 34 | Qxd4 | Errore grave | Errore grave | 38.606608478201984 | -685 | 157 | N/D | -528 | N/D |  |
| 35 | Bc3 | Mossa mancata | Errore grave | 29.20785167252805 | -535 | 535 | N/D | 0 | N/D | unsupported |
| 36 | Qd8 | Imprecisione | Buona | 3.991488455556574 | -64 | 0 | N/D | -64 | N/D |  |
| 37 | Qe3 | Ottima | Ottima | 1.8701027946289028 | -30 | 55 | N/D | 25 | N/D |  |
| 38 | Bxh5 | Buona | Buona | 3.175225231042705 | -51 | -22 | N/D | -73 | N/D |  |
| 39 | Be4 | Migliore | Migliore | 0 | 0 | 73 | N/D | 73 | N/D |  |
| 40 | Nd7 | Ottima | Ottima | 1.234250357332023 | -20 | -80 | N/D | -100 | N/D |  |
| 41 | Bxa8 | Migliore | Migliore | 0.2467221893541427 | -4 | 94 | N/D | 90 | N/D |  |
| 42 | Qxa8 | Migliore | Migliore | 0 | 18 | -83 | N/D | -65 | N/D |  |
| 43 | Qg3 | Migliore | Migliore | 0.061961093883422524 | -1 | 75 | N/D | 74 | N/D |  |
| 44 | g5 | Errore | Imprecisione | 7.377608461587792 | -121 | -61 | N/D | -182 | N/D |  |
| 45 | Qxc7 | Grande | Migliore | 0.46706678844706806 | -8 | 214 | N/D | 206 | N/D | unsupported |
| 46 | Nf8 | Errore | Errore grave | 24.677335605684096 | -562 | -204 | N/D | -766 | N/D |  |
| 47 | Qe5 | Grande | Migliore | 0 | 240 | 729 | N/D | 969 | N/D | unsupported |
| 48 | f6 | Migliore | Migliore | 0 | 213 | -929 | N/D | -716 | N/D |  |
| 49 | Qxf6 | Migliore | Migliore | 0 | 0 | 911 | N/D | 911 | N/D |  |
| 50 | Nd7 | Errore | Imprecisione | 7.585818002124355 | N/D | -1036 | N/D | N/D | -1 |  |
| 51 | Qg7# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 6 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 1 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 0 | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-02: BUMCestinait0 vs skui1, 2026.10.03

Ply: 75; inclusi: 64; esclusi unici: 11.
Corrispondenza esatta: 42.1875%; entro una classe: 90.625%.

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
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | c5 | Libro | Migliore | 0.6239296460171351 | -10 | -28 | N/D | -38 | N/D | book |
| 3 | d4 | Libro | Ottima | 1.9357265776787536 | -31 | 38 | N/D | 7 | N/D | book |
| 4 | cxd4 | Libro | Migliore | 0.9373901521660788 | -15 | 0 | N/D | -15 | N/D | book |
| 5 | Qxd4 | Libro | Migliore | 0.7499566439013616 | -12 | 11 | N/D | -1 | N/D | book |
| 6 | Na6 | Imprecisione | Imprecisione | 7.442854888130862 | -120 | -1 | N/D | -121 | N/D |  |
| 7 | Qd1 | Buona | Imprecisione | 5.502420716044476 | -89 | 124 | N/D | 35 | N/D |  |
| 8 | Nf6 | Ottima | Migliore | 0 | 11 | -66 | N/D | -55 | N/D |  |
| 9 | Nc3 | Migliore | Migliore | 0.1863234067281394 | -3 | 65 | N/D | 62 | N/D |  |
| 10 | e5 | Migliore | Migliore | 0 | 2 | -62 | N/D | -60 | N/D |  |
| 11 | Nf3 | Buona | Ottima | 1.9295614178626574 | -31 | 66 | N/D | 35 | N/D |  |
| 12 | Bb4 | Migliore | Migliore | 0.6857302979838165 | -11 | -35 | N/D | -46 | N/D |  |
| 13 | Nxe5 | Ottima | Migliore | 0.4366368612625404 | -7 | 39 | N/D | 32 | N/D |  |
| 14 | O-O | Ottima | Migliore | 0.18727839811089608 | -3 | -26 | N/D | -29 | N/D |  |
| 15 | Bd2 | Buona | Buona | 3.8730374757630024 | -62 | 33 | N/D | -29 | N/D |  |
| 16 | d6 | Buona | Imprecisione | 7.351371336377061 | -118 | 29 | N/D | -89 | N/D |  |
| 17 | Nxf7 | Errore grave | Errore grave | 22.250421189535835 | -366 | 99 | N/D | -267 | N/D |  |
| 18 | Rxf7 | Migliore | Ottima | 1.3197209008842359 | -23 | 247 | N/D | 224 | N/D |  |
| 19 | Bc4 | Migliore | Migliore | 0 | 2 | -224 | N/D | -222 | N/D |  |
| 20 | Kf8 | Errore grave | Errore | 18.345381989713548 | -301 | 245 | N/D | -56 | N/D |  |
| 21 | Bxf7 | Grande | Migliore | 0.4348378161247779 | -7 | 66 | N/D | 59 | N/D | unsupported |
| 22 | Kxf7 | Migliore | Migliore | 0 | 8 | -68 | N/D | -60 | N/D |  |
| 23 | a3 | Migliore | Migliore | 0 | 5 | 65 | N/D | 70 | N/D |  |
| 24 | Bc5 | Migliore | Migliore | 0.1857956598520505 | -3 | -75 | N/D | -78 | N/D |  |
| 25 | O-O | Buona | Ottima | 2.9874259983707185 | -48 | 74 | N/D | 26 | N/D |  |
| 26 | Bg4 | Migliore | Ottima | 1.3721334322770007 | -22 | -25 | N/D | -47 | N/D |  |
| 27 | Qe1 | Migliore | Migliore | 0.37386617211677686 | -6 | 47 | N/D | 41 | N/D |  |
| 28 | Qe8 | Buona | Buona | 3.039226837614084 | -49 | -44 | N/D | -93 | N/D |  |
| 29 | b4 | Imprecisione | Imprecisione | 6.408853761696632 | -103 | 96 | N/D | -7 | N/D |  |
| 30 | Bxf2+ | Errore grave | Errore grave | 27.988562900072576 | -506 | 0 | N/D | -506 | N/D |  |
| 31 | Rxf2 | Grande | Ottima | 1.39169709671918 | -34 | 556 | N/D | 522 | N/D | unsupported |
| 32 | b5 | Imprecisione | Ottima | 2.5201706090077796 | -63 | -523 | N/D | -586 | N/D |  |
| 33 | h3 | Buona | Ottima | 1.8722434779268604 | -49 | 609 | N/D | 560 | N/D |  |
| 34 | Bh5 | Buona | Ottima | 1.6746363501884383 | -44 | -565 | N/D | -609 | N/D |  |
| 35 | g4 | Ottima | Ottima | 2.013224691529425 | -52 | 602 | N/D | 550 | N/D |  |
| 36 | Bg6 | Errore | Ottima | 1.1605053275372952 | -31 | -582 | N/D | -613 | N/D |  |
| 37 | Rd1 | Buona | Imprecisione | 6.73182341732238 | -167 | 633 | N/D | 466 | N/D |  |
| 38 | d5 | Buona | Buona | 3.9296384627309027 | -96 | -491 | N/D | -587 | N/D |  |
| 39 | Nxd5 | Ottima | Migliore | 0.9176956813712223 | -24 | 596 | N/D | 572 | N/D |  |
| 40 | Kf8 | Imprecisione | Buona | 4.388558841554735 | -125 | -575 | N/D | -700 | N/D |  |
| 41 | Nxf6 | Migliore | Ottima | 2.128347806730757 | -65 | 711 | N/D | 646 | N/D |  |
| 42 | gxf6 | Migliore | Ottima | 1.0751339389008352 | -31 | -629 | N/D | -660 | N/D |  |
| 43 | Rxf6+ | Ottima | Ottima | 1.6726637519787424 | -51 | 703 | N/D | 652 | N/D |  |
| 44 | Kg7 | Migliore | Ottima | 1.0930618776947343 | -35 | -688 | N/D | -723 | N/D |  |
| 45 | Rxa6 | Ottima | Ottima | 2.2511513019345064 | -72 | 741 | N/D | 669 | N/D |  |
| 46 | Bxe4 | Imprecisione | Imprecisione | 6.965246145102534 | -285 | -699 | N/D | -984 | N/D |  |
| 47 | Bc3+ | Buona | Ottima | 2.5371513287882563 | -119 | 966 | N/D | 847 | N/D |  |
| 48 | Kf8 | Imprecisione | Buona | 3.1549333180321075 | -1546 | -847 | N/D | -2393 | N/D |  |
| 49 | Qf2+ | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 9 |  |
| 50 | Qf7 | Migliore | Migliore | 0 | N/D | N/D | -9 | N/D | -8 |  |
| 51 | Qxf7+ | Mossa mancata | Errore | 14.307272348008071 | N/D | N/D | 8 | 716 | N/D | unsupported |
| 52 | Kxf7 | Forzata | Buona | 4.902045170439369 | -182 | -697 | N/D | -879 | N/D | forced |
| 53 | Rf1+ | Ottima | Migliore | 0 | 1 | 870 | N/D | 871 | N/D |  |
| 54 | Ke7 | Errore | Migliore | 0.38689068300014756 | -20 | -943 | N/D | -963 | N/D |  |
| 55 | Rf4 | Buona | Imprecisione | 5.89829643253994 | -241 | 960 | N/D | 719 | N/D |  |
| 56 | Bxc2 | Migliore | Migliore | 0.618513838890461 | -20 | -701 | N/D | -721 | N/D |  |
| 57 | Rh6 | Ottima | Buona | 3.9375628794544038 | -115 | 710 | N/D | 595 | N/D |  |
| 58 | Rc8 | Migliore | Ottima | 1.2497069396843559 | -34 | -592 | N/D | -626 | N/D |  |
| 59 | Bf6+ | Buona | Ottima | 1.2648520228196847 | -35 | 637 | N/D | 602 | N/D |  |
| 60 | Kf7 | Imprecisione | Ottima | 1.6848083476529858 | -47 | -601 | N/D | -648 | N/D |  |
| 61 | Bg5+ | Buona | Ottima | 1.4362479042946297 | -41 | 659 | N/D | 618 | N/D |  |
| 62 | Kg7 | Buona | Ottima | 1.046528731544258 | -30 | -626 | N/D | -656 | N/D |  |
| 63 | Ra6 | Migliore | Ottima | 1.1449749128047082 | -34 | 679 | N/D | 645 | N/D |  |
| 64 | h6 | Errore | Buona | 3.3716010622408517 | -113 | -675 | N/D | -788 | N/D |  |
| 65 | Rxa7+ | Ottima | Migliore | 0 | 12 | 798 | N/D | 810 | N/D |  |
| 66 | Kg6 | Errore | Imprecisione | 5.089240010089726 | -422 | -772 | N/D | -1194 | N/D |  |
| 67 | Bh4 | Migliore | Migliore | 0 | 2665 | 1373 | N/D | 4038 | N/D |  |
| 68 | Rc3 | Imprecisione | Migliore | 0 | N/D | N/D | -9 | N/D | -1 |  |
| 69 | Ra6+ | Mossa mancata | Errore | 11.634569909472336 | N/D | N/D | 1 | 811 | N/D | unsupported |
| 70 | Kg7 | Buona | Ottima | 2.971848384996896 | -140 | -839 | N/D | -979 | N/D |  |
| 71 | Rd4 | Imprecisione | Imprecisione | 9.458353237842354 | -713 | 1346 | N/D | 633 | N/D |  |
| 72 | Rxh3 | Errore | Errore | 16.903245511688773 | N/D | -637 | N/D | N/D | -2 |  |
| 73 | Rd7+ | Grande | Migliore | 0 | N/D | N/D | 2 | N/D | 1 | unsupported |
| 74 | Kf8 | Migliore | Migliore | 0 | N/D | N/D | -1 | N/D | -1 |  |
| 75 | Ra8# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Imprecisione | 1 | 2 | 2 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 0 | 9 | 3 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 6 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 14 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 |
| Errore | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-03: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 136; inclusi: 125; esclusi unici: 11.
Corrispondenza esatta: 53.6%; entro una classe: 87.2%.

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
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | d5 | Libro | Ottima | 2.8005929546392307 | -45 | -28 | N/D | -73 | N/D | book |
| 3 | exd5 | Libro | Ottima | 1.6114057807368742 | -26 | 86 | N/D | 60 | N/D | book |
| 4 | e5 | Libro | Buona | 3.397240515004057 | -55 | -58 | N/D | -113 | N/D | book |
| 5 | Nc3 | Buona | Ottima | 2.948068884897803 | -48 | 129 | N/D | 81 | N/D |  |
| 6 | f5 | Errore | Imprecisione | 5.59058804772069 | -92 | -86 | N/D | -178 | N/D |  |
| 7 | d3 | Imprecisione | Buona | 4.364153240663404 | -72 | 175 | N/D | 103 | N/D |  |
| 8 | Nf6 | Ottima | Migliore | 0.4924165523864543 | -8 | -95 | N/D | -103 | N/D |  |
| 9 | Bg5 | Imprecisione | Buona | 4.028948329969662 | -65 | 103 | N/D | 38 | N/D |  |
| 10 | h6 | Ottima | Ottima | 1.0600034167250416 | -17 | -30 | N/D | -47 | N/D |  |
| 11 | Bxf6 | Migliore | Migliore | 0 | 19 | 45 | N/D | 64 | N/D |  |
| 12 | Qxf6 | Migliore | Migliore | 0 | 14 | -68 | N/D | -54 | N/D |  |
| 13 | Nf3 | Ottima | Ottima | 1.4327623017579838 | -23 | 57 | N/D | 34 | N/D |  |
| 14 | Bd6 | Migliore | Ottima | 1.1839407399830526 | -19 | -34 | N/D | -53 | N/D |  |
| 15 | Nb5 | Ottima | Migliore | 0.3113056341533138 | -5 | 52 | N/D | 47 | N/D |  |
| 16 | f4 | Imprecisione | Buona | 4.6382154491191425 | -75 | -42 | N/D | -117 | N/D |  |
| 17 | b3 | Imprecisione | Imprecisione | 6.4470665799594595 | -104 | 118 | N/D | 14 | N/D |  |
| 18 | a6 | Imprecisione | Buona | 3.922220706147356 | -63 | -15 | N/D | -78 | N/D |  |
| 19 | Nxd6+ | Grande | Migliore | 0 | 0 | 77 | N/D | 77 | N/D | unsupported |
| 20 | Qxd6 | Migliore | Ottima | 1.6031005583003854 | -26 | -80 | N/D | -106 | N/D |  |
| 21 | c4 | Buona | Ottima | 2.8435157551732093 | -46 | 106 | N/D | 60 | N/D |  |
| 22 | Nd7 | Imprecisione | Imprecisione | 5.169026076956612 | -84 | -55 | N/D | -139 | N/D |  |
| 23 | g3 | Buona | Buona | 4.746568245455496 | -77 | 130 | N/D | 53 | N/D |  |
| 24 | g5 | Buona | Ottima | 2.450296800734497 | -40 | -93 | N/D | -133 | N/D |  |
| 25 | Qe2 | Buona | Migliore | 0.790597155456152 | -13 | 139 | N/D | 126 | N/D |  |
| 26 | Qc5 | Errore | Errore | 10.183540517326872 | -174 | -114 | N/D | -288 | N/D |  |
| 27 | Nxe5 | Mossa mancata | Errore | 12.421185838324067 | -211 | 294 | N/D | 83 | N/D | unsupported |
| 28 | Nxe5 | Mossa mancata | Errore | 13.036182164307808 | -223 | -88 | N/D | -311 | N/D | unsupported |
| 29 | Qxe5+ | Migliore | Migliore | 0.9698290411932153 | -18 | 321 | N/D | 303 | N/D |  |
| 30 | Qe7 | Buona | Ottima | 2.0542660449486663 | -39 | -316 | N/D | -355 | N/D |  |
| 31 | Qxe7+ | Buona | Ottima | 1.3413155763270401 | -26 | 369 | N/D | 343 | N/D |  |
| 32 | Kxe7 | Forzata | Migliore | 0.052364218870532 | -1 | -341 | N/D | -342 | N/D | forced |
| 33 | O-O-O | Buona | Buona | 4.10070005937383 | -76 | 348 | N/D | 272 | N/D |  |
| 34 | Kf6 | Buona | Buona | 3.5092120360288357 | -65 | -277 | N/D | -342 | N/D |  |
| 35 | gxf4 | Ottima | Ottima | 2.3593514253994696 | -44 | 339 | N/D | 295 | N/D |  |
| 36 | Bg4 | Ottima | Migliore | 0 | 6 | -327 | N/D | -321 | N/D |  |
| 37 | Re1 | Migliore | Migliore | 0 | 7 | 326 | N/D | 333 | N/D |  |
| 38 | gxf4 | Migliore | Migliore | 0.737861350737018 | -14 | -328 | N/D | -342 | N/D |  |
| 39 | Rg1 | Migliore | Migliore | 0.15469273021262442 | -3 | 358 | N/D | 355 | N/D |  |
| 40 | Rhg8 | Ottima | Ottima | 1.4008679243233735 | -27 | -337 | N/D | -364 | N/D |  |
| 41 | Re6+ | Errore grave | Errore grave | 48.73088108571745 | -856 | 371 | N/D | -485 | N/D |  |
| 42 | Bxe6 | Grande | Migliore | 0.5769906340823971 | -13 | 488 | N/D | 475 | N/D | unsupported |
| 43 | dxe6 | Errore | Imprecisione | 9.05913456367762 | -254 | -502 | N/D | -756 | N/D |  |
| 44 | Kxe6 | Mossa mancata | Errore grave | 20.112227344436107 | -477 | 756 | N/D | 279 | N/D | unsupported |
| 45 | Rxg8 | Imprecisione | Imprecisione | 6.48596331831488 | -125 | -287 | N/D | -412 | N/D |  |
| 46 | Rxg8 | Migliore | Migliore | 0.14600501299285584 | -3 | 410 | N/D | 407 | N/D |  |
| 47 | Be2 | Ottima | Ottima | 2.7131703964045792 | -58 | -412 | N/D | -470 | N/D |  |
| 48 | Rg1+ | Ottima | Ottima | 2.490110502791343 | -55 | 494 | N/D | 439 | N/D |  |
| 49 | Kd2 | Migliore | Migliore | 0.741953340858717 | -16 | -440 | N/D | -456 | N/D |  |
| 50 | Rg2 | Ottima | Migliore | 0.09239122271688105 | -2 | 452 | N/D | 450 | N/D |  |
| 51 | f3 | Buona | Buona | 4.476318703041351 | -100 | -425 | N/D | -525 | N/D |  |
| 52 | Rxh2 | Ottima | Migliore | 0.3751532608996411 | -9 | 531 | N/D | 522 | N/D |  |
| 53 | a4 | Imprecisione | Migliore | 0.7055558877705592 | -17 | -521 | N/D | -538 | N/D |  |
| 54 | Kd6 | Buona | Buona | 3.66824713201942 | -87 | 562 | N/D | 475 | N/D |  |
| 55 | Ke1 | Imprecisione | Buona | 3.673220654141332 | -90 | -496 | N/D | -586 | N/D |  |
| 56 | Kc5 | Ottima | Migliore | 0 | 0 | 578 | N/D | 578 | N/D |  |
| 57 | Kd2 | Buona | Migliore | 0.5713230257904406 | -15 | -579 | N/D | -594 | N/D |  |
| 58 | Kb4 | Buona | Ottima | 2.2323584224323567 | -57 | 597 | N/D | 540 | N/D |  |
| 59 | Ke1 | Buona | Ottima | 2.5612577636439564 | -65 | -532 | N/D | -597 | N/D |  |
| 60 | Kxb3 | Ottima | Ottima | 1.2687268789155492 | -33 | 597 | N/D | 564 | N/D |  |
| 61 | c5 | Ottima | Buona | 3.0784103636907534 | -80 | -540 | N/D | -620 | N/D |  |
| 62 | Kxa4 | Ottima | Ottima | 1.879266965981996 | -50 | 620 | N/D | 570 | N/D |  |
| 63 | d4 | Migliore | Migliore | 0.9656212262525637 | -25 | -565 | N/D | -590 | N/D |  |
| 64 | Kb4 | Ottima | Migliore | 0 | 19 | 592 | N/D | 611 | N/D |  |
| 65 | Kd2 | Buona | Migliore | 0 | 13 | -634 | N/D | -621 | N/D |  |
| 66 | c6 | Migliore | Ottima | 1.7781017024161239 | -52 | 679 | N/D | 627 | N/D |  |
| 67 | Kd3 | Migliore | Migliore | 0.173401615624022 | -5 | -642 | N/D | -647 | N/D |  |
| 68 | h5 | Migliore | Buona | 3.3008253214313 | -89 | 648 | N/D | 559 | N/D |  |
| 69 | Bd1 | Ottima | Ottima | 1.2334258494200196 | -33 | -582 | N/D | -615 | N/D |  |
| 70 | Rf2 | Ottima | Ottima | 1.011044996272481 | -28 | 634 | N/D | 606 | N/D |  |
| 71 | Ke4 | Ottima | Ottima | 2.4954643964565397 | -72 | -609 | N/D | -681 | N/D |  |
| 72 | h4 | Migliore | Buona | 3.7528759997627503 | -105 | 679 | N/D | 574 | N/D |  |
| 73 | Kxf4 | Ottima | Migliore | 0.6049395572985505 | -19 | -685 | N/D | -704 | N/D |  |
| 74 | h3 | Ottima | Ottima | 2.955197457729941 | -90 | 722 | N/D | 632 | N/D |  |
| 75 | Kg3 | Migliore | Ottima | 2.463025162499238 | -74 | -632 | N/D | -706 | N/D |  |
| 76 | h2 | Ottima | Buona | 3.6299415481573782 | -111 | 735 | N/D | 624 | N/D |  |
| 77 | Kxf2 | Migliore | Migliore | 0.6394169313833131 | -18 | -621 | N/D | -639 | N/D |  |
| 78 | h1=Q | Migliore | Migliore | 0.8177101735610925 | -23 | 641 | N/D | 618 | N/D |  |
| 79 | Ke3 | Errore | Ottima | 1.1387837493544466 | -33 | -631 | N/D | -664 | N/D |  |
| 80 | Qxd1 | Buona | Migliore | 0 | 242 | 792 | N/D | 1034 | N/D |  |
| 81 | f4 | Buona | Migliore | 0 | -2615 | -1062 | N/D | -3677 | N/D |  |
| 82 | Qe1+ | Ottima | Buona | 3.4705133095060847 | -2843 | 3677 | N/D | 834 | N/D |  |
| 83 | Kf3 | Migliore | Migliore | 0 | -42 | -1038 | N/D | -1080 | N/D |  |
| 84 | Qd1+ | Ottima | Migliore | 0 | 0 | 1079 | N/D | 1079 | N/D |  |
| 85 | Ke4 | Ottima | Migliore | 0 | -159 | -1084 | N/D | -1243 | N/D |  |
| 86 | Qc2+ | Buona | Imprecisione | 8.457614979408213 | -598 | 1260 | N/D | 662 | N/D |  |
| 87 | Kf3 | Imprecisione | Imprecisione | 7.860708506229118 | -619 | -680 | N/D | -1299 | N/D |  |
| 88 | Qd3+ | Buona | Migliore | 0 | -2434 | 3723 | N/D | 1289 | N/D |  |
| 89 | Kg4 | Buona | Migliore | 0 | 0 | -3729 | N/D | -3729 | N/D |  |
| 90 | Qxd4 | Migliore | Migliore | 0 | 0 | 3737 | N/D | 3737 | N/D |  |
| 91 | Kg5 | Migliore | Migliore | 0 | 0 | -3737 | N/D | -3737 | N/D |  |
| 92 | Qxc5+ | Migliore | Migliore | 0 | 41 | 3737 | N/D | 3778 | N/D |  |
| 93 | f5 | Ottima | Migliore | 0 | 0 | -3777 | N/D | -3777 | N/D |  |
| 94 | Qg1+ | Mossa mancata | Migliore | 0 | -129 | 3777 | N/D | 3648 | N/D | unsupported |
| 95 | Kf6 | Imprecisione | Migliore | 0 | -81 | -3648 | N/D | -3729 | N/D |  |
| 96 | Qf2 | Ottima | Migliore | 0 | -81 | 3729 | N/D | 3648 | N/D |  |
| 97 | Ke5 | Imprecisione | Migliore | 0 | -79 | -3650 | N/D | -3729 | N/D |  |
| 98 | a5 | Migliore | Migliore | 0 | 11 | 3718 | N/D | 3729 | N/D |  |
| 99 | f6 | Migliore | Migliore | 0 | 11 | -3729 | N/D | -3718 | N/D |  |
| 100 | a4 | Migliore | Migliore | 0 | -8 | 3718 | N/D | 3710 | N/D |  |
| 101 | Ke6 | Migliore | Migliore | 0 | -60 | -4354 | N/D | -4414 | N/D |  |
| 102 | a3 | Migliore | Migliore | 0 | 38 | 4414 | N/D | 4452 | N/D |  |
| 103 | f7 | Migliore | Migliore | 0 | N/D | N/D | -10 | N/D | -10 |  |
| 104 | a2 | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 9 |  |
| 105 | Ke7 | Migliore | Migliore | 0 | N/D | N/D | -9 | N/D | -9 |  |
| 106 | a1=Q | Migliore | Migliore | 0 | N/D | N/D | 5 | N/D | 4 |  |
| 107 | f8=Q | Migliore | Migliore | 0 | N/D | N/D | -4 | N/D | -4 |  |
| 108 | Qxf8+ | Buona | Imprecisione | 7.585818002124345 | N/D | N/D | 4 | 4290 | N/D |  |
| 109 | Kxf8 | Migliore | Migliore | 0 | -52 | -4290 | N/D | -4342 | N/D |  |
| 110 | Qe1 | Migliore | Migliore | 0 | -89 | 4366 | N/D | 4277 | N/D |  |
| 111 | Kf7 | Migliore | Migliore | 0 | 0 | -4360 | N/D | -4360 | N/D |  |
| 112 | Ka3 | Ottima | Migliore | 0 | -37 | 4362 | N/D | 4325 | N/D |  |
| 113 | Kf6 | Migliore | Migliore | 0 | -44 | -4319 | N/D | -4363 | N/D |  |
| 114 | c5 | Migliore | Migliore | 0 | -36 | 4363 | N/D | 4327 | N/D |  |
| 115 | Kf5 | Ottima | Imprecisione | 7.585818002124355 | N/D | -4326 | N/D | N/D | -14 |  |
| 116 | c4 | Migliore | Migliore | 0 | N/D | N/D | 13 | N/D | 13 |  |
| 117 | Kf4 | Migliore | Migliore | 0 | N/D | N/D | -13 | N/D | -10 |  |
| 118 | c3 | Migliore | Migliore | 0 | N/D | N/D | 10 | N/D | 8 |  |
| 119 | Kf3 | Migliore | Migliore | 0 | N/D | N/D | -8 | N/D | -6 |  |
| 120 | c2 | Migliore | Migliore | 0 | N/D | N/D | 6 | N/D | 5 |  |
| 121 | Kg2 | Ottima | Migliore | 0 | N/D | N/D | -5 | N/D | -3 |  |
| 122 | c1=Q | Ottima | Migliore | 0 | N/D | N/D | 3 | N/D | 3 |  |
| 123 | Kh2 | Ottima | Migliore | 0 | N/D | N/D | -3 | N/D | -2 |  |
| 124 | b5 | Ottima | Migliore | 0 | N/D | N/D | 2 | N/D | 2 |  |
| 125 | Kg2 | Migliore | Migliore | 0 | N/D | N/D | -2 | N/D | -2 |  |
| 126 | b4 | Buona | Migliore | 0 | N/D | N/D | 2 | N/D | 3 |  |
| 127 | Kf3 | Migliore | Migliore | 0 | N/D | N/D | -3 | N/D | -3 |  |
| 128 | b3 | Ottima | Migliore | 0 | N/D | N/D | 3 | N/D | 3 |  |
| 129 | Kg2 | Ottima | Migliore | 0 | N/D | N/D | -3 | N/D | -2 |  |
| 130 | b2 | Buona | Migliore | 0 | N/D | N/D | 2 | N/D | 3 |  |
| 131 | Kf3 | Migliore | Migliore | 0 | N/D | N/D | -3 | N/D | -3 |  |
| 132 | b1=Q | Migliore | Migliore | 0 | N/D | N/D | 3 | N/D | 2 |  |
| 133 | Kg2 | Migliore | Migliore | 0 | N/D | N/D | -2 | N/D | -2 |  |
| 134 | Qec3 | Migliore | Migliore | 0 | N/D | N/D | 2 | N/D | 1 |  |
| 135 | Kf2 | Migliore | Migliore | 0 | N/D | N/D | -1 | N/D | -1 |  |
| 136 | Qbc2# | Migliore | Migliore | 0 | N/D | N/D | 1 | N/D | 0 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Buona | 9 | 7 | 5 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 1 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 3 | 0 | 5 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 19 | 12 | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 44 | 4 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-04: ProprioI0 vs BUMCestinait0, 2026.10.04

Ply: 55; inclusi: 46; esclusi unici: 9.
Corrispondenza esatta: 50%; entro una classe: 71.73913043478261%.

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
| 1 | d4 | Libro | Migliore | 0.6241138248585965 | -10 | 35 | N/D | 25 | N/D | book |
| 2 | c6 | Libro | Ottima | 2.0583787469369397 | -33 | -18 | N/D | -51 | N/D | book |
| 3 | c4 | Libro | Migliore | 0.8726836798297666 | -14 | 48 | N/D | 34 | N/D | book |
| 4 | d5 | Libro | Migliore | 0.3743608913264862 | -6 | -30 | N/D | -36 | N/D | book |
| 5 | Nf3 | Libro | Migliore | 0.9986539306845788 | -16 | 37 | N/D | 21 | N/D | book |
| 6 | dxc4 | Libro | Ottima | 2.306463404955139 | -37 | -21 | N/D | -58 | N/D | book |
| 7 | g3 | Ottima | Ottima | 2.4944278278248966 | -40 | 56 | N/D | 16 | N/D |  |
| 8 | Bf5 | Buona | Ottima | 2.929513901839409 | -47 | -16 | N/D | -63 | N/D |  |
| 9 | Bf4 | Buona | Buona | 3.5509751537632805 | -57 | 71 | N/D | 14 | N/D |  |
| 10 | e6 | Migliore | Migliore | 0 | 0 | -18 | N/D | -18 | N/D |  |
| 11 | Bg2 | Migliore | Migliore | 0 | 10 | 11 | N/D | 21 | N/D |  |
| 12 | Bd6 | Ottima | Ottima | 2.2480717557220253 | -36 | -3 | N/D | -39 | N/D |  |
| 13 | Bxd6 | Migliore | Ottima | 1.3661529618509194 | -22 | 75 | N/D | 53 | N/D |  |
| 14 | Qxd6 | Migliore | Migliore | 0 | 0 | -55 | N/D | -55 | N/D |  |
| 15 | Ng5 | Imprecisione | Imprecisione | 7.85832187081637 | -126 | 57 | N/D | -69 | N/D |  |
| 16 | Ne7 | Ottima | Migliore | 0.06214390421095395 | -1 | 61 | N/D | 60 | N/D |  |
| 17 | e4 | Buona | Ottima | 1.6727950721355578 | -27 | -61 | N/D | -88 | N/D |  |
| 18 | Bg6 | Migliore | Migliore | 0.7401547173597867 | -12 | 98 | N/D | 86 | N/D |  |
| 19 | O-O | Migliore | Migliore | 0.43170009466038106 | -7 | -89 | N/D | -96 | N/D |  |
| 20 | h6 | Ottima | Migliore | 0.6158931663638123 | -10 | 102 | N/D | 92 | N/D |  |
| 21 | e5 | Errore | Buona | 3.290197298033598 | -54 | -100 | N/D | -154 | N/D |  |
| 22 | Qb4 | Grande | Ottima | 2.979615360952159 | -51 | 234 | N/D | 183 | N/D | unsupported |
| 23 | Nd2 | Imprecisione | Errore | 10.301650413435931 | -184 | -172 | N/D | -356 | N/D |  |
| 24 | hxg5 | Migliore | Migliore | 0.3023277613802611 | -6 | 381 | N/D | 375 | N/D |  |
| 25 | a3 | Migliore | Migliore | 0 | 2 | -364 | N/D | -362 | N/D |  |
| 26 | Qxb2 | Buona | Imprecisione | 5.480321451639525 | -103 | 376 | N/D | 273 | N/D |  |
| 27 | Nxc4 | Migliore | Migliore | 0.05517013196281728 | -1 | -285 | N/D | -286 | N/D |  |
| 28 | Qb5 | Errore grave | Errore grave | 45.785428863200686 | -806 | 290 | N/D | -516 | N/D |  |
| 29 | Nd6+ | Grande | Migliore | 0 | 38 | 471 | N/D | 509 | N/D | unsupported |
| 30 | Kf8 | Migliore | Ottima | 2.3157780778769563 | -56 | -504 | N/D | -560 | N/D |  |
| 31 | Nxb5 | Migliore | Migliore | 0 | 3 | 563 | N/D | 566 | N/D |  |
| 32 | cxb5 | Errore | Migliore | 0.11766611164637508 | -3 | -566 | N/D | -569 | N/D |  |
| 33 | Bxb7 | Migliore | Migliore | 0.4307849888318005 | -11 | 574 | N/D | 563 | N/D |  |
| 34 | Nbc6 | Migliore | Migliore | 0.3865430593721991 | -10 | -572 | N/D | -582 | N/D |  |
| 35 | Bxa8 | Migliore | Migliore | 0 | 17 | 574 | N/D | 591 | N/D |  |
| 36 | Nb8 | Buona | Buona | 3.5346919294197114 | -105 | -610 | N/D | -715 | N/D |  |
| 37 | Qb3 | Ottima | Ottima | 1.925788467609757 | -60 | 720 | N/D | 660 | N/D |  |
| 38 | Nf5 | Errore | Buona | 3.0076189038630714 | -96 | -656 | N/D | -752 | N/D |  |
| 39 | Qxb5 | Migliore | Migliore | 0.693756333797102 | -25 | 783 | N/D | 758 | N/D |  |
| 40 | Nxd4 | Errore | Buona | 4.101855311872928 | -186 | -798 | N/D | -984 | N/D |  |
| 41 | Qxb8+ | Migliore | Migliore | 0 | 26 | 1107 | N/D | 1133 | N/D |  |
| 42 | Ke7 | Forzata | Migliore | 0 | -175 | -1472 | N/D | -1647 | N/D | forced |
| 43 | Qxh8 | Buona | Migliore | 0 | -784 | 1818 | N/D | 1034 | N/D |  |
| 44 | Ne2+ | Imprecisione | Migliore | 0 | -91 | -1107 | N/D | -1198 | N/D |  |
| 45 | Kg2 | Buona | Migliore | 0 | 13 | 1217 | N/D | 1230 | N/D |  |
| 46 | Be4+ | Imprecisione | Imprecisione | 7.585818002124355 | N/D | -1510 | N/D | N/D | -5 |  |
| 47 | f3 | Ottima | Imprecisione | 8.647147583877224 | N/D | N/D | 5 | 943 | N/D |  |
| 48 | Nd4 | Errore | Migliore | 0.1950479483440598 | -287 | -989 | N/D | -1276 | N/D |  |
| 49 | Bxe4 | Buona | Imprecisione | 7.585818002124345 | N/D | N/D | 9 | 1741 | N/D |  |
| 50 | Ne2 | Errore | Migliore | 0 | N/D | N/D | -6 | N/D | -3 |  |
| 51 | Qxg7 | Buona | Imprecisione | 7.585818002124345 | N/D | N/D | 3 | 1444 | N/D |  |
| 52 | Nc3 | Ottima | Imprecisione | 7.585818002124355 | N/D | -1668 | N/D | N/D | -6 |  |
| 53 | Qxg5+ | Buona | Migliore | 0 | N/D | N/D | 6 | N/D | 8 |  |
| 54 | Kd7 | Errore | Migliore | 0 | N/D | N/D | -8 | N/D | -6 |  |
| 55 | Rac1 | Migliore | Migliore | 0 | N/D | N/D | 5 | N/D | 7 |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 2 | 3 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 3 | 2 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 15 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 1 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 4 | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-05: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 37; inclusi: 24; esclusi unici: 13.
Corrispondenza esatta: 50%; entro una classe: 91.66666666666667%.

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
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | e5 | Libro | Migliore | 0.6862851101817502 | -11 | -28 | N/D | -39 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0.18706619898509746 | -3 | 40 | N/D | 37 | N/D | book |
| 4 | Nc6 | Libro | Migliore | 0.8106034252805261 | -13 | -32 | N/D | -45 | N/D | book |
| 5 | Bb5 | Libro | Migliore | 0.06233210474508866 | -1 | 42 | N/D | 41 | N/D | book |
| 6 | Nf6 | Libro | Migliore | 0 | 15 | -40 | N/D | -25 | N/D | book |
| 7 | d4 | Libro | Ottima | 1.2496049486073302 | -20 | 23 | N/D | 3 | N/D | book |
| 8 | Nxe4 | Libro | Ottima | 2.8107042476334607 | -45 | 7 | N/D | -38 | N/D | book |
| 9 | dxe5 | Migliore | Migliore | 0 | 3 | 36 | N/D | 39 | N/D |  |
| 10 | Bc5 | Buona | Ottima | 2.2394067581779975 | -36 | -36 | N/D | -72 | N/D |  |
| 11 | Bxc6 | Errore | Errore | 11.862974701569968 | -191 | 64 | N/D | -127 | N/D |  |
| 12 | Nxf2 | Mossa mancata | Errore | 11.490148269192874 | -185 | 127 | N/D | -58 | N/D | unsupported |
| 13 | Bxd7+ | Errore | Errore grave | 20.51418464400313 | -338 | 70 | N/D | -268 | N/D |  |
| 14 | Qxd7 | Mossa mancata | Imprecisione | 8.837158333240403 | -149 | 254 | N/D | 105 | N/D | unsupported |
| 15 | Qe2 | Errore grave | Errore | 17.197455818920215 | -309 | -110 | N/D | -419 | N/D |  |
| 16 | Nxh1 | Grande | Migliore | 0 | 1 | 393 | N/D | 394 | N/D | unsupported |
| 17 | Qc4 | Imprecisione | Imprecisione | 8.972664082082996 | -208 | -398 | N/D | -606 | N/D |  |
| 18 | b6 | Buona | Buona | 4.058670154207222 | -101 | 602 | N/D | 501 | N/D |  |
| 19 | Ng5 | Imprecisione | Buona | 4.1677329592690215 | -106 | -513 | N/D | -619 | N/D |  |
| 20 | O-O | Migliore | Migliore | 0.9852445202599758 | -27 | 627 | N/D | 600 | N/D |  |
| 21 | Nc3 | Ottima | Migliore | 0.4325916541537661 | -12 | -615 | N/D | -627 | N/D |  |
| 22 | Qe7 | Imprecisione | Imprecisione | 8.318534436851388 | -199 | 624 | N/D | 425 | N/D |  |
| 23 | Qe4 | Buona | Migliore | 0.23727890343778757 | -5 | -427 | N/D | -432 | N/D |  |
| 24 | Qxg5 | Errore grave | Errore grave | 45.04845547242078 | -787 | 490 | N/D | -297 | N/D |  |
| 25 | Bxg5 | Migliore | Migliore | 0.8490734874926242 | -16 | 336 | N/D | 320 | N/D |  |
| 26 | Nf2 | Errore | Buona | 4.082212316063993 | -81 | -337 | N/D | -418 | N/D |  |
| 27 | Qxa8 | Grande | Migliore | 0 | 49 | 395 | N/D | 444 | N/D | unsupported |
| 28 | Re8 | Ottima | Buona | 3.231821078799002 | -72 | -437 | N/D | -509 | N/D |  |
| 29 | Bf4 | Migliore | Ottima | 1.2715104409704026 | -29 | 505 | N/D | 476 | N/D |  |
| 30 | g5 | Ottima | Ottima | 2.893700976930755 | -68 | -478 | N/D | -546 | N/D |  |
| 31 | Bxg5 | Ottima | Ottima | 1.2791477275460483 | -31 | 549 | N/D | 518 | N/D |  |
| 32 | Rxe5+ | Ottima | Migliore | 0 | 17 | -537 | N/D | -520 | N/D |  |
| 33 | Kd2 | Ottima | Migliore | 0 | 22 | 519 | N/D | 541 | N/D |  |
| 34 | Re8 | Buona | Ottima | 2.3194107179733163 | -60 | -547 | N/D | -607 | N/D |  |
| 35 | Re1 | Migliore | Migliore | 0.9005151426823232 | -25 | 634 | N/D | 609 | N/D |  |
| 36 | Kf8 | Errore | Errore | 18.429726028236704 | N/D | -595 | N/D | N/D | -3 |  |
| 37 | Bh6+ | Grande | Migliore | 0 | N/D | N/D | 3 | N/D | 2 | unsupported |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Migliore | 4 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 1 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 1 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 |
| Errore grave | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Ottima | 3 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Motore: Stockfish 16; depth 12; MultiPV 5.

## personal-06: BUMCestinait0 vs ProprioI0, 2026.10.04

Ply: 45; inclusi: 33; esclusi unici: 12.
Corrispondenza esatta: 66.66666666666667%; entro una classe: 90.9090909090909%.

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
| 1 | e4 | Libro | Migliore | 0.37439889284200945 | -6 | 35 | N/D | 29 | N/D | book |
| 2 | e5 | Libro | Migliore | 0.6862851101817502 | -11 | -28 | N/D | -39 | N/D | book |
| 3 | Nf3 | Libro | Migliore | 0.18706619898509746 | -3 | 40 | N/D | 37 | N/D | book |
| 4 | Nf6 | Libro | Migliore | 0.997471160899005 | -16 | -32 | N/D | -48 | N/D | book |
| 5 | Nc3 | Libro | Ottima | 1.996734852412485 | -32 | 47 | N/D | 15 | N/D | book |
| 6 | Nc6 | Libro | Migliore | 0.3748992380455063 | -6 | -10 | N/D | -16 | N/D | book |
| 7 | g3 | Libro | Ottima | 2.3120797489174114 | -37 | 17 | N/D | -20 | N/D | book |
| 8 | Bc5 | Libro | Migliore | 0.9372437173678749 | -15 | 20 | N/D | 5 | N/D | book |
| 9 | Bg2 | Libro | Migliore | 0.24994323807299157 | -4 | -10 | N/D | -14 | N/D | book |
| 10 | O-O | Ottima | Migliore | 0.9374428761607323 | -15 | 12 | N/D | -3 | N/D |  |
| 11 | Nxe5 | Geniale | Buona | 3.3084364584743287 | -53 | 50 | N/D | -3 | N/D | unsupported |
| 12 | Nxe5 | Migliore | Migliore | 0 | 0 | 3 | N/D | 3 | N/D |  |
| 13 | d4 | Grande | Migliore | 0 | 19 | -9 | N/D | 10 | N/D | unsupported |
| 14 | Bxd4 | Buona | Buona | 4.41700016294575 | -71 | -15 | N/D | -86 | N/D |  |
| 15 | Qxd4 | Migliore | Migliore | 0 | 18 | 72 | N/D | 90 | N/D |  |
| 16 | d6 | Migliore | Migliore | 0.06168946763022709 | -1 | -91 | N/D | -92 | N/D |  |
| 17 | O-O | Ottima | Buona | 3.2885385241794407 | -53 | 93 | N/D | 40 | N/D |  |
| 18 | Bg4 | Errore | Imprecisione | 8.728838198279515 | -143 | -45 | N/D | -188 | N/D |  |
| 19 | f3 | Buona | Buona | 3.6541865445885113 | -61 | 195 | N/D | 134 | N/D |  |
| 20 | Bh5 | Buona | Buona | 4.183102026722979 | -70 | -134 | N/D | -204 | N/D |  |
| 21 | g4 | Migliore | Migliore | 0.3509713826936989 | -6 | 210 | N/D | 204 | N/D |  |
| 22 | Bg6 | Migliore | Migliore | 0 | 0 | -204 | N/D | -204 | N/D |  |
| 23 | Bg5 | Migliore | Migliore | 0 | 3 | 204 | N/D | 207 | N/D |  |
| 24 | h6 | Migliore | Ottima | 1.2302807816210182 | -21 | -194 | N/D | -215 | N/D |  |
| 25 | Bh4 | Migliore | Migliore | 0 | 6 | 217 | N/D | 223 | N/D |  |
| 26 | c5 | Buona | Migliore | 0.17394716860318904 | -3 | -219 | N/D | -222 | N/D |  |
| 27 | Qf2 | Migliore | Migliore | 0 | 7 | 229 | N/D | 236 | N/D |  |
| 28 | b5 | Buona | Buona | 3.982339373238136 | -72 | -246 | N/D | -318 | N/D |  |
| 29 | a4 | Imprecisione | Buona | 3.9053391015175465 | -71 | 324 | N/D | 253 | N/D |  |
| 30 | b4 | Buona | Buona | 3.687215485000567 | -66 | -237 | N/D | -303 | N/D |  |
| 31 | Nd5 | Grande | Migliore | 0.26751355846942326 | -5 | 322 | N/D | 317 | N/D | unsupported |
| 32 | Qd7 | Buona | Errore | 13.473312802367706 | -298 | -317 | N/D | -615 | N/D |  |
| 33 | Bxf6 | Migliore | Migliore | 0.4919062928971485 | -12 | 544 | N/D | 532 | N/D |  |
| 34 | gxf6 | Errore | Buona | 4.999833461452449 | -145 | -576 | N/D | -721 | N/D |  |
| 35 | Nxf6+ | Migliore | Migliore | 0.8506627014663426 | -27 | 714 | N/D | 687 | N/D |  |
| 36 | Kg7 | Migliore | Migliore | 0 | 14 | -656 | N/D | -642 | N/D |  |
| 37 | Nxd7 | Migliore | Migliore | 0 | 18 | 638 | N/D | 656 | N/D |  |
| 38 | Nxd7 | Migliore | Migliore | 0.16822624985685375 | -5 | -660 | N/D | -665 | N/D |  |
| 39 | Qg3 | Ottima | Migliore | 0.9177308046428467 | -27 | 670 | N/D | 643 | N/D |  |
| 40 | Ne5 | Migliore | Migliore | 0.7446183171644694 | -22 | -648 | N/D | -670 | N/D |  |
| 41 | f4 | Ottima | Migliore | 0.429988613468657 | -13 | 679 | N/D | 666 | N/D |  |
| 42 | Nc4 | Ottima | Migliore | 0.4978455094129919 | -15 | -663 | N/D | -678 | N/D |  |
| 43 | Rfd1 | Ottima | Ottima | 1.6696375792639273 | -50 | 692 | N/D | 642 | N/D |  |
| 44 | h5 | Buona | Buona | 3.487451635654895 | -111 | -647 | N/D | -758 | N/D |  |
| 45 | gxh5 | Migliore | Migliore | 0 | 7 | 758 | N/D | 765 | N/D |  |

Matrice di confusione (attesa × ottenuta):

| Attesa | Migliore | Ottima | Buona | Imprecisione | Errore | Errore grave | Libro | Geniale | Grande | Mossa mancata | Non valutabile |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ottima | 4 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Migliore | 15 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Buona | 1 | 0 | 6 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| Errore | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Imprecisione | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
