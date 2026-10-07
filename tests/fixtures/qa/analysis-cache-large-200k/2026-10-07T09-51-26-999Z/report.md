# 2.2b — Stockfish 19 large-single, 200.000 nodi

Esperimento offline; nessuna adozione di default. MultiPV 5, Threads 1, Hash 16 MB. Processo nuovo per partita; ucinewgame e Clear Hash prima di ogni ricerca. Due ricerche per ply, nessun riuso della posizione successiva. Score grezzi dalla prospettiva side-to-move; score classificati normalizzati a chi muove.

Baseline: cache originali Stockfish 16, depth 12. Differiscono motore, budget e storia hash: il confronto non isola una sola causa. Soglie 1/3/5/10/20, modello, Libro, cap e Mossa mancata invariati.

QA: esclusioni attuali Libro, Forzata, Grande/Geniale, etichette sospette e score mancanti. Mossa mancata entra in esatta ma non nella scala ordinale. Le righe Libro sono mostrate con la categoria protetta dell’app; il vecchio helper QA le mostra numericamente pur escludendole dalle metriche. Non modificato.

| Gruppo/schema | Esatta | % | Entro una classe | % |
|---|---:|---:|---:|---:|
| personal baseline | 174/342 | 50.88% | 300/332 | 90.36% |
| personal large 200k | 178/342 | 52.05% | 296/332 | 89.16% |
| historical baseline | 80/161 | 49.69% | 137/161 | 85.09% |
| historical large 200k | 77/161 | 47.83% | 139/161 | 86.34% |
| all baseline | 254/503 | 50.50% | 437/493 | 88.64% |
| all large 200k | 255/503 | 50.70% | 435/493 | 88.24% |

| Partita | Ply | go | Secondi ricerca | Secondi sessione | Mediana s/go | P90 s/go | Cambi categorie |
|---|---:|---:|---:|---:|---:|---:|---:|
| personal-01 | 51 | 102 | 70.653 | 72.489 | 0.697 | 0.757 | 11 |
| personal-02 | 75 | 150 | 93.776 | 95.922 | 0.646 | 0.741 | 26 |
| personal-03 | 136 | 272 | 122.325 | 125.730 | 0.476 | 0.705 | 52 |
| personal-04 | 55 | 110 | 70.878 | 72.622 | 0.666 | 0.750 | 18 |
| personal-05 | 37 | 74 | 50.702 | 52.079 | 0.693 | 0.755 | 9 |
| personal-06 | 45 | 90 | 63.585 | 65.123 | 0.706 | 0.764 | 13 |
| game-1-chigorin-steinitz-1892 | 61 | 122 | 80.796 | 82.684 | 0.658 | 0.735 | 17 |
| game-2-saintamant-staunton-1843 | 132 | 264 | 160.610 | 163.899 | 0.644 | 0.697 | 32 |

go totali: 1184; tempo totale: 731.072 s. Integrità input/cache/src verificata con SHA-256.

## Tutti i ply che cambiano categoria

| Partita | ply | SAN | Attesa | Vecchia | Nuova | best vecchio cp/mate | played vecchio cp/mate | perdita vecchia pp | best nuovo cp/mate | played nuovo cp/mate | perdita nuova pp | Esclusioni vecchie/nuove |
|---|---:|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| personal-01 | 9 | Nf3 | Ottima | Migliore | Ottima | 82 | 82 | 0 | 84 | 81 | 0.1855198234797517 |  /  |
| personal-01 | 24 | Qd5 | Buona | Buona | Ottima | -44 | -113 | 4.268672103724164 | -66 | -109 | 2.654987992313196 |  /  |
| personal-01 | 26 | Re8 | Migliore | Ottima | Migliore | -87 | -89 | 0.12349955569406212 | -102 | -102 | 0 |  /  |
| personal-01 | 28 | Qd8 | Imprecisione | Buona | Ottima | -60 | -134 | 4.554560885744996 | -93 | -131 | 2.328639156865936 |  /  |
| personal-01 | 31 | g4 | Errore | Imprecisione | Errore | 127 | -32 | 9.870420261571578 | 191 | -73 | 16.26561498657542 |  /  |
| personal-01 | 33 | gxh5 | Imprecisione | Buona | Ottima | -12 | -85 | 4.542655058228551 | -112 | -136 | 1.4644298996178362 |  /  |
| personal-01 | 36 | Qd8 | Imprecisione | Buona | Errore | 0 | -50 | 3.120937337375623 | 122 | -60 | 11.309419638629898 |  /  |
| personal-01 | 37 | Qe3 | Ottima | Migliore | Ottima | 55 | 55 | 0 | 60 | 35 | 1.556879137214806 |  /  |
| personal-01 | 38 | Bxh5 | Buona | Buona | Ottima | -22 | -73 | 3.175225231042705 | -35 | -70 | 2.177763326547727 |  /  |
| personal-01 | 40 | Nd7 | Ottima | Ottima | Buona | -80 | -99 | 1.1727073023717671 | -53 | -127 | 4.563824009402934 |  /  |
| personal-01 | 50 | Nd7 | Errore | Imprecisione | Buona | -1036 | mate -1 | 6.978478287658009 | -1219 | mate -1 | 4.532552841468334 |  /  |
| personal-02 | 13 | Nxe5 | Ottima | Migliore | Ottima | 39 | 39 | 0 | 24 | 7 | 1.062061326963648 |  /  |
| personal-02 | 14 | O-O | Ottima | Migliore | Ottima | -26 | -26 | 0 | -7 | -31 | 1.4990419880158479 |  /  |
| personal-02 | 15 | Bd2 | Buona | Buona | Imprecisione | 33 | -29 | 3.8730374757630024 | 58 | -29 | 5.430368527497614 |  /  |
| personal-02 | 17 | Nxf7 | Errore grave | Errore | Errore grave | 99 | -178 | 17.10108539645207 | 61 | -320 | 22.80257655134716 |  /  |
| personal-02 | 20 | Kf8 | Errore grave | Errore | Errore grave | 245 | -56 | 18.345381989713548 | 305 | -76 | 22.925388273268265 |  /  |
| personal-02 | 24 | Bc5 | Migliore | Ottima | Migliore | -75 | -75 | 0 | -70 | -70 | 0 |  /  |
| personal-02 | 25 | O-O | Buona | Buona | Ottima | 74 | 14 | 3.7369434165539284 | 87 | 53 | 2.1085030397543947 |  /  |
| personal-02 | 32 | b5 | Imprecisione | Ottima | Buona | -523 | -586 | 2.5201706090077796 | -751 | -909 | 3.92500402523933 |  /  |
| personal-02 | 37 | Rd1 | Buona | Imprecisione | Buona | 633 | 466 | 6.73182341732238 | 856 | 688 | 4.6601774134149565 |  /  |
| personal-02 | 41 | Nxf6 | Migliore | Ottima | Migliore | 711 | 686 | 0.7904208830087689 | 947 | 947 | 0 |  /  |
| personal-02 | 43 | Rxf6+ | Ottima | Ottima | Migliore | 703 | 696 | 0.22092108272722122 | 991 | 991 | 0 |  /  |
| personal-02 | 44 | Kg7 | Migliore | Migliore | Ottima | -688 | -688 | 0 | -917 | -965 | 0.9521553513743647 |  /  |
| personal-02 | 45 | Rxa6 | Ottima | Migliore | Ottima | 741 | 741 | 0 | 965 | 964 | 0.018885614991270838 |  /  |
| personal-02 | 46 | Bxe4 | Imprecisione | Imprecisione | Ottima | -699 | -984 | 6.965246145102534 | -975 | -1066 | 1.5286979294181964 |  /  |
| personal-02 | 49 | Qf2+ | Migliore | Migliore | Ottima | mate 10 | mate 10 | 0 | 1994 | 1466 | 1.8171650795029026 |  /  |
| personal-02 | 50 | Qf7 | Migliore | Migliore | Ottima | mate -9 | mate -9 | 0 | mate -6 | mate -6 | 0 |  /  |
| personal-02 | 51 | Qxf7+ | Mossa mancata | Errore | Imprecisione | mate 8 | 718 | 14.246080221548796 | mate 13 | 925 | 9.00929939619518 |  /  |
| personal-02 | 53 | Rf1+ | Ottima | Migliore | Ottima | 870 | 870 | 0 | 879 | 910 | 0 |  /  |
| personal-02 | 55 | Rf4 | Buona | Imprecisione | Ottima | 960 | 719 | 5.89829643253994 | 921 | 861 | 1.3181714917770981 |  /  |
| personal-02 | 57 | Rh6 | Ottima | Buona | Ottima | 710 | 595 | 3.9375628794544038 | 848 | 797 | 1.2824555100458657 |  /  |
| personal-02 | 62 | Kg7 | Buona | Ottima | Migliore | -626 | -671 | 1.5503555944732321 | -841 | -841 | 0 |  /  |
| personal-02 | 63 | Ra6 | Migliore | Ottima | Migliore | 679 | 640 | 1.3189553286480193 | 858 | 858 | 0 |  /  |
| personal-02 | 64 | h6 | Errore | Buona | Ottima | -675 | -788 | 3.3716010622408517 | -836 | -905 | 1.5795893517400807 |  /  |
| personal-02 | 66 | Kg6 | Errore | Buona | Ottima | -772 | -938 | 3.9286559641770302 | -925 | -1097 | 2.9581371813826545 |  /  |
| personal-02 | 69 | Ra6+ | Mossa mancata | Errore | Imprecisione | mate 1 | 811 | 11.634569909472336 | mate 1 | 1149 | 5.3529849527566675 |  /  |
| personal-02 | 71 | Rd4 | Imprecisione | Errore | Imprecisione | 1346 | 626 | 13.95229605086069 | 1174 | 822 | 6.30978725510607 |  /  |
| personal-03 | 7 | d3 | Imprecisione | Buona | Imprecisione | 175 | 103 | 4.364153240663404 | 233 | 121 | 6.658890464577549 |  /  |
| personal-03 | 10 | h6 | Ottima | Migliore | Ottima | -30 | -30 | 0 | -53 | -47 | 0 |  /  |
| personal-03 | 16 | f4 | Imprecisione | Buona | Imprecisione | -42 | -117 | 4.6382154491191425 | -29 | -153 | 7.635886570505873 |  /  |
| personal-03 | 21 | c4 | Buona | Buona | Imprecisione | 106 | 51 | 3.4033113479257415 | 166 | 70 | 5.864748965155176 |  /  |
| personal-03 | 22 | Nd7 | Imprecisione | Imprecisione | Buona | -55 | -139 | 5.169026076956612 | -70 | -149 | 4.842424092774045 |  /  |
| personal-03 | 23 | g3 | Buona | Buona | Ottima | 130 | 53 | 4.746568245455496 | 149 | 101 | 2.927118802617401 |  /  |
| personal-03 | 24 | g5 | Buona | Ottima | Migliore | -93 | -133 | 2.450296800734497 | -101 | -101 | 0 |  /  |
| personal-03 | 28 | Nxe5 | Mossa mancata | Errore | Errore grave | -88 | -321 | 13.572976612035593 | -122 | -516 | 20.848283813493605 |  /  |
| personal-03 | 30 | Qe7 | Buona | Buona | Ottima | -316 | -381 | 3.3786339601818316 | -497 | -516 | 0.8148313530170065 |  /  |
| personal-03 | 35 | gxf4 | Ottima | Ottima | Migliore | 339 | 328 | 0.580610749444388 | 459 | 459 | 0 |  /  |
| personal-03 | 36 | Bg4 | Ottima | Migliore | Ottima | -327 | -327 | 0 | -455 | -500 | 2.0079520820651204 |  /  |
| personal-03 | 38 | gxf4 | Migliore | Ottima | Migliore | -328 | -347 | 0.998889375627654 | -468 | -468 | 0 |  /  |
| personal-03 | 40 | Rhg8 | Ottima | Ottima | Migliore | -337 | -364 | 1.4008679243233735 | -485 | -485 | 0 |  /  |
| personal-03 | 44 | Kxe6 | Mossa mancata | Errore grave | Errore | 756 | 279 | 20.112227344436107 | 836 | 379 | 16.93152956266263 |  /  |
| personal-03 | 47 | Be2 | Ottima | Ottima | Buona | -412 | -470 | 2.7131703964045792 | -490 | -613 | 4.9429540239139955 |  /  |
| personal-03 | 48 | Rg1+ | Ottima | Ottima | Buona | 494 | 430 | 2.914587878852559 | 613 | 533 | 3.1117936210472097 |  /  |
| personal-03 | 53 | a4 | Imprecisione | Ottima | Imprecisione | -521 | -550 | 1.1931349454768536 | -550 | -709 | 5.658151730256112 |  /  |
| personal-03 | 54 | Kd6 | Buona | Ottima | Buona | 562 | 502 | 2.4811929481453388 | 709 | 616 | 3.1303569821299004 |  /  |
| personal-03 | 55 | Ke1 | Imprecisione | Buona | Imprecisione | -496 | -586 | 3.673220654141332 | -576 | -734 | 5.390164095997124 |  /  |
| personal-03 | 56 | Kc5 | Ottima | Ottima | Migliore | 578 | 569 | 0.3497697770051933 | 734 | 734 | 0 |  /  |
| personal-03 | 57 | Kd2 | Buona | Ottima | Migliore | -579 | -583 | 0.15366251263045638 | -710 | -710 | 0 |  /  |
| personal-03 | 58 | Kb4 | Buona | Ottima | Buona | 597 | 540 | 2.2323584224323567 | 751 | 649 | 3.2184085465220225 |  /  |
| personal-03 | 61 | c5 | Ottima | Buona | Ottima | -540 | -618 | 3.0060774712018343 | -749 | -772 | 0.6502136505920797 |  /  |
| personal-03 | 63 | d4 | Migliore | Ottima | Migliore | -565 | -595 | 1.1542779881667131 | -763 | -763 | 0 |  /  |
| personal-03 | 64 | Kb4 | Ottima | Migliore | Ottima | 592 | 592 | 0 | 744 | 699 | 1.3659746669532513 |  /  |
| personal-03 | 68 | h5 | Migliore | Buona | Ottima | 648 | 559 | 3.3008253214313 | 824 | 789 | 0.9074785528169205 |  /  |
| personal-03 | 69 | Bd1 | Ottima | Migliore | Ottima | -582 | -582 | 0 | -790 | -833 | 1.1043450525822494 |  /  |
| personal-03 | 72 | h4 | Migliore | Ottima | Migliore | 679 | 623 | 1.9213611898633798 | 911 | 911 | 0 |  /  |
| personal-03 | 73 | Kxf4 | Ottima | Ottima | Migliore | -685 | -711 | 0.8227627343161764 | -937 | -937 | 0 |  /  |
| personal-03 | 74 | h3 | Ottima | Buona | Migliore | 722 | 613 | 3.6384692919046446 | 919 | 919 | 0 |  /  |
| personal-03 | 76 | h2 | Ottima | Ottima | Migliore | 735 | 657 | 2.4777942615784476 | 932 | 932 | 0 |  /  |
| personal-03 | 79 | Ke3 | Errore | Migliore | Ottima | -631 | -631 | 0 | -941 | -1024 | 1.510972189779236 |  /  |
| personal-03 | 81 | f4 | Buona | Migliore | Ottima | -1062 | -1062 | 0 | -1040 | -1013 | 0 |  /  |
| personal-03 | 82 | Qe1+ | Ottima | Errore | Ottima | 3677 | 838 | 10.948195572229292 | 1013 | 1003 | 0.1723088073058543 |  /  |
| personal-03 | 85 | Ke4 | Ottima | Migliore | Ottima | -1084 | -1084 | 0 | -1011 | -1151 | 2.067558126519903 |  /  |
| personal-03 | 86 | Qc2+ | Buona | Errore | Ottima | 1260 | 662 | 11.934305161486058 | 1151 | 1000 | 2.258108774793832 |  /  |
| personal-03 | 87 | Kf3 | Imprecisione | Errore | Ottima | -680 | -1243 | 11.166631986004314 | -1000 | -1015 | 0.25874322297707447 |  /  |
| personal-03 | 88 | Qd3+ | Buona | Migliore | Ottima | 3723 | 3723 | 0 | 1015 | 996 | 0.32914495603393323 |  /  |
| personal-03 | 91 | Kg5 | Migliore | Migliore | Buona | -3737 | -3737 | 0 | -1086 | -1380 | 3.1325161891160733 |  /  |
| personal-03 | 92 | Qxc5+ | Migliore | Ottima | Buona | 3737 | 3737 | 0 | 1063 | 899 | 3.003707502011843 |  /  |
| personal-03 | 93 | f5 | Ottima | Ottima | Migliore | -3777 | -3777 | 0 | -899 | -899 | 0 |  /  |
| personal-03 | 95 | Kf6 | Imprecisione | Ottima | Migliore | -3648 | -3729 | 0.002006053276894335 | -884 | -884 | 0 |  /  |
| personal-03 | 98 | a5 | Migliore | Migliore | Ottima | 3718 | 3718 | 0 | 911 | 1257 | 0 |  /  |
| personal-03 | 99 | f6 | Migliore | Migliore | Ottima | -3729 | -3729 | 0 | -1257 | -1284 | 0.25966838745257115 |  /  |
| personal-03 | 100 | a4 | Migliore | Ottima | Migliore | 3718 | 3718 | 0 | mate 8 | mate 8 | 0 |  /  |
| personal-03 | 101 | Ke6 | Migliore | Ottima | Migliore | -4354 | -4401 | 0.0002077122266286194 | mate -7 | mate -7 | 0 |  /  |
| personal-03 | 102 | a3 | Migliore | Migliore | Ottima | 4414 | 4414 | 0 | 1434 | 1196 | 2.0891582386421192 |  /  |
| personal-03 | 103 | f7 | Migliore | Ottima | Migliore | mate -10 | mate -10 | 0 | mate -6 | mate -6 | 0 |  /  |
| personal-03 | 104 | a2 | Migliore | Migliore | Ottima | mate 10 | mate 10 | 0 | mate 8 | 1472 | 2.460242840273952 |  /  |
| personal-03 | 108 | Qxf8+ | Buona | Ottima | Imprecisione | mate 4 | 3732 | 0.008871436615898176 | mate 4 | 1087 | 6.1948584658503725 |  /  |
| personal-03 | 114 | c5 | Migliore | Ottima | Buona | 4363 | 4342 | 0.00009874747638471959 | 9165 | 1373 | 3.1295054080222595 |  /  |
| personal-03 | 132 | b1=Q | Migliore | Migliore | Ottima | mate 3 | mate 3 | 0 | mate 3 | mate 3 | 0 |  /  |
| personal-04 | 8 | Bf5 | Buona | Ottima | Buona | -16 | -63 | 2.929513901839409 | -19 | -71 | 3.2386090661620406 |  /  |
| personal-04 | 9 | Bf4 | Buona | Buona | Ottima | 71 | 14 | 3.5509751537632805 | 71 | 28 | 2.6766000751483388 |  /  |
| personal-04 | 10 | e6 | Migliore | Migliore | Ottima | -18 | -18 | 0 | -30 | -36 | 0.3743608913264862 |  /  |
| personal-04 | 11 | Bg2 | Migliore | Ottima | Migliore | 11 | 7 | 0.2499678414760731 | 27 | 27 | 0 |  /  |
| personal-04 | 21 | e5 | Errore | Ottima | Errore | -100 | -138 | 2.322806824366702 | -105 | -280 | 10.293702460106624 |  /  |
| personal-04 | 25 | a3 | Migliore | Migliore | Ottima | -364 | -364 | 0 | -601 | -619 | 0.6605314488145025 |  /  |
| personal-04 | 26 | Qxb2 | Buona | Buona | Imprecisione | 376 | 302 | 3.8832460717735384 | 620 | 460 | 6.5402814886849185 |  /  |
| personal-04 | 30 | Kf8 | Migliore | Ottima | Buona | -504 | -571 | 2.7485380137355215 | -715 | -828 | 3.1332465807663037 |  /  |
| personal-04 | 34 | Nbc6 | Migliore | Migliore | Ottima | -572 | -572 | 0 | -786 | -840 | 1.3830129637244546 |  /  |
| personal-04 | 36 | Nb8 | Buona | Buona | Ottima | -610 | -715 | 3.5346919294197114 | -827 | -905 | 1.8019330305621541 |  /  |
| personal-04 | 38 | Nf5 | Errore | Buona | Ottima | -656 | -752 | 3.0076189038630714 | -901 | -1012 | 2.1352391479181665 |  /  |
| personal-04 | 40 | Nxd4 | Errore | Buona | Imprecisione | -798 | -984 | 4.101855311872928 | -991 | -1451 | 5.155642052719185 |  /  |
| personal-04 | 43 | Qxh8 | Buona | Buona | Ottima | 1818 | 1138 | 4.443177990130131 | 1923 | 1419 | 1.98884361702919 |  /  |
| personal-04 | 47 | f3 | Ottima | Imprecisione | Ottima | mate 5 | 1130 | 5.598807906182168 | 1684 | 1403 | 1.4470406572615668 |  /  |
| personal-04 | 48 | Nd4 | Errore | Buona | Ottima | -989 | -1230 | 3.365831894631952 | -1444 | mate -7 | 2.633931962528339 |  /  |
| personal-04 | 49 | Bxe4 | Buona | Buona | Migliore | mate 9 | 1217 | 4.554237656394788 | mate 7 | mate 7 | 0 |  /  |
| personal-04 | 52 | Nc3 | Ottima | Migliore | Ottima | -1668 | -1668 | 0 | mate -5 | mate -4 | 0 |  /  |
| personal-04 | 54 | Kd7 | Errore | Ottima | Migliore | mate -8 | mate -6 | 0 | mate -5 | mate -5 | 0 |  /  |
| personal-05 | 10 | Bc5 | Buona | Ottima | Buona | -36 | -72 | 2.2394067581779975 | -28 | -82 | 3.357841164095227 |  /  |
| personal-05 | 14 | Qxd7 | Mossa mancata | Imprecisione | Errore | 254 | 110 | 8.530234742125586 | 345 | 123 | 12.69077887265433 |  /  |
| personal-05 | 15 | Qe2 | Errore grave | Errore | Errore grave | -110 | -384 | 15.480182164614176 | -123 | -648 | 25.852020731612 |  /  |
| personal-05 | 18 | b6 | Buona | Imprecisione | Ottima | 602 | 473 | 5.292201201417523 | 831 | 748 | 2.223870938495809 |  /  |
| personal-05 | 20 | O-O | Migliore | Ottima | Migliore | 627 | 597 | 1.0973708972867091 | 842 | 842 | 0 |  /  |
| personal-05 | 21 | Nc3 | Ottima | Migliore | Ottima | -615 | -615 | 0 | -856 | -875 | 0.439076679245326 |  /  |
| personal-05 | 28 | Re8 | Ottima | Buona | Ottima | -437 | -509 | 3.231821078799002 | -623 | -633 | 0.35639610785622167 |  /  |
| personal-05 | 33 | Kd2 | Ottima | Ottima | Migliore | 519 | 503 | 0.6818489969260821 | 686 | 686 | 0 |  /  |
| personal-05 | 34 | Re8 | Buona | Ottima | Buona | -547 | -607 | 2.3194107179733163 | -675 | -801 | 3.7164209605242777 |  /  |
| personal-06 | 10 | O-O | Ottima | Ottima | Buona | 12 | -14 | 1.62485444308606 | 24 | -26 | 3.123978268148242 |  /  |
| personal-06 | 14 | Bxd4 | Buona | Imprecisione | Buona | -15 | -113 | 6.078512386017448 | -13 | -77 | 3.985265273053551 |  /  |
| personal-06 | 20 | Bh5 | Buona | Buona | Imprecisione | -134 | -204 | 4.183102026722979 | -140 | -244 | 6.132322316332023 |  /  |
| personal-06 | 21 | g4 | Migliore | Migliore | Ottima | 210 | 210 | 0 | 244 | 225 | 1.0910007600267169 |  /  |
| personal-06 | 22 | Bg6 | Migliore | Ottima | Migliore | -204 | -204 | 0 | -225 | -225 | 0 |  /  |
| personal-06 | 24 | h6 | Migliore | Ottima | Migliore | -194 | -210 | 0.9388333495175871 | -263 | -263 | 0 |  /  |
| personal-06 | 26 | c5 | Buona | Ottima | Imprecisione | -219 | -221 | 0.11600377423833796 | -224 | -372 | 8.062274521140617 |  /  |
| personal-06 | 28 | b5 | Buona | Buona | Imprecisione | -246 | -318 | 3.982339373238136 | -349 | -466 | 5.697442383632981 |  /  |
| personal-06 | 29 | a4 | Imprecisione | Buona | Ottima | 324 | 265 | 3.2287749329730664 | 466 | 426 | 1.8595161670847071 |  /  |
| personal-06 | 30 | b4 | Buona | Buona | Ottima | -237 | -298 | 3.414969358599451 | -426 | -432 | 0.28490915814000095 |  /  |
| personal-06 | 38 | Nxd7 | Migliore | Migliore | Ottima | -660 | -660 | 0 | -936 | -938 | 0.039989434893075715 |  /  |
| personal-06 | 39 | Qg3 | Ottima | Ottima | Migliore | 670 | 643 | 0.9177308046428467 | 956 | 956 | 0 |  /  |
| personal-06 | 44 | h5 | Buona | Buona | Ottima | -647 | -758 | 3.487451635654895 | -902 | -1050 | 2.737235577830334 |  /  |
| game-1-chigorin-steinitz-1892 | 15 | Bb5 | Ottima | Migliore | Buona | -43 | -43 | 0 | -7 | -86 | 4.916901480134489 |  /  |
| game-1-chigorin-steinitz-1892 | 16 | exd4 | Imprecisione | Ottima | Buona | 64 | 24 | 2.49193829361557 | 86 | 35 | 3.1682849179516803 |  /  |
| game-1-chigorin-steinitz-1892 | 20 | Nce7 | Errore | Imprecisione | Buona | 16 | -80 | 5.983266419244337 | 7 | -64 | 4.4289772905339255 |  /  |
| game-1-chigorin-steinitz-1892 | 26 | Bb6 | Migliore | Ottima | Migliore | -111 | -127 | 0.9781653090587428 | -107 | -107 | 0 |  /  |
| game-1-chigorin-steinitz-1892 | 29 | e5 | Migliore | Ottima | Buona | 117 | 82 | 2.153679455591817 | 176 | 111 | 3.932582137696794 |  /  |
| game-1-chigorin-steinitz-1892 | 33 | Ba3 | Migliore | Migliore | Ottima | 237 | 237 | 0 | 331 | 293 | 2.0472418184872665 |  /  |
| game-1-chigorin-steinitz-1892 | 41 | Ne5 | Migliore | Imprecisione | Buona | 250 | 108 | 8.426195970059991 | 236 | 174 | 3.629815762269817 |  /  |
| game-1-chigorin-steinitz-1892 | 42 | Qc8 | Imprecisione | Buona | Imprecisione | -158 | -214 | 3.3162759824058363 | -109 | -258 | 8.81762931344537 |  /  |
| game-1-chigorin-steinitz-1892 | 44 | Kf6 | Imprecisione | Buona | Imprecisione | -210 | -284 | 4.208497151350238 | -264 | -404 | 7.375976078747209 |  /  |
| game-1-chigorin-steinitz-1892 | 47 | Bxe7+ | Imprecisione | Ottima | Buona | 339 | 314 | 1.32857209585725 | 498 | 420 | 3.565823815124425 |  /  |
| game-1-chigorin-steinitz-1892 | 49 | Nxg6+ | Migliore | Migliore | Ottima | 345 | 345 | 0 | 481 | 584 | 0 |  /  |
| game-1-chigorin-steinitz-1892 | 51 | Nxh8 | Ottima | Imprecisione | Ottima | 527 | 323 | 9.71889572161212 | 545 | 539 | 0.24451045548853356 |  /  |
| game-1-chigorin-steinitz-1892 | 52 | Bxd4 | Buona | Imprecisione | Buona | -364 | -541 | 8.153788431836443 | -593 | -719 | 4.2894445172556726 |  /  |
| game-1-chigorin-steinitz-1892 | 53 | Rb3 | Geniale | Buona | Ottima | 526 | 432 | 4.1854650670436815 | 719 | 672 | 1.4939808066130933 | unsupported / unsupported |
| game-1-chigorin-steinitz-1892 | 57 | g4 | Migliore | Migliore | Buona | 553 | 553 | 0 | 777 | 629 | 4.648682668882708 |  /  |
| game-1-chigorin-steinitz-1892 | 59 | Qh6+ | Ottima | Ottima | Migliore | 584 | 537 | 1.863190987872565 | 799 | 799 | 0 |  /  |
| game-1-chigorin-steinitz-1892 | 60 | Rg6 | Imprecisione | Imprecisione | Errore | -537 | -800 | 8.789631307042765 | -608 | -1349 | 14.629546935281098 |  /  |
| game-2-saintamant-staunton-1843 | 11 | Bd3 | Imprecisione | Buona | Ottima | 41 | -9 | 3.1227351031943296 | 18 | -4 | 1.3748081113729715 |  /  |
| game-2-saintamant-staunton-1843 | 20 | Nc6 | Migliore | Migliore | Ottima | 4 | 4 | 0 | 2 | -7 | 0.5624885745613262 |  /  |
| game-2-saintamant-staunton-1843 | 26 | h6 | Ottima | Ottima | Migliore | -22 | -35 | 0.811451906924654 | -13 | -13 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 29 | Re1 | Migliore | Ottima | Migliore | 14 | 11 | 0.18745401157060915 | 17 | 17 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 30 | b5 | Ottima | Migliore | Ottima | -12 | -12 | 0 | -9 | -10 | 0.0624911792184879 |  /  |
| game-2-saintamant-staunton-1843 | 31 | h3 | Ottima | Migliore | Ottima | 12 | 12 | 0 | 12 | 8 | 0.24996042106205651 |  /  |
| game-2-saintamant-staunton-1843 | 33 | Qb3 | Ottima | Ottima | Migliore | 17 | 14 | 0.18742941247233968 | 16 | 16 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 34 | Qc7 | Buona | Ottima | Migliore | -17 | -21 | 0.24985851772796885 | -5 | -5 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 41 | Qd1 | Migliore | Ottima | Migliore | 62 | 61 | 0.062132082064880745 | 43 | 43 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 43 | Nh4 | Imprecisione | Ottima | Buona | 56 | 10 | 2.8693270658704084 | 60 | 7 | 3.3054956993976092 |  /  |
| game-2-saintamant-staunton-1843 | 45 | Qd2 | Ottima | Migliore | Ottima | 25 | 25 | 0 | 39 | 38 | 0.06235546416462068 |  /  |
| game-2-saintamant-staunton-1843 | 46 | Nh7 | Buona | Buona | Imprecisione | -21 | -80 | 3.6712011130234536 | 3 | -89 | 5.727163953157604 |  /  |
| game-2-saintamant-staunton-1843 | 50 | Ne8 | Imprecisione | Ottima | Buona | 3 | -37 | 2.4983516700075814 | 3 | -47 | 3.1216241256772523 |  /  |
| game-2-saintamant-staunton-1843 | 51 | Nf5 | Imprecisione | Buona | Ottima | 39 | -14 | 3.3104815648447525 | 47 | 0 | 2.9341250045785583 |  /  |
| game-2-saintamant-staunton-1843 | 55 | Qb3 | Imprecisione | Imprecisione | Buona | 17 | -73 | 5.6122188217745785 | 7 | -54 | 3.8073723782674316 |  /  |
| game-2-saintamant-staunton-1843 | 79 | Rd1 | Errore | Imprecisione | Errore | -150 | -236 | 5.0698545740332 | -143 | -328 | 10.580121998039226 |  /  |
| game-2-saintamant-staunton-1843 | 86 | Qe7 | Imprecisione | Ottima | Buona | 272 | 233 | 2.209624420278933 | 356 | 293 | 3.3536532121705043 |  /  |
| game-2-saintamant-staunton-1843 | 90 | Re4 | Ottima | Migliore | Imprecisione | 329 | 329 | 0 | 474 | 354 | 5.798835439531569 |  /  |
| game-2-saintamant-staunton-1843 | 96 | Re8 | Ottima | Ottima | Buona | 252 | 242 | 0.569006963475871 | 373 | 295 | 4.113327258179556 |  /  |
| game-2-saintamant-staunton-1843 | 97 | Qc3 | Imprecisione | Ottima | Imprecisione | -237 | -252 | 0.8550906227111466 | -282 | -481 | 9.967381823549273 |  /  |
| game-2-saintamant-staunton-1843 | 107 | hxg5 | Ottima | Ottima | Migliore | -446 | -490 | 1.988216897540085 | -608 | -608 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 108 | Bxf4 | Buona | Imprecisione | Ottima | 501 | 386 | 5.36105523420246 | 612 | 554 | 2.221349241303272 |  /  |
| game-2-saintamant-staunton-1843 | 109 | Bxf4 | Buona | Imprecisione | Buona | -410 | -534 | 5.572109680270596 | -615 | -771 | 4.987144454332951 |  /  |
| game-2-saintamant-staunton-1843 | 110 | Qxe2 | Buona | Errore | Imprecisione | 565 | 313 | 11.794128893828482 | 771 | 596 | 5.689417681753939 |  /  |
| game-2-saintamant-staunton-1843 | 114 | c3 | Ottima | Ottima | Migliore | 478 | 454 | 1.0873666701814555 | 637 | 637 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 115 | Kf1 | Migliore | Migliore | Ottima | -533 | -533 | 0 | -620 | -615 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 120 | c2 | Migliore | Buona | Ottima | 604 | 523 | 3.196669212744896 | 654 | 618 | 1.2663034948359853 |  /  |
| game-2-saintamant-staunton-1843 | 123 | d6 | Ottima | Ottima | Migliore | -640 | -672 | 1.088614598062279 | -673 | -673 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 124 | Rd4 | Ottima | Migliore | Ottima | 682 | 682 | 0 | 724 | 711 | 0.39739822970719096 |  /  |
| game-2-saintamant-staunton-1843 | 126 | Rxd6 | Migliore | Migliore | Ottima | 671 | 671 | 0 | 727 | 706 | 0.6431106771483286 |  /  |
| game-2-saintamant-staunton-1843 | 130 | Kg6 | Ottima | Ottima | Migliore | 799 | 713 | 2.4529053197063666 | 777 | 777 | 0 |  /  |
| game-2-saintamant-staunton-1843 | 132 | b4 | Ottima | Buona | Migliore | 965 | 764 | 4.675639016823563 | 879 | 879 | 0 |  /  |

Nuova accuratezza sul telefono, analisi partita completa in browser, download Internet/cache browser: NON ESEGUITI. Stockfish 19 nativo compilato: NON ESEGUITO; il NativeEngine QA trasporta lo stesso WASM single via Node, con go nodes 200000. App e engineConfig.js invariati.

## Comparabilità con i rapporti QA precedenti

La baseline pubblicata 256/503 e 439/493 deriva dal helper QA che conserva categorie numeriche nelle righe Libro. La tabella principale usa le categorie effettive dell’app, con Libro protetto. H1 ply 13–14 sono Libro locale ma attesi Migliore: questa differenza di rappresentazione è mostrata, non corretta modificando il repertorio o le attese. Tabelle separate evitano di attribuirla al motore. Stesse esclusioni e nessuna modifica alle regole.

| Gruppo | Schema | Esatta | % | Entro una classe | % |
|---|---|---:|---:|---:|---:|
| personal | QA precedente baseline | 174/342 | 50.88% | 300/332 | 90.36% |
| personal | QA precedente large 200k | 178/342 | 52.05% | 296/332 | 89.16% |
| personal | App baseline | 174/342 | 50.88% | 300/332 | 90.36% |
| personal | App large 200k | 178/342 | 52.05% | 296/332 | 89.16% |
| historical | QA precedente baseline | 82/161 | 50.93% | 139/161 | 86.34% |
| historical | QA precedente large 200k | 78/161 | 48.45% | 141/161 | 87.58% |
| historical | App baseline | 80/161 | 49.69% | 137/161 | 85.09% |
| historical | App large 200k | 77/161 | 47.83% | 139/161 | 86.34% |
| all | QA precedente baseline | 256/503 | 50.89% | 439/493 | 89.05% |
| all | QA precedente large 200k | 256/503 | 50.89% | 437/493 | 88.64% |
| all | App baseline | 254/503 | 50.50% | 437/493 | 88.64% |
| all | App large 200k | 255/503 | 50.70% | 435/493 | 88.24% |

## Metriche app per partita

| Partita | Schema | Esatta | % | Entro una classe | % |
|---|---|---:|---:|---:|---:|
| personal-01 | baseline | 23/42 | 54.76% | 40/40 | 100.00% |
| personal-01 | large 200k | 24/42 | 57.14% | 37/40 | 92.50% |
| personal-02 | baseline | 30/66 | 45.45% | 57/64 | 89.06% |
| personal-02 | large 200k | 35/66 | 53.03% | 56/64 | 87.50% |
| personal-03 | baseline | 62/129 | 48.06% | 114/125 | 91.20% |
| personal-03 | large 200k | 63/129 | 48.84% | 114/125 | 91.20% |
| personal-04 | baseline | 26/46 | 56.52% | 35/46 | 76.09% |
| personal-04 | large 200k | 23/46 | 50.00% | 36/46 | 78.26% |
| personal-05 | baseline | 11/26 | 42.31% | 23/24 | 95.83% |
| personal-05 | large 200k | 16/26 | 61.54% | 23/24 | 95.83% |
| personal-06 | baseline | 22/33 | 66.67% | 31/33 | 93.94% |
| personal-06 | large 200k | 17/33 | 51.52% | 30/33 | 90.91% |
| game-1-chigorin-steinitz-1892 | baseline | 19/40 | 47.50% | 31/40 | 77.50% |
| game-1-chigorin-steinitz-1892 | large 200k | 19/40 | 47.50% | 31/40 | 77.50% |
| game-2-saintamant-staunton-1843 | baseline | 61/121 | 50.41% | 106/121 | 87.60% |
| game-2-saintamant-staunton-1843 | large 200k | 58/121 | 47.93% | 108/121 | 89.26% |

Fra le mosse incluse in entrambi gli schemi: 63 diventano esatte, 62 perdono la corrispondenza esatta. Flag Libro invariati: true.

## Diagnostica nodi, depth e transizioni

```json
{
  "diagnostics": [
    {
      "id": "personal-01",
      "sameEligibleCohort": 42,
      "changedToExpected": 4,
      "changedAwayFromExpected": 3,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 1,
      "minActualNodes": 0,
      "maxActualNodes": 200277,
      "primaryDepths": [
        0,
        11,
        12,
        13,
        14,
        15,
        16
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 6,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 7,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "personal-02",
      "sameEligibleCohort": 66,
      "changedToExpected": 12,
      "changedAwayFromExpected": 7,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 3,
      "minActualNodes": 0,
      "maxActualNodes": 200306,
      "primaryDepths": [
        0,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        20,
        24,
        32,
        245
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "personal-03",
      "sameEligibleCohort": 129,
      "changedToExpected": 19,
      "changedAwayFromExpected": 18,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 17,
      "minActualNodes": 0,
      "maxActualNodes": 200335,
      "primaryDepths": [
        0,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        20,
        21,
        24,
        25,
        27,
        31,
        36,
        39,
        83,
        94,
        100,
        103,
        105,
        120,
        245
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Buona",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "personal-04",
      "sameEligibleCohort": 46,
      "changedToExpected": 5,
      "changedAwayFromExpected": 8,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 0,
      "minActualNodes": 200003,
      "maxActualNodes": 200256,
      "primaryDepths": [
        12,
        13,
        14,
        15,
        16,
        17,
        19,
        20,
        27,
        30,
        45
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 6,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "personal-05",
      "sameEligibleCohort": 26,
      "changedToExpected": 6,
      "changedAwayFromExpected": 1,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 1,
      "minActualNodes": 20463,
      "maxActualNodes": 200248,
      "primaryDepths": [
        10,
        11,
        12,
        13,
        14,
        15,
        245
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 6,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 7,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 8,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "personal-06",
      "sameEligibleCohort": 33,
      "changedToExpected": 3,
      "changedAwayFromExpected": 8,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 0,
      "minActualNodes": 200006,
      "maxActualNodes": 200259,
      "primaryDepths": [
        12,
        13,
        14,
        15
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 6,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 7,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 8,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 9,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    },
    {
      "id": "game-1-chigorin-steinitz-1892",
      "sameEligibleCohort": 40,
      "changedToExpected": 5,
      "changedAwayFromExpected": 5,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 0,
      "minActualNodes": 200002,
      "maxActualNodes": 200270,
      "primaryDepths": [
        11,
        12,
        13,
        14,
        15,
        16,
        42
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 6,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 7,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 8,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 9,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 10,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 11,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 12,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 13,
          "expected": "Migliore",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": []
        },
        {
          "ply": 14,
          "expected": "Migliore",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": []
        }
      ]
    },
    {
      "id": "game-2-saintamant-staunton-1843",
      "sameEligibleCohort": 121,
      "changedToExpected": 9,
      "changedAwayFromExpected": 12,
      "unchangedBookFlags": true,
      "searchesBelowNodeBudget": 0,
      "minActualNodes": 200000,
      "maxActualNodes": 200352,
      "primaryDepths": [
        11,
        12,
        13,
        14,
        15,
        16
      ],
      "legacyQaBookDifferences": [
        {
          "ply": 1,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 2,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 3,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 4,
          "expected": "Libro",
          "legacyActual": "Migliore",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        },
        {
          "ply": 5,
          "expected": "Libro",
          "legacyActual": "Ottima",
          "appActual": "Libro",
          "excluded": [
            "book"
          ]
        }
      ]
    }
  ],
  "transitions": {
    "Migliore -> Ottima": 38,
    "Buona -> Ottima": 25,
    "Ottima -> Migliore": 39,
    "Imprecisione -> Errore": 4,
    "Buona -> Errore": 1,
    "Ottima -> Buona": 20,
    "Imprecisione -> Buona": 9,
    "Buona -> Imprecisione": 12,
    "Errore -> Errore grave": 4,
    "Imprecisione -> Ottima": 6,
    "Errore -> Imprecisione": 4,
    "Errore grave -> Errore": 1,
    "Ottima -> Imprecisione": 4,
    "Buona -> Migliore": 3,
    "Errore -> Ottima": 3,
    "Migliore -> Buona": 3,
    "Ottima -> Errore": 1,
    "Migliore -> Imprecisione": 1
  }
}
```

## Verifiche reali

Replay tramite analyzeGame dell?app: 1184 ply (592 per schema), categorie e campi numerici identici al rapporto, normalizzando -0/0 come fa JSON; zero nuove ricerche del motore. Il primo confronto strettamente Object.is aveva segnalato -0 contro 0 in H2 ply 51: differenza di serializzazione, non di punteggio o categoria. Nessuna cache rigenerata. SHA-256 invariati dopo test/build: 81 file protetti e 2 file motore.

```text
npm test -- --config scripts/qa-no-env-test.config.js --cache false
Test Files 21 passed (21)
Tests 125 passed | 1 skipped | 1 todo (127)
Duration 16.44s; exit 0; nessuna esclusione

npm run build -- --config scripts/qa-no-env-build.config.js
68 modules transformed; built in 3.01s; exit 0
Warning: chunk oltre 500 kB

git diff --check
exit 0; avvisi LF/CRLF
```

Log integrali: npm-test.log, npm-build.log, git-diff-check.log. Nessun commit/push; nessuna lettura .env o Partite/7?10. File src, fixture e cache preesistenti invariati.
