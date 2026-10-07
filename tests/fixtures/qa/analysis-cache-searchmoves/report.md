# C7 — Stockfish 16 searchmoves

Offline; depth 12, Threads 1, Hash 16 MB. Sessione nuova per partita/schema, ucinewgame; hash mantenuta fra richieste dello stesso schema. Riferimenti MultiPV legacy, nessuna nuova ricerca completa.

Schema single: best cached + played single per ogni ply. Schema pair: MultiPV cached per mosse interne, best/played dalla ricerca a due candidati per mosse esterne. La prima PV della coppia determina isEngineBest; migliore soltanto fra i due candidati. Regole QA, esclusioni e Mossa mancata importate senza modifiche. Terminali: preservata la regola corrente del matto; nessuna nuova regola dello stallo.

Adattamento QA: score root inseriti in linee sintetiche, stessa depth; root-pv è il contratto numerico del classificatore, NON una dichiarazione che single e best cached provengano dalla stessa ricerca. Raw separati nei file delle ricerche.

P90 nearest-rank; inversioni di segno strettamente positivo/negativo, zeri separati. Mate/cp esclusi dalla distribuzione cp. Il riferimento 32,74 cp riguarda altre coppie e un diverso sottoinsieme: confronto descrittivo, non test appaiato.

| Partita | P | K | go attuale (storico) | go single misurati | secondi single | go pair aggiuntivi | secondi pair |
|---|---:|---:|---:|---:|---:|---:|---:|
| personal-01 | 51 | 16 | 102 | 51 | 1.624 | 16 | 1.374 |
| personal-02 | 75 | 19 | 150 | 75 | 1.493 | 19 | 0.958 |
| personal-03 | 136 | 33 | 272 | 136 | 1.898 | 33 | 1.398 |
| personal-04 | 55 | 17 | 110 | 55 | 1.034 | 17 | 0.739 |
| personal-05 | 37 | 10 | 74 | 37 | 0.767 | 10 | 0.337 |
| personal-06 | 45 | 9 | 90 | 45 | 1.156 | 9 | 0.511 |
| game-1-chigorin-steinitz-1892 | 61 | 5 | 122 | 61 | 1.777 | 5 | 0.460 |
| game-2-saintamant-staunton-1843 | 132 | 27 | 264 | 132 | 3.938 | 27 | 2.129 |

Tempi attuale: NON ESEGUITO (cache storiche senza tempi). Tempo completo B4/pair: NON ESEGUITO, manca il costo delle ricerche MultiPV complete e delle eventuali posizioni finali. go candidato B4: P+K+T; questo esperimento single esegue P ricerche anche dentro MultiPV. Pair operativo: P+K+T; pair incrementale offline: K.

| Gruppo | Schema | Esatta | % | Entro una classe | % |
|---|---|---:|---:|---:|---:|
| personal | current | 174/342 | 50.8772 | 300/332 | 90.3614 |
| personal | single | 164/342 | 47.9532 | 291/332 | 87.6506 |
| personal | pair | 167/342 | 48.8304 | 297/332 | 89.4578 |
| historical | current | 82/161 | 50.9317 | 139/161 | 86.3354 |
| historical | single | 82/161 | 50.9317 | 137/161 | 85.0932 |
| historical | pair | 76/161 | 47.2050 | 135/161 | 83.8509 |

## Rumore interno MultiPV

```json
{
  "pairs": 456,
  "cpPairs": 425,
  "mean": 123.69882352941177,
  "median": 16,
  "p90": 104,
  "max": 3136,
  "signInversions": 5,
  "zeroTransitions": 5,
  "mateCp": 7,
  "mateMate": 24
}
```

## Distribuzioni per partita (coppia vs single e cache incluse)

```json
[
  {
    "id": "personal-01",
    "P": 51,
    "K": 16,
    "insideNoise": {
      "pairs": 35,
      "cpPairs": 34,
      "mean": 33.26470588235294,
      "median": 10,
      "p90": 72,
      "max": 312,
      "signInversions": 2,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairVsSingle": {
      "pairs": 16,
      "cpPairs": 15,
      "mean": 13.466666666666667,
      "median": 10,
      "p90": 27,
      "max": 35,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 16,
      "cpPairs": 15,
      "mean": 24.733333333333334,
      "median": 9,
      "p90": 35,
      "max": 232,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairBestVsCache": {
      "pairs": 16,
      "cpPairs": 16,
      "mean": 27.375,
      "median": 12.5,
      "p90": 47,
      "max": 204,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "singleGo": 51,
    "pairGo": 16,
    "singleMs": 1623.8284999999998,
    "pairMs": 1374.0298000000007
  },
  {
    "id": "personal-02",
    "P": 75,
    "K": 19,
    "insideNoise": {
      "pairs": 56,
      "cpPairs": 51,
      "mean": 34.372549019607845,
      "median": 18,
      "p90": 76,
      "max": 229,
      "signInversions": 0,
      "zeroTransitions": 1,
      "mateCp": 1,
      "mateMate": 4
    },
    "outsidePairVsSingle": {
      "pairs": 19,
      "cpPairs": 17,
      "mean": 24.823529411764707,
      "median": 20,
      "p90": 65,
      "max": 99,
      "signInversions": 1,
      "zeroTransitions": 1,
      "mateCp": 0,
      "mateMate": 2
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 19,
      "cpPairs": 17,
      "mean": 48.05882352941177,
      "median": 28,
      "p90": 89,
      "max": 223,
      "signInversions": 1,
      "zeroTransitions": 1,
      "mateCp": 0,
      "mateMate": 2
    },
    "outsidePairBestVsCache": {
      "pairs": 19,
      "cpPairs": 17,
      "mean": 29.58823529411765,
      "median": 14,
      "p90": 85,
      "max": 95,
      "signInversions": 1,
      "zeroTransitions": 1,
      "mateCp": 1,
      "mateMate": 1
    },
    "singleGo": 75,
    "pairGo": 19,
    "singleMs": 1493.4793999999983,
    "pairMs": 958.0827000000018
  },
  {
    "id": "personal-03",
    "P": 136,
    "K": 33,
    "insideNoise": {
      "pairs": 103,
      "cpPairs": 82,
      "mean": 518.6829268292682,
      "median": 23.5,
      "p90": 2499,
      "max": 3136,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 4,
      "mateMate": 17
    },
    "outsidePairVsSingle": {
      "pairs": 33,
      "cpPairs": 28,
      "mean": 42.142857142857146,
      "median": 14,
      "p90": 58,
      "max": 648,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 5
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 33,
      "cpPairs": 28,
      "mean": 44.75,
      "median": 24.5,
      "p90": 64,
      "max": 583,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 5
    },
    "outsidePairBestVsCache": {
      "pairs": 33,
      "cpPairs": 28,
      "mean": 60.964285714285715,
      "median": 14.5,
      "p90": 77,
      "max": 652,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 5
    },
    "singleGo": 136,
    "pairGo": 33,
    "singleMs": 1898.4341999999897,
    "pairMs": 1397.6233999999931
  },
  {
    "id": "personal-04",
    "P": 55,
    "K": 17,
    "insideNoise": {
      "pairs": 38,
      "cpPairs": 36,
      "mean": 62.05555555555556,
      "median": 23.5,
      "p90": 205,
      "max": 430,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 1,
      "mateMate": 1
    },
    "outsidePairVsSingle": {
      "pairs": 17,
      "cpPairs": 15,
      "mean": 44.8,
      "median": 10,
      "p90": 187,
      "max": 263,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 1,
      "mateMate": 1
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 17,
      "cpPairs": 14,
      "mean": 15,
      "median": 9,
      "p90": 50,
      "max": 60,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 2,
      "mateMate": 1
    },
    "outsidePairBestVsCache": {
      "pairs": 17,
      "cpPairs": 14,
      "mean": 49.142857142857146,
      "median": 17.5,
      "p90": 85,
      "max": 366,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 2,
      "mateMate": 1
    },
    "singleGo": 55,
    "pairGo": 17,
    "singleMs": 1034.166900000011,
    "pairMs": 738.7177999999949
  },
  {
    "id": "personal-05",
    "P": 37,
    "K": 10,
    "insideNoise": {
      "pairs": 27,
      "cpPairs": 26,
      "mean": 27.46153846153846,
      "median": 17.5,
      "p90": 82,
      "max": 108,
      "signInversions": 0,
      "zeroTransitions": 2,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairVsSingle": {
      "pairs": 10,
      "cpPairs": 9,
      "mean": 29.333333333333332,
      "median": 18,
      "p90": 71,
      "max": 71,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 10,
      "cpPairs": 9,
      "mean": 24.333333333333332,
      "median": 14,
      "p90": 65,
      "max": 65,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 1
    },
    "outsidePairBestVsCache": {
      "pairs": 10,
      "cpPairs": 10,
      "mean": 25.6,
      "median": 21,
      "p90": 59,
      "max": 65,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "singleGo": 37,
    "pairGo": 10,
    "singleMs": 766.9944999999971,
    "pairMs": 337.40710000000036
  },
  {
    "id": "personal-06",
    "P": 45,
    "K": 9,
    "insideNoise": {
      "pairs": 36,
      "cpPairs": 36,
      "mean": 17.75,
      "median": 11.5,
      "p90": 44,
      "max": 49,
      "signInversions": 2,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairVsSingle": {
      "pairs": 9,
      "cpPairs": 9,
      "mean": 24.88888888888889,
      "median": 24,
      "p90": 48,
      "max": 48,
      "signInversions": 1,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 9,
      "cpPairs": 9,
      "mean": 30,
      "median": 29,
      "p90": 61,
      "max": 61,
      "signInversions": 1,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairBestVsCache": {
      "pairs": 9,
      "cpPairs": 9,
      "mean": 26.444444444444443,
      "median": 27,
      "p90": 57,
      "max": 57,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "singleGo": 45,
    "pairGo": 9,
    "singleMs": 1155.9290999999994,
    "pairMs": 510.70260000000053
  },
  {
    "id": "game-1-chigorin-steinitz-1892",
    "P": 61,
    "K": 5,
    "insideNoise": {
      "pairs": 56,
      "cpPairs": 55,
      "mean": 27.945454545454545,
      "median": 20,
      "p90": 63,
      "max": 140,
      "signInversions": 0,
      "zeroTransitions": 1,
      "mateCp": 1,
      "mateMate": 0
    },
    "outsidePairVsSingle": {
      "pairs": 5,
      "cpPairs": 5,
      "mean": 11.4,
      "median": 13,
      "p90": 17,
      "max": 17,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 5,
      "cpPairs": 5,
      "mean": 21,
      "median": 17,
      "p90": 44,
      "max": 44,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairBestVsCache": {
      "pairs": 5,
      "cpPairs": 5,
      "mean": 15,
      "median": 15,
      "p90": 26,
      "max": 26,
      "signInversions": 0,
      "zeroTransitions": 0,
      "mateCp": 0,
      "mateMate": 0
    },
    "singleGo": 61,
    "pairGo": 5,
    "singleMs": 1777.0196999999898,
    "pairMs": 459.776799999996
  },
  {
    "id": "game-2-saintamant-staunton-1843",
    "P": 132,
    "K": 27,
    "insideNoise": {
      "pairs": 105,
      "cpPairs": 105,
      "mean": 19.35238095238095,
      "median": 11,
      "p90": 52,
      "max": 98,
      "signInversions": 1,
      "zeroTransitions": 1,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairVsSingle": {
      "pairs": 27,
      "cpPairs": 27,
      "mean": 16.40740740740741,
      "median": 15,
      "p90": 37,
      "max": 43,
      "signInversions": 1,
      "zeroTransitions": 1,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairVsCachedPlayed": {
      "pairs": 27,
      "cpPairs": 27,
      "mean": 30.444444444444443,
      "median": 14,
      "p90": 103,
      "max": 146,
      "signInversions": 2,
      "zeroTransitions": 1,
      "mateCp": 0,
      "mateMate": 0
    },
    "outsidePairBestVsCache": {
      "pairs": 27,
      "cpPairs": 27,
      "mean": 36.22222222222222,
      "median": 9,
      "p90": 96,
      "max": 315,
      "signInversions": 0,
      "zeroTransitions": 2,
      "mateCp": 0,
      "mateMate": 0
    },
    "singleGo": 132,
    "pairGo": 27,
    "singleMs": 3938.2585000000436,
    "pairMs": 2128.9092000000055
  }
]
```

Ripetibilità: 50/50 score identici fra due replay a condizioni iniziali e ordine uguali; seed 20261007. Non misura identità rispetto al primo passaggio, che aveva diversa storia hash.
go totali reali: 828; tempo totale 31.475 s.

## Tutti i cambiamenti di categoria (incluse mosse escluse dalle metriche)

| Partita | Schema | ply | SAN | Attesa | Prima | Dopo | best prima | played prima | best dopo | played dopo | Esclusioni |
|---|---|---:|---|---|---|---|---|---|---|---|---|
| personal-01 | single | 31 | g4 | Errore | Imprecisione | Errore | 127 | -32 | 127 | -77 |  |
| personal-01 | single | 33 | gxh5 | Imprecisione | Buona | Imprecisione | -12 | -85 | -12 | -146 |  |
| personal-01 | single | 38 | Bxh5 | Buona | Buona | Ottima | -22 | -73 | -22 | -43 |  |
| personal-01 | single | 44 | g5 | Errore | Imprecisione | Buona | -61 | -178 | -61 | -118 |  |
| personal-01 | single | 46 | Nf8 | Errore | Errore grave | Errore | -204 | -766 | -204 | -509 |  |
| personal-01 | pair | 2 | d5 | Libro | Ottima | Buona | -28 | -73 | -24 | -73 | book |
| personal-01 | pair | 24 | Qd5 | Buona | Buona | Ottima | -44 | -113 | -69 | -115 |  |
| personal-01 | pair | 29 | Qd2 | Errore | Errore | Imprecisione | 151 | -58 | 117 | -37 |  |
| personal-01 | pair | 31 | g4 | Errore | Imprecisione | Errore | 127 | -32 | 140 | -67 |  |
| personal-01 | pair | 46 | Nf8 | Errore | Errore grave | Errore | -204 | -766 | -157 | -534 |  |
| personal-01 | pair | 50 | Nd7 | Errore | Imprecisione | Buona | -1036 | mate -1 | -1240 | mate -1 |  |
| personal-02 | single | 7 | Qd1 | Buona | Imprecisione | Buona | 124 | 35 | 124 | 55 |  |
| personal-02 | single | 25 | O-O | Buona | Buona | Ottima | 74 | 14 | 74 | 30 |  |
| personal-02 | single | 28 | Qe8 | Buona | Buona | Ottima | -44 | -93 | -44 | -84 |  |
| personal-02 | single | 46 | Bxe4 | Imprecisione | Imprecisione | Ottima | -699 | -984 | -699 | -784 |  |
| personal-02 | single | 47 | Bc3+ | Buona | Ottima | Imprecisione | 966 | 847 | 966 | 677 |  |
| personal-02 | single | 64 | h6 | Errore | Buona | Ottima | -675 | -788 | -675 | -742 |  |
| personal-02 | single | 66 | Kg6 | Errore | Buona | Ottima | -772 | -938 | -772 | -779 |  |
| personal-02 | pair | 7 | Qd1 | Buona | Imprecisione | Ottima | 124 | 35 | 118 | 70 |  |
| personal-02 | pair | 16 | d6 | Buona | Imprecisione | Ottima | 29 | -89 | 36 | -9 |  |
| personal-02 | pair | 20 | Kf8 | Errore grave | Errore | Imprecisione | 245 | -56 | 150 | 0 |  |
| personal-02 | pair | 38 | d5 | Buona | Buona | Imprecisione | -491 | -587 | -445 | -571 |  |
| personal-02 | pair | 40 | Kf8 | Imprecisione | Buona | Ottima | -575 | -700 | -660 | -672 |  |
| personal-02 | pair | 46 | Bxe4 | Imprecisione | Imprecisione | Buona | -699 | -984 | -614 | -761 |  |
| personal-02 | pair | 57 | Rh6 | Ottima | Buona | Ottima | 710 | 595 | 704 | 662 |  |
| personal-02 | pair | 64 | h6 | Errore | Buona | Ottima | -675 | -788 | -652 | -722 |  |
| personal-02 | pair | 68 | Rc3 | Imprecisione | Ottima | Imprecisione | mate -9 | mate -1 | -1092 | mate -1 |  |
| personal-03 | single | 6 | f5 | Errore | Imprecisione | Buona | -86 | -178 | -86 | -159 |  |
| personal-03 | single | 7 | d3 | Imprecisione | Buona | Imprecisione | 175 | 103 | 175 | 90 |  |
| personal-03 | single | 16 | f4 | Imprecisione | Buona | Imprecisione | -42 | -117 | -42 | -129 |  |
| personal-03 | single | 17 | b3 | Imprecisione | Imprecisione | Buona | 118 | 14 | 118 | 40 |  |
| personal-03 | single | 20 | Qxd6 | Migliore | Ottima | Buona | -80 | -128 | -80 | -137 |  |
| personal-03 | single | 22 | Nd7 | Imprecisione | Imprecisione | Buona | -55 | -139 | -55 | -128 |  |
| personal-03 | single | 25 | Qe2 | Buona | Ottima | Buona | 139 | 106 | 139 | 82 |  |
| personal-03 | single | 26 | Qc5 | Errore | Errore | Imprecisione | -114 | -288 | -114 | -264 |  |
| personal-03 | single | 30 | Qe7 | Buona | Buona | Ottima | -316 | -381 | -316 | -361 |  |
| personal-03 | single | 34 | Kf6 | Buona | Buona | Ottima | -277 | -342 | -277 | -295 |  |
| personal-03 | single | 43 | dxe6 | Errore | Imprecisione | Errore | -502 | -756 | -502 | -821 |  |
| personal-03 | single | 45 | Rxg8 | Imprecisione | Imprecisione | Buona | -287 | -408 | -287 | -381 |  |
| personal-03 | single | 55 | Ke1 | Imprecisione | Buona | Ottima | -496 | -586 | -496 | -526 |  |
| personal-03 | single | 58 | Kb4 | Buona | Ottima | Buona | 597 | 540 | 597 | 517 |  |
| personal-03 | single | 61 | c5 | Ottima | Buona | Ottima | -540 | -618 | -540 | -607 |  |
| personal-03 | single | 62 | Kxa4 | Ottima | Ottima | Buona | 620 | 570 | 620 | 531 |  |
| personal-03 | single | 68 | h5 | Migliore | Buona | Ottima | 648 | 559 | 648 | 582 |  |
| personal-03 | single | 72 | h4 | Migliore | Ottima | Buona | 679 | 623 | 679 | 589 |  |
| personal-03 | single | 76 | h2 | Ottima | Ottima | Buona | 735 | 657 | 735 | 636 |  |
| personal-03 | single | 84 | Qd1+ | Ottima | Ottima | Imprecisione | 1079 | 1079 | 1079 | 738 |  |
| personal-03 | single | 87 | Kf3 | Imprecisione | Errore | Ottima | -680 | -1243 | -680 | -765 |  |
| personal-03 | single | 90 | Qxd4 | Migliore | Ottima | Imprecisione | 3737 | 3737 | 3737 | 1075 |  |
| personal-03 | single | 92 | Qxc5+ | Migliore | Ottima | Errore | 3737 | 3737 | 3737 | 601 |  |
| personal-03 | single | 94 | Qg1+ | Mossa mancata | Ottima | Errore | 3777 | 3648 | 3777 | 670 |  |
| personal-03 | single | 96 | Qf2 | Ottima | Ottima | Errore | 3729 | 3648 | 3729 | 823 |  |
| personal-03 | single | 100 | a4 | Migliore | Ottima | Buona | 3718 | 3718 | 3718 | 1295 |  |
| personal-03 | pair | 2 | d5 | Libro | Ottima | Buona | -28 | -73 | -24 | -73 | book |
| personal-03 | pair | 6 | f5 | Errore | Imprecisione | Buona | -86 | -178 | -85 | -160 |  |
| personal-03 | pair | 22 | Nd7 | Imprecisione | Imprecisione | Buona | -55 | -139 | -67 | -122 |  |
| personal-03 | pair | 23 | g3 | Buona | Buona | Ottima | 130 | 53 | 126 | 88 |  |
| personal-03 | pair | 24 | g5 | Buona | Ottima | Migliore | -93 | -133 | -100 | -100 |  |
| personal-03 | pair | 26 | Qc5 | Errore | Errore | Imprecisione | -114 | -288 | -124 | -258 |  |
| personal-03 | pair | 27 | Nxe5 | Mossa mancata | Errore | Imprecisione | 294 | 83 | 265 | 108 |  |
| personal-03 | pair | 34 | Kf6 | Buona | Buona | Ottima | -277 | -342 | -261 | -308 |  |
| personal-03 | pair | 43 | dxe6 | Errore | Imprecisione | Errore | -502 | -756 | -486 | -820 |  |
| personal-03 | pair | 55 | Ke1 | Imprecisione | Buona | Ottima | -496 | -586 | -494 | -561 |  |
| personal-03 | pair | 62 | Kxa4 | Ottima | Ottima | Buona | 620 | 570 | 604 | 516 |  |
| personal-03 | pair | 68 | h5 | Migliore | Buona | Ottima | 648 | 559 | 571 | 557 |  |
| personal-03 | pair | 86 | Qc2+ | Buona | Errore | Buona | 1260 | 662 | 692 | 587 |  |
| personal-03 | pair | 112 | Ka3 | Ottima | Ottima | Migliore | 4362 | 4325 | 4310 | 4310 |  |
| personal-04 | single | 7 | g3 | Ottima | Ottima | Buona | 56 | 16 | 56 | 6 |  |
| personal-04 | single | 9 | Bf4 | Buona | Buona | Ottima | 71 | 14 | 71 | 28 |  |
| personal-04 | single | 12 | Bd6 | Ottima | Ottima | Buona | -3 | -39 | -3 | -60 |  |
| personal-04 | single | 36 | Nb8 | Buona | Buona | Ottima | -610 | -715 | -610 | -628 |  |
| personal-04 | single | 37 | Qb3 | Ottima | Ottima | Buona | 720 | 660 | 720 | 610 |  |
| personal-04 | single | 38 | Nf5 | Errore | Buona | Ottima | -656 | -752 | -656 | -739 |  |
| personal-04 | single | 40 | Nxd4 | Errore | Buona | Imprecisione | -798 | -984 | -798 | -1242 |  |
| personal-04 | single | 43 | Qxh8 | Buona | Buona | Imprecisione | 1818 | 1138 | 1818 | 974 |  |
| personal-04 | single | 48 | Nd4 | Errore | Buona | Ottima | -989 | -1230 | -989 | -1116 |  |
| personal-04 | single | 49 | Bxe4 | Buona | Buona | Imprecisione | mate 9 | 1217 | mate 9 | 1162 |  |
| personal-04 | single | 51 | Qxg7 | Buona | Ottima | Buona | mate 3 | 1444 | mate 3 | 1230 |  |
| personal-04 | single | 53 | Qxg5+ | Buona | Ottima | Buona | mate 6 | mate 9 | mate 6 | 1276 |  |
| personal-04 | pair | 9 | Bf4 | Buona | Buona | Ottima | 71 | 14 | 59 | 12 |  |
| personal-04 | pair | 23 | Nd2 | Imprecisione | Errore | Buona | -172 | -356 | -257 | -340 |  |
| personal-04 | pair | 36 | Nb8 | Buona | Buona | Ottima | -610 | -715 | -583 | -655 |  |
| personal-04 | pair | 38 | Nf5 | Errore | Buona | Ottima | -656 | -752 | -674 | -742 |  |
| personal-04 | pair | 55 | Rac1 | Migliore | Ottima | Migliore | mate 5 | mate 7 | 1312 | 1312 |  |
| personal-05 | single | 11 | Bxc6 | Errore | Errore | Imprecisione | 64 | -127 | 64 | -49 |  |
| personal-05 | single | 12 | Nxf2 | Mossa mancata | Imprecisione | Errore | 127 | 0 | 127 | -82 |  |
| personal-05 | single | 13 | Bxd7+ | Errore | Errore grave | Errore | 70 | -265 | 70 | -157 |  |
| personal-05 | single | 18 | b6 | Buona | Imprecisione | Buona | 602 | 473 | 602 | 485 |  |
| personal-05 | single | 19 | Ng5 | Imprecisione | Buona | Ottima | -513 | -619 | -513 | -566 |  |
| personal-05 | single | 22 | Qe7 | Imprecisione | Imprecisione | Errore | 624 | 425 | 624 | 357 |  |
| personal-05 | single | 26 | Nf2 | Errore | Buona | Imprecisione | -337 | -418 | -337 | -473 |  |
| personal-05 | single | 28 | Re8 | Ottima | Buona | Ottima | -437 | -509 | -437 | -487 |  |
| personal-05 | single | 31 | Bxg5 | Ottima | Ottima | Buona | 549 | 483 | 549 | 477 |  |
| personal-05 | single | 34 | Re8 | Buona | Ottima | Buona | -547 | -607 | -547 | -630 |  |
| personal-05 | pair | 26 | Nf2 | Errore | Buona | Ottima | -337 | -418 | -368 | -408 |  |
| personal-05 | pair | 28 | Re8 | Ottima | Buona | Ottima | -437 | -509 | -430 | -444 |  |
| personal-06 | single | 19 | f3 | Buona | Buona | Ottima | 195 | 134 | 195 | 149 |  |
| personal-06 | single | 30 | b4 | Buona | Buona | Ottima | -237 | -298 | -237 | -272 |  |
| personal-06 | single | 34 | gxf6 | Errore | Buona | Imprecisione | -576 | -721 | -576 | -742 |  |
| personal-06 | pair | 20 | Bh5 | Buona | Buona | Ottima | -134 | -204 | -135 | -183 |  |
| personal-06 | pair | 28 | b5 | Buona | Buona | Ottima | -246 | -318 | -219 | -257 |  |
| personal-06 | pair | 44 | h5 | Buona | Buona | Ottima | -647 | -758 | -657 | -729 |  |
| game-1-chigorin-steinitz-1892 | single | 7 | b4 | Libro | Ottima | Buona | 40 | -7 | 40 | -14 | book |
| game-1-chigorin-steinitz-1892 | single | 11 | O-O | Libro | Buona | Ottima | -13 | -65 | -13 | -56 | book |
| game-1-chigorin-steinitz-1892 | single | 18 | Bd7 | Imprecisione | Buona | Ottima | 27 | -33 | 27 | -12 |  |
| game-1-chigorin-steinitz-1892 | single | 19 | Bb2 | Imprecisione | Ottima | Buona | 29 | -16 | 29 | -48 |  |
| game-1-chigorin-steinitz-1892 | single | 37 | Nxf7 | Errore | Errore | Imprecisione | 392 | 161 | 392 | 211 | suspect |
| game-1-chigorin-steinitz-1892 | single | 51 | Nxh8 | Ottima | Imprecisione | Errore | 527 | 323 | 527 | 271 |  |
| game-1-chigorin-steinitz-1892 | single | 52 | Bxd4 | Buona | Imprecisione | Ottima | -364 | -541 | -364 | -401 |  |
| game-1-chigorin-steinitz-1892 | single | 59 | Qh6+ | Ottima | Ottima | Imprecisione | 584 | 537 | 584 | 421 |  |
| game-1-chigorin-steinitz-1892 | pair | 7 | b4 | Libro | Ottima | Buona | 40 | -7 | 66 | -8 | book |
| game-1-chigorin-steinitz-1892 | pair | 24 | Nh6 | Imprecisione | Buona | Imprecisione | -58 | -138 | -32 | -121 |  |
| game-1-chigorin-steinitz-1892 | pair | 37 | Nxf7 | Errore | Errore | Imprecisione | 392 | 161 | 388 | 205 | suspect |
| game-2-saintamant-staunton-1843 | single | 11 | Bd3 | Imprecisione | Buona | Ottima | 41 | -9 | 41 | 8 |  |
| game-2-saintamant-staunton-1843 | single | 40 | Nh5 | Buona | Ottima | Buona | -20 | -62 | -20 | -71 |  |
| game-2-saintamant-staunton-1843 | single | 43 | Nh4 | Imprecisione | Ottima | Buona | 56 | 10 | 56 | 3 |  |
| game-2-saintamant-staunton-1843 | single | 47 | Qc2 | Buona | Buona | Imprecisione | 100 | 28 | 100 | 17 |  |
| game-2-saintamant-staunton-1843 | single | 59 | Na2 | Errore | Buona | Ottima | -59 | -113 | -59 | -91 |  |
| game-2-saintamant-staunton-1843 | single | 70 | Ng3 | Ottima | Ottima | Buona | 123 | 86 | 123 | 67 |  |
| game-2-saintamant-staunton-1843 | single | 75 | Nc3 | Buona | Ottima | Buona | -89 | -100 | -89 | -164 |  |
| game-2-saintamant-staunton-1843 | single | 79 | Rd1 | Errore | Imprecisione | Buona | -150 | -236 | -150 | -232 |  |
| game-2-saintamant-staunton-1843 | single | 86 | Qe7 | Imprecisione | Ottima | Imprecisione | 272 | 233 | 272 | 185 |  |
| game-2-saintamant-staunton-1843 | single | 91 | Qa2 | Buona | Imprecisione | Ottima | -290 | -436 | -290 | -298 |  |
| game-2-saintamant-staunton-1843 | single | 92 | Kf7 | Buona | Imprecisione | Errore | 435 | 250 | 435 | 238 |  |
| game-2-saintamant-staunton-1843 | single | 97 | Qc3 | Imprecisione | Ottima | Buona | -237 | -252 | -237 | -291 |  |
| game-2-saintamant-staunton-1843 | single | 101 | Qe1 | Buona | Imprecisione | Buona | -336 | -459 | -336 | -397 |  |
| game-2-saintamant-staunton-1843 | single | 106 | Qg4 | Migliore | Ottima | Buona | 473 | 425 | 473 | 376 |  |
| game-2-saintamant-staunton-1843 | single | 108 | Bxf4 | Buona | Imprecisione | Buona | 501 | 386 | 501 | 414 |  |
| game-2-saintamant-staunton-1843 | single | 109 | Bxf4 | Buona | Imprecisione | Ottima | -410 | -534 | -410 | -436 |  |
| game-2-saintamant-staunton-1843 | single | 120 | c2 | Migliore | Buona | Ottima | 604 | 523 | 604 | 546 |  |
| game-2-saintamant-staunton-1843 | single | 128 | Kxh6 | Ottima | Ottima | Buona | 726 | 709 | 726 | 624 |  |
| game-2-saintamant-staunton-1843 | single | 130 | Kg6 | Ottima | Ottima | Buona | 799 | 713 | 799 | 672 |  |
| game-2-saintamant-staunton-1843 | single | 132 | b4 | Ottima | Buona | Imprecisione | 965 | 764 | 965 | 704 |  |
| game-2-saintamant-staunton-1843 | pair | 11 | Bd3 | Imprecisione | Buona | Ottima | 41 | -9 | 32 | 6 |  |
| game-2-saintamant-staunton-1843 | pair | 38 | Ne7 | Ottima | Ottima | Migliore | -19 | -40 | -21 | -21 |  |
| game-2-saintamant-staunton-1843 | pair | 47 | Qc2 | Buona | Buona | Ottima | 100 | 28 | 34 | 25 |  |
| game-2-saintamant-staunton-1843 | pair | 55 | Qb3 | Imprecisione | Imprecisione | Buona | 17 | -73 | 0 | -62 |  |
| game-2-saintamant-staunton-1843 | pair | 69 | f4 | Imprecisione | Imprecisione | Ottima | -11 | -111 | -75 | -113 |  |
| game-2-saintamant-staunton-1843 | pair | 70 | Ng3 | Ottima | Ottima | Buona | 123 | 86 | 123 | 74 |  |
| game-2-saintamant-staunton-1843 | pair | 79 | Rd1 | Errore | Imprecisione | Buona | -150 | -236 | -141 | -203 |  |
| game-2-saintamant-staunton-1843 | pair | 91 | Qa2 | Buona | Imprecisione | Ottima | -290 | -436 | -267 | -318 |  |
| game-2-saintamant-staunton-1843 | pair | 117 | Bc1 | Ottima | Ottima | Buona | -521 | -582 | -387 | -482 |  |
| game-2-saintamant-staunton-1843 | pair | 121 | Bd2 | Buona | Ottima | Migliore | -564 | -590 | -569 | -569 |  |
| game-2-saintamant-staunton-1843 | pair | 131 | Ke1 | Ottima | Ottima | Migliore | -751 | -827 | -681 | -681 |  |
| game-2-saintamant-staunton-1843 | pair | 132 | b4 | Ottima | Buona | Migliore | 965 | 764 | 661 | 661 |  |

Stockfish 19/browser: NON ESEGUITO. Build e test sono verifiche del repository, non validazione del worker per questo esperimento.

## Tabelle aggregate

| Gruppo, single vs MultiPV interna | N cp | Media | Mediana | P90 | Max | Inversioni | mate/cp | mate/mate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| personal | 265 | 184.92 | 18 | 214 | 3136 | 4 | 6 | 24 |
| historical | 160 | 22.31 | 13 | 54 | 140 | 1 | 1 | 0 |
| all | 425 | 123.70 | 16 | 104 | 3136 | 5 | 7 | 24 |

| Confronto fuori MultiPV (136 mosse) | N cp | Media | Mediana | P90 | Max | Inversioni | mate/cp | mate/mate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| pair played vs single | 125 | 27.71 | 16 | 48 | 648 | 3 | 1 | 10 |
| pair played vs cached child (sign inverted) | 124 | 32.80 | 15.5 | 66 | 583 | 4 | 2 | 10 |
| pair cached-best candidate vs cached best | 126 | 38.75 | 15 | 70 | 652 | 1 | 3 | 7 |

## Casi mate/cp, inversioni e differenze >=1000 cp nel campione interno

| Partita | ply | SAN | single cp | single mate | cached cp | cached mate |
|---|---:|---|---:|---:|---:|---:|
| personal-01 | 32 | Bxf3 | 79 |  | -2 |  |
| personal-01 | 35 | Bc3 | -32 |  | 22 |  |
| personal-02 | 49 | Qf2+ | 1116 |  |  | 10 |
| personal-03 | 88 | Qd3+ | 934 |  | 3723 |  |
| personal-03 | 89 | Kg4 | -1061 |  | -3729 |  |
| personal-03 | 90 | Qxd4 | 1075 |  | 3737 |  |
| personal-03 | 91 | Kg5 | -1238 |  | -3737 |  |
| personal-03 | 92 | Qxc5+ | 601 |  | 3737 |  |
| personal-03 | 93 | f5 | -1267 |  | -3777 |  |
| personal-03 | 94 | Qg1+ | 670 |  | 3648 |  |
| personal-03 | 95 | Kf6 | -1271 |  | -3729 |  |
| personal-03 | 96 | Qf2 | 823 |  | 3648 |  |
| personal-03 | 97 | Ke5 | -1273 |  | -3706 |  |
| personal-03 | 98 | a5 | 1271 |  | 3718 |  |
| personal-03 | 99 | f6 | -1271 |  | -3729 |  |
| personal-03 | 100 | a4 | 1295 |  | 3718 |  |
| personal-03 | 101 | Ke6 | -1295 |  | -4401 |  |
| personal-03 | 103 | f7 | -4341 |  |  | -10 |
| personal-03 | 104 | a2 | 4341 |  |  | 10 |
| personal-03 | 116 | c4 | 4354 |  |  | 14 |
| personal-03 | 117 | Kf4 | -4383 |  |  | -12 |
| personal-04 | 53 | Qxg5+ | 1276 |  |  | 9 |
| personal-06 | 12 | Nxe5 | -21 |  | 3 |  |
| personal-06 | 13 | d4 | 21 |  | -9 |  |
| game-1-chigorin-steinitz-1892 | 61 | Rxf5+ | 841 |  |  | 8 |
| game-2-saintamant-staunton-1843 | 20 | Nc6 | -6 |  | 4 |  |

## Tempi reali

```json
{
  "single": 13.688110800000027,
  "pairAdditional": 7.9052493999999935,
  "repeat": 3.029722999999998,
  "total": 31.4750364
}
```

Lettura: nessuno schema sperimentale migliora entrambe le metriche nei due gruppi. La media interna è dominata dalla coda P3; non dimostra che searchmoves riduca il rumore. Ripetibilità a hash iniziale e ordine uguali non implica coerenza con un diverso percorso MultiPV. Nessun cambio di produzione consigliato sulla sola base di questo esperimento.

Nel single, quando la giocata coincide con la prima PV cached, il classificatore usa lo stesso score single per best e played e mantiene perdita zero, come la regola attuale per isEngineBest. Nel pair, la prima PV può cambiare fra i due candidati; non certifica la migliore globale.
