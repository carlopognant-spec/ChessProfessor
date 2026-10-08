# Valutatore congelato Grande e Geniale

- version: "specials-frozen-candidate-v1"
- games: 1
- metrics: {"plies":51,"included":50,"labelled":50,"unlabelled":0,"overlaps":0,"categories":[{"category":"Grande","tp":1,"fp":0,"fn":1,"precision":1,"recall":0.5,"unlabelledAssignments":0},{"category":"Geniale","tp":0,"fp":0,"fn":0,"precision":null,"recall":null,"unlabelledAssignments":0}],"brilliantAbstentions":4,"grandeAbstentions":0}
- regression: null
- supplementalSearchesReused: 0
- searchesExecuted: 0
- retrainingExecuted: false
- sourceHashesUnchanged: true
- independentValidation: false
- appIntegration: false

| Partita | Ply | SAN | Riferimento | Previsto | Motivo Grande | Motivo Geniale |
|---|---:|---|---|---|---|---|
| personal-01 | 11 | Bd2 | Ottima | Ottima | protected-or-not-best | missing-acceptance-score |
| personal-01 | 23 | a4 | Ottima | Ottima | protected-or-not-best | missing-acceptance-score |
| personal-01 | 25 | Bb4 | Buona | Ottima | protected-or-not-best | missing-acceptance-score |
| personal-01 | 37 | Qe3 | Ottima | Ottima | protected-or-not-best | missing-acceptance-score |
| personal-01 | 45 | Qxc7 | Grande | Migliore | frozen-rule-no-match | no-material-offer |
| personal-01 | 47 | Qe5 | Grande | Grande | frozen-rule-match | no-material-offer |

Annotazioni assenti non sono negativi. Input forniti non sono automaticamente indipendenti. Score supplementari verificati contro UCI e manifest; nessuna ricerca automatica. Priorità Geniale sulle eventuali assegnazioni Grande, sovrapposizioni esplicite.

App, cache e file precedenti invariati. Nessun commit/push o lettura .env/7–10. Suite app/build/browser NON ESEGUITI.
