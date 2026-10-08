# Valutazione del modello congelato Grande

- frozenVersion: "grande-prudent-candidate-v1"
- metrics: {"plies":592,"included":586,"labelled":586,"unlabelled":0,"expectedGrande":24,"scoredAssignments":6,"tp":6,"fp":0,"fn":18,"precision":1,"recall":0.25,"unlabelledGrande":0,"insufficient":0}
- games: 8
- searchesExecuted: 0
- retrainingExecuted: false
- sourceHashesUnchanged: true
- independentValidation: false
- appIntegration: false
- regression: {"comparedPlies":592,"allPredictionsMatch":true,"note":"All six cautious fold rules were identical to the final frozen rule. This replay is not new validation."}

## Tutte le Grande assegnate, attese e i casi insufficienti

| Partita | Ply | SAN | Riferimento | Previsto | Stato | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-01 | 47 | Qe5 | Grande | Grande | candidate | frozen-rule-match |
| personal-02 | 21 | Bxf7 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-02 | 31 | Rxf2 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-02 | 73 | Rd7+ | Grande | Grande | candidate | frozen-rule-match |
| personal-03 | 19 | Nxd6+ | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-03 | 42 | Bxe6 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-04 | 22 | Qb4 | Grande | Grande | candidate | frozen-rule-match |
| personal-04 | 29 | Nd6+ | Grande | Grande | candidate | frozen-rule-match |
| personal-05 | 16 | Nxh1 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-05 | 27 | Qxa8 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-05 | 37 | Bh6+ | Grande | Grande | candidate | frozen-rule-match |
| personal-06 | 13 | d4 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-06 | 31 | Nd5 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Grande | candidate | frozen-rule-match |
| game-1-chigorin-steinitz-1892 | 39 | e6+ | Grande | Migliore | rejected | frozen-rule-no-match |
| game-1-chigorin-steinitz-1892 | 43 | Re1 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-1-chigorin-steinitz-1892 | 45 | Qh5 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-2-saintamant-staunton-1843 | 56 | axb4 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-2-saintamant-staunton-1843 | 80 | Nxc3 | Grande | Migliore | rejected | frozen-rule-no-match |
| game-2-saintamant-staunton-1843 | 82 | Bf3 | Grande | Migliore | rejected | frozen-rule-no-match |

Le annotazioni mancanti non sono negativi. Precisione/recall riguardano soltanto le mosse annotate e incluse. Input incompleti o incoerenti fanno fallire la raccolta; score mancanti rimangono Non valutabile o insufficienti. Ruolo di nuovi input non dichiarato automaticamente indipendente.

Modello non riaddestrato; nessuna ricerca motore. App/cache/file precedenti intatti. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
