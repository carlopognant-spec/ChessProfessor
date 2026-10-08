# Valutatore congelato Grande e Geniale

- version: "specials-frozen-candidate-v1"
- games: 8
- metrics: {"plies":592,"included":586,"labelled":586,"unlabelled":0,"overlaps":0,"categories":[{"category":"Grande","tp":6,"fp":0,"fn":18,"precision":1,"recall":0.25,"unlabelledAssignments":0},{"category":"Geniale","tp":1,"fp":0,"fn":2,"precision":1,"recall":0.3333333333333333,"unlabelledAssignments":0}],"brilliantAbstentions":0,"grandeAbstentions":0}
- regression: {"comparedPlies":592,"allAssignmentsAndBrilliantReasonsMatch":true}
- supplementalSearchesReused: 30
- searchesExecuted: 0
- retrainingExecuted: false
- sourceHashesUnchanged: true
- independentValidation: false
- appIntegration: false

| Partita | Ply | SAN | Riferimento | Previsto | Motivo Grande | Motivo Geniale |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-01 | 47 | Qe5 | Grande | Grande | frozen-rule-match | no-material-offer |
| personal-02 | 21 | Bxf7 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-02 | 31 | Rxf2 | Grande | Migliore | frozen-rule-no-match | winning-nonsacrifice-alternative |
| personal-02 | 73 | Rd7+ | Grande | Grande | frozen-rule-match | winning-nonsacrifice-alternative |
| personal-03 | 19 | Nxd6+ | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-03 | 42 | Bxe6 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-04 | 22 | Qb4 | Grande | Grande | frozen-rule-match | no-material-offer |
| personal-04 | 29 | Nd6+ | Grande | Grande | frozen-rule-match | no-material-offer |
| personal-05 | 16 | Nxh1 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-05 | 27 | Qxa8 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-05 | 37 | Bh6+ | Grande | Grande | frozen-rule-match | winning-nonsacrifice-alternative |
| personal-06 | 11 | Nxe5 | Geniale | Geniale | preserve-brilliant | supported-material-offer |
| personal-06 | 13 | d4 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-06 | 31 | Nd5 | Grande | Migliore | frozen-rule-no-match | ordinary-exchanges |
| game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore | frozen-rule-no-match | poor-after-position |
| game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Grande | frozen-rule-match | ordinary-exchanges |
| game-1-chigorin-steinitz-1892 | 39 | e6+ | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-1-chigorin-steinitz-1892 | 43 | Re1 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-1-chigorin-steinitz-1892 | 45 | Qh5 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-1-chigorin-steinitz-1892 | 53 | Rb3 | Geniale | Ottima | protected-or-not-best | winning-nonsacrifice-alternative |
| game-1-chigorin-steinitz-1892 | 61 | Rxf5+ | Geniale | Migliore | frozen-rule-no-match | winning-nonsacrifice-alternative |
| game-2-saintamant-staunton-1843 | 56 | axb4 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore | frozen-rule-no-match | ordinary-exchanges |
| game-2-saintamant-staunton-1843 | 80 | Nxc3 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| game-2-saintamant-staunton-1843 | 82 | Bf3 | Grande | Migliore | frozen-rule-no-match | no-material-offer |

Annotazioni assenti non sono negativi. Input forniti non sono automaticamente indipendenti. Score supplementari verificati contro UCI e manifest; nessuna ricerca automatica. Priorità Geniale sulle eventuali assegnazioni Grande, sovrapposizioni esplicite.

App, cache e file precedenti invariati. Nessun commit/push o lettura .env/7–10. Suite app/build/browser NON ESEGUITI.
