# Classificatore semplice Stockfish — primo risultato

Protocollo: ../stockfish-specials-root-reuse-v1-protocol.md. Zero nuove ricerche; dati di sviluppo, nessuna validazione indipendente. Categorie dell’app non modificate.

| Gruppo | Categoria | Attesi | Assegnati | TP | FP | FN | Precisione | Richiamo |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| development | Grande | 14 | 7 | 4 | 3 | 10 | 57.1% | 28.6% |
| development | Geniale | 1 | 1 | 1 | 0 | 0 | 100.0% | 100.0% |
| historical | Grande | 10 | 1 | 0 | 1 | 10 | 0.0% | 0.0% |
| historical | Geniale | 2 | 0 | 0 | 0 | 2 | n/d | 0.0% |
| all | Grande | 24 | 8 | 4 | 4 | 20 | 50.0% | 16.7% |
| all | Geniale | 3 | 1 | 1 | 0 | 2 | 100.0% | 33.3% |

## Concordanza globale

- development: v1 originale 216/393; nuova categoria comune 214/393; dopo 216/393. Esclusi 6 (Forzata e matto dato).
- historical: v1 originale 94/193; nuova categoria comune 95/193; dopo 94/193. Esclusi 0 (Forzata e matto dato).
- all: v1 originale 310/586; nuova categoria comune 309/586; dopo 310/586. Esclusi 6 (Forzata e matto dato).

Root sostituiti: 0; cambiamenti: 0; correzioni: 0; concordanze perse: 0.

## Tutte le assegnazioni, gli attesi non riconosciuti e i cambiamenti

| Partita | Ply | Mossa | Atteso | V1 | Base nuova | Prototipo | Fonte | Motivo |
|---|---:|---|---|---|---|---|---|---|
| personal-01 | 45 | Qxc7 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| personal-01 | 47 | Qe5 | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| personal-02 | 21 | Bxf7 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| personal-02 | 31 | Rxf2 | Grande | Grande | Migliore | Grande | current-root | opponent-error-opportunity |
| personal-02 | 73 | Rd7+ | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| personal-03 | 19 | Nxd6+ | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| personal-03 | 29 | Qxe5+ | Migliore | Grande | Migliore | Grande | current-root | only-winning-estimate |
| personal-03 | 42 | Bxe6 | Grande | Grande | Migliore | Grande | current-root | only-good-estimate |
| personal-03 | 46 | Rxg8 | Migliore | Grande | Migliore | Grande | current-root | only-good-estimate |
| personal-04 | 22 | Qb4 | Grande | Migliore | Migliore | Migliore | original-unusable | invalid-or-duplicate-roots |
| personal-04 | 29 | Nd6+ | Grande | Migliore | Migliore | Migliore | original-unusable | invalid-or-duplicate-roots |
| personal-04 | 31 | Nxb5 | Migliore | Grande | Migliore | Grande | current-root | only-good-estimate |
| personal-05 | 16 | Nxh1 | Grande | Grande | Migliore | Grande | current-root | only-winning-estimate |
| personal-05 | 27 | Qxa8 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| personal-05 | 37 | Bh6+ | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| personal-06 | 11 | Nxe5 | Geniale | Geniale | Migliore | Geniale | current-root | accepted-sacrifice |
| personal-06 | 13 | d4 | Grande | Grande | Migliore | Grande | current-root | only-good-estimate |
| personal-06 | 31 | Nd5 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| game-1-chigorin-steinitz-1892 | 39 | e6+ | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-1-chigorin-steinitz-1892 | 43 | Re1 | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| game-1-chigorin-steinitz-1892 | 45 | Qh5 | Grande | Migliore | Migliore | Migliore | original-unusable | invalid-or-duplicate-roots |
| game-1-chigorin-steinitz-1892 | 53 | Rb3 | Geniale | Ottima | Ottima | Ottima | original-unusable | protected-or-not-best |
| game-1-chigorin-steinitz-1892 | 61 | Rxf5+ | Geniale | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-2-saintamant-staunton-1843 | 56 | axb4 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore | Migliore | Migliore | current-root | no-special-condition |
| game-2-saintamant-staunton-1843 | 80 | Nxc3 | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| game-2-saintamant-staunton-1843 | 82 | Bf3 | Grande | Migliore | Migliore | Migliore | original-unusable | different-root-depths |
| game-2-saintamant-staunton-1843 | 112 | Rxe2 | Migliore | Grande | Migliore | Grande | current-root | only-good-estimate |

MultiPV e PV sono stime, non prove di tutte le alternative. Un solo positivo Geniale limita fortemente qualsiasi conclusione. Le soglie di questa esecuzione non sono state modificate dopo il confronto.

Verifiche: replay delle partite e delle PV candidate; hash di 18 sorgenti invariati. .env e partite 7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun push.
