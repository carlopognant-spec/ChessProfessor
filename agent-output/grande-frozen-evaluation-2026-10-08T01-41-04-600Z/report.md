# Valutazione del modello congelato Grande

- frozenVersion: "grande-prudent-candidate-v1"
- metrics: {"plies":51,"included":50,"labelled":50,"unlabelled":0,"expectedGrande":2,"scoredAssignments":1,"tp":1,"fp":0,"fn":1,"precision":1,"recall":0.5,"unlabelledGrande":0,"insufficient":0}
- games: 1
- searchesExecuted: 0
- retrainingExecuted: false
- sourceHashesUnchanged: true
- independentValidation: false
- appIntegration: false
- regression: null

## Tutte le Grande assegnate, attese e i casi insufficienti

| Partita | Ply | SAN | Riferimento | Previsto | Stato | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | Migliore | rejected | frozen-rule-no-match |
| personal-01 | 47 | Qe5 | Grande | Grande | candidate | frozen-rule-match |

Le annotazioni mancanti non sono negativi. Precisione/recall riguardano soltanto le mosse annotate e incluse. Input incompleti o incoerenti fanno fallire la raccolta; score mancanti rimangono Non valutabile o insufficienti. Ruolo di nuovi input non dichiarato automaticamente indipendente.

Modello non riaddestrato; nessuna ricerca motore. App/cache/file precedenti intatti. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
