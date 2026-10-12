# Confronto dopo il miglioramento dei dati numerici

- reviewPolicy: "review-reliability-v1"
- specialPolicy: "counterfactual-v6"
- plies: 592
- before: 326
- after: 329
- corrected: 3
- regressed: 0
- changes: 3
- evidence: {"coherent":368,"independent":209,"conflicting":12,"terminal":3}
- newSearches: 0
- independentValidation: false
- frozenSourcesUnchanged: true

| Categoria attesa | Totale | Prima corrette | Dopo corrette | Falsi positivi dopo |
|---|---:|---:|---:|---:|
| Libro | 58 | 56 | 56 | 2 |
| Migliore | 178 | 120 | 120 | 60 |
| Ottima | 121 | 83 | 83 | 132 |
| Buona | 94 | 17 | 17 | 35 |
| Imprecisione | 57 | 17 | 17 | 23 |
| Errore | 36 | 10 | 10 | 8 |
| Errore grave | 8 | 8 | 8 | 3 |
| Mossa mancata | 10 | 3 | 3 | 0 |
| Grande | 24 | 11 | 11 | 0 |
| Geniale | 3 | 1 | 1 | 0 |
| Forzata | 3 | 0 | 3 | 0 |
| Non valutabile | 0 | 0 | 0 | 0 |

## Cambiamenti

- personal-02/52 Kxf7: Migliore -> Forzata; attesa Forzata.
- personal-03/32 Kxe7: Migliore -> Forzata; attesa Forzata.
- personal-04/42 Ke7: Migliore -> Forzata; attesa Forzata.

## Interpretazione

Il guadagno di concordanza riguarda le tre Forzate. Le altre etichette restano invariate sulle cache originarie, che non contengono snapshot completati. Il confronto coerente migliora il percorso delle nuove analisi; qui si verifica la regressione, non un aumento dimostrato per Buona, Imprecisione o Errore. Nessun fitting, rating o nuova curva.

Indipendente significa confronto indicativo fra due ricerche; conflicting significa perdita grezza negativa fra quelle stime. Le etichette numeriche restano conservate e il limite è mostrato nel resoconto. La prima scelta del motore mantiene perdita zero nella stessa ricerca. Libro e Forzata conservano la categoria numerica separata.

Le partite sono già studiate: nessuna validazione indipendente o equivalenza con Chess.com è dichiarata. Nessuna lettura delle partite riservate 7–10 e nessuna nuova ricerca motore.
