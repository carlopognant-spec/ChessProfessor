# P02.2-SIC-01 — Due nuovi percorsi della Siciliana

Data: 20 ottobre 2026. Implementazione con GPT-6.1 Sol / High, dopo la progettazione con GPT-6 Astra / High.

## Risultato

Sono disponibili Najdorf con 6.Ag5 e sviluppo classico, fino a 11...Ab7, e Chekhover con 4.Dxd4 e ...Ad7, fino a 10...O-O. Le 42 semimosse complessive sono integralmente presenti nelle fonti fissate. Ogni percorso ha piani per entrambi i colori e note specifiche: 13 nuovi testi per coppia, oltre al riuso dei prefissi esatti già commentati.

Entrambi i percorsi sono praticabili con Bianco e Nero. La navigazione distingue il bivio 6.Ag5/6.Ae3 della Najdorf e la ricattura 4.Dxd4/4.Cxd4 della Chekhover. Le note mostrano la provenienza della linea interamente documentata. Le conclusioni didattiche sono a 22 e 20 semimosse; non sono state generate mosse per allungarle.

I due esercizi costruiti allenano la cattura della donna dopo 7...Cxe4 nella Najdorf e dopo 5.Ac4 nella Chekhover. La soluzione e il suggerimento di prevenzione appaiono nel riepilogo dopo la risposta. Non sono errori di frequenza misurata o posizioni attribuite a partite storiche.

## Copertura effettiva

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Corsi totali | 280 | 282 |
| Corsi siciliani | 19 | 21 |
| Esercizi costruiti | 280 | 282 |
| Posizioni con almeno un ordine delle fonti raggiunto esattamente | 1.919 | 1.939 |
| Posizioni raggiunte soltanto per trasposizione | 201 | 201 |
| Posizioni ancora assenti nel perimetro A | 10.202 | 10.182 |

Le 20 nuove posizioni comprendono 6 posizioni con ancore ECO. I dati effettivi coincidono con la proiezione del progetto. Nei sottoalberi esatti Najdorf 6.Ag5 e Chekhover 4.Dxd4 restano rispettivamente 145 e 13 posizioni assenti, elencate nel rapporto. Questi 158 residui non rappresentano tutte le lacune della Siciliana.

Il perimetro completo A rimane confermato e P02 rimane in corso. Raggiungere una posizione non equivale a commentare integralmente una variante o a completare tutti gli ordini d'ingresso. Dopo il lotto risultano 1.994 utilizzi di note scritte su 4.513 coppie, 8.972 semimosse con spiegazione posizionale e 59 percorsi interamente commentati per coppia. Sono misure distinte dalla revisione editoriale integrale P03.

## Evidenza motore limitata

Sono state eseguite esattamente **4 ricerche**, senza conferme aggiuntive: 800.000 nodi richiesti e 800.533 nodi effettivamente riportati. Nessuna ricerca è stata eseguita per costruire le mosse dei corsi. Motore: Stockfish 16 nativo, un thread, Hash 32 MiB, MultiPV 1, hash azzerata a ogni ricerca; eseguibile e driver vincolati nel manifest.

| Esercizio | Risorsa verificata | Variazione cp di controllo | Repliche legali immediate | Saldo materiale minimo |
| --- | --- | ---: | ---: | ---: |
| Najdorf dopo 7...Cxe4 | 8.Axd8 | 550 | 26 | 5 |
| Chekhover dopo 5.Ac4 | 5...Cxd4 | 609 | 39 | 6 |

La variazione cp è `cp_after + cp_before`, perché gli score sono relativi al lato al tratto e le posizioni hanno tratto opposto. È un controllo della deviazione costruita al budget dichiarato, non una soglia nuova del classificatore. Il controllo materiale enumera ogni replica legale immediata dopo la cattura, indipendentemente dallo score del motore. Il modello materiale usa pedone=1, cavallo/alfiere=3, torre=5, donna=9.

È verificata l'unicità della cattura immediata della donna, non l'unicità di tutte le possibili mosse vincenti. Le verifiche non sono una prova sull'intera partita. Il browser usa gli artefatti raccolti e non avvia il motore della biblioteca.

## Compatibilità e artefatti

Conservati tutti i 280 ID e le relative famiglie, titoli e mosse, con verifica del digest originale come sottoinsieme dei 282 corsi. Catalogo sorgente, Libro, configurazione e classificazione protetti mantengono gli hash iniziali. `openingExpansion.js`, `openingPracticalCases.js` e le due prove storiche restano identici byte per byte.

I nuovi dati sono in moduli distinti; l'aggregatore espone insieme gli esercizi storici e quelli nuovi. Lo storage continua a usare `chessprofessor.openings.v1` e chiavi `journey:v1:<id>:<side>`. I test browser partono da preferiti e progressi già salvati e ne verificano la conservazione dopo il completamento e il ricaricamento.

- [Progetto originario e prompt](OPENING-SICILIAN-P022-DESIGN.md).
- [Specifica fissata](data/opening-sicilian-p022-plan.json).
- [Rapporto attuale: invarianti, copertura e residui](data/opening-sicilian-p022-result.json).
- [Manifest delle sole ricerche autorizzate](data/opening-sicilian-p022-engine/manifest.json), con richieste, trascrizioni e risultati separati nelle sottocartelle.
- [Prove dei nuovi esercizi](data/opening-sicilian-p022-practical-verification.json).
- [Nuovi corsi](../src/data/openingRoadmapCourses.js), [nuovi esercizi](../src/data/openingRoadmapPracticalCases.js), [aggregatore](../src/lib/openingPracticalLibrary.js).

Le fotografie P01, P02.1 e del progetto restano conservate. I loro generatori dipendono dagli input storici: dopo l'aggiunta dei due corsi non vanno rigenerati per cancellare il confronto. Usare il rapporto attuale per il risultato dell'implementazione.

## Verifiche

Verifiche offline riproducibili, senza avviare Stockfish:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/report-opening-sicilian-result.mjs --check
```

Il primo comando riproduce e confronta i nuovi dati dalle fonti e dalle trascrizioni già raccolte, inclusi bestmove, score, PV e tutte le repliche immediate. Il secondo verifica il sottoinsieme storico, gli hash protetti, gli esercizi e la copertura effettiva del corpus A.

| Controllo eseguito | Risultato |
| --- | --- |
| Verificatori offline dei dati e della copertura | PASS |
| Test mirati di corsi, espansioni ed esercizi | 3 file, 56 PASS |
| Build no-env | PASS, 132 moduli, 5,00 s |
| Browser dei due nuovi corsi | 13 PASS, 2,2 minuti |
| Suite completa no-env | 76 file, 724 PASS e 1 TODO preesistente; 148,16 s |

Comandi applicativi eseguiti:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
git diff --check
```

I 13 test browser coprono quattro sessioni complete, persistenza dei progressi, desktop e mobile, due esercizi con risposte sulla scacchiera, i quattro cambi di ramo nelle due direzioni, due checkpoint del Nero e la risposta legale ...Dd7 ancora fuori dal percorso disponibile. Il worker è disabilitato e le richieste Explorer sono simulate. Non sono state verificate tutte le pagine dell'app o tutte le linee nel browser.

Il primo passaggio della suite ha individuato due aspettative storiche da aggiornare: conteggi dei commenti e lunghezza minima indiscriminata. I controlli ora conservano i 58 percorsi storici interamente commentati e il minimo precedente per i vecchi corsi, aggiungendo il controllo esatto dei nuovi conteggi e delle due conclusioni documentate. Nessuna soglia di qualità o prova storica è stata eliminata.

La build conserva l'avviso preesistente sui chunk oltre 500 kB; la soglia non è cambiata. Nessun commit, push o deploy.

## Ripresa

Questo lotto chiude i due percorsi previsti, non P02 nel suo insieme. La prossima parte è la progettazione del ramo Chekhover Zaitsev con 5...Dd7 e delle sue dipendenze, partendo dai 13 residui del sottoalbero Chekhover e verificando la distinzione rispetto a ...Ad7.

Configurazione consigliata: **GPT-6 Astra / High**. Fermarsi prima di questo lavoro, attendendo il cambio manuale e il «continua» di Carlo. Al termine del prossimo progetto, indicare nuovamente la configurazione adatta alla sua implementazione.
