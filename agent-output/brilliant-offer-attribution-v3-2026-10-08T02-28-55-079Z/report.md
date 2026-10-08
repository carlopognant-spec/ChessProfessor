# Geniale v3 — attribuzione dell’offerta

Ipotesi ricavata da errori già osservati: risultato di sviluppo, nessuna validazione indipendente. Protocollo: ../brilliant-offer-attribution-v3-protocol.md.

| Gruppo | Versione | TP | FP | FN | Precisione | Richiamo |
|---|---|---:|---:|---:|---:|---:|
| development | v1 | 1 | 0 | 0 | 1 | 1 |
| development | v2 | 1 | 1 | 0 | 0.5 | 1 |
| development | v3 | 1 | 0 | 0 | 1 | 1 |
| historical | v1 | 0 | 0 | 2 | n/d | 0 |
| historical | v2 | 0 | 1 | 2 | 0 | 0 |
| historical | v3 | 0 | 0 | 2 | n/d | 0 |
| all | v1 | 1 | 0 | 2 | 1 | 0.3333333333333333 |
| all | v2 | 1 | 2 | 2 | 0.3333333333333333 | 0.3333333333333333 |
| all | v3 | 1 | 0 | 2 | 1 | 0.3333333333333333 |

## Variazioni complete

- personal-02, ply 14, O-O: true → false; riferimento Ottima; persistent-offer; [{"replyUci":"f1a6","offeredSquare":"a6","status":"persistent","reason":"previously-legally-capturable","earlierCaptures":[{"san":"Bxa6","uci":"f1a6"}],"laterRecoveryPly":4,"continuation":[{"san":"Bxa6","uci":"f1a6","captured":"n","materialDelta":-3,"mate":false},{"san":"Qc7","uci":"d8c7","captured":null,"materialDelta":-3,"mate":false},{"san":"Nd3","uci":"e5d3","captured":null,"materialDelta":-3,"mate":false},{"san":"Bxc3+","uci":"b4c3","captured":"n","materialDelta":0,"mate":false},{"san":"bxc3","uci":"b2c3","captured":"b","materialDelta":-3,"mate":false},{"san":"bxa6","uci":"b7a6","captured":"b","materialDelta":0,"mate":false},{"san":"e5","uci":"e4e5","captured":null,"materialDelta":0,"mate":false},{"san":"Ne4","uci":"f6e4","captured":null,"materialDelta":0,"mate":false}]}].
- game-1-chigorin-steinitz-1892, ply 55, Rf3: true → false; riferimento Migliore; persistent-offer; [{"replyUci":"a8h8","offeredSquare":"h8","status":"persistent","reason":"previously-legally-capturable","earlierCaptures":[{"san":"Qxh8","uci":"c8h8"}],"laterRecoveryPly":4,"continuation":[{"san":"Rxh8","uci":"a8h8","captured":"n","materialDelta":-3,"mate":false},{"san":"g4","uci":"g2g4","captured":null,"materialDelta":-3,"mate":false},{"san":"h6","uci":"h7h6","captured":null,"materialDelta":-3,"mate":false},{"san":"gxf5","uci":"g4f5","captured":"n","materialDelta":0,"mate":false},{"san":"Kg7","uci":"f6g7","captured":null,"materialDelta":0,"mate":false},{"san":"Rg3+","uci":"f3g3","captured":null,"materialDelta":0,"mate":false},{"san":"Kf8","uci":"g7f8","captured":null,"materialDelta":0,"mate":false},{"san":"Qh4","uci":"h5h4","captured":null,"materialDelta":0,"mate":false}]}].

## Riferimenti Geniale

- personal-06, ply 11, Nxe5: true; supported-material-offer.
- game-1-chigorin-steinitz-1892, ply 53, Rb3: false; winning-nonsacrifice-alternative.
- game-1-chigorin-steinitz-1892, ply 61, Rxf5+: false; winning-nonsacrifice-alternative.

Astensioni: 26. Positivi veri persi: 0. Nessuna nuova ricerca, commit/push o modifica ad app/Grande/cache. Suite app/build/browser NON ESEGUITI.
