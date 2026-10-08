# Grande mancanti — famiglie e controfattuale

Protocollo: ../grande-missed-families-v1-protocol.md. Diagnosi su riferimenti già studiati; nessun nuovo fitting o modifica al modello.

- plies: 592
- missedGrande: 18
- missedFamilies: {"capture-after-error":5,"capture-without-error":4,"quiet-without-error":9}
- eligiblePositives: 24
- eligibleNegatives: 164
- featureCounts: [{"feature":"check","positives":6,"negatives":9},{"feature":"answerToCheck","positives":2,"negatives":17},{"feature":"recapture","positives":1,"negatives":26},{"feature":"geometricDoubleAttack","positives":5,"negatives":5},{"feature":"kingAndQueenAttack","positives":2,"negatives":1}]
- metrics: [{"group":"development","field":"grandeAssigned","tp":5,"fp":0,"fn":9},{"group":"development","field":"relaxedAssignment","tp":9,"fp":6,"fn":5},{"group":"historical","field":"grandeAssigned","tp":1,"fp":0,"fn":9},{"group":"historical","field":"relaxedAssignment","tp":2,"fp":2,"fn":8},{"group":"all","field":"grandeAssigned","tp":6,"fp":0,"fn":18},{"group":"all","field":"relaxedAssignment","tp":11,"fp":8,"fn":13}]
- additionalAssignments: 13
- searchesExecuted: 0
- modelChanged: false
- sourceHashesUnchanged: true
- independentValidation: false
- appIntegration: false

| Partita | Giocata | Famiglia | Scacco | Possibile doppio attacco geometrico | Matto segnalato | Precedente categoria numerica |
|---|---|---|---|---|---|---|
| personal-01 | 23.Qxc7 | capture-without-error | false | false | false | g5: inaccuracy |
| personal-02 | 11.Bxf7 | capture-after-error | false | false | false | Kf8: blunder |
| personal-02 | 16.Rxf2 | capture-after-error | false | false | false | Bxf2+: blunder |
| personal-03 | 10.Nxd6+ | capture-without-error | true | true | false | a6: good |
| personal-03 | 21...Bxe6 | capture-after-error | false | false | false | Re6+: blunder |
| personal-05 | 8...Nxh1 | capture-after-error | false | false | false | Qe2: blunder |
| personal-05 | 14.Qxa8 | capture-without-error | false | false | false | Nf2: good |
| personal-06 | 7.d4 | quiet-without-error | false | true | false | Nxe5: best |
| personal-06 | 16.Nd5 | quiet-without-error | false | false | false | b4: excellent |
| game-1-chigorin-steinitz-1892 | 13.Nc4 | quiet-without-error | false | false | false | Nh6: good |
| game-1-chigorin-steinitz-1892 | 14...c6 | quiet-without-error | false | false | false | a4: best |
| game-1-chigorin-steinitz-1892 | 20.e6+ | quiet-without-error | true | true | false | Kxf7: best |
| game-1-chigorin-steinitz-1892 | 22.Re1 | quiet-without-error | false | false | false | Qc8: inaccuracy |
| game-1-chigorin-steinitz-1892 | 23.Qh5 | quiet-without-error | false | false | false | Kf6: inaccuracy |
| game-2-saintamant-staunton-1843 | 28...axb4 | capture-without-error | false | false | false | Qb3: good |
| game-2-saintamant-staunton-1843 | 38...Ne4 | quiet-without-error | false | false | false | Nc3: excellent |
| game-2-saintamant-staunton-1843 | 40...Nxc3 | capture-after-error | false | true | false | Rd1: mistake |
| game-2-saintamant-staunton-1843 | 41...Bf3 | quiet-without-error | false | false | false | Qxc3: best |

## Tutte le assegnazioni nuove togliendo solo il veto sulle prese

- personal-01, ply 32, Bxf3: riferimento Migliore; famiglia capture-after-error.
- personal-02, ply 18, Rxf7: riferimento Migliore; famiglia capture-after-error.
- personal-02, ply 21, Bxf7: riferimento Grande; famiglia capture-after-error.
- personal-02, ply 31, Rxf2: riferimento Grande; famiglia capture-after-error.
- personal-03, ply 29, Qxe5+: riferimento Migliore; famiglia capture-after-error.
- personal-03, ply 42, Bxe6: riferimento Grande; famiglia capture-after-error.
- personal-04, ply 24, hxg5: riferimento Migliore; famiglia capture-after-error.
- personal-05, ply 16, Nxh1: riferimento Grande; famiglia capture-after-error.
- personal-05, ply 25, Bxg5: riferimento Migliore; famiglia capture-after-error.
- personal-06, ply 33, Bxf6: riferimento Migliore; famiglia capture-after-error.
- game-1-chigorin-steinitz-1892, ply 38, Kxf7: riferimento Migliore; famiglia capture-after-error.
- game-1-chigorin-steinitz-1892, ply 61, Rxf5+: riferimento Geniale; famiglia capture-after-error.
- game-2-saintamant-staunton-1843, ply 80, Nxc3: riferimento Grande; famiglia capture-after-error.

Attacchi geometrici non provano forchette vincenti; PV non provano unicità. Il controfattuale non modifica il valutatore congelato. Nessun motore avviato o modifica ad app/cache; nessun commit/push. Suite app/build/browser NON ESEGUITI.
