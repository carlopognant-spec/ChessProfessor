# Valutatore offline congelato Grande e Geniale

Versione: [specials-frozen-candidate-v1](specials-frozen-candidate-v1.json), sperimentale e non attivata nell'app. Combina Grande prudente v1 e Geniale con confronto stessa offerta v4. Non riaddestra e non avvia ricerche motore. Le venti dipendenze congelate, incluso il codice chess.js effettivamente risolto, sono controllate tramite SHA-256: se cambiano, il comando fallisce invece di valutare con una politica diversa.

## Verifica sui dati già studiati

```powershell
node scripts/specials-frozen-evaluate.js --development
```

Ripercorre solo personali 1–6 e le due storiche, riutilizzando le 30 accettazioni già analizzate. [Risultato eseguito](specials-frozen-evaluation-2026-10-08T02-58-22-772Z/report.md): tutte le 592 assegnazioni e i motivi Geniale coincidono con gli esperimenti separati.

| Categoria | Corrette | Errate | Mancate |
|---|---:|---:|---:|
| Grande | 6 | 0 | 18 |
| Geniale | 1 | 0 | 2 |

Nessuna sovrapposizione osservata. Zero errori nel campione non dimostra precisione perfetta; nessuna validazione indipendente. I motivi vengono riportati separatamente, così una Geniale esclusa non viene automaticamente promossa a Grande.

## Una partita fornita

```powershell
node scripts/specials-frozen-evaluate.js --fixture percorso/partita.json --cache percorso/analisi.json
```

Fixture: `{ "id": "nuova-partita", "pgn": "...", "annotations": [{ "ply": 11, "san": "Nxe5", "category": "Geniale" }] }`. Le annotazioni possono essere parziali o assenti: non diventano falsi positivi e non entrano nei rilevatori. Il PGN e le SAN devono coincidere con la cache. Per misurare precisione e richiamo su una partita intera occorrono etichette complete, comprese quelle ordinarie.

Cache: stesso formato delle cache QA già presenti, Stockfish 19.0.0, 200.000 nodi, MultiPV 5, Threads 1, Hash 16 MB, score dalla prospettiva del lato al tratto a ciascuna FEN. PGN/FEN/catena incoerenti o configurazione diversa fanno fallire la valutazione. Il comando non produce la cache e non assume che una nuova partita sia indipendente dalle scelte di sviluppo.

L'esecuzione reale su personale 1 con questa interfaccia, senza supplementi, ha confermato una Grande corretta e una mancata, nessuna Geniale assegnata e quattro astensioni Geniale: [risultato](specials-frozen-evaluation-2026-10-08T02-58-43-543Z/report.md). Non vengono inventate valutazioni per colmare i dati mancanti.

## Prove supplementari già raccolte

```powershell
node scripts/specials-frozen-evaluate.js --fixture percorso/partita.json --cache percorso/analisi.json --evidence percorso/results.json --manifest percorso/manifest.json
```

Le due opzioni sono obbligatorie insieme. Il formato supportato è quello del completamento delle accettazioni: manifest con `configuration` e `schedule`, risultati con `summary` e `searches`. Stockfish 19 WASM large-single, MultiPV 1, Threads 1, Hash 16 MB e reset dell'hash per ricerca; budget supportati 200.000 o 1.000.000 nodi. Ricerche con stato incompleto non diventano score favorevoli.

Ogni score deve coincidere con l'ultima riga UCI completa senza bound per la radice richiesta; FEN/radice/budget devono essere presenti nel manifest, la PV deve essere legale e non ci devono essere radici supplementari duplicate. I supplementi vengono usati solo per la FEN e la risposta corrispondenti. WDL non sostituisce la formula esistente. Non usare questo controllo come certificazione che una ricerca sia esaustiva o che una PV provi vittoria contro tutte le difese.

## Output e stato

Ogni esecuzione crea una nuova cartella `agent-output/specials-frozen-evaluation-<timestamp>/` con `results.json` e `report.md`: categorie, motivi per entrambi i rilevatori, evidenze, hash, metriche sulle sole mosse annotate e astensioni. Priorità esplicita Geniale, poi Grande, poi categoria comune; le eventuali sovrapposizioni vengono conteggiate.

Le previsioni restano uguali cambiando o eliminando le annotazioni: verificato con test. I percorsi `.env` e delle partite riservate 7–10 sono rifiutati prima della lettura. Nessuna modifica a file precedenti, app o cache, nessun commit/push. 27 test mirati superati: 6 integrazione, 10 confronto stessa offerta, 9 Grande congelata, 2 controllo percorsi. Suite app/build/browser NON ESEGUITI.

Questo passaggio consolida e rende ripetibile ciò che abbiamo misurato. Non aumenta il richiamo e non costituisce approvazione per attivare le etichette nell'app. Nuove partite con riferimenti documentati potranno essere valutate con questa versione prima di ulteriori modifiche.
