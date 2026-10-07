# Confronto post-raccolta con Chess.com

Annotazioni P1?P6 lette solo dopo chiusura e salvataggio dei risultati. Nessuna lettura 7?10.
TP=1; FP=0; non riconosciute=13; precisione osservata=1; richiamo osservato=0.07142857142857142.
Sessione parziale: 33 candidati non avviati, 1 candidato incompleto. Gli attesi non assegnati includono astensioni e casi non eseguiti: non sono tutti esclusioni verificate.
Campione development: non validazione indipendente. Un solo assegnato non consente stime affidabili della precisione.

| Partita | Ply | SAN | Attesa | Grande assegnata | Stato | Motivo |
|---|---:|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | false | rejected | unstable-score |
| personal-01 | 47 | Qe5 | Grande | false | not-run | eligible-for-full-root-experiment |
| personal-02 | 21 | Bxf7 | Grande | false | abstained | insufficient-score |
| personal-02 | 31 | Rxf2 | Grande | false | rejected | alternative-above-guard |
| personal-02 | 73 | Rd7+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-03 | 19 | Nxd6+ | Grande | false | abstained | insufficient-score |
| personal-03 | 42 | Bxe6 | Grande | true | verified-experimental | verified-under-experimental-policy |
| personal-04 | 22 | Qb4 | Grande | false | abstained | insufficient-score |
| personal-04 | 29 | Nd6+ | Grande | false | rejected | unstable-score |
| personal-05 | 16 | Nxh1 | Grande | false | abstained | insufficient-score |
| personal-05 | 27 | Qxa8 | Grande | false | abstained | insufficient-score |
| personal-05 | 37 | Bh6+ | Grande | false | excluded-by-initial-filter | missing-or-mate-primary-score |
| personal-06 | 13 | d4 | Grande | false | abstained | insufficient-score |
| personal-06 | 31 | Nd5 | Grande | false | abstained | insufficient-score |

Stati: {"abstained":40,"rejected":23,"verified-experimental":1,"incomplete":1}
Motivi: {"insufficient-score":40,"played-below-guard":9,"alternative-above-guard":6,"unstable-score":8,"verified-under-experimental-policy":1,"budget-cap":1}

I 6 hash delle annotazioni sono invariati. Nessuna modifica del classificatore. STOP.
