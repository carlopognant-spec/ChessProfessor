# Grande v3 integrata — 1 novembre 2026

Worktree: `work/grande-candidate-20261030`. Nessun commit, push o deploy.
Questo documento aggiorna il checkpoint offline di `GRANDE-V3-CLOSURE.md`.

## Percorso applicativo unico

- `gameAnalysis.analyzeGame`: calcolo numerico/speciale esistente, refresh della
  mossa precedente e fase finale `classifyGrandeCandidateV3`. Il contesto interno
  pubblicato rimane distinto dagli esiti emessi; ogni aggiornamento emette solo
  etichette e decisioni finali coerenti. I risultati del motore non cambiano.
- `reviewMoves.reclassifyAnalysisMoves`: stessa fase pubblicata, poi stessa v3;
  elimina lo stato candidato precedente prima del ricalcolo. L'esportazione
  `reclassifyReviewedMoves` conserva lo stadio pubblicato per gli studi v1/v2,
  non è un secondo percorso applicativo selezionabile.
- `App.handleOpenArchive`: riclassifica una copia prima di mostrare o trasferire
  le righe a `EnginePanel`, evitando un primo rendering con etichette vecchie.
  Gli archivi con profili motore obsoleti mantengono l'avviso e il ricalcolo
  esplicito esistenti; non sono spacciati per analisi correnti.
- `analysisRefinement.selectRefinementView`: passa dal medesimo ingresso finale.
  L'ammissibilità precedente per la verifica esplicita delle Grandi empiriche
  resta nei metadati: un verdetto inconcludente non nasconde il comando di verifica.
- `reviewPractice.prepareLegacyPracticeEntries`: usa la riclassificazione finale
  solo per selezionare indizi; giudizio e tentativi richiedono le verifiche fresche
  già previste. Grande/Migliore non diventano errori da ripassare.
- Navigazione e `analysisPresentation` continuano a risolvere la riga per la
  posizione effettiva. Tabella, `ClassificationDetails` e spiegazioni leggono
  lo stesso risultato. La decisione registra anche `policy.grandeVersion` e
  `candidateAssessment`; la versione è visibile nell'interfaccia.
- Il wrapper `displaySpecialMoves` aggiorna insieme etichetta, assessment e
  decisione della sola proiezione visuale. Disattivare le categorie speciali
  non lascia una spiegazione da Grande/Geniale e non cambia i dati da salvare.

L'archivio resta invariato come schema e API. Aprire non riscrive IndexedDB;
un salvataggio esplicito conserva `classificationOrigin` e le prove con i merge
esistenti. I dati legacy senza criteri mantengono un'origine con `policy: null`.
Per un'analisi fresca lo stadio interno pubblicato non viene inventato come
decisione storica. Nessun import di fixture o file temporanei nell'app.

## Prove supplementari reali

La normale analisi conserva il budget esistente. Per Qxa8, Nd5 e Bf3 è già
disponibile il comando opt-in **Verifica le scelte decisive**:

1. `buildNativeProofPlan` seleziona le candidate e recupera le ricerche compatibili;
2. `refineNativeProofs` richiede solo le posizioni mancanti e scrive
   `refinement.nativeProof`; le tre famiglie possono bastare con la coppia
   prima/dopo, senza alternative aggiuntive;
3. la v3 verifica il pacchetto e il certificato, con possibilità di riuso
   successivo tramite archivio e approfondimenti.

Budget opt-in preesistente: un milione di nodi per posizione, MultiPV 5,
massimo 12 mosse e 24 posizioni. Nessun incremento automatico per ogni mossa.
I test del flusso usano le vere cache archiviate al posto del callback motore;
lo smoke di produzione riapre una prova salvata. Non sono state raccolte nuove
ricerche per Qxa8/Nd5/Bf3 e non si garantisce che ogni futura ricerca produca
un pacchetto sufficiente. I pacchetti degli studi restano solo fixture finché
non vengono realmente prodotti o salvati nell'archivio dell'utente.

## Limiti conservati

Soglie, v1/v2, dieci file protetti e aperture sospese invariati. Nessun replay
aggiuntivo dei 857 esempi e nessun benchmark. Restano i risultati e i limiti
quantitativi del checkpoint offline, che non è validazione indipendente.

Nf5 resta Ottima; Qg6 e la cattura ordinaria dello scaccante Qxf6 restano Migliori.
Una Grande ereditata è indicata come compatibilità, mai come nuova conferma tattica.
I confronti supplementari di Nxe4 e d5 possono rimanere inconcludenti quando il
contesto opponente non coincide con quello validato. I pacchetti restano salvati:
non si rilassano le regole per ottenere l'etichetta. Per Nxe4 il percorso che
mantiene un contesto valido conserva invece Grande come ereditata contestuale.
I test storici ora verificano esplicitamente questi diversi esiti e il limite
del solo confronto numerico. Non si avviano altri cicli di candidate.

## Verifiche della versione locale

Suite Vitest completa: **98 file PASS, 992 test PASS, 1 TODO preesistente**.
Esecuzione finale del 1 novembre 2026: 260,45 secondi. Include test mirati v3,
integrazione live/cache/archivio, prove supplementari, ripasso e altre categorie.
Le prime esecuzioni avevano rilevato aspettative della policy precedente e
la perdita dell'ammissibilità della verifica empirica; corrette le aspettative
esplicitamente cambiate dalla v3 e preservata la verifica opt-in, la suite
completa finale è passata senza esclusioni aggiuntive.

Build di produzione con `scripts/qa-no-env-build.config.js`: PASS, 155 moduli;
artefatto in `dist/`. Resta l'avviso Vite per i bundle oltre 500 kB.

Playwright:

- `qa-grande-v3-browser.config.js`: 2 PASS sulla build di produzione; prova Qxa8
  persistita, navigazione FEN, spiegazioni/metadati, toggle, salvataggio/reload,
  origine e Grande ereditata. Worker bloccati: zero ricerche durante il caricamento.
- `qa-review-practice-browser.config.js`: 17 PASS; motore simulato e interazioni
  del ripasso, vecchi archivi, errori, interruzioni e progressi.
- `qa-release-browser.config.js --grep "production analyzes"`: 1 PASS sulla build;
  analisi, spiegazione, archivio e ripasso con il vero motore.

Le ricerche reali eseguite sono quelle dei test d'integrazione richiesti,
non nuove raccolte sul corpus del classificatore.

Verifiche finali: `git diff --check` PASS; SHA-256 dei dieci file protetti e dei
moduli candidati v1/v2 identici ai riferimenti congelati. Nessun riferimento
a fixture, `agent-output` o risultati temporanei nel bundle applicativo.
Checkout originale e lavoro sulle aperture non modificati.

Esito: **nessun blocco tecnico rilevato, build locale pronta per la verifica
di Carlo prima della pubblicazione**. Artefatti in `dist/`; nessuna pubblicazione
eseguita. Restano i limiti di evidenza dichiarati, il TODO preesistente e
l'assenza di validazione indipendente del corpus. Fase del classificatore chiusa
temporaneamente; nessuna candidata successiva avviata.

Comandi per la verifica locale (senza leggere `.env`):

```powershell
node node_modules/vitest/vitest.mjs run --config scripts/qa-no-env-test.config.js
node node_modules/vite/bin/vite.js build --config scripts/qa-no-env-build.config.js
node node_modules/@playwright/test/cli.js test --config scripts/qa-grande-v3-browser.config.js
node node_modules/@playwright/test/cli.js test --config scripts/qa-review-practice-browser.config.js
node node_modules/@playwright/test/cli.js test --config scripts/qa-release-browser.config.js --grep "production analyzes"
```
