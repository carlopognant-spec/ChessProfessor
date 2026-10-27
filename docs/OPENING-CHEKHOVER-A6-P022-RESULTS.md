# P02.2-SIC-04 — Risultati Chekhover con 4...a6

Il lotto aggiunge due percorsi e due esercizi, raggiungendo cinque posizioni sorgenti prima assenti. Il totale passa da 286 a **288 corsi ed esercizi**, preservando quelli precedenti. P02 rimane in corso.

Data: 21 ottobre 2026. [Progetto e prompt](OPENING-CHEKHOVER-A6-P022-DESIGN.md), [specifica fissata](data/opening-chekhover-a6-p022-plan.json), [fotografia del progetto](data/opening-chekhover-a6-p022-design-verification.json), [rapporto corrente](data/opening-chekhover-a6-p022-result.json).

## Percorsi e interazione

| Corso | Semimosse documentate | Scelta didattica scritta | Totale |
| --- | ---: | --- | ---: |
| Chekhover: 4...a6 e sviluppo con 5.Ae3 | 9 | 5...Cf6 | 10 |
| Chekhover: 4...a6, 5.c4 e ritirata Dd2 | 12 | Nessuna | 12 |

Le 21 semimosse documentate sono sommate sulle due linee con prefissi ripetuti; la risposta ...Cf6 resta separata dalla fonte e verificata a budget limitato. Nessuna mossa dei due percorsi è generata dal motore. I cinque record B53 provengono dal catalogo JeffML/eco.json fissato in P01; il nodo 4...a6 comune alle due linee si conta una sola volta. Questi sono moduli brevi di confronto, collegati ai percorsi Chekhover più lunghi già disponibili.

Sono presenti cinque voci editoriali nuove, quattro testi distinti: la spiegazione di Dxd4/a6 è condivisa. La risposta nera all’indice 7 usa la nota della coppia 6, che descrive a6 e il cavallo b8 ancora fermo. Le altre note distinguono il sostegno di Ae3 alla donna d4, la difesa di e4, l’attacco di ...Cc6 e il fianchetto soltanto preparato. Dd2 interrompe la diagonale c1-e3 dell’alfiere bianco.

I bivi sono quello nero ...Cc6/...a6 all’indice 7 e quello bianco Ae3/c4 all’indice 8. Il flusso di navigazione esistente li gestisce senza modifiche all’interfaccia: dopo il checkpoint si attende l’avvio, poi ciascun colore ha mosse attive. La singola mossa ...a6 seleziona il primo rappresentante, Ae3; c4 si distingue alla mossa seguente o mediante selezione esplicita del corso. Il completamento della coppia Ae3/Cf6 dopo un cambio di ramo completa realmente il modulo breve. Nessun credito deriva dal solo prefisso o dalla sola proposta «Segui».

La mossa Dd3 nel ramo c4 è legale e non coperta da un corso con quel prefisso. Resta distinta da un errore scacchistico e non viene associata al corso Dd3 che passa da una posizione diversa. I comportamenti di prosecuzione e ripasso dei corsi contenuti del lotto precedente restano presenti.

## Prove motore e degli esercizi

Il [manifest](data/opening-chekhover-a6-p022-engine/manifest.json) fissa Stockfish 16 nativo, hash dell’eseguibile, Threads 1, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash per ogni ricerca, 200.000 nodi richiesti per `go` e timeout 30 secondi. Firma: `407c3fd1f1a542931899ee3e387e70c764d352379ee8cc9ff40fb8e969dde27a`.

Eseguite **cinque ricerche primarie**, zero conferme: **1.000.000 nodi richiesti**, **1.000.653 riportati** nelle trascrizioni. Il limite fissato di dieci `go` e 2.000.000 nodi richiesti, incluse conferme/fallimenti, non è stato aumentato. Il controllo dopo Ae3 è riutilizzato come baseline del relativo esercizio. Nessun collector storico è stato rilanciato.

La continuazione ...Cf6 è confrontata con la ricerca libera dalla stessa FEN e con lo stesso lato al tratto: score -27/-41 cp, differenza e perdita **14 cp**, entro il massimo 100 cp. Il confronto non dimostra una scelta teoricamente unica.

| Esercizio costruito | Risposta | Variazione cp | Repliche immediate | Saldo minimo |
| --- | --- | ---: | ---: | ---: |
| Dopo 5...Db6 | 6.Dxb6 | 762 | 21 | +9 |
| Dopo 6.Cc3 | 6...Cxd4 | 617 | 33 | +6 |

Le variazioni sommano gli score prima e dopo la deviazione tenendo conto del cambio di lato al tratto: 789 + (-27) e 583 + 34, entrambe oltre il minimo 200 cp fissato. Il builder verifica trascrizioni, firma, radici, bestmove, score/PV completi corrispondenti e legalità delle PV, oltre a fonti e budget. Tutti i gate sono passati prima di generare i moduli.

Tutte le **54 repliche immediate legali** sono riprodotte nelle [prove](data/opening-chekhover-a6-p022-practical-verification.json), con materiale p=1, C/A=3, T=5, D=9, confrontato con la posizione prima della deviazione. Nel primo caso il pedone a6 non può riprendere in b6; ...Cd7 può però attaccare la donna nel turno successivo. Nel secondo il cavallo f3 può riprendere in d4, limitando il saldo a donna contro cavallo, mentre il cavallo c3 non attacca d4.

È verificata l’unicità della cattura immediata della donna, non di ogni mossa vincente o del risultato della partita. Gli esercizi sono costruiti: non rappresentano partite personali o errori con frequenza misurata. Soluzione e prevenzione non vengono anticipate nel testo iniziale.

## Copertura e preservazione

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Corsi / esercizi | 286 / 286 | 288 / 288 |
| Corsi siciliani | 25 | 27 |
| Posizioni con ordine sorgente esatto | 1.944 | 1.949 |
| Posizioni raggiunte solo per trasposizione | 201 | 201 |
| Posizioni assenti nel corpus A | 10.177 | 10.172 |
| Assenti nel sottoalbero Chekhover | 8 su 22 | 3 su 22 |

Le cinque posizioni aggiunte sono quelle elencate nel progetto, con zero nuove ancore ECO. Il replay ricalcola tutte le 12.322 posizioni del corpus A e include le posizioni intermedie dei percorsi. La scelta didattica ...Cf6 non aggiunge altre posizioni sorgenti.

I tre residui sono `position:c9c6ddc7d60aa2cf` (4...Ad7), `position:7161d5217d6da902` (4...Cf6) e `position:2b356881d43ce8ce` (4...Cf6 5.Cc3). Rimangono nel perimetro A. L’ordine 4...Ad7 è diverso dal 5...Ad7 già insegnato.

I 286 corsi precedenti conservano ID, famiglia, titolo e mosse; i 286 esercizi precedenti conservano il digest completo. I 108 file congelati e gli hash protetti P02.1 sono identici. Classificatore, Libro, soglie, configurazioni del motore e studi congelati restano invariati. Lo storage resta `chessprofessor.openings.v1`, con chiavi `journey:v1:<id>:<side>`.

Commenti misurati: **9.064 semimosse spiegate**, **2.023 utilizzi di note scritte su 4.559 coppie**, **61 percorsi interamente commentati per coppia**. I nuovi moduli aggiungono undici utilizzi di note, cinque dei quali voci specifiche nuove. Il resto della revisione editoriale completa rimane P03.

## Verifiche e riproduzione

Controlli offline correnti, senza nuove ricerche:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-chekhover-content.mjs --check
node scripts/build-opening-chekhover-a6-content.mjs --check
node scripts/report-opening-chekhover-a6-result.mjs --check
```

Il verificatore di progetto SIC-04 e il reporter SIC-03 sono passati prima dell’integrazione. Conservano ora fotografie storiche e non vanno rigenerati sui nuovi totali. I builder precedenti restano controlli isolati validi; il nuovo reporter verifica hash e sottoinsiemi precedenti.

| Controllo | Risultato |
| --- | --- |
| Verificatore del progetto e controlli precedenti prima dell’integrazione | PASS |
| Preparazione offline del manifest | PASS, zero ricerche |
| Gate del builder prima della generazione | PASS |
| Quattro builder offline e reporter corrente in `--check` | PASS |
| Test mirati | 9 file, 100 PASS, 67,06 s |
| Suite completa no-env | 79 file, 742 PASS e 1 TODO preesistente, 149,37 s |
| Build no-env | PASS, 138 moduli, 11,55 s |
| Browser finale | 62 PASS, 4,2 minuti |

Comandi applicativi:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false tests/opening-chekhover-a6-roadmap.test.js tests/opening-chekhover-roadmap.test.js tests/opening-zaitsev-roadmap.test.js tests/opening-sicilian-roadmap.test.js tests/opening-variants.test.js tests/opening-scope.test.js tests/opening-full-notes.test.js tests/opening-expansion.test.js tests/opening-move-review.test.js
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
git diff --check
```

La build conserva il precedente avviso sui chunk oltre 500 kB, senza cambiare soglie.

La prima raccolta browser si è interrotta prima di eseguire scenari: due coppie
di percorsi avevano lo stesso titolo di test per il checkpoint verso c4. Il nome
ora include anche il corso di origine, distinguendo tutte le dodici riprese nuove.
La correzione riguarda i nomi dei test; non ha richiesto modifiche applicative,
riduzione dei casi o aumento dei timeout.

La successiva esecuzione completa passa tutti i **62 scenari distinti**: sedici
completamenti nei due colori con persistenza, otto esercizi sulla scacchiera,
quattordici cambi di ramo, diciotto checkpoint di bivio, due prosecuzioni, due
ripassi di destinazioni contenute e due alternative legali non coperte. Conserva
i 39 casi precedenti e aggiunge i 23 previsti dal progetto. I nuovi checkpoint
coprono sei transizioni dirette in entrambi i colori, con avvio esplicito, mosse
attive, assenza di credito prematuro e persistenza dopo reload. Il modulo Ae3
registra correttamente il completamento dopo l’ultima coppia realmente giocata.
Le prove comprendono desktop e mobile, conservazione dei preferiti e dei vecchi
progressi. Worker disabilitato ed Explorer simulato; nessuna ricerca aggiuntiva
nel browser. I conteggi non sommano ripetizioni dello stesso caso.

Verificati anche `git diff --check`, i collegamenti dei nuovi documenti, UTF-8 e
assenza di lock motore residui. La normalizzazione LF segnalata da Git riguarda
il file di test preesistente, non i file congelati; il controllo termina con esito 0.

## Artefatti e prossima ripresa

- [Due corsi](../src/data/openingChekhoverA6Courses.js) e [due esercizi](../src/data/openingChekhoverA6PracticalCases.js).
- [Prove](data/opening-chekhover-a6-p022-practical-verification.json), [manifest](data/opening-chekhover-a6-p022-engine/manifest.json) e [rapporto corrente](data/opening-chekhover-a6-p022-result.json).
- [Inventario](OPENING-COVERAGE.md) e [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md).

Lotto completato. Prossima ripresa: progettazione dei tre residui Chekhover con **4...Cf6, 5.Cc3 e 4...Ad7**, mantenendo il resto del corpus A in P02. Configurazione **GPT-6 Astra / High**, con pausa prima del progetto per il cambio manuale e il «continua» di Carlo. Nessun commit, push o deploy.
