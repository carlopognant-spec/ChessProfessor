# Compensazione corroborata: confronto completo

- version: "stable-compensation-v1-candidate"
- newSearches: 0
- plies: 617
- baselineReproduced: true
- sourceHashesUnchanged: true
- independentlyValidated: false
- appDefaultChanged: false
- metrics: {"baseline":{"development":[{"category":"great","tp":11,"fp":0,"fn":13},{"category":"brilliant","tp":1,"fp":0,"fn":2},{"category":"missed","tp":3,"fp":0,"fn":7}],"publicExamples":[{"category":"great","tp":1,"fp":0,"fn":1},{"category":"brilliant","tp":1,"fp":0,"fn":1},{"category":"missed","tp":0,"fp":0,"fn":0}]},"coverageOnly":{"development":[{"category":"great","tp":11,"fp":0,"fn":13},{"category":"brilliant","tp":1,"fp":0,"fn":2},{"category":"missed","tp":3,"fp":0,"fn":7}],"publicExamples":[{"category":"great","tp":1,"fp":0,"fn":1},{"category":"brilliant","tp":1,"fp":0,"fn":1},{"category":"missed","tp":0,"fp":0,"fn":0}]},"corroborated":{"development":[{"category":"great","tp":11,"fp":0,"fn":13},{"category":"brilliant","tp":1,"fp":0,"fn":2},{"category":"missed","tp":3,"fp":0,"fn":7}],"publicExamples":[{"category":"great","tp":1,"fp":0,"fn":1},{"category":"brilliant","tp":2,"fp":0,"fn":0},{"category":"missed","tp":0,"fp":0,"fn":0}]}}
- changed: 1
- coverageSources: 172
- confirmationSources: 76

| Partita/ply | Mossa | Riferimento | V5 | Sola copertura | Conferma | Motivo finale |
|---|---|---|---|---|---|---|
| external-vienna-53976549565/15 | Bxf4 | brilliant | best | best | brilliant | compensated-new-offer |

Il confronto pubblico ora è dato di sviluppo: l’ipotesi deriva da Bxf4. Le mosse non annotate non sono negativi. Nessuna ricerca aggiuntiva e nessuna modifica alla politica predefinita.
