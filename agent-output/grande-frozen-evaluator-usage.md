# Confronto con il modello congelato

8 ottobre 2026. Strumento pronto; modello non collegato all'app. Nessun riaddestramento o ricerca motore: legge una partita e la relativa cache esistente. Ogni esecuzione riuscita scrive una nuova cartella agent-output, senza sovrascrivere sorgenti o QA.

## Ripetere il confronto sullo sviluppo

```powershell
node scripts/grande-frozen-evaluate.js --development
```

Whitelist: personali 1–6 e due storiche. Verifica che tutte le 592 previsioni riproducano il risultato prudente salvato. È riproducibilità, non nuova validazione: sei Grande corrette, zero false, diciotto mancate.

## Una partita già analizzata

```powershell
node scripts/grande-frozen-evaluate.js --fixture "percorso/partita.json" --cache "percorso/analisi.json"
```

Fixture: pgn completo, id facoltativo e annotations facoltativo. Annotazioni nel formato `{ "ply": 28, "san": "Qb5", "category": "Grande" }`, con SAN esatta. Annotazioni parziali accettate: una mossa senza riferimento non è un negativo.

Cache: PGN identico ed entries con ply, san, uci, fenBefore/fenAfter, engine e playedEngine. Metadati richiesti: packageVersion 19.0.0, searchLimit nodes/200000, multiPv 5, threads 1, hashMb 16, scorePerspective `side-to-move at each FEN`. Configurazioni diverse vengono rifiutate, senza conversioni silenziose. Il PGN con FEN iniziale viene ripercorso da quella posizione.

La CLI non genera la cache. Se una futura partita non ha un'analisi, la raccolta va eseguita separatamente. Una lista delle sole Grande non basta per misurare tutti i falsi positivi: occorre annotare anche le altre mosse assegnate.

## Output e controlli

- results.json contiene metadati, metriche, tutte le mosse e hash sorgenti.
- report.md mostra tutte le Grande assegnate/attese e i casi insufficienti.
- Le Grande non annotate sono separate; precisione/richiamo si calcolano sui riferimenti disponibili.
- Score mancanti restano ignoti. Cache incompleta, PGN diverso, SAN incoerente o annotazioni duplicate fanno fallire l'esecuzione.
- .env e percorsi delle partite 7–10 sono rifiutati prima della lettura, controllando anche il percorso reale; ID riservati rifiutati. Il campione riservato resta escluso.
- Un input fornito non viene automaticamente dichiarato indipendente: occorre verificare che non abbia guidato la scelta delle regole.
- Modello, filtro e predicati sono controllati per versione. Non cambiare il JSON mantenendo la stessa versione.

Modello: agent-output/grande-prudent-candidate-v1.json. Nessuna modifica all'app, a classification.js, curve/soglie, cache o file precedenti; nessun commit/push.
