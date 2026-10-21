# P02.2-SIC-03 — Chekhover dopo ...Ad7

**Implementazione completata il 21 ottobre 2026.** [Risultati, verifiche e punto di ripresa](OPENING-CHEKHOVER-P022-RESULTS.md). Il progetto sottostante conserva le decisioni e la baseline precedenti all'integrazione; il suo verificatore non va rigenerato sui 286 corsi attuali.

Progetto del 21 ottobre 2026. **Solo progettazione conclusa: implementazione e verifiche motore ancora da eseguire.** La baseline pubblicata resta 283 corsi ed esercizi; questo documento non completa P02.

Leggere insieme alla [roadmap e al protocollo comune](ROADMAP-E-PROMPT-OPERATIVI.md), alla [specifica fissata](data/opening-chekhover-p022-plan.json) e alla [prova offline](data/opening-chekhover-p022-design-verification.json). Il punto precedente è il [risultato Zaitsev](OPENING-ZAITSEV-P022-RESULTS.md). Il perimetro completo A è già confermato.

## Risultato progettato e fonti

Tre percorsi aggiungono quattro posizioni sorgenti mancanti del gruppo Chekhover con 5...Ad7. Sono moduli di confronto e prosecuzione del corso esistente `sicilian:chekhover-bd7`: non sostituiscono quel corso e non vengono presentati come tre partite complete fino al mediogioco.

| Nuovo ID, dopo `sicilian:` | Prefisso comune col corso esistente | Fonte | Seguito didattico scelto | Totale |
| --- | ---: | --- | --- | ---: |
| `chekhover-c4-g6` | 12 semimosse: bivio 7.c4 / 7.Cc3 | Fino a 8...g6; anche record intermedio 7.c4 | Nessuno | 16 |
| `chekhover-qd3` | 18 semimosse: bivio 10.Dd3 / 10.The1 | Fino a 10.Dd3 | 10...O-O | 20 |
| `chekhover-qd2` | 20 semimosse: intero corso precedente | Fino a 11.Dd2 | 11...Dc7 | 22 |

Totale: **56 semimosse documentate, 2 scelte didattiche, 0 generate dal motore**. I due seguiti sono legali ma devono ancora superare il controllo previsto. Non attribuire alla fonte l'intera sequenza di 20 o 22 semimosse.

Fonte primaria locale: catalogo JeffML/eco.json, revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, licenza MIT, SHA256 `5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2`. Le quattro voci sono B53, fissate nel corpus P01:

| Record | Posizione | Termine documentato |
| --- | --- | --- |
| `eco:e3db46f894b3eb7c` | `position:65a7a0f0faa6092b` | 7.c4 |
| `eco:cab3a0b1cf0331d6` | `position:559d29741ab02c1f` | 8...g6 |
| `eco:ce70dab23d629d53` | `position:cb47b173ef24af42` | 10.Dd3 |
| `eco:aed1668deddb6fa8` | `position:1e26b7829d87dc1e` | 11.Dd2 |

Nelle fonti fissate non ci sono ulteriori discendenti di questi prefissi oltre alle quattro voci elencate. Le posizioni selezionate non hanno riferimenti Lichess né nuove ancore ECO; non contare il catalogo aggregato e le sue fonti come testimonianze indipendenti. Gli ID di famiglia archiviati nel catalogo restano immutati; l'associazione corrente è `sicilian`.

## Contenuto e vincoli sulle spiegazioni

La specifica contiene sequenze complete, piani per entrambi i colori, motivazioni della conclusione, dichiarazioni delle fonti e quattro note specifiche: indici 12/14 per c4, 18 per Dd3, 20 per Dd2. Fissare `editorialLine` alla sequenza completa di ciascun corso. Riutilizzare soltanto spiegazioni già riferite al medesimo prefisso e alla risposta effettiva; non copiare automaticamente tutte le note del corso padre. La copertura dei commenti va misurata dopo l'integrazione: quattro testi nuovi non equivalgono a tre corsi interamente commentati.

- Dopo 8...g6 l'alfiere nero è ancora in f8 e i re sono in e1/e8. c4 controlla d5, Cc3 sostiene e4, Cf6 attacca e4; anche la donna d4 difende e4. Il fianchetto è preparato, non completato.
- Dopo 10.Dd3 e l'arrocco didattico la donna d3 sostiene e4. Le torri bianche sono in d1 e h1, non in e1. Gli arrocchi opposti non dimostrano un attacco vincente.
- Dopo 11.Dd2 Dc7 le torri bianche sono in d1/e1. Dc7 libera d8 e collega le torri nere a8/f8; l'alfiere c6 interrompe la colonna davanti alla donna. Non dichiarare un attacco diretto della donna c7 al pedone c2.

Il verificatore riproduce le posizioni e controlla i fatti geometrici principali. L'obiettivo è rendere utilizzabile ogni nuovo percorso; la revisione completa dei commenti resta P03.

## Dipendenza necessaria: prosecuzione e ritorno al percorso contenuto

I primi due percorsi hanno veri bivi alle semimosse 12 e 18. Il terzo **prosegue** il percorso esistente: il nodo a 20 contiene la fine del vecchio corso e una sola mossa successiva, Dd2. `curriculumFork` deve continuare a distinguere queste situazioni; non aggiungere una scelta fittizia alla scacchiera.

Oggi `curriculumReturnIndex` restituisce 20 anche quando si torna dal nuovo percorso Dd2 al vecchio percorso di sole 20 semimosse. `returnToBranch` usa quell'indice senza un controllo: il checkpoint finisce già alla conclusione del percorso, senza mosse attive da giocare. È una dipendenza concreta del lotto, da risolvere con una modifica circoscritta alla ripresa.

Comportamento richiesto:

1. Vecchio corso → Dd2: mostrare la posizione comune dopo 10...O-O; testo di **prosecuzione**, non di bivio. Dopo l'avvio esplicito il Bianco gioca Dd2 e riceve ...Dc7; con il Nero viene mostrata Dd2 e il giocatore esegue ...Dc7. Entrambi hanno una mossa attiva.
2. Dd2 → vecchio corso: se l'indice restituito è maggiore o uguale alla lunghezza del percorso destinazione, preparare un checkpoint all'indice 0, con motivo `contained-route` o equivalente. Spiegare che il percorso più breve è già contenuto in quello appena seguito; offrire **«Ripassa questo percorso dall'inizio»**. Non aggiungere completamenti o progressi per il solo prefisso comune.
3. Dopo il clic di avvio mantenere la normale gestione del colore: posizione iniziale per il Bianco, prima mossa avversaria automatica per il Nero. Solo il completamento effettivo può registrare il risultato, rispettando la politica esistente sugli aiuti e sul ripasso.
4. Per i due bivi reali mantenere checkpoint, cambi nelle due direzioni e spiegazioni della risposta avversaria. L'ordine e le statistiche dei rami restano quelli esistenti; niente ridisegno generale P04.

La prova offline simula il controllo proposto e completa i percorsi con entrambi i colori; **non dimostra che la correzione sia già nell'app**. Test browser e persistenza sono obbligatori nel prossimo lavoro. Distinguere nel titolo/testo del checkpoint i tre motivi: bivio reale, prosecuzione, ripasso dall'inizio.

## Tre esercizi costruiti

Ogni esercizio ha ID `practice:<courseId>`, appartiene al suo corso e contiene il prefisso, una deviazione costruita e la risposta prevista. Non deriva da partite personali né da errori di frequenza misurata. `beforeIndex` conta le semimosse prima della deviazione; il punto iniziale giocabile è `beforeIndex + 1`.

| Corso | beforeIndex | Deviazione | Risposta | Colore | Pezzo catturato | Repliche immediate | Saldo minimo |
| --- | ---: | --- | --- | --- | --- | ---: | ---: |
| c4/g6 | 13 | 7...Axe4 | 8.Dxe4 | Bianco | Alfiere | 24 | +2 |
| Dd3 | 20 | 11.Db5 | 11...Axb5 | Nero | Donna | 39 | +6 |
| Dd2 | 21 | 11...Aa4 | 12.Cxa4 | Bianco | Alfiere | 26 | +2 |

Sono state enumerate tutte le **89 repliche immediate legali** con `chess.js`, confrontando il materiale con la posizione prima dell'errore: p=1, C/A=3, T=5, D=9. È unica la cattura immediata del tipo di pezzo bersaglio nei tre casi; non è dimostrata l'unicità di tutte le mosse vincenti o il risultato della partita.

Nel primo caso il pedone e4 è già perso: guadagno dell'alfiere meno pedone = +2. Nel secondo sia Cxb5 sia Axf6 possono recuperare un pezzo minore: non presentare Cxb5 come unica difesa. Nel terzo ...Cxe4 recupera un pedone e riduce il saldo a +2.

Il caso Dd3 parte **dall'ultima posizione del corso**, quindi `beforeIndex === moves.length` è valido. Il builder non deve imporre `<` né richiedere sempre una cattura della donna: rispettare `capturedType` b/q/b, restando limitato ai casi del lotto. Il testo iniziale mostra solo obiettivo e situazione; soluzione, prevenzione e spiegazione completa vanno rivelate nel momento previsto dal flusso esistente. Il suggerimento di prevenzione va ricavato dalla prova raccolta e presentato come possibilità, senza inventare unicità.

## Piano motore fissato per l'implementazione

Usare `scripts/opening-bounded-engine.mjs` immutato, un collector nuovo e la cartella nuova prevista nella specifica. Non avviare collector storici. Stockfish 16 nativo, hash dell'eseguibile fissato nel piano, un thread, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash prima di ogni ricerca, 200.000 nodi per `go`, timeout 30 secondi.

Le FEN complete, gli ID e le radici dei nove job sono in `engineJobs` della prova offline, in quest'ordine:

| Job | Posizione | Vincolo e uso |
| ---: | --- | --- |
| 1 | Dopo 7.c4 | Libero: baseline esercizio c4 |
| 2 | Dopo 7...Axe4 | Libero: bestmove richiesto Dxe4 (`d4e4`) |
| 3 | Dopo 10.Dd3 | Libero: controllo continuazione |
| 4 | Stessa FEN | `searchmoves e8g8`: arrocco scelto |
| 5 | Dopo 10...O-O nel percorso Dd3 | Libero: baseline esercizio Dd3 |
| 6 | Dopo 11.Db5 | Libero: bestmove richiesto Axb5 (`c6b5`) |
| 7 | Dopo 11.Dd2 | Libero: controllo continuazione **e** baseline esercizio Dd2 |
| 8 | Stessa FEN | `searchmoves d8c7`: Dc7 scelta |
| 9 | Dopo 11...Aa4 | Libero: bestmove richiesto Cxa4 (`c3a4`) |

Nove ricerche primarie = 1.800.000 nodi richiesti. Una sola conferma per job è ammessa esclusivamente quando manca una riga score/PV completa corrispondente al bestmove, secondo il driver esistente. Limite complessivo **18 `go` e 3.600.000 nodi richiesti**, incluse richieste fallite/interrotte e conferme. I nodi riportati vanno registrati separatamente, senza confonderli con il limite richiesto. Il job 7 si riusa: non fare due ricerche identiche.

Criteri da fissare nel manifest prima di eseguire:

1. Hash di piano, prova offline, collector, driver/helper, eseguibile, opzioni, FEN e radici. Salvare richiesta prima di ogni `go`; riusare soltanto risultati con firma identica. Non cancellare lock o prove per forzare tentativi; non rilanciare automaticamente job falliti o interrotti.
2. Rileggere i log offline, collegare bestmove, score cp completo e PV; riprodurre legalmente la PV. Nessuna accettazione automatica di score mate o dati incompleti. Non cambiare il driver vincolato dai lotti precedenti.
3. Continuazioni: confrontare job 3–4 e 7–8, stessa FEN e lato al tratto. Registrare differenza `cp_libero - cp_vincolato` e perdita `max(0, differenza)`, al massimo **100 cp** per ciascuna scelta.
4. Esercizi: bestmove richiesti nei job 2/6/9; variazioni `cp2 + cp1`, `cp6 + cp5`, `cp9 + cp7`, almeno **200 cp** ciascuna. La somma tiene conto del cambio del lato al tratto. Richiedere inoltre i conteggi 24/39/26 e saldi minimi 2/6/2 della prova completa delle repliche immediate, oltre alla soglia materiale minima 2.
5. Pubblicare insieme i tre corsi/esercizi solo se passano **tutti** i controlli. Se un requisito fallisce, conservare le prove, lasciare il lotto non pubblicato e fermarsi per revisione del progetto con Astra / High. Non cercare candidati sostitutivi, alzare budget, abbassare soglie o allungare linee automaticamente. Queste soglie riguardano il lotto, non il classificatore.

## Prompt operativo — GPT-6.1 Sol / High

Realizza esclusivamente P02.2-SIC-03 seguendo questo progetto, la specifica JSON, la prova offline e il protocollo comune. La progettazione è conclusa; non richiedere una nuova conferma del perimetro A. Procedi fino a implementazione e verifiche, salvo fallimento dei controlli fissati o necessità di riprogettazione. Non cambiare modello o delegare per aggirare la pausa concordata con Carlo.

1. **Ripresa e invarianti.** Controlla Git e istruzioni locali senza aggiornare automaticamente il checkout. Esegui il verificatore nuovo in `--check`, entrambi i builder precedenti in `--check` e il rapporto Zaitsev corrente in `--check` prima di modificare l'app. Non leggere `.env`. Mantieni i 70 file elencati in `preserveFiles` e gli hash protetti P02.1 identici byte per byte. La baseline semantica fissa 283 ID/famiglie/titoli/sequenze e tutti i 283 esercizi: verificarli come sottoinsieme dopo l'integrazione.
2. **Raccolta limitata.** Implementa `scripts/collect-opening-chekhover-evidence.mjs` con preparazione offline del manifest, poi i nove job prescritti tramite `runFrozenOpeningJobs`. Verifica il manifest prima delle ricerche. Salva log, richieste, risposte, risultati e firma nella nuova cartella. Nessun richiamo ai collector storici o al motore browser.
3. **Builder offline.** Crea `scripts/build-opening-chekhover-content.mjs`; deve ricontrollare invarianti, log, radici, PV, budget, confronti cp, legalità e materiale prima di scrivere. `--check` deve essere riproducibile e non avviare motori. Supporta soltanto le differenze necessarie: tre casi, tipo di pezzo bersaglio, esercizio all'endpoint e baseline condivisa. Non costruire un nuovo sistema generale di puzzle.
4. **Moduli e provenienza.** Genera `openingChekhoverCourses.js` e `openingChekhoverPracticalCases.js`, separati dai moduli storici. Integra negli aggregatori esistenti senza cicli d'importazione; includi politica e riferimenti alle nuove prove. Usa gli ID e i testi UTF-8 fissati, `editorialLine` esatta, una linea interamente documentata e due prefissi con continuazione didattica. Lo stato di controllo va dichiarato verificato soltanto dopo i gate. Mantieni spiegazioni prima della mossa e risposta avversaria effettiva. Non modificare i vecchi testi per gonfiare la copertura editoriale.
5. **Navigazione necessaria.** Realizza il controllo di destinazione contenuta nel solo flusso di ripresa interessato; distingui nel checkpoint bivio, prosecuzione e ripasso dall'inizio. Preserva il comportamento dei bivi reali e gli ID/storage. Una destinazione già contenuta non deve bloccarsi alla fine né ricevere credito automatico. Il ritorno al corso breve deve richiedere avvio esplicito e mosse giocate. Non cambiare classificazione, Libro, frequenze, soglie o altre interazioni P04.
6. **Test mirati.** Verifica moduli, fonte/seguito, preservazione della baseline, quattro posizioni nuove e otto residui. Verifica entrambe le direzioni dei bivi 12/18, completamento dei nuovi percorsi per entrambi i colori, avanzamento attivo dal checkpoint 20 e ritorno al corso breve dall'indice 0. Aggiungi una regressione che fallisca col comportamento attuale alla destinazione contenuta; controlla assenza di credito prima delle mosse e normale persistenza dopo il completamento. Verifica gli esercizi con alfiere/donna e quello all'endpoint. Non indebolire i test storici o sostituire conteggi esatti con limiti inferiori.
7. **Browser.** Mantieni i venti casi precedenti e aggiungi completamenti dei tre percorsi in entrambi i colori, almeno desktop e mobile nel gruppo, tre esercizi giocati sulla scacchiera senza soluzione anticipata, bivi avanti/indietro, checkpoint 20 nei due colori, ritorno alla destinazione contenuta in entrambi i colori e reload dei progressi nuovi/precedenti. Conserva almeno un'alternativa legale non coperta, come 6.Dd3 nel corso Zaitsev, senza etichettarla come errore. Mantieni worker disabilitato ed Explorer simulato. Misura i nuovi casi realmente eseguiti, senza sommare due esecuzioni degli stessi test come copertura distinta.
8. **Rapporto nuovo.** Crea reporter e risultato nei percorsi `plannedFiles`. Ricalcola l'intero corpus P01 includendo tutte le posizioni intermedie; misura corsi, esercizi, semimosse e note effettive. La proiezione attesa è 286 corsi/esercizi, 25 corsi siciliani, 1.944 posizioni esatte, 201 solo trasposte, 10.177 assenti, otto residui Chekhover, zero nuove ancore ECO. Non imporre il numero dei commenti a priori. Aggiorna gli inventari attuali, README dei dati e documentazione della biblioteca con risultati reali.
9. **Fotografie storiche.** Non rigenerare vecchi audit, progetti o report per adattarli ai nuovi conteggi. Dopo l'integrazione questo verificatore di progetto e il reporter Zaitsev non sono più verificatori globali correnti: lascia i loro output come fotografie. Il nuovo builder/reporter deve validarne hash e sottoinsiemi; entrambi i builder precedenti devono invece continuare a passare in `--check` perché controllano moduli isolati.
10. **Verifiche finali e consegna.** Esegui test mirati, suite completa, build no-env e browser del gruppo roadmap aggiornato, poi controlli offline dei builder/report corrente e `git diff --check`. Registra comandi, esiti, richieste/ricerche reali, nodi richiesti/riportati, gate e limiti in `OPENING-CHEKHOVER-P022-RESULTS.md` e nella roadmap. Nessun commit, push o deploy. Fermati prima del progetto successivo e indica **GPT-6 Astra / High**: prossimo gruppo da progettare, alternative Chekhover precoci con 4...a6 e dipendenze; i residui 4...Cf6 e 4...Ad7 restano nel perimetro.

Comandi applicativi da usare nella fase di implementazione, dopo i test mirati:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
```

Per i testi italiani usare scrittura UTF-8 che preservi i caratteri; evitare here-string PowerShell piped a Node con codifica implicita. Non modificare i piani dei lotti precedenti per correggerne i testi archiviati.

## Verifica del progetto e impatto previsto

| Misura | Attuale verificata | Proiezione condizionata ai controlli |
| --- | ---: | ---: |
| Corsi / esercizi | 283 / 283 | 286 / 286 |
| Corsi siciliani | 22 | 25 |
| Posizioni con ordine esatto | 1.940 | 1.944 |
| Solo per trasposizione | 201 | 201 |
| Assenti nel corpus A | 10.181 | 10.177 |
| Assenti nel sottoalbero Chekhover | 12 su 22 | 8 su 22 |

La proiezione deriva dal replay contro tutte le 12.322 posizioni del corpus. Le due mosse didattiche non aggiungono ulteriori posizioni sorgenti. Gli otto residui sono elencati nel JSON di verifica, inclusi i discendenti delle alternative 4...a6, 4...Cf6 e 4...Ad7; nessuno è stato escluso dal perimetro A.

Verifiche offline del progetto:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/report-opening-zaitsev-result.mjs --check
node scripts/verify-opening-chekhover-design.mjs
node scripts/verify-opening-chekhover-design.mjs --check
git diff --check
```

Esito: legalità, fonti, hash e baseline preservati; 89 repliche immediate, saldi minimi 2/6/2; simulazioni offline di completamento e del controllo proposto; nove job preparati nel rapporto, **zero ricerche eseguite**. Nessuna modifica applicativa; build, suite e browser del lotto restano da eseguire durante l'implementazione.

**Prossimo passo: GPT-6.1 Sol / High**, per eseguire il prompt operativo. È una scelta per questo incarico di integrazione e test, coerente con il protocollo concordato; non un confronto misurato dei modelli sul progetto. La [documentazione ufficiale OpenAI](https://developers.openai.com/api/docs/models/gpt-6.1-sol), consultata il 21 ottobre 2026, include il lavoro di programmazione complesso e il livello `high` tra gli usi/opzioni del modello. Fermarsi qui per il cambio manuale richiesto da Carlo e riprendere al suo «continua».
