# Esperimento sul completamento di tattiche

Protocollo: ../stockfish-specials-continuation-v1-protocol.md. Soglie v1 invariate, zero nuove ricerche motore. V1 riprodotta esattamente prima del confronto.

| Gruppo | Versione | Categoria | TP | FP | FN |
|---|---|---|---:|---:|---:|
| development | v1 | Grande | 4 | 3 | 10 |
| development | v1 | Geniale | 1 | 0 | 0 |
| development | v2 | Grande | 3 | 3 | 11 |
| development | v2 | Geniale | 1 | 0 | 0 |
| historical | v1 | Grande | 0 | 1 | 10 |
| historical | v1 | Geniale | 0 | 0 | 2 |
| historical | v2 | Grande | 0 | 1 | 10 |
| historical | v2 | Geniale | 0 | 0 | 2 |
| all | v1 | Grande | 4 | 4 | 20 |
| all | v1 | Geniale | 1 | 0 | 2 |
| all | v2 | Grande | 3 | 4 | 21 |
| all | v2 | Geniale | 1 | 0 | 2 |

Cambiamenti: 1; falsi positivi corretti: 0; veri positivi persi: 1.

## Tutti i cambiamenti

| Partita | Ply | SAN | Atteso | V1 | V2 | Punto iniziale | Prefisso previsto |
|---|---:|---|---|---|---|---|---|
| personal-06 | 13 | d4 | Grande | Grande | Migliore | 11: Nxe5 | Nxe5 Nxe5 d4 |

Nessuna validazione indipendente. Cache, app e file precedenti invariati. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun nuovo commit/push.
