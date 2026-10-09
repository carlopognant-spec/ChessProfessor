# Audit legale dei dieci doppi attacchi

Protocollo: [v1](../grande-fork-legal-v1-protocol.md). Dati già studiati; nessuna nuova ricerca o modifica alle categorie.

- cases: 10
- legalReplies: 159
- capturesEnumerated: 295
- recaptureMovesEnumerated: 7199
- enumerationMs: 1125
- engineSearches: 0
- sourceHashesUnchanged: true
- independentValidation: false
- classificationChanged: false
- groups: [{"group":"Grande","cases":5,"everyReplyAllowsCapture":1,"everyReplyAllowsPositiveImmediateIncrement":1},{"group":"other","cases":5,"everyReplyAllowsCapture":3,"everyReplyAllowsPositiveImmediateIncrement":2}]

| Partita / ply | Mossa | Riferimento | Risposte legali | Cattura sempre disponibile | Incremento positivo sempre disponibile dopo ricattura | Minimo incremento |
|---|---|---|---:|---|---|---:|
| personal-02 / 19 | Bc4 | Migliore | 35 | true | false | -1 |
| personal-02 / 43 | Rxf6+ | Ottima | 5 | true | true | 3 |
| personal-03 / 19 | Nxd6+ | Grande | 6 | false | false | non applicabile |
| personal-03 / 29 | Qxe5+ | Migliore | 6 | false | false | non applicabile |
| personal-04 / 29 | Nd6+ | Grande | 3 | true | true | 6 |
| personal-06 / 13 | d4 | Grande | 33 | false | false | non applicabile |
| personal-06 / 35 | Nxf6+ | Migliore | 2 | true | true | 6 |
| personal-06 / 37 | Nxd7 | Migliore | 31 | false | false | non applicabile |
| game-1-chigorin-steinitz-1892 / 39 | e6+ | Grande | 7 | false | false | non applicabile |
| game-2-saintamant-staunton-1843 / 80 | Nxc3 | Grande | 31 | false | false | non applicabile |

## Difese che impediscono un incremento materiale immediato positivo

- personal-02/19 Bc4: Be6, d5, Nd5, Bxc3.
- personal-02/43 Rxf6+: nessuna a questo orizzonte.
- personal-03/19 Nxd6+: Ke7, Kd7, Kd8, cxd6, Qxd6.
- personal-03/29 Qxe5+: Qe7.
- personal-04/29 Nd6+: nessuna a questo orizzonte.
- personal-06/13 d4: Bxd4, Nf3+, Nd3+.
- personal-06/35 Nxf6+: nessuna a questo orizzonte.
- personal-06/37 Nxd7: Rg8, Rh8, Rfe8, Rfd8, Rfc8, Nxd7, Nxf3+.
- game-1-chigorin-steinitz-1892/39 e6+: Qxe6, Kxe6.
- game-2-saintamant-staunton-1843/80 Nxc3: Qxc3.

## Limiti

Il saldo include la candidata, la risposta, la cattura di un bersaglio e l’eventuale ricattura immediata. L’incremento sottrae il guadagno già ottenuto dalla candidata. Il minimo non prova guadagno forzato a lungo termine: altre difese e mosse quiete successive non sono esplorate. Difensori geometrici e ricatture legali sono registrati separatamente. Le PV salvate non coprono tutte le risposte e non provano unicità o valore rispetto alle alternative.

Hash invariati, nessuna lettura .env/partite 7–10, nessun nuovo score, nessuna attivazione Grande/Geniale, nessun commit/push.
