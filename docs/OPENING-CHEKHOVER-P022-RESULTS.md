# P02.2-SIC-03 — Risultati Chekhover dopo ...Ad7

Il lotto aggiunge tre percorsi e tre esercizi e corregge la ripresa di un percorso già contenuto in quello appena studiato. La copertura effettiva passa da 283 a **286 corsi/esercizi**; quattro posizioni del corpus prima assenti sono raggiunte con il loro ordine sorgente esatto. P02 rimane in corso.

Data: 21 ottobre 2026. [Progetto e prompt](OPENING-CHEKHOVER-P022-DESIGN.md), [specifica fissata](data/opening-chekhover-p022-plan.json), [fotografia del progetto](data/opening-chekhover-p022-design-verification.json), [rapporto corrente](data/opening-chekhover-p022-result.json).

## Percorsi e comportamento

| Corso | Semimosse documentate | Seguito didattico scritto | Lunghezza |
| --- | ---: | --- | ---: |
| Chekhover: 7.c4 e preparazione del fianchetto | 16 | Nessuno | 16 |
| Chekhover: 10.Dd3 e arrocco del Nero | 19 | 10...O-O | 20 |
| Chekhover: 11.Dd2 e coordinazione delle torri | 21 | 11...Dc7 | 22 |

Le 56 semimosse documentate e le due scelte didattiche rimangono distinte nella provenienza e nei testi visibili. Nessuna mossa è generata dal motore. Le sequenze sorgenti e il loro termine sono verificati contro i quattro record B53 del catalogo JeffML/eco.json fissato in P01; la fonte non viene estesa attribuendole i due seguiti scritti. I moduli sono confronti e prosecuzioni del percorso Chekhover con ...Ad7 già disponibile, non tre nuove partite complete fino al mediogioco.

I bivi 7.c4 / 7.Cc3 e 10.Dd3 / 10.The1 funzionano con i percorsi esistenti. 11.Dd2 prosegue invece l'intero corso precedente: il checkpoint mostra la posizione dopo 10...O-O come prosecuzione e lascia una mossa attiva a ciascun colore. Tornando dalla linea lunga a quella più breve, il controllo di destinazione contenuta offre un ripasso esplicito dall'inizio. Il solo prefisso comune non registra completamenti; dopo l'avvio il giocatore deve eseguire le mosse.

Le quattro note specifiche riguardano i passaggi distintivi e sono legate alla sequenza completa. Dopo ...g6 il fianchetto è soltanto preparato; dopo Dd3 la torre bianca è ancora in h1; dopo Dd2 Dc7 l'alfiere c6 interrompe la colonna davanti alla donna. Le note precedenti restano immutate.

## Prove motore e dei tre esercizi

Il nuovo [manifest](data/opening-chekhover-p022-engine/manifest.json) fissa Stockfish 16 nativo, SHA256 dell'eseguibile, un thread, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash a ogni ricerca, 200.000 nodi richiesti per `go` e timeout 30 secondi. Firma: `224a6e3df49b39c738224e68bf0f7e3466117a9f44fea1f337bc7336512e8987`.

Eseguite **nove ricerche primarie**, zero conferme: 1.800.000 nodi richiesti e 1.800.661 riportati nelle trascrizioni. Il limite fissato era diciotto `go` e 3.600.000 nodi richiesti incluse conferme/fallimenti; non è stato aumentato. Il controllo dopo 11.Dd2 è riusato come baseline dell'esercizio, senza una ricerca duplicata. Nessun collector storico è stato rilanciato.

I confronti delle continuazioni usano la stessa FEN e lo stesso lato al tratto. Differenze `cp_libero - cp_vincolato` e perdite `max(0, differenza)`: **3 cp per ...O-O**, **28 cp per ...Dc7**, entrambe entro 100 cp. Sono controlli a budget limitato; non dimostrano una scelta teoricamente unica né qualità a gioco ottimale.

| Esercizio costruito | Risposta verificata | Variazione cp | Repliche immediate | Saldo minimo |
| --- | --- | ---: | ---: | ---: |
| Dopo 7...Axe4 | 8.Dxe4 | 486 | 24 | +2 |
| Dopo 11.Db5 | 11...Axb5 | 624 | 39 | +6 |
| Dopo 11...Aa4 | 12.Cxa4 | 491 | 26 | +2 |

Le variazioni sommano score prima e dopo l'errore correggendo il cambio del lato al tratto; tutte superano il minimo 200 cp fissato. Tutte le **89 risposte immediate legali** sono riprodotte nelle [prove](data/opening-chekhover-p022-practical-verification.json), con valori p=1, C/A=3, T=5, D=9. Il primo e il terzo esercizio catturano un alfiere; il secondo parte dall'endpoint del corso e cattura la donna. L'unicità verificata riguarda la cattura immediata del tipo di pezzo bersaglio, non tutte le mosse vincenti. Non è una dimostrazione del risultato della partita.

Il builder offline controlla ogni trascrizione, bestmove, score/PV corrispondenti, legalità della PV, radici vincolate, richieste/risposte, budget, confronti e repliche immediate. Tutti i gate sono passati prima della scrittura dei tre corsi e dei tre esercizi. I casi sono costruiti; non vengono presentati come errori frequenti o partite personali.

## Copertura effettiva e preservazione

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Corsi / esercizi | 283 / 283 | 286 / 286 |
| Corsi siciliani | 22 | 25 |
| Posizioni del corpus con ordine sorgente esatto | 1.940 | 1.944 |
| Posizioni raggiunte solo per trasposizione | 201 | 201 |
| Posizioni assenti nel corpus A | 10.181 | 10.177 |
| Assenti nel sottoalbero Chekhover | 12 su 22 | 8 su 22 |

Le quattro posizioni aggiunte sono `position:65a7a0f0faa6092b`, `position:559d29741ab02c1f`, `position:cb47b173ef24af42` e `position:1e26b7829d87dc1e`; zero nuove ancore ECO. Il replay copre l'intero corpus di 12.322 posizioni, comprese le posizioni intermedie. Gli otto residui Chekhover restano elencati nel rapporto corrente. Le due mosse didattiche non aggiungono altre posizioni sorgenti.

I 283 corsi precedenti mantengono ID, famiglie, titoli e sequenze; i 283 esercizi precedenti mantengono il digest completo. I 70 file fissati dal piano e gli hash protetti P02.1 sono preservati. I moduli dei due lotti precedenti, fonti, classificatore, Libro, configurazione motore e studi congelati restano identici. Lo storage resta `chessprofessor.openings.v1`, con chiavi `journey:v1:<id>:<side>`.

Copertura attuale dei commenti: **9.042 semimosse spiegate**, **2.012 utilizzi di note scritte su 4.548 coppie**, **59 percorsi interamente commentati per coppia**. I nuovi percorsi aggiungono tredici utilizzi di note, quattro dei quali nuovi testi specifici. La revisione completa P03 resta da fare.

## Verifiche e riproduzione

Comandi offline correnti, senza ricerche motore:

```powershell
node scripts/build-opening-chekhover-content.mjs --check
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/report-opening-chekhover-result.mjs --check
```

Il verificatore del progetto nuovo e il reporter Zaitsev sono passati prima dell'integrazione; dopo l'integrazione conservano la fotografia a 283 corsi e non vanno rigenerati per adattarla ai nuovi conteggi. Il rapporto corrente verifica gli hash storici e i sottoinsiemi preservati. I builder dei contenuti precedenti continuano a passare perché controllano i loro moduli isolati.

| Controllo | Risultato |
| --- | --- |
| Verificatore del progetto e controlli precedenti prima dell'integrazione | PASS |
| Preparazione offline manifest | PASS, zero ricerche |
| Nuovo builder, builder precedenti e rapporto corrente | PASS |
| Test mirati | 8 file, 84 PASS, 58,70 s |
| Suite completa no-env | 78 file, 735 PASS e 1 TODO preesistente, 161,37 s |
| Build no-env | PASS, 136 moduli, 12,17 s |
| Browser finale | 39 PASS, 2,7 minuti |

Comandi applicativi eseguiti:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false tests/opening-chekhover-roadmap.test.js tests/opening-sicilian-roadmap.test.js tests/opening-zaitsev-roadmap.test.js tests/opening-curriculum.test.js tests/opening-variants.test.js tests/opening-scope.test.js tests/opening-full-notes.test.js tests/opening-expansion.test.js
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
git diff --check
```

I 39 casi browser mantengono i venti controlli precedenti e coprono dodici completamenti con persistenza, sei esercizi sulla scacchiera senza soluzione anticipata, dieci cambi di ramo nelle due direzioni, sei checkpoint di bivio, due prosecuzioni e due ripassi di destinazioni contenute, oltre all'alternativa Zaitsev legale non coperta. I completamenti includono entrambi i colori, desktop e mobile, conservando preferiti e progressi precedenti. I ripassi verificano esplicitamente l'assenza di credito prima dell'avvio e prima delle mosse, poi la persistenza del completamento effettivo. Worker disabilitato ed Explorer simulato.

La build mantiene il precedente avviso sui chunk oltre 500 kB. Nessuna soglia è stata modificata. La prima esecuzione browser ha avuto 36 PASS e tre fallimenti: un timeout durante il caricamento iniziale del catalogo, prima di entrare in un corso, e due aspettative del nuovo test Dd3 da distinguere. In quel bivio la mossa del giocatore e la risposta avversaria completano davvero la linea: il test ora verifica zero credito prima di seguire il ramo e un solo completamento dopo le mosse, conservando l'aspettativa di zero completamenti per i bivi che non raggiungono l'endpoint. Nessuna modifica applicativa richiesta da questi tre esiti. La ripetizione completa finale passa tutti i 39 casi, con timeout invariati.

Anche `git diff --check`, i collegamenti locali, i testi UTF-8 e l'assenza di lock motore residui sono stati verificati. I conteggi browser si riferiscono a 39 casi distinti, senza sommare i due passaggi.

## Artefatti e prossima ripresa

- [Tre corsi](../src/data/openingChekhoverCourses.js) e [tre esercizi](../src/data/openingChekhoverPracticalCases.js).
- [Prove e trascrizioni](data/opening-chekhover-p022-practical-verification.json), [manifest](data/opening-chekhover-p022-engine/manifest.json), [rapporto attuale](data/opening-chekhover-p022-result.json).
- [Inventario](OPENING-COVERAGE.md) e [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md).

Lotto completato. Il prossimo lavoro è progettare le alternative Chekhover precoci con **4...a6 e dipendenze**, conservando anche i residui 4...Cf6 e 4...Ad7 nel perimetro completo A. Configurazione consigliata per quella progettazione: **GPT-6 Astra / High**. Fermarsi prima di iniziarla, attendendo il cambio manuale e il «continua» di Carlo. Nessun commit, push o deploy.
