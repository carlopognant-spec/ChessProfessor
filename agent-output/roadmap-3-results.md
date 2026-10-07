# Roadmap 3 — esito e limiti

## 3.1

Diagnosi offline completata su cache esistenti P1–P6/H1–H2, senza ricerche. Mossa mancata: 1 TP, 0 FP, 9 FN su sviluppo sia SF16/depth12 sia large19/200k; richiamo 10%. Il 100% di precisione si basa su una sola previsione e non valida la regola.

Grande e Geniale NON implementate: le cinque linee disponibili non dimostrano l'unicità fra tutte le mosse legali né sacrificio, miglior difesa e controfattuale. Nessuna soglia inventata per imitare le 14 Grande e 1 Geniale attese. Il piano precedente conserva i requisiti per un eventuale esperimento separato.

## 3.2

Precisione per Bianco/Nero aggiunta al resoconto e ricostruita anche dalle analisi archiviate, senza nuove ricerche o modifica del formato salvato. Formula arrotondata pubblicata da Lichess, senza bonus +1 presente nel codice lila; media tra aggregazione ponderata per volatilità e media armonica. Clamp cp/matto ±1000, stallo 0; FEN iniziale realmente analizzata, poi risultati playedEngine lungo la stessa sequenza. Mancanze e bound non diventano punteggi zero. Analisi parziali dichiarate in UI.

Fonti: https://lichess.org/page/accuracy e https://github.com/lichess-org/lila/blob/2e653ad1e2b9fad31b4a092394019ef8fafdedb8/modules/analyse/src/main/AccuracyPercent.scala . La Precisione così ottenuta non equivale al modello privato chess.com. Tabella per partita/lato e diagnostica: roadmap-3-1-3-2/report.md e results.json. 24 file fixture/cache verificati con hash invariati, go=0.

Confronto Precisione chess.com (correlazione/scarto): NON ESEGUITO, valori per lato non disponibili.

## 3.3

NON ESEGUITO: richiesti per P1–P6 e ciascun lato Precisione chess.com, Punteggio partita, Elo reale e impostazione della revisione. Nessuna formula cp→Elo arbitraria e nessuna stima presentata come attendibile. Appena disponibili, consentiranno confronto e progettazione del modello; non usare Partite/7–10 per tararlo.

## Audit

Completata ricognizione statica e revisione manuale dei risultati: code-audit.md e code-audit-static.json. Segnalati codice legacy senza uso nell'app, duplicazioni semantiche e disallineamento del contesto chat durante navigazione. Nessuna pulizia automatica, nessuna modifica a soglie, modello di classificazione, Libro o cap. Nessun commit/push.

## Verifiche reali

- npm test -- --config scripts/qa-no-env-test.config.js --cache false: exit 0; 25 file passati, 144 passed, 1 skipped, 1 todo (146), durata 5,83 s. Suite completa, nessuna esclusione aggiunta; envDir isolato.
- npm run build -- --config scripts/qa-no-env-build.config.js: exit 0; 73 modules transformed, built in 2.26s. Warning Vite sul chunk del repertorio >500 kB; WASM large 99.102,79 kB nel solo dist ignorato.
- npm run test:browser: exit 0; 15 passed (1.3m), incluse prove con motore reale. Nessuna cache QA generata; il go=0 del report si riferisce al ricalcolo offline, non ai test browser.
- git diff --check: exit 0, nessun errore whitespace; avvisi Git LF?CRLF per tre file modificati.
- node scripts/qa-roadmap-report.js: exit 0, 24 hash invariati; node scripts/audit-code.cjs: exit 0, 86 file, zero gruppi clone esatto. Prima esecuzione audit fallita per nome exports in CommonJS, corretto in exportRecords; nessuna analisi motore coinvolta.

File nuovi di questo passaggio: src/lib/accuracy.js, src/components/AccuracySummary.jsx, tests/accuracy.test.js, scripts/qa-roadmap-report.js, scripts/audit-code.cjs, agent-output/roadmap-3-1-3-2/{report.md,results.json}, agent-output/{code-audit.md,code-audit-static.json,roadmap-3-results.md}. File modificati: src/components/AnalysisSummary.jsx, playwright-check.spec.js, HANDOFF-ChessProfessor.md. agent-output/roadmap-3-1-plan.md era gi� pendente dal passaggio precedente. dist � output ignorato della build; gli artefatti browser tracciati sono stati ripristinati.
