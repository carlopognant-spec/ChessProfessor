# P02.2-SIC-05 — Chekhover con 4...Cf6 e 4...Ad7

Implementazione del 21 ottobre 2026 completata e verificata. Due corsi e due esercizi integrati. [Progetto fissato](OPENING-CHEKHOVER-EARLY-P022-DESIGN.md), [piano](data/opening-chekhover-early-p022-plan.json), [prova del progetto](data/opening-chekhover-early-p022-design-verification.json) e [rapporto corrente](data/opening-chekhover-early-p022-result.json).

## Contenuti e ordini di mosse

| Corso dopo Dxd4 | Semimosse documentate | Seguito didattico scritto | Totale |
| --- | ---: | --- | ---: |
| 4...Cf6 5.Cc3 Ad7 | 9 | 5...Ad7 | 10 |
| 4...Ad7 5.Cc3 Cf6 | 8 | 5.Cc3 Cf6 | 10 |

Le 17 semimosse documentate sono sommate sulle due linee con prefissi ripetuti. Le tre scelte didattiche sono separate dalla fonte, con una verifica individuale per ciascuna. Nessuna mossa è generata dal motore. I tre record B53 del catalogo fissato coprono 4...Cf6, 4...Cf6 5.Cc3 e 4...Ad7; nessuna nuova conferma indipendente Lichess viene attribuita a queste posizioni.

Sono moduli brevi di confronto collegati ai percorsi Chekhover già disponibili. Le quattro note specifiche descrivono la pressione di Cf6 su e4, già difeso dalla donna d4, il sostegno aggiuntivo di Cc3 e la diagonale libera dell'alfiere d7. Nel nuovo ordine 4...Ad7 i cavalli neri sono ancora nelle case iniziali; nel vecchio ordine 4...Cc6 5.Ab5 Ad7 il cavallo c6 interrompe la diagonale verso a4. Le note sono vincolate alla sequenza completa, compresa la risposta nera della coppia all'indice 6.

I due nuovi ordini raggiungono la stessa FEN completa:

```text
rn1qkb1r/pp1bpppp/3p1n2/8/3QP3/2N2N2/PPP2PPP/R1B1KB1R w KQkq - 3 6
```

Questa posizione didattica non è una quarta posizione sorgente del corpus. I corsi conservano ID e progressi distinti. Il prefisso comune termina dopo sette semimosse: il checkpoint torna al bivio dopo Dxd4, attende l'avvio esplicito e lascia mosse attive a entrambi i colori. Lo stesso endpoint non assegna credito alla destinazione. Nel cambio durante il gioco col Nero, «Segui» porta all'indice 9, lasciando ancora una mossa da eseguire nei due moduli brevi.

Il nodo nero offre ...Cc6, ...a6, ...Cf6 e ...Ad7, mantenendo i rappresentanti esistenti. Nel corso con 4...Cf6 la mossa 5.Ae3 resta legale e non coperta: non viene associata al corso con Ae3 dopo ...a6. Non è stata necessaria alcuna modifica al comportamento di navigazione dell'applicazione.

## Prove motore ed esercizi

Il [manifest](data/opening-chekhover-early-p022-engine/manifest.json) fissa Stockfish 16 nativo, hash dell'eseguibile, Threads 1, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash prima di ogni ricerca, 200.000 nodi richiesti per `go` e timeout 30 secondi. Firma: `2fa1a90bf0744e51999f636028b42e816eff4c65a9c786ef9ae6e67e85cbe54b`.

Eseguite **otto ricerche primarie**, zero conferme: **1.600.000 nodi richiesti** e **1.601.397 riportati** nelle trascrizioni. Il limite di 16 `go` e 3.200.000 nodi richiesti, comprese conferme e richieste fallite, non è stato aumentato. Due controlli sono riusati come baseline degli esercizi; nessun collector storico è stato rilanciato.

| Scelta didattica | Indice | Score libero / vincolato | Perdita |
| --- | ---: | ---: | ---: |
| ...Ad7 dopo ...Cf6/Cc3 | 9 | -4 / -50 cp | 46 cp |
| Cc3 dopo ...Ad7 | 8 | 39 / 20 cp | 19 cp |
| ...Cf6 dopo ...Ad7/Cc3 | 9 | -11 / -35 cp | 24 cp |

Ogni confronto usa la stessa FEN e lo stesso lato al tratto: perdita `max(0, cp_libero - cp_vincolato)`, entro il massimo 100 cp. Il builder gestisce l'array `authoredMoves` e produce tre controlli identificati da corso e indice; verificare una mossa non viene trattato come prova delle altre.

| Esercizio costruito | Risposta | Variazione cp | Repliche immediate | Saldo minimo |
| --- | --- | ---: | ---: | ---: |
| Dopo 5...Af5 | 6.exf5 | 561 | 27 | +3 |
| Dopo 5.Da4 | 5...Axa4 | 719 | 33 | +9 |

Le variazioni sono 565 + (-4) e 680 + 39, correggendo il cambio di lato al tratto; entrambe superano il minimo 200 cp. Le [prove](data/opening-chekhover-early-p022-practical-verification.json) riproducono tutte le **60 repliche immediate legali**, con materiale p=1, C/A=3, T=5, D=9, confrontato con la posizione prima della deviazione.

Nel primo esercizio il pedone e4 cattura l'alfiere f5; ...Cc6 può poi attaccare la donna d4. Nel secondo Da4 non è scacco perché l'alfiere d7 interrompe la diagonale verso e8, e lo stesso alfiere può catturare la donna lungo d7-c6-b5-a4. È verificata l'unicità della cattura immediata del tipo di bersaglio dichiarato, senza dedurre unicità di ogni mossa vincente o vittoria nella partita. Sono scenari costruiti, senza frequenze pratiche misurate o attribuzioni a partite personali.

Prima della generazione, il builder ha verificato firme, richieste persistite, radici, budget, bestmove, score/PV completi corrispondenti, legalità delle PV, fonti e materiale. I due corsi e i due esercizi sono stati generati insieme dopo il superamento di tutti i gate.

## Copertura e conservazione

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Corsi / esercizi | 288 / 288 | 290 / 290 |
| Corsi siciliani | 27 | 29 |
| Posizioni con ordine sorgente esatto | 1.949 | 1.952 |
| Posizioni solo per trasposizione | 201 | 201 |
| Posizioni assenti nel corpus A | 10.172 | 10.169 |
| Chekhover con almeno un ordine esatto | 19 su 22 | 22 su 22 |

Replay di tutte le 12.322 posizioni del corpus A, comprese quelle intermedie dei percorsi. Tre posizioni aggiunte e zero nuove ancore ECO. Tutte le 22 posizioni Chekhover sono ora raggiungibili tramite un ordine sorgente esatto: non equivale alla completezza teorica della Chekhover, della Siciliana o del perimetro A.

I 288 corsi precedenti conservano ID, famiglia, titolo e mosse; i 288 esercizi precedenti conservano il digest completo. I 134 file congelati e gli hash protetti sono identici. Classificatore, Libro, Mossa mancata, soglie, configurazione del motore e studi congelati restano invariati. Lo storage usa sempre `chessprofessor.openings.v1` e `journey:v1:<id>:<side>`.

Commenti misurati: **9.084 semimosse spiegate**, **2.033 utilizzi di note scritte su 4.569 coppie**, **63 percorsi interamente commentati per coppia**. I nuovi moduli aggiungono dieci utilizzi di note, quattro dei quali voci specifiche nuove. La revisione editoriale completa resta P03.

## Verifiche e riproduzione

Controlli offline correnti, senza nuove ricerche:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-chekhover-content.mjs --check
node scripts/build-opening-chekhover-a6-content.mjs --check
node scripts/build-opening-chekhover-early-content.mjs --check
node scripts/report-opening-chekhover-early-result.mjs --check
```

Il verificatore SIC-05 e il reporter SIC-04 sono passati prima dell'integrazione; ora conservano le fotografie a 288 corsi e non vanno rigenerati sui nuovi totali. I cinque builder restano controlli isolati. Il reporter corrente verifica hash e sottoinsiemi preservati, la FEN condivisa e i 22 ordini sorgente esatti Chekhover.

| Controllo | Risultato |
| --- | --- |
| Progetto e controlli precedenti prima dell'integrazione | PASS |
| Preparazione offline del manifest | PASS, zero ricerche |
| Gate prima della generazione | PASS |
| Cinque builder offline e reporter corrente in `--check` | PASS |
| Test mirati | Prima esecuzione: 106 PASS, un conteggio atteso da aggiornare; dopo la correzione, file scope 7 PASS |
| Suite completa no-env | 80 file, 749 PASS e un TODO preesistente, 233,35 s |
| Build no-env | PASS, 140 moduli, 6,26 s |
| Browser | 87 PASS, 9,0 minuti |

Comandi applicativi:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false tests/opening-chekhover-early-roadmap.test.js tests/opening-chekhover-a6-roadmap.test.js tests/opening-chekhover-roadmap.test.js tests/opening-zaitsev-roadmap.test.js tests/opening-sicilian-roadmap.test.js tests/opening-expansion.test.js tests/opening-variants.test.js tests/opening-scope.test.js tests/opening-full-notes.test.js tests/opening-move-review.test.js
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
git diff --check
```

Il primo gruppo mirato ha rilevato il conteggio atteso della famiglia siciliana ancora a 27. Aggiornato a 29, il file passa tutti i sette test; nessuna modifica applicativa richiesta. La build mantiene il precedente avviso sui chunk oltre 500 kB, senza cambiare le soglie.

L'esecuzione completa successiva include anche tutti i 107 test del gruppo mirato, che passano. Non sono state necessarie altre modifiche applicative o ripetizioni della suite completa. Verificati UTF-8, collegamenti locali e assenza di lock motore residui. `git diff --check` passa; mantiene il precedente avviso CRLF/LF del file di test, senza alterare le prove congelate.

Il browser passa tutti gli **87 scenari distinti** in un'unica esecuzione: venti completamenti dei corsi nei due colori, dieci esercizi sulla scacchiera, venti cambi durante il gioco, trenta checkpoint di bivio, due prosecuzioni, due ripassi di destinazioni contenute e tre alternative legali non coperte. Conservati tutti i 62 casi precedenti e aggiunti i 25 previsti. Le quattro riprese tra i due nuovi ordini verificano esplicitamente la stessa FEN finale, nessun credito alla destinazione, ritorno al prefisso 7, avvio esplicito, mosse residue e progressi distinti persistenti dopo reload. Verificati anche desktop/mobile, preferiti e progressi precedenti. Worker disabilitato ed Explorer simulato; nessuna ricerca aggiuntiva nel browser. Nessuna modifica applicativa o aumento dei timeout richiesto.

## Artefatti e ripresa

- [Due corsi](../src/data/openingChekhoverEarlyCourses.js) e [due esercizi](../src/data/openingChekhoverEarlyPracticalCases.js).
- [Prove](data/opening-chekhover-early-p022-practical-verification.json), [manifest](data/opening-chekhover-early-p022-engine/manifest.json) e [rapporto corrente](data/opening-chekhover-early-p022-result.json).
- [Inventario](OPENING-COVERAGE.md), [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md) e [roadmap](ROADMAP-E-PROMPT-OPERATIVI.md).

Lotto completato; P02 resta in corso. Prossima ripresa con **GPT-6 Astra / High**, dopo il cambio manuale e il «continua» di Carlo: progettare le alternative precoci della Siciliana aperta dopo 4.Cxd4, ...g6/...a6/...e5 e relativi discendenti, confrontandole con il Dragone già presente. Le quattro posizioni sorgenti sono identificate in `nextDesign` del progetto e del rapporto; non sono state progettate o implementate durante SIC-05. Nessun commit, push o deploy.
