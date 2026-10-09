# Sacrificio e causalità: risultati

{
  "plies": 592,
  "reviewedMoves": 197,
  "statusCounts": {
    "new-offer": 93,
    "already-compensated": 30,
    "missing-score-coverage": 84,
    "currently-uncompensated": 6
  },
  "reusedSupplementarySearches": 32,
  "newSearches": 0,
  "classificationChanged": false,
  "sourceHashesUnchanged": true,
  "metrics": [
    {
      "category": "great",
      "tp": 11,
      "fp": 0,
      "fn": 13,
      "assigned": 11,
      "precision": 1,
      "recall": 0.4583333333333333
    },
    {
      "category": "brilliant",
      "tp": 1,
      "fp": 0,
      "fn": 2,
      "assigned": 1,
      "precision": 1,
      "recall": 0.3333333333333333
    },
    {
      "category": "missed",
      "tp": 3,
      "fp": 0,
      "fn": 7,
      "assigned": 3,
      "precision": 1,
      "recall": 0.3
    }
  ],
  "independentValidation": false
}

## personal-02/14 O-O

Riferimento: Ottima; categoria attuale: excellent; blocco: persistent-offer.

Bxa6: already-compensated. Score attuali dal lato di chi sacrifica: [{"source":"current-playedEngine","depth":11,"cpOpponent":58,"mateOpponent":null,"index":0.46381337976820525}]. Score precedenti: [{"rootUci":"f1a6","rows":[{"source":"previous-own-playedEngine","depth":13,"evalCpOpponent":24,"mateOpponent":null,"probabilityMover":0.48500449838059,"pv":["f1a6","b7a6","e1g1","d7d6","c3d5","f6d5","d1d5","a8b8","c2c3","c8e6","d5d3","b4c5","b2b3"],"raw":"info depth 13 seldepth 26 multipv 1 score cp 24 nodes 200141 nps 331908 hashfull 46 time 603 pv f1a6 b7a6 e1g1 d7d6 c3d5 f6d5 d1d5 a8b8 c2c3 c8e6 d5d3 b4c5 b2b3"},{"source":"intervening-root-engine","depth":13,"evalCpOpponent":24,"mateOpponent":null,"probabilityMover":0.48500449838059,"pv":["f1a6","b7a6","e1g1","d7d6","c3d5","f6d5","d1d5","a8b8","c2c3","c8e6","d5d3","b4c5","b2b3"],"raw":"info depth 13 seldepth 26 multipv 1 score cp 24 nodes 200141 nps 331908 hashfull 46 time 603 pv f1a6 b7a6 e1g1 d7d6 c3d5 f6d5 d1d5 a8b8 c2c3 c8e6 d5d3 b4c5 b2b3"}],"usableCount":2,"minProbability":0.48500449838059,"maxProbability":0.48500449838059}].

Alternative con la stessa offerta: [].
Variante di matto: null.

| Root | Depth | cp | Mate |
|---|---:|---:|---:|
| Qe7 | 11 | -7 |  |
| O-O | 11 | -31 |  |
| O-O | 10 | -26 |  |
| Bxc3+ | 10 | -64 |  |
| Nc5 | 10 | -99 |  |

## personal-04/55 Rac1

Riferimento: Migliore; categoria attuale: excellent; blocco: missing-acceptance-analysis.

Nxe4: new-offer. Score attuali dal lato di chi sacrifica: [{"source":"supplementary-200000-nodes-depth-168","depth":168,"cpOpponent":null,"mateOpponent":-3,"index":1}]. Score precedenti: [].

Alternative con la stessa offerta: [{"san":"Rab1","depth":19,"cp":null,"mate":5},{"san":"Rfc1","depth":19,"cp":null,"mate":5},{"san":"Rfb1","depth":19,"cp":null,"mate":6}].
Variante di matto: {"mateForMover":4,"depth":30,"legalReplies":15,"completeMatingPV":true,"san":["Nd5","Bxd5","a6","Bb7","f5","Qg7+","Kd8","Rc8#"],"proofAgainstEveryDefense":false}.

| Root | Depth | cp | Mate |
|---|---:|---:|---:|
| Rab1 | 19 |  | 5 |
| Rfc1 | 19 |  | 5 |
| Rac1 | 19 |  | 5 |
| Rfb1 | 19 |  | 6 |
| Qf6 | 18 |  | 7 |

## game-1-chigorin-steinitz-1892/53 Rb3

Riferimento: Geniale; categoria attuale: excellent; blocco: persistent-offer.

Qxh8: missing-score-coverage. Score attuali dal lato di chi sacrifica: [{"source":"supplementary-200000-nodes-depth-21","depth":21,"cpOpponent":-903,"mateOpponent":null,"index":0.9052955092424101},{"source":"supplementary-1000000-nodes-depth-28","depth":28,"cpOpponent":-977,"mateOpponent":null,"index":0.9200112574735666}]. Score precedenti: [{"rootUci":"c8h8","rows":[],"usableCount":0,"minProbability":null,"maxProbability":null}].

Alternative con la stessa offerta: [{"san":"h4","depth":13,"cp":642,"mate":null}].
Variante di matto: null.

| Root | Depth | cp | Mate |
|---|---:|---:|---:|
| g4 | 14 | 719 |  |
| Rb3 | 13 | 656 |  |
| h4 | 13 | 642 |  |
| Nf7 | 13 | 611 |  |
| Qf7+ | 13 | 515 |  |

## game-1-chigorin-steinitz-1892/55 Rf3

Riferimento: Migliore; categoria attuale: best; blocco: persistent-offer.

Rxh8: already-compensated. Score attuali dal lato di chi sacrifica: [{"source":"current-playedEngine","depth":14,"cpOpponent":-743,"mateOpponent":null,"index":0.8650052864928219}]. Score precedenti: [{"rootUci":"c8h8","rows":[{"source":"supplementary-200000-nodes-depth-21","depth":21,"evalCpOpponent":-903,"mateOpponent":null,"probabilityMover":0.9052955092424101,"pv":["c8h8","b3f3","h8g8","f3f5","f6g7","f5g5","g7h8","g5g8","a8g8","e1e7","g8g7","e7e8","g7g8","e8g8","h8g8","h5g4","g8f7","g4d4"],"raw":"info depth 21 seldepth 22 multipv 1 score cp -903 nodes 200186 nps 286389 hashfull 73 time 699 pv c8h8 b3f3 h8g8 f3f5 f6g7 f5g5 g7h8 g5g8 a8g8 e1e7 g8g7 e7e8 g7g8 e8g8 h8g8 h5g4 g8f7 g4d4"},{"source":"supplementary-1000000-nodes-depth-28","depth":28,"evalCpOpponent":-977,"mateOpponent":null,"probabilityMover":0.9200112574735666,"pv":["c8h8","g2g4","h8g8","h5f5","f6g7","e1e7","g7h8","b3b7","d4g7","e7g7","g8g7","b7g7","h8g7","f5e5","g7f7","e5c7","f7g8","c7c6","a8f8","c6d5","g8g7","g1f1","f8f7","d5g5","g7h8","g5d8","h8g7"],"raw":"info depth 28 seldepth 32 multipv 1 score cp -977 nodes 1000218 nps 315924 hashfull 388 time 3166 pv c8h8 g2g4 h8g8 h5f5 f6g7 e1e7 g7h8 b3b7 d4g7 e7g7 g8g7 b7g7 h8g7 f5e5 g7f7 e5c7 f7g8 c7c6 a8f8 c6d5 g8g7 g1f1 f8f7 d5g5 g7h8 g5d8 h8g7"}],"usableCount":2,"minProbability":0.9052955092424101,"maxProbability":0.9200112574735666}].

Alternative con la stessa offerta: [{"san":"Rg3","depth":13,"cp":732,"mate":null},{"san":"Rh3","depth":13,"cp":493,"mate":null},{"san":"Re2","depth":13,"cp":493,"mate":null}].
Variante di matto: null.

| Root | Depth | cp | Mate |
|---|---:|---:|---:|
| Rf3 | 13 | 769 |  |
| Rg3 | 13 | 732 |  |
| Rh3 | 13 | 493 |  |
| Re2 | 13 | 493 |  |
| Ra3 | 12 | 496 |  |

## game-1-chigorin-steinitz-1892/61 Rxf5+

Riferimento: Geniale; categoria attuale: best; blocco: winning-alternative-without-new-sacrifice.

Qxf5: new-offer. Score attuali dal lato di chi sacrifica: [{"source":"current-playedEngine","depth":42,"cpOpponent":null,"mateOpponent":-6,"index":1}]. Score precedenti: [].

Alternative con la stessa offerta: [].
Variante di matto: {"mateForMover":6,"depth":42,"legalReplies":1,"completeMatingPV":true,"san":["Qxf5","Qf8+","Kg5","Qxf5+","Kh6","Re7","Rxg4+","Qxg4","Bxf2+","Kxf2","d4","Re6#"],"proofAgainstEveryDefense":false}.

| Root | Depth | cp | Mate |
|---|---:|---:|---:|
| Rxf5+ | 15 | 1644 |  |
| g5+ | 15 | 983 |  |
| Qf8+ | 14 | 715 |  |
| Qf4 | 14 | 402 |  |
| Qh5 | 14 | 175 |  |

## Interpretazione

Rb3: Qxh8 è compensata nelle due ricerche esistenti (+903/+977 cp per il Bianco). La cattura precedente c8h8 non ha score disponibile: non possiamo chiamarla già compensata. h4 mantiene il medesimo cavallo in presa alla stessa depth di Rb3 e con score quasi uguale (+642 contro +656). La sola compensazione attuale non attribuisce la novità alla torre b3. Servirebbero score di Qxh8 dopo la precedente mossa propria e dopo h4, dalla FEN corretta con il Nero al tratto.

Rxf5+: Qxf5 è l’unica risposta legale. La stima mate -6 a depth 42 ha una PV completa fino al matto; Qf8+ conserva temporaneamente il sacrificio, Qxf5+ recupera la donna al quarto ply. Il sacrificio tattico è documentato. g5+ (+983 cp, depth 15) e Qf8+ (+715 cp, depth 14) risultano già molto favorevoli, ma non aver trovato mate in queste ricerche non dimostra che non esista. Non confrontare depth 42 e depth 15 come prove di unicità. Servirebbero ricerche comparabili sulle alternative, con budget fissato prima.

I controlli O-O/Rf3/Rac1 impediscono di equiparare ogni offerta compensata a una nuova Geniale. In particolare Rac1 ha alternative con lo stesso pezzo offerto e mate già stimato. Nessuna regola basata sulla SAN e nessuna promozione per assenza di prove contrarie.

Decisione: conservare le categorie v5. Il veto persistente è un criterio prudenziale di attribuzione, non una dimostrazione che il sacrificio fosse già buono. Il veto sulle alternative è una scelta locale sulla necessità del sacrificio, non nega il motivo tattico. Prima di modificarli mancano confronti causali e ricerche comparabili. Nessuna nuova ricerca, nessuna nuova classificazione; conteggio invariato 15/37 sul campione già studiato.
