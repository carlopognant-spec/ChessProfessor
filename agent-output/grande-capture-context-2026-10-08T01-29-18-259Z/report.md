# Grande — ampliamento con il contesto delle prese

Protocollo: ../grande-capture-context-v1-protocol.md. Costo FP, supporto minimo e complessità del modello prudenti invariati. Personali predette fuori dal rispettivo training; storiche fuori da tutti i training. Dati già studiati: nessuna validazione indipendente.

| Gruppo | Metodo | TP | FP | FN | Assegnazioni |
|---|---|---:|---:|---:|---:|
| development | priorPrudent | 5 | 0 | 9 | 5 |
| development | predicted | 5 | 1 | 9 | 6 |
| historical | priorPrudent | 1 | 0 | 9 | 1 |
| historical | predicted | 1 | 0 | 9 | 1 |
| all | priorPrudent | 6 | 0 | 18 | 6 |
| all | predicted | 6 | 1 | 18 | 7 |

Nuovi positivi: 0; positivi persi: 0; nuovi falsi positivi: 1.

## Tutti i cambiamenti

| Partita | Ply | SAN | Atteso | Prudente precedente | Nuovo |
|---|---:|---|---|---|---|
| personal-04 | 31 | Nxb5 | Migliore | Migliore | Grande |

## Tutti i modelli

### Esclusa personal-01
- afterError AND non capture; nuovi TP training 4; FP 0.

### Esclusa personal-02
- afterError AND non capture; nuovi TP training 4; FP 0.

### Esclusa personal-03
- afterError AND non capture; nuovi TP training 5; FP 0.

### Esclusa personal-04
- largeComparableGap AND opponentCanRecapture; nuovi TP training 4; FP 0.
- afterError AND non capture; nuovi TP training 3; FP 0.

### Esclusa personal-05
- afterError AND non capture; nuovi TP training 4; FP 0.

### Esclusa personal-06
- afterError AND non capture; nuovi TP training 5; FP 0.

### Esclusa historical-separate
- afterError AND non capture; nuovi TP training 5; FP 0.

Geniale invariata. Zero nuove ricerche motore, app/cache/file precedenti invariati. .env/7–10 non letti. Suite app/build/browser NON ESEGUITI. Nessun commit/push.
