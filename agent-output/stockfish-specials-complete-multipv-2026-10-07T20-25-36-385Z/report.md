# Raccolta MultiPV completa — prova limitata

- searches: 15
- selected: 15
- budget: 200000
- cap: 4000000
- nominalNodes: 3000000
- actualNodes: 3002050
- capExceeded: false
- elapsedMs: 12336.400099999999
- sourceHashesUnchanged: true
- failure: null
- completeSnapshots: 15
- bestmoveDisagreements: 0
- recoveredComparisons: 15
- newLatestMixedDepth: 15
- newLatestDuplicates: 5
- appIntegration: false
- independentValidation: false

## Tutte le posizioni selezionate

| Partita | Ply | SAN | Atteso | Prima | Ultime righe | Blocco completo | Motivo | Depth | Nodi al blocco/finali |
|---|---:|---|---|---|---|---|---|---:|---|
| personal-01 | 13 | Bxc3 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 13 | 176366/200193 |
| personal-02 | 10 | e5 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 11 | 124334/200076 |
| personal-03 | 11 | Bxf6 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 11 | 173656/200160 |
| personal-04 | 18 | Bg6 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 13 | 133079/200101 |
| personal-05 | 25 | Bxg5 | Migliore | Migliore | Migliore | Grande | only-good-estimate | 13 | 70947/200132 |
| personal-06 | 15 | Qxd4 | Migliore | Migliore | Migliore | Grande | only-good-estimate | 15 | 194425/200127 |
| game-1-chigorin-steinitz-1892 | 21 | Bxd7+ | Migliore | Migliore | Migliore | Migliore | no-special-condition | 11 | 152704/200029 |
| game-2-saintamant-staunton-1843 | 8 | Nf6 | Libro | Migliore | Migliore | Migliore | no-special-condition | 13 | 197140/200279 |
| personal-01 | 14 | Nf6 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 13 | 176248/200164 |
| personal-02 | 12 | Bb4 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 12 | 125664/200217 |
| personal-03 | 12 | Qxf6 | Migliore | Migliore | Migliore | Grande | only-good-estimate | 13 | 96839/200092 |
| personal-04 | 22 | Qb4 | Grande | Migliore | Migliore | Migliore | no-special-condition | 12 | 158628/200071 |
| personal-06 | 33 | Bxf6 | Migliore | Migliore | Migliore | Migliore | no-special-condition | 14 | 123725/200220 |
| game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore | Migliore | Migliore | no-special-condition | 11 | 179929/200185 |
| game-2-saintamant-staunton-1843 | 9 | Nf3 | Libro | Migliore | Migliore | Migliore | no-special-condition | 13 | 183500/200004 |

## Metriche sui soli selezionati

- original: {"version":"original","moves":15,"matches":11,"categories":[{"category":"Grande","assigned":0,"expected":2,"tp":0,"fp":0,"fn":2},{"category":"Geniale","assigned":0,"expected":0,"tp":0,"fp":0,"fn":0}]}
- latest: {"version":"latest","moves":15,"matches":11,"categories":[{"category":"Grande","assigned":0,"expected":2,"tp":0,"fp":0,"fn":2},{"category":"Geniale","assigned":0,"expected":0,"tp":0,"fp":0,"fn":0}]}
- snapshot: {"version":"snapshot","moves":15,"matches":8,"categories":[{"category":"Grande","assigned":3,"expected":2,"tp":0,"fp":3,"fn":2},{"category":"Geniale","assigned":0,"expected":0,"tp":0,"fp":0,"fn":0}]}

## Totale con sostituzione parziale

- original: {"version":"original","moves":586,"matches":310,"categories":[{"category":"Grande","assigned":8,"expected":24,"tp":4,"fp":4,"fn":20},{"category":"Geniale","assigned":1,"expected":3,"tp":1,"fp":0,"fn":2}]}
- snapshot: {"version":"snapshot","moves":586,"matches":307,"categories":[{"category":"Grande","assigned":11,"expected":24,"tp":4,"fp":7,"fn":20},{"category":"Geniale","assigned":1,"expected":3,"tp":1,"fp":0,"fn":2}]}

Il confronto ultime righe/blocco usa la stessa ricerca reale. Il confronto con la baseline include anche l’effetto della nuova ricerca. Resto del campione non ricalcolato. Nessuna modifica alle soglie, app o QA. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
