# Grande — regole verificate lasciando fuori una partita

Protocollo: ../grande-leave-game-out-v1-protocol.md. Dati personali già usati per sviluppo: il confronto per partita non è una validazione nuova indipendente. Storiche già esaminate, tenute fuori dall’addestramento.

| Gruppo | Metodo | Assegnate | TP | FP | FN | Precisione | Richiamo |
|---|---|---:|---:|---:|---:|---:|---:|
| development | v1-known-development-baseline | 7 | 4 | 3 | 10 | 57.1% | 28.6% |
| development | cautious | 5 | 5 | 0 | 9 | 100.0% | 35.7% |
| development | exploratory | 11 | 5 | 6 | 9 | 45.5% | 35.7% |
| historical | v1-known-development-baseline | 1 | 0 | 1 | 10 | 0.0% | 0.0% |
| historical | cautious | 1 | 1 | 0 | 9 | 100.0% | 10.0% |
| historical | exploratory | 1 | 1 | 0 | 9 | 100.0% | 10.0% |

## Regole in tutti i modelli

### cautious, esclusa personal-01
Training: 99 mosse, 12 Grande.
- afterError AND non capture; nuovi TP training=4, FP=0, stima interna=83.3%.

### cautious, esclusa personal-02
Training: 94 mosse, 11 Grande.
- afterError AND non capture; nuovi TP training=4, FP=0, stima interna=83.3%.

### cautious, esclusa personal-03
Training: 75 mosse, 12 Grande.
- afterError AND non capture; nuovi TP training=5, FP=0, stima interna=85.7%.

### cautious, esclusa personal-04
Training: 97 mosse, 12 Grande.
- afterError AND non capture; nuovi TP training=3, FP=0, stima interna=80.0%.

### cautious, esclusa personal-05
Training: 107 mosse, 11 Grande.
- afterError AND non capture; nuovi TP training=4, FP=0, stima interna=83.3%.

### cautious, esclusa personal-06
Training: 98 mosse, 12 Grande.
- afterError AND non capture; nuovi TP training=5, FP=0, stima interna=85.7%.

### cautious, esclusa historical-separate
Training: 114 mosse, 14 Grande.
- afterError AND non capture; nuovi TP training=5, FP=0, stima interna=85.7%.

### exploratory, esclusa personal-01
Training: 99 mosse, 12 Grande.
- afterError AND non recapture; nuovi TP training=7, FP=2, stima interna=72.7%.

### exploratory, esclusa personal-02
Training: 94 mosse, 11 Grande.
- afterError AND non capture; nuovi TP training=4, FP=0, stima interna=83.3%.

### exploratory, esclusa personal-03
Training: 75 mosse, 12 Grande.
- afterError AND non capture; nuovi TP training=5, FP=0, stima interna=85.7%.
- largeComparableGap AND non winningPrimary; nuovi TP training=3, FP=1, stima interna=66.7%.

### exploratory, esclusa personal-04
Training: 97 mosse, 12 Grande.
- afterError AND non recapture; nuovi TP training=6, FP=2, stima interna=70.0%.
- largeComparableGap AND non recapture; nuovi TP training=3, FP=2, stima interna=57.1%.

### exploratory, esclusa personal-05
Training: 107 mosse, 11 Grande.
- afterError AND non capture; nuovi TP training=4, FP=0, stima interna=83.3%.
- largeComparableGap AND non winningPrimary; nuovi TP training=3, FP=2, stima interna=57.1%.

### exploratory, esclusa personal-06
Training: 98 mosse, 12 Grande.
- afterError AND non recapture; nuovi TP training=8, FP=2, stima interna=75.0%.

### exploratory, esclusa historical-separate
Training: 114 mosse, 14 Grande.
- afterError AND non capture; nuovi TP training=5, FP=0, stima interna=85.7%.
- afterError AND majorCapture; nuovi TP training=3, FP=1, stima interna=66.7%.

## Tutte le previsioni Grande e tutte le Grande attese

| Politica | Partita | Ply | SAN | Atteso | Previsto |
|---|---|---:|---|---|---|
| cautious | personal-01 | 45 | Qxc7 | Grande | Migliore |
| cautious | personal-01 | 47 | Qe5 | Grande | Grande |
| cautious | personal-02 | 21 | Bxf7 | Grande | Migliore |
| cautious | personal-02 | 31 | Rxf2 | Grande | Migliore |
| cautious | personal-02 | 73 | Rd7+ | Grande | Grande |
| cautious | personal-03 | 19 | Nxd6+ | Grande | Migliore |
| cautious | personal-03 | 42 | Bxe6 | Grande | Migliore |
| cautious | personal-04 | 22 | Qb4 | Grande | Grande |
| cautious | personal-04 | 29 | Nd6+ | Grande | Grande |
| cautious | personal-05 | 16 | Nxh1 | Grande | Migliore |
| cautious | personal-05 | 27 | Qxa8 | Grande | Migliore |
| cautious | personal-05 | 37 | Bh6+ | Grande | Grande |
| cautious | personal-06 | 13 | d4 | Grande | Migliore |
| cautious | personal-06 | 31 | Nd5 | Grande | Migliore |
| cautious | game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore |
| cautious | game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore |
| cautious | game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Grande |
| cautious | game-1-chigorin-steinitz-1892 | 39 | e6+ | Grande | Migliore |
| cautious | game-1-chigorin-steinitz-1892 | 43 | Re1 | Grande | Migliore |
| cautious | game-1-chigorin-steinitz-1892 | 45 | Qh5 | Grande | Migliore |
| cautious | game-2-saintamant-staunton-1843 | 56 | axb4 | Grande | Migliore |
| cautious | game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore |
| cautious | game-2-saintamant-staunton-1843 | 80 | Nxc3 | Grande | Migliore |
| cautious | game-2-saintamant-staunton-1843 | 82 | Bf3 | Grande | Migliore |
| exploratory | personal-01 | 32 | Bxf3 | Migliore | Grande |
| exploratory | personal-01 | 45 | Qxc7 | Grande | Migliore |
| exploratory | personal-01 | 47 | Qe5 | Grande | Grande |
| exploratory | personal-02 | 21 | Bxf7 | Grande | Migliore |
| exploratory | personal-02 | 31 | Rxf2 | Grande | Migliore |
| exploratory | personal-02 | 73 | Rd7+ | Grande | Grande |
| exploratory | personal-03 | 12 | Qxf6 | Migliore | Grande |
| exploratory | personal-03 | 19 | Nxd6+ | Grande | Migliore |
| exploratory | personal-03 | 42 | Bxe6 | Grande | Migliore |
| exploratory | personal-04 | 22 | Qb4 | Grande | Grande |
| exploratory | personal-04 | 24 | hxg5 | Migliore | Grande |
| exploratory | personal-04 | 29 | Nd6+ | Grande | Grande |
| exploratory | personal-04 | 31 | Nxb5 | Migliore | Grande |
| exploratory | personal-04 | 41 | Qxb8+ | Migliore | Grande |
| exploratory | personal-05 | 16 | Nxh1 | Grande | Migliore |
| exploratory | personal-05 | 27 | Qxa8 | Grande | Migliore |
| exploratory | personal-05 | 37 | Bh6+ | Grande | Grande |
| exploratory | personal-06 | 13 | d4 | Grande | Migliore |
| exploratory | personal-06 | 31 | Nd5 | Grande | Migliore |
| exploratory | personal-06 | 33 | Bxf6 | Migliore | Grande |
| exploratory | game-1-chigorin-steinitz-1892 | 25 | Nc4 | Grande | Migliore |
| exploratory | game-1-chigorin-steinitz-1892 | 28 | c6 | Grande | Migliore |
| exploratory | game-1-chigorin-steinitz-1892 | 31 | Nd6+ | Grande | Grande |
| exploratory | game-1-chigorin-steinitz-1892 | 39 | e6+ | Grande | Migliore |
| exploratory | game-1-chigorin-steinitz-1892 | 43 | Re1 | Grande | Migliore |
| exploratory | game-1-chigorin-steinitz-1892 | 45 | Qh5 | Grande | Migliore |
| exploratory | game-2-saintamant-staunton-1843 | 56 | axb4 | Grande | Migliore |
| exploratory | game-2-saintamant-staunton-1843 | 76 | Ne4 | Grande | Migliore |
| exploratory | game-2-saintamant-staunton-1843 | 80 | Nxc3 | Grande | Migliore |
| exploratory | game-2-saintamant-staunton-1843 | 82 | Bf3 | Grande | Migliore |

Geniale v1 conservata; nessun nuovo modello Geniale addestrato. Zero nuove ricerche motore, soglie e file precedenti intatti. Hash sorgenti invariati. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
