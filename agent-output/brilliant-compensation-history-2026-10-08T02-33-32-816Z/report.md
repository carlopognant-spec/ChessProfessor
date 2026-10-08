# Compensazione delle offerte persistenti

Protocollo: ../brilliant-compensation-history-v1-protocol.md. Confronto temporale, non causale. Nessuna nuova classificazione.

- plies: 592
- materialOffers: 213
- persistentOffers: 120
- statusCounts: {"already-compensated":11,"currently-uncompensated":6,"missing-score-coverage":103,"new-offer":93}
- searchesExecuted: 0
- sourceHashesUnchanged: true
- appIntegration: false
- independentValidation: false
- causalAttributionEstablished: false
- classificationChanged: false

## Tre riferimenti e due falsi positivi v2

- personal-02 14 O-O (Ottima): Bxa6: already-compensated; ora 0.46381337976820525–0.46381337976820525; prima f1a6 0.48500449838059–0.48500449838059
- personal-06 11 Nxe5 (Geniale): Nxe5: new-offer; ora 0.5131219861822434–0.5131219861822434; prima non confrontabile
- game-1-chigorin-steinitz-1892 53 Rb3 (Geniale): Qxh8: missing-score-coverage; ora ?–?; prima c8h8 ?–?
- game-1-chigorin-steinitz-1892 55 Rf3 (Migliore): Rxh8: missing-score-coverage; ora 0.8650052864928219–0.8650052864928219; prima c8h8 ?–?
- game-1-chigorin-steinitz-1892 61 Rxf5+ (Geniale): Qxf5: new-offer; ora 1–1; prima non confrontabile

## Tutte le offerte precedentemente sfavorevoli ora compensate


Score diversi da ricerche diverse/depth diverse non provano miglioramento causato dalla mossa. Mancanza di score non equivale a sacrificio sfavorevole. Nessun uso di Elo stimato. App/Grande/cache invariati, nessuna nuova ricerca/commit/push. Suite app/build/browser NON ESEGUITI.
