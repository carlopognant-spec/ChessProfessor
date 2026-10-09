# Categorie speciali: audit della prima implementazione

Confronto su dati già studiati, senza nuove ricerche o fitting. Le vecchie cache non contengono gli snapshot MultiPV completi ora raccolti dal worker: i confronti usano solo linee distinte alla stessa profondità.

- version: "counterfactual-v6"
- plies: 592
- metrics: [{"category":"great","tp":11,"fp":0,"fn":13,"assigned":11,"precision":1,"recall":0.4583333333333333},{"category":"brilliant","tp":1,"fp":0,"fn":2,"assigned":1,"precision":1,"recall":0.3333333333333333},{"category":"missed","tp":3,"fp":0,"fn":7,"assigned":3,"precision":1,"recall":0.3}]
- changed: 12
- sourceHashesUnchanged: true
- independentValidation: false
- newSearches: 0
- reasons: {"grande:rejected:not-eligible":313,"brilliant:rejected:not-eligible":239,"brilliant:rejected:no-material-offer":171,"grande:insufficient:missing-or-conflicting-played-score":126,"brilliant:insufficient:missing-or-conflicting-played-score":126,"brilliant:candidate:missing-acceptance-analysis":13,"grande:insufficient:incomplete-common-depth-snapshot":124,"grande:insufficient:duplicate-or-illegal-roots":12,"brilliant:insufficient:duplicate-or-illegal-roots":12,"brilliant:rejected:persistent-offer":23,"grande:supported:best-noncapture-after-opponent-error":6,"grande:supported:equilibrium-recovery":1,"grande:protected:forced-or-terminal":3,"brilliant:protected:forced-or-terminal":3,"grande:candidate:decision-novelty-not-established":3,"grande:supported:critical-defense":3,"brilliant:rejected:winning-alternative-without-new-sacrifice":2,"grande:supported:critical-winning-choice":1,"brilliant:rejected:ordinary-exchange":1,"brilliant:candidate:unresolved-immediate-recovery":1,"brilliant:supported:compensated-new-offer":1}

| Partita / ply | Giocata | Riferimento | Prima | Dopo |
|---|---|---|---|---|
| personal-01/47 | Qe5 | Grande | best | great |
| personal-02/21 | Bxf7 | Grande | best | great |
| personal-02/73 | Rd7+ | Grande | best | great |
| personal-03/19 | Nxd6+ | Grande | best | great |
| personal-03/42 | Bxe6 | Grande | best | great |
| personal-04/22 | Qb4 | Grande | best | great |
| personal-04/29 | Nd6+ | Grande | best | great |
| personal-05/16 | Nxh1 | Grande | best | great |
| personal-05/37 | Bh6+ | Grande | best | great |
| personal-06/11 | Nxe5 | Geniale | best | brilliant |
| personal-06/13 | d4 | Grande | best | great |
| game-1-chigorin-steinitz-1892/31 | Nd6+ | Grande | best | great |

Grande è una decisione critica rispetto alle alternative confrontabili, con copertura dichiarata. Geniale richiede offerta nuova, compensazione nelle accettazioni legali coperte, niente recupero immediato irrisolto e confronto con alternative vincenti senza nuova offerta. Dati insufficienti mantengono la categoria numerica. Questi risultati non dimostrano equivalenza con Chess.com.
