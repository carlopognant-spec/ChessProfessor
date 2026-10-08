# Diagnosi del lock e continuazione della pulizia — 8 ottobre 2026

Ramo `cleanup/revisione-2026-10-08`, base originale `7d33608`.
Ripresa dal commit `a3de8bb`, su autorizzazione di Carlo a proseguire.
Nessun push, nessuna modifica al lock o alle sue venti dipendenze.

## Frecce

Commit `a52f1a3`: eliminato soltanto il blocco CSS
`.engine-arrow-overlay line` in `src/index.css`, che imponeva spessore 2.4,
linecap round e opacity 0.92. Il disegno ora usa strokeWidth e strokeOpacity
generati per ciascuna freccia in Board.jsx. Round rimane nell'attributo SVG.
L'opacità globale non attenua ulteriormente quella generata e lo spessore non
è più uniforme. Anche le punte SVG possono seguire la diversa larghezza.

Nessun test browser o ricerca motore reale eseguito. La verifica visiva resta
manuale; test unitari e build non provano l'aspetto finale nel browser.

## Verifiche della ripresa

Prima della modifica e dopo il commit delle frecce:

- Suite app: 25 file, 149 passati, zero skipped, 1 todo.
- Suite ricerca: 18 file, 112 passati.
- Build no-env: exit 0; avviso preesistente sul chunk oltre 500 kB.

Comandi: `npm test -- --config scripts/qa-no-env-test.config.js --cache false`,
`node --test` su tutti i file `scripts/*.test.js`,
`npm run build -- --config scripts/qa-no-env-build.config.js`.

Log locali nella cartella `agent-output/cleanup-review-2026-10-08/`, con
prefissi `resume-baseline` e `arrows`. Nessun caricamento di .env, lettura delle
partite riservate 7–10, nuova ricerca Stockfish o richiesta LLM.

## Risultati della diagnosi degli hash

La diagnosi confronta byte, SHA-256, blob Git e trasformazioni eseguite solo
in memoria. Non modifica nessun file protetto e non esegue il valutatore.

I 15 casi già identificati di conversione CRLF→LF coincidono con il lock dopo
normalizzazione. Le due dipendenze chess.js già coincidono senza conversione.
Per i tre casi inizialmente non chiariti:

| File | Risultato |
|---|---|
| src/lib/evaluation.js | Hash esatto del lock ricostruito dal testo di 7d33608 con CRLF, tranne le terminazioni delle righe 23–26 in LF. Il contenuto normalizzato è identico al commit. |
| src/lib/engineConfig.js | Hash esatto del lock ricostruito dal testo di 7d33608 con LF, tranne le terminazioni delle righe 26–34 in CRLF. Il contenuto normalizzato è identico al commit. |
| src/lib/classification.js | Causa non risolta. Nessuna corrispondenza nei 5 blob storici del file esaminati e nelle loro versioni CRLF; nemmeno nelle varianti semplici con/senza newline finale. Le ricostruzioni a uno/due intervalli di newline alternativi e quella basata sulle aggiunte dei diff storici non riproducono l'hash. |

Gli ultimi tentativi non esauriscono tutte le combinazioni possibili di newline
misti, né dimostrano che classification.js sia semanticamente diverso. Non
attribuire il problema a un cambiamento di soglie o formule senza evidenza.

I metadati delle prove sono nei file locali:

- cleanup-review-2026-10-08/lock-history-diagnosis.json
- cleanup-review-2026-10-08/lock-mixed-newline-diagnosis.json
- cleanup-review-2026-10-08/lock-classification-reconstruction.json
- cleanup-review-2026-10-08/lock-classification-two-range-diagnosis.json

Tutti i 20 file mantengono i byte registrati prima dell'intera pulizia. Il lock
resta incompatibile con alcuni byte del checkout Windows; il problema non è
corretto da questa diagnosi e il valutatore congelato non è stato collaudato.

Un'eventuale riparazione richiederebbe cambiare file protetti o la politica del
valutatore: non è compresa nell'autorizzazione corrente. Per classification.js,
la prova più utile sarebbe reperire la copia originale usata quando è stato
creato il lock e confrontarla, senza riscrivere gli hash di riferimento.

## Cache

Nessuna modifica. È stata richiesta la scelta tra cache unica di sessione senza
TTL (riuso fino a reset/evizione) e cache unica con TTL di 60 secondi (scadenza
uniforme, con possibili nuove ricerche al successivo riuso). La scelta resta
necessaria prima di cambiare il contratto di cache.

I refactoring B1–B6 rimangono esclusi. Nessun cambiamento a soglie, formule,
categorie sperimentali, report storici o distribuzioni Stockfish 16.
