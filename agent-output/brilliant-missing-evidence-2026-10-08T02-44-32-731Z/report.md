# Geniale — completamento delle accettazioni mancanti

Manifest congelato: ../brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json. Regole v3 invariate; campione già studiato.

- searchesExecuted: 30
- completedEstimates: 30
- nominalNodes: 6000000
- actualNodes: 6003955
- cap: 7500000
- capExceeded: false
- elapsedMs: 33025.3298
- wdlSupported: true
- failure: null
- sourceHashesUnchanged: true
- remainingAbstentions: 0
- changedRows: 26
- assignedAfter: 2
- independentValidation: false
- appIntegration: false
- metrics: [{"group":"development","version":"before","tp":1,"fp":0,"fn":0,"precision":1,"recall":1},{"group":"development","version":"after","tp":1,"fp":1,"fn":0,"precision":0.5,"recall":1},{"group":"historical","version":"before","tp":0,"fp":0,"fn":2,"precision":null,"recall":0},{"group":"historical","version":"after","tp":0,"fp":0,"fn":2,"precision":null,"recall":0},{"group":"all","version":"before","tp":1,"fp":0,"fn":2,"precision":1,"recall":0.3333333333333333},{"group":"all","version":"after","tp":1,"fp":1,"fn":2,"precision":0.5,"recall":0.3333333333333333}]

| Partita | Ply | SAN | Riferimento | Prima | Dopo | Esito |
|---|---:|---|---|---|---|---|
| personal-01 | 11 | Bd2 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| personal-01 | 23 | a4 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| personal-01 | 25 | Bb4 | Buona | missing-acceptance-score | ordinary-exchanges | false |
| personal-01 | 37 | Qe3 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| personal-02 | 26 | Bg4 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| personal-04 | 9 | Bf4 | Buona | missing-acceptance-score | ordinary-exchanges | false |
| personal-04 | 10 | e6 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| personal-04 | 55 | Rac1 | Migliore | missing-acceptance-score | supported-material-offer | true |
| personal-06 | 16 | d6 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| personal-06 | 31 | Nd5 | Grande | missing-acceptance-score | ordinary-exchanges | false |
| game-1-chigorin-steinitz-1892 | 33 | Ba3 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| game-1-chigorin-steinitz-1892 | 35 | Rb1 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 39 | Rac1 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 41 | Qd1 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 45 | Qd2 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 49 | Kh1 | Buona | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 51 | Nf5 | Imprecisione | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 57 | axb4 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 58 | Rc4 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 60 | Nf6 | Migliore | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 62 | Qc6 | Imprecisione | missing-acceptance-score | persistent-offer | false |
| game-2-saintamant-staunton-1843 | 64 | Qd7 | Buona | missing-acceptance-score | persistent-offer | false |
| game-2-saintamant-staunton-1843 | 65 | Kg1 | Ottima | missing-acceptance-score | ordinary-exchanges | false |
| game-2-saintamant-staunton-1843 | 68 | f5 | Ottima | missing-acceptance-score | persistent-offer | false |
| game-2-saintamant-staunton-1843 | 70 | Ng3 | Ottima | missing-acceptance-score | persistent-offer | false |
| game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | missing-acceptance-score | ordinary-exchanges | false |

WDL registrato come misura separata di auto-gioco Stockfish: non usato per cambiare soglie o etichette. Nessuna modifica ad app/Grande/cache, commit/push o lettura .env/7–10. Suite app/build/browser NON ESEGUITI.
