# Grande — confronto dopo chiusura della raccolta

TP=1; FP=0; attese non riconosciute=13; attese irrisolte/non eseguite=1.
Precisione osservata=1; richiamo osservato=0.07142857142857142.
Observed recall counts every expected but unassigned label, including unresolved/unrun. Precision based on few predictions is not evidence of generalization. No thresholds changed after reading expected labels.

| Partita | Ply | SAN | Attesa | Grande assegnata | Stato | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | false | rejected | unstable-score |
| personal-01 | 47 | Qe5 | Grande | false | abstained | insufficient-score |
| personal-02 | 21 | Bxf7 | Grande | false | rejected | alternative-above-guard |
| personal-02 | 31 | Rxf2 | Grande | false | rejected | alternative-above-guard |
| personal-02 | 73 | Rd7+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-03 | 19 | Nxd6+ | Grande | false | rejected | unstable-score |
| personal-03 | 42 | Bxe6 | Grande | true | verified-experimental | verified-under-experimental-policy |
| personal-04 | 22 | Qb4 | Grande | false | rejected | alternative-above-guard |
| personal-04 | 29 | Nd6+ | Grande | false | rejected | unstable-score |
| personal-05 | 16 | Nxh1 | Grande | false | rejected | alternative-above-guard |
| personal-05 | 27 | Qxa8 | Grande | false | rejected | alternative-above-guard |
| personal-05 | 37 | Bh6+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-06 | 13 | d4 | Grande | false | rejected | played-below-guard |
| personal-06 | 31 | Nd5 | Grande | false | rejected | alternative-above-guard |

Annotazioni P1–P6 lette solo dopo chiusura della sessione. Sei hash verificati invariati. .env e Partite/7–10 non letti. Nessun commit/push. STOP.
