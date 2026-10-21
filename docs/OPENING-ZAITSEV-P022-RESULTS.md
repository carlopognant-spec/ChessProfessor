# P02.2-SIC-02 — Chekhover Zaitsev: risultato e ripresa

Data: 21 ottobre 2026. Configurazione del lotto: GPT-6.1 Sol / High.

Integrati il percorso `sicilian:chekhover-zaitsev` e il relativo esercizio. Il nuovo bivio distingue 5...Dd7 da ...Ad7 e funziona con entrambi i colori. I 282 corsi e i 282 esercizi precedenti sono conservati; il totale attuale è **283 corsi e 283 esercizi**. P02 resta in corso.

## Contenuto e provenienza

La linea è `1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 Nc6 5. Bb5 Qd7 6. Bxc6 Qxc6`.

Il catalogo fissato documenta le prime dieci semimosse fino a ...Dd7. Axc6 Dxc6 è un seguito didattico scritto, verificato separatamente; nessuna mossa è generata dal motore. Il corso mostra questo confine e spiega perché termina dopo il cambio. Non presenta il seguito come unica possibilità o come sviluppo completo.

La nota specifica distingue l'inchiodatura al re prima di ...Dd7 dal vincolo relativo sulla donna dopo ...Dd7. La ripresa con la donna differisce da quella con l'alfiere del corso ...Ad7. Dopo ...Dxc6 il pedone e4 è attaccato dalla donna nera e difeso dalla donna d4: non è descritto come perduto. Le due note nuove sono legate alla sequenza completa e non vengono riutilizzate dopo una modifica delle mosse.

Il progetto archiviato aveva perso alcuni caratteri italiani durante la scrittura da PowerShell. Il [testo UTF-8 ripristinato](data/opening-zaitsev-p022-editorial.json) alimenta i contenuti pubblicati; il builder verifica che sostituire i caratteri non ASCII con `?` riproduca esattamente i testi del piano. Sono ripristinati soltanto accenti e apostrofi: il piano congelato, le mosse, le posizioni e la firma delle ricerche restano invariati.

L'esercizio costruito usa 6.Ad3, cui il Nero risponde ...Cxd4. La soluzione e il controllo di prevenzione compaiono dopo il tentativo. Il caso non proviene da una partita personale e non ha una frequenza misurata. I controesempi con Cc3 o Aa4 e successivo cambio delle donne restano nelle prove: non ogni spostamento del cavallo o ritiro dell'alfiere produce una perdita materiale.

## Prove motore e limiti

Eseguite esattamente **cinque ricerche**, senza conferme aggiuntive. Stockfish 16 nativo, un thread, Hash 32 MiB, MultiPV 1, hash azzerata per ricerca, 200.000 nodi richiesti per `go`. Totale: **1.000.000 nodi richiesti e 1.000.864 riportati**. Eseguibile, opzioni, FEN, radici e input sono fissati nel [manifest](data/opening-zaitsev-p022-engine/manifest.json); richieste, trascrizioni UCI complete e risultati sono nelle sottocartelle `attempts` e `results`.

| Controllo | Risultato al budget fissato | Criterio predefinito |
| --- | --- | --- |
| Axc6 dalla posizione dopo ...Dd7 | cp libero 62, vincolato -12; differenza 74 | Perdita di controllo al massimo 100 cp: PASS |
| Dxc6 dalla posizione dopo Axc6 | cp libero 1, vincolato 21; differenza -20, perdita di controllo 0 | Al massimo 100 cp: PASS |
| Esercizio dopo Ad3 | bestmove `c6d4`, cp 578; baseline condivisa cp 62 | Variazione 640 cp, almeno 200: PASS |
| Materiale dopo ...Cxd4 | Tutte le 36 repliche immediate; minimo +6 | Minimo esatto previsto +6: PASS |

I primi due confronti partono dalla stessa FEN e dallo stesso lato al tratto. La differenza negativa per Dxc6 riflette ricerche separate e non dimostra che la mossa vincolata sia oggettivamente superiore al risultato libero. Il limite di 100 cp appartiene solo a questo lotto e non modifica il classificatore. La baseline del primo confronto viene riutilizzata nell'esercizio: nessuna sesta ricerca duplicata.

Nell'esercizio si sommano cp dopo Ad3 e cp prima della deviazione perché cambia il lato al tratto. La prova materiale usa pedone=1, cavallo/alfiere=3, torre=5, donna=9 e confronta il saldo con la posizione prima della deviazione. Il Bianco può riprendere il cavallo con Cxd4, da cui il minimo +6. È verificata l'unicità della cattura immediata della donna, non l'unicità di tutte le mosse vincenti o il risultato dell'intera partita.

## Copertura e compatibilità

| Misura | Prima del lotto | Attuale |
| --- | ---: | ---: |
| Corsi / esercizi | 282 / 282 | 283 / 283 |
| Corsi siciliani | 21 | 22 |
| Posizioni con almeno un ordine sorgente esatto raggiunto | 1.939 | 1.940 |
| Posizioni raggiunte soltanto per trasposizione | 201 | 201 |
| Posizioni assenti nel corpus A | 10.182 | 10.181 |
| Posizioni assenti nel sottoalbero Chekhover | 13 su 22 | 12 su 22 |

La posizione aggiunta è `position:c2707909c4c54697`, senza nuove ancore ECO. Le due semimosse didattiche non aggiungono altre posizioni del corpus. Copertura delle posizioni, ordini delle mosse, alias e completezza editoriale restano misure distinte.

Tutti i 282 ID, famiglie, titoli e sequenze precedenti riproducono il digest della baseline; anche i 282 esercizi precedenti riproducono il proprio digest. Fonti, Libro, classificazione, configurazione motore e dati/prove congelati mantengono gli hash iniziali. I due moduli del lotto Siciliana precedente restano identici byte per byte. Il nuovo corso ed esercizio hanno moduli distinti, aggiunti agli aggregatori esistenti. Lo storage resta `chessprofessor.openings.v1`, con chiavi `journey:v1:<id>:<side>`.

Copertura attuale dei commenti: 8.984 semimosse spiegate, 1.999 utilizzi di note scritte su 4.519 coppie e 59 percorsi interamente commentati per coppia. Il nuovo percorso aggiunge cinque utilizzi di note scritte, due dei quali nuovi testi specifici; ha cinque coppie scritte su sei. Non è un completamento di P03.

## Verifiche e riproduzione offline

I controlli seguenti non avviano il motore e non rigenerano gli studi storici:

```powershell
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-sicilian-content.mjs --check
node scripts/report-opening-zaitsev-result.mjs --check
```

Il nuovo builder rilegge le trascrizioni, collega score/PV al bestmove, controlla radici, budget, confronti cp e tutte le repliche immediate. Il rapporto attuale verifica il sottoinsieme preservato, gli hash e l'intero corpus di 12.322 posizioni. Le fotografie dei progetti e il rapporto P02.2-SIC-01 conservano i propri input e conteggi; non vanno rigenerati contro i 283 corsi per sovrascrivere il confronto.

| Controllo realmente eseguito | Risultato |
| --- | --- |
| Verificatore del progetto prima dell'integrazione | PASS |
| Preparazione offline del nuovo manifest | PASS, zero ricerche |
| Builder dei nuovi dati e del lotto precedente, rapporto attuale | PASS |
| Test mirati | 6 file, 74 PASS, 70,15 s |
| Build no-env finale | PASS, 134 moduli, 13,52 s |
| Browser dei tre percorsi roadmap | 20 PASS, 3,0 minuti |
| Suite completa no-env finale | 77 file, 729 PASS e 1 TODO preesistente; 198,33 s |

I venti test browser coprono sei completamenti con persistenza e dati preesistenti, desktop e mobile, tre esercizi giocati sulla scacchiera senza soluzione anticipata, sei cambi di ramo nelle due direzioni, quattro checkpoint e una continuazione Zaitsev legale non coperta. Il worker è disabilitato e l'Explorer è simulato. Il primo passaggio ha segnalato due aspettative che richiedevano una linea interamente documentata anche per la nuova provenienza mista; il controllo ora verifica esplicitamente il confine della fonte per Zaitsev, conservando l'aspettativa precedente per gli altri due corsi. La ripetizione finale passa tutti i venti casi.

La build mantiene l'avviso preesistente sui chunk oltre 500 kB. Nessuna soglia è cambiata. La suite finale è stata eseguita dopo il ripristino dei testi e include i controlli sul nuovo contenuto UTF-8. Anche `git diff --check`, i collegamenti locali e l'assenza di lock motore residui sono stati verificati.

Comandi applicativi:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
git diff --check
```

## Artefatti e prossima ripresa

- [Progetto e prompt fissati](OPENING-ZAITSEV-P022-DESIGN.md), [specifica](data/opening-zaitsev-p022-plan.json) e [fotografia del progetto](data/opening-zaitsev-p022-design-verification.json).
- [Rapporto attuale](data/opening-zaitsev-p022-result.json), con tutti i residui Chekhover.
- [Prove del seguito e dell'esercizio](data/opening-zaitsev-p022-practical-verification.json).
- [Nuovo corso](../src/data/openingZaitsevCourses.js) e [nuovo esercizio](../src/data/openingZaitsevPracticalCases.js).

La prossima parte è la progettazione congiunta dei residui Chekhover del ramo ...Ad7: 7.c4 e finali di linea 10.Dd3/11.Dd2, verificandone fonti, prefissi, dipendenze e riuso. Gli altri dodici residui restano tracciati nel rapporto: questa indicazione non li esclude dal perimetro A.

Configurazione consigliata per quel lavoro: **GPT-6 Astra / High**. Fermarsi prima della nuova progettazione e attendere il cambio manuale e il «continua» di Carlo. Nessun commit, push o deploy in questo lotto.
