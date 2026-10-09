# Primo confronto esterno: Vienna Gambit

Fonte delle etichette: [articolo dell’autore](https://adventuresofachessnoob.com/2022/08/22/brilliant-vienna-gambit-my-subscriber-goes-super-saiyan/). Mosse verificate attraverso la [API pubblica](https://api.chess.com/pub/player/yosoyfood/games/2022/08).

Regole v5 fissate prima della raccolta; partita selezionata per quattro esempi positivi. Le etichette del 2022 sono riferite dall’autore: non rappresentano necessariamente il Game Review attuale. Rating 1028/1058; il classificatore locale non usa una calibrazione per rating.

- version: "counterfactual-v5"
- searches: 50
- nominalNodes: 10000000
- actualNodes: 9630726
- cap: 10200000
- capExceeded: false
- failure: null
- labelledMoves: 4
- matches: 2
- unlabelledSpecials: 0
- falsePositivesMeasurable: false
- sourceHashesUnchanged: true
- appChanged: false
- independentOfTrainingGames: true
- representativeValidation: false
- annotationProvenance: "author-reported Chess.com Game Review, August 2022; not fresh platform labels"
- transportRecovery: {"previousAttempt":"agent-output/external-specials-probe-2026-10-09T14-01-30-480Z/results.json","reusedSearches":1,"newlyExecutedSearches":49,"previousFailedSearchActualNodes":null,"previousFailedSearchNominalNodes":200000,"cumulativeActualNodesAcrossAttemptsKnown":false,"reason":"align runner with app; latest unbounded PV1 may differ from bestmove; empty completed evidence stays insufficient"}

| Ply | Mossa | Riferimento | Risultato | Motivo Grande | Motivo Geniale |
|---:|---|---|---|---|---|
| 15 | Bxf4 | brilliant | best | not-eligible | missing-acceptance-analysis |
| 17 | Bxf7+ | brilliant | brilliant | not-eligible | compensated-new-offer |
| 19 | Qxf3 | great | best | not-eligible | no-material-offer |
| 21 | Qh5+ | great | great | best-noncapture-after-opponent-error | no-material-offer |

Le mosse non annotate restano sconosciute, non negativi. Nessuna soglia aggiornata in base ai risultati; nessun fitting, nessuna integrazione nell’app e nessun riutilizzo come test indipendente dopo eventuali modifiche future.
