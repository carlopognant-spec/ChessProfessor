# Grande — confronto dopo chiusura della raccolta

TP=2; FP=1; attese non riconosciute=12; attese irrisolte/non eseguite=3.
Precisione osservata=0.6666666666666666; richiamo osservato=0.14285714285714285.
Observed recall counts every expected but unassigned label, including unresolved/unrun. Precision based on few predictions is not evidence of generalization. No thresholds changed after reading expected labels.

| Partita | Ply | SAN | Attesa | Grande assegnata | Stato | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | false | incomplete | missing-roots-or-second-budget |
| personal-01 | 47 | Qe5 | Grande | false | abstained | insufficient-score |
| personal-02 | 21 | Bxf7 | Grande | false | rejected | alternative-above-guard |
| personal-02 | 31 | Rxf2 | Grande | false | rejected | alternative-above-guard |
| personal-02 | 73 | Rd7+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-03 | 19 | Nxd6+ | Grande | true | verified-experimental | verified-branch-a |
| personal-03 | 42 | Bxe6 | Grande | true | verified-experimental | verified-branch-a |
| personal-03 | 46 | Rxg8 | Migliore | true | verified-experimental | verified-branch-a |
| personal-04 | 22 | Qb4 | Grande | false | rejected | alternative-above-guard |
| personal-04 | 29 | Nd6+ | Grande | false | incomplete | missing-roots-or-second-budget |
| personal-05 | 16 | Nxh1 | Grande | false | rejected | alternative-above-guard |
| personal-05 | 27 | Qxa8 | Grande | false | rejected | alternative-above-guard |
| personal-05 | 37 | Bh6+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-06 | 13 | d4 | Grande | false | rejected | played-below-guard |
| personal-06 | 31 | Nd5 | Grande | false | rejected | alternative-above-guard |

Annotazioni P1–P6 lette solo dopo chiusura della sessione. Sei hash verificati invariati. .env e Partite/7–10 non letti. Nessun commit/push. STOP.
