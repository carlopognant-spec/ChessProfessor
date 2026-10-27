# P02.2-SIC-05 — Chekhover con 4...Cf6 e 4...Ad7

Progetto del 21 ottobre 2026, ora **implementato e verificato**: [risultati e prossima ripresa](OPENING-CHEKHOVER-EARLY-P022-RESULTS.md). L’applicazione ha 290 corsi e 290 esercizi; otto ricerche primarie, zero conferme, suite completa 749 PASS e un TODO preesistente, build PASS, browser 87 PASS. Il progetto sotto conserva la fotografia precedente all’integrazione a 288 corsi e il prompt operativo storico. Non rieseguire il verificatore di progetto sul nuovo totale; usare i cinque builder isolati e il reporter SIC-05 corrente in `--check`.

Leggere insieme alla [roadmap e al protocollo comune](ROADMAP-E-PROMPT-OPERATIVI.md), alla [specifica fissata](data/opening-chekhover-early-p022-plan.json) e alla [prova offline](data/opening-chekhover-early-p022-design-verification.json). Baseline: [risultato SIC-04](OPENING-CHEKHOVER-A6-P022-RESULTS.md). Il perimetro completo A è già confermato.

## Risultato progettato e fonti

Due percorsi coprono le tre posizioni Chekhover ancora assenti nelle fonti fissate. Il nodo 4...Cf6 e il suo discendente 5.Cc3 appartengono allo stesso percorso; 4...Ad7 è un ingresso differente dal 5...Ad7 del corso già disponibile.

| ID dopo `sicilian:` | Sequenza dopo 4.Dxd4 | Fonte | Seguito didattico | Totale semimosse |
| --- | --- | ---: | --- | ---: |
| `chekhover-nf6` | 4...Cf6 5.Cc3 Ad7 | 9 | 5...Ad7 | 10 |
| `chekhover-early-bd7` | 4...Ad7 5.Cc3 Cf6 | 8 | 5.Cc3 Cf6 | 10 |

Totale sulle due linee, con prefissi ripetuti: **17 semimosse documentate, tre scelte didattiche, zero generate dal motore**. Gli esempi convergono nella stessa FEN completa, pur attraversando posizioni iniziali diverse. Questo è lo scopo del confronto: i due percorsi restano distinti per ordine di mosse e posizione sorgente d’ingresso. Sono moduli brevi collegati agli itinerari Chekhover esistenti, non due nuove partite complete fino al mediogioco.

Fonte locale fissata: JeffML/eco.json, revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, licenza MIT, SHA256 catalogo `5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2`.

| Record B53 | Posizione | Termine documentato |
| --- | --- | --- |
| `eco:db3b24f2c8f7bcc1` | `position:7161d5217d6da902` | 4...Cf6 |
| `eco:2e1f03274972c77b` | `position:2b356881d43ce8ce` | 4...Cf6 5.Cc3 |
| `eco:7cd29665e2cfcb77` | `position:c9c6ddc7d60aa2cf` | 4...Ad7 |

Nessun ulteriore discendente dei due prefissi nelle fonti fissate, nessun riferimento Lichess per queste tre posizioni e nessuna nuova ancora ECO. La FEN finale degli esempi didattici non compare come posizione del corpus P01: non attribuirla alla fonte e non contarla come una quarta posizione aggiunta. Il catalogo aggregato e le fonti che incorpora non sono conferme indipendenti.

## Contenuto e trasposizione

Il piano fissa titoli, piani per i due colori, contrasto, endpoint, provenienza e quattro note specifiche, agli indici di coppia 6 e 8 di ciascun corso. `editorialLine` deve contenere l’intera sequenza esatta. La risposta nera all’indice 7 appartiene alla coppia 6: non ereditare la nota del vecchio corso che descrive ...Cc6.

- Dopo 4...Cf6 il cavallo attacca e4, già difeso dalla donna d4; non attacca la donna. Cc3 aggiunge una difesa a e4.
- Dopo 4...Ad7 i cavalli neri sono ancora in b8/g8. La diagonale d7-c6-b5-a4 è libera; nel vecchio ordine 4...Cc6 5.Ab5 Ad7 il cavallo c6 la interrompe. Il verificatore controlla entrambe le posizioni.
- Alla fine dei due esempi la donna d4 e il cavallo c3 difendono e4, attaccato dal cavallo f6. L’alfiere nero è in d7, il cavallo b8 e l’alfiere f8 restano da sviluppare, i re sono in e1/e8.

FEN comune verificata:

```text
rn1qkb1r/pp1bpppp/3p1n2/8/3QP3/2N2N2/PPP2PPP/R1B1KB1R w KQkq - 3 6
```

Non fondere i corsi per questa FEN. I loro primi sette tratti sono comuni, poi divergono alla risposta nera: la ripresa deve mostrare il bivio all’indice 7. Il raggiungimento dello stesso endpoint non completa automaticamente l’altro ordine né autorizza a saltare direttamente alla sua fine. Il trie e il checkpoint attuali, basati sulle sequenze, supportano già questo comportamento.

## Navigazione da verificare nell’implementazione

Il nodo dopo Dxd4 avrà quattro risposte documentate rappresentate: **...Cc6, ...a6, ...Cf6 e ...Ad7**. Mantenere gli ID e l’ordine dei moduli precedenti; aggiungere il corso Cf6 e poi quello Ad7 precoce. I rappresentanti di ...Cc6 e ...a6 restano i corsi già esistenti.

Verificare tre coppie in entrambe le direzioni: vecchio `sicilian:chekhover-bd7` ↔ nuovo Cf6, vecchio corso ↔ nuovo Ad7 precoce, e i due nuovi fra loro. Tutti i sei collegamenti sono bivi neri all’indice 7.

1. Dopo aver completato il corso di partenza, il corso destinazione non deve ricevere credito, anche quando ha la stessa FEN finale. Il checkpoint mostra la posizione dopo Dxd4 e attende «Inizia questa variante».
2. Con il Bianco, solo dopo l’avvio viene mostrata ...Cf6 o ...Ad7; il giocatore esegue Cc3 e riceve la risposta prevista. Con il Nero, il giocatore esegue la quarta mossa, riceve Cc3 e poi gioca la quinta. Entrambi hanno mosse attive.
3. Nei cambi durante il gioco, la risposta alternativa proposta non modifica la scacchiera né registra progressi prima di «Segui». Dopo «Segui» al tratto nero 7 si arriva all’indice 9: resta ancora una mossa nera nei due percorsi brevi, quindi non sono già completati.
4. Nel corso Cf6, 5.Ae3 all’indice 8 è legale e non coperta. Non associarla al corso Ae3 dopo ...a6, che ha un altro prefisso; mantenere il messaggio di alternativa alla linea senza giudizio di errore scacchistico.
5. Conservare i controlli precedenti su bivi, prosecuzioni e destinazioni contenute. Non occorre una modifica generale della navigazione o una nuova interfaccia delle trasposizioni.

La prova offline esercita il codice attuale di pratica/checkpoint, sei transizioni nei due colori, i quattro figli del bivio e la FEN comune. UI, persistenza e assenza di credito automatico vanno confermate nel browser dopo l’integrazione.

## Due esercizi costruiti

| Percorso | beforeIndex | Deviazione | Risposta | Colore | Bersaglio | Repliche immediate | Saldo minimo |
| --- | ---: | --- | --- | --- | --- | ---: | ---: |
| Cf6 | 9 | 5...Af5 | 6.exf5 | Bianco | Alfiere | 27 | +3 |
| Ad7 precoce | 8 | 5.Da4 | 5...Axa4 | Nero | Donna | 33 | +9 |

`beforeIndex` conta le semimosse prima della deviazione; l’inizio giocabile è `beforeIndex + 1`. I casi sono costruiti da posizioni del percorso: niente attribuzione a partite personali, frequenze misurate o errori tipici osservati.

Tutte le **60 repliche immediate legali** sono enumerate nella prova. Il materiale è confrontato con la posizione prima dell’errore, usando p=1, C/A=3, T=5, D=9. In ciascun caso è unica la cattura immediata del tipo di pezzo bersaglio, non è dimostrata l’unicità di tutte le mosse vincenti o l’esito della partita.

Nel primo caso il pedone e4 cattura l’alfiere f5. Dopo ...Cc6 la donna d4 viene attaccata: il guadagno immediato non elimina le decisioni successive. Nel secondo, Da4 **non è scacco** perché l’alfiere d7 interrompe la diagonale verso e8; lo stesso alfiere può catturare la donna lungo d7-c6-b5-a4.

Mostrare prima della risposta obiettivo e posizione; rivelare soluzione, spiegazione e possibile prevenzione secondo il flusso esistente. Ricavare la prevenzione dalla prova raccolta, senza dichiararla unica o attribuirla al catalogo.

## Otto job motore fissati

Usare il driver storico immutato `scripts/opening-bounded-engine.mjs` e un collector nuovo. Stockfish 16 nativo, eseguibile/hash nel piano, Threads 1, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash prima di ogni ricerca, 200.000 nodi richiesti per `go`, timeout 30 secondi. Non avviare collector storici o il motore browser.

FEN, ID, radici, `courseId`, `authoredIndex` e usi esatti sono in `engineJobs` della prova, nell’ordine seguente:

| Job | Posizione | Ricerca e uso |
| ---: | --- | --- |
| 1 | Dopo 4...Cf6 5.Cc3 | Libera: controllo ...Ad7 e baseline esercizio Af5 |
| 2 | Stessa FEN | `searchmoves c8d7`: ...Ad7 scelto |
| 3 | Dopo 5...Af5 | Libera: bestmove richiesto exf5, `e4f5` |
| 4 | Dopo 4...Ad7 | Libera: controllo Cc3 e baseline esercizio Da4 |
| 5 | Stessa FEN | `searchmoves b1c3`: Cc3 scelto |
| 6 | Dopo 4...Ad7 5.Cc3 | Libera: controllo ...Cf6 |
| 7 | Stessa FEN | `searchmoves g8f6`: ...Cf6 scelto |
| 8 | Dopo 5.Da4 | Libera: bestmove richiesto ...Axa4, `d7a4` |

Otto ricerche primarie = **1.600.000 nodi richiesti**. Il job 1 e il job 4 sono ciascuno riusati per un esercizio. La convergenza finale non rende uguali le FEN dei tre confronti: non riusare un risultato su una radice diversa.

Una sola conferma per job è ammessa esclusivamente quando manca score/PV completo corrispondente al bestmove, secondo il driver fissato. Limite totale **16 `go` e 3.200.000 nodi richiesti**, incluse richieste fallite/interrotte e conferme. Registrare separatamente i nodi riportati; niente aumento automatico di budget, ricerca di candidati sostitutivi o rilancio automatico dei job falliti/interrotti.

Preparare prima delle ricerche il manifest con hash di piano, prova, collector, driver/helper/eseguibile, opzioni, FEN, radici e criteri. Salvare le richieste prima dei `go`, usare soltanto prove con firma identica e non cancellare lock o log per forzare tentativi.

Gate prima della pubblicazione:

1. Rileggere le trascrizioni offline e verificare bestmove, score cp completo, PV corrispondente e sua legalità. Score mate o prove incomplete richiedono revisione, senza accettazione automatica.
2. Confrontare separatamente le coppie **1/2, 4/5 e 6/7**, con stessa FEN e lato al tratto. Registrare differenza `cp_libero - cp_vincolato` e perdita `max(0, differenza)`, massimo **100 cp per scelta**. Non sommare score di posizioni diverse e non trattare il controllo di una mossa come prova delle altre due.
3. Esercizi: bestmove richiesti nei job 3/8, variazioni **`cp3 + cp1` e `cp8 + cp4`**, almeno **200 cp**, correggendo così il cambio di lato al tratto. Verificare anche le 27/33 repliche, i saldi 3/9 e la soglia materiale minima 2.
4. Pubblicare insieme i due corsi e i due esercizi solo dopo tutti i gate. Se uno fallisce, conservare le prove e fermarsi per revisione **GPT-6 Astra / High**; non ritoccare mosse, soglie, conteggi o budget per ottenere l’accettazione. Le soglie del lotto non riguardano il classificatore.

## Prompt operativo — GPT-6.1 Sol / High

Realizza esclusivamente P02.2-SIC-05 seguendo questo documento, il piano JSON, la prova offline e il protocollo comune. Il perimetro A è già approvato. Procedi fino a implementazione e verifiche, salvo fallimento dei gate o necessità concreta di riprogettazione. Rispetta il cambio manuale richiesto da Carlo; non aggirarlo delegando a un modello diverso.

1. **Ripresa e invarianti.** Controlla Git e istruzioni locali senza aggiornare automaticamente il checkout. Prima delle modifiche applicative esegui questo verificatore in `--check`, i quattro builder precedenti e il reporter SIC-04 corrente in `--check`. Non leggere `.env`. Mantieni identici i 134 file `preserveFiles` e gli hash protetti P02.1. Conserva i 288 corsi e i 288 esercizi precedenti tramite baseline e digest, compresi i due percorsi con ...a6; non normalizzare i file congelati.
2. **Raccolta limitata.** Crea il collector e la nuova cartella previsti da `plannedFiles`. Prepara prima il manifest offline, controlla gli otto job e i due riusi delle baseline, quindi esegui tramite `runFrozenOpeningJobs`. Il driver, gli eseguibili e le prove dei vecchi lotti restano immutati.
3. **Builder con tre scelte controllate.** Crea il builder offline adattando soltanto ciò che serve: questo piano usa **`authoredMoves` come array**, con una scelta nel primo corso e due nel secondo. Controllare ogni indice/SAN/UCI contro la sequenza, quindi una coppia libera/vincolata per ciascuna mossa. Emettere tre `continuationChecks` distinguibili per `courseId` e `authoredIndex`; generare comunque un solo corso e un solo esercizio per voce del piano. Non ricopiare il ramo singolo `spec.authoredMove` del builder SIC-04: salterebbe le tre verifiche. `--check` deve ricostruire gli stessi output senza motore e fallire su incoerenze di log, radici, budget, cp, materiale o fonte.
4. **Moduli e provenienza.** Genera `openingChekhoverEarlyCourses.js` e `openingChekhoverEarlyPracticalCases.js`, nell’ordine Cf6/Ad7 precoce, poi integrali negli aggregatori esistenti senza cicli. I due corsi hanno provenienza mista 9+1 e 8+2; marcare il seguito verificato solo dopo i gate. Fissare `editorialLine`, i quattro testi UTF-8 e i due esercizi, includendo policy e riferimenti alle prove. Preservare confine della fonte, domanda prima della mossa e risposta avversaria effettiva. Non deduplicare i corsi per la FEN finale.
5. **Navigazione.** Utilizzare il comportamento esistente basato sul prefisso di mosse. Le tre coppie hanno prefisso 7, non 10 anche quando condividono l’endpoint. Verificare i quattro figli del bivio e i rappresentanti nuovi/esistenti. Se emerge un difetto concreto, correggere solo il comportamento necessario con una regressione; una riprogettazione sostanziale richiede la pausa concordata. Non aprire P04.
6. **Test mirati.** Aggiungere `tests/opening-chekhover-early-roadmap.test.js` con preservazione della baseline, tre posizioni nuove, confine 9+1/8+2, note della risposta nera alla coppia 6, tutti i tre confronti e due baseline condivise, 60 repliche e saldi, completamento nei due colori e sei transizioni dirette. Verificare la FEN comune e i progressi distinti, il prefisso 7 e il caso legale Ae3 non coperto. Integrare prove e nuovi ID nei test aggregati di espansione, varianti, scope, commenti e spiegazioni. Entrambe le lunghezze nuove sono 10: aggiungerle esplicitamente alla politica dei moduli sorgenti brevi, senza ridurre il requisito delle vecchie linee o sostituire conteggi esatti con limiti inferiori.
7. **Browser.** Conservare i 62 casi precedenti. Aggiungere quattro completamenti dei nuovi corsi nei due colori, due esercizi sulla scacchiera senza soluzione anticipata, sei cambi durante il gioco col Nero (tre coppie × due direzioni), dodici riprese da checkpoint (tre coppie × due direzioni × due colori) e Ae3 legale non coperta. Totale **25 scenari aggiuntivi, 87 complessivi** con un test per scenario. I quattro checkpoint fra i due nuovi corsi devono verificare esplicitamente assenza di completamento della destinazione dopo aver finito l’altro ordine con la stessa FEN, prefisso 7, avvio esplicito e registrazione solo dopo le mosse residue. Verificare reload, preferiti e progressi precedenti, desktop/mobile nel gruppo. I nomi dei test includano origine, destinazione, direzione e colore per evitare duplicati. Worker disabilitato, Explorer simulato, nessuna nuova ricerca browser; contare i casi distinti realmente eseguiti.
8. **Rapporto corrente.** Creare reporter, JSON e documento risultati. Replay dell’intero corpus P01 con posizioni intermedie: attesi 290 corsi/esercizi, 29 siciliani, 1.952 posizioni esatte, 201 solo trasposte, 10.169 assenti e zero nuove ancore ECO. Per il sottoalbero Chekhover attese **22 posizioni su 22 con almeno un ordine esatto**, non la completezza della teoria o dell’intera Siciliana. Registrare la FEN didattica condivisa senza contarla come nuova posizione sorgente. Ricalcolare commenti e semimosse effettivi; aggiornare inventari, biblioteca, README dei dati e roadmap con risultati reali.
9. **Fotografie storiche.** Non rigenerare audit, piani, prove o report precedenti per adeguarli ai nuovi totali. Dopo l’integrazione questo verificatore e il reporter SIC-04 sono fotografie a 288 corsi; il nuovo reporter verifica hash e sottoinsiemi. I quattro builder precedenti restano controlli isolati da eseguire in `--check`.
10. **Verifiche e consegna.** Eseguire test mirati, suite completa no-env, build, gruppo browser aggiornato, cinque builder/report corrente offline e `git diff --check`. Registrare comandi, esiti, ricerche richieste/eseguite, nodi richiesti/riportati, firme e limiti. Nessun commit, push o deploy. Fermarsi prima del progetto successivo, con **GPT-6 Astra / High**: alternative precoci della Siciliana aperta dopo 4.Cxd4, ...g6/...a6/...e5 e relativi discendenti, da confrontare con il Dragone già presente. Non progettare o implementare quel gruppo durante SIC-05.

Comandi applicativi per l’implementazione:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
```

Scrivere testi italiani con `apply_patch` o codifica UTF-8 esplicita; evitare here-string PowerShell inviate a Node con codifica implicita. Nessun cambiamento a classificatore, Libro, Mossa mancata, soglie o studi congelati.

## Verifiche del progetto e punto di ripresa

| Misura | Pubblicata e ricontrollata | Proiezione condizionata ai gate |
| --- | ---: | ---: |
| Corsi / esercizi | 288 / 288 | 290 / 290 |
| Corsi siciliani | 27 | 29 |
| Posizioni con ordine esatto | 1.949 | 1.952 |
| Solo per trasposizione | 201 | 201 |
| Assenti nel corpus A | 10.172 | 10.169 |
| Chekhover con ordine esatto | 19 su 22 | 22 su 22 |

Il punto successivo è già rintracciabile senza ampliare questo lotto: i prefissi della Siciliana aperta con ...g6, ...a6 e ...e5 selezionano quattro posizioni distinte del corpus, tuttora assenti anche nella proiezione. Sono elencate in `nextDesign` della prova; nessuna loro continuazione è stata progettata qui. Il nome sorgente dell’ordine ...g6 e la relazione con il Dragone andranno esaminati nel relativo progetto, senza dedurre equivalenze dai soli nomi.

Controlli offline del progetto:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-chekhover-content.mjs --check
node scripts/build-opening-chekhover-a6-content.mjs --check
node scripts/report-opening-chekhover-a6-result.mjs --check
node scripts/verify-opening-chekhover-early-design.mjs
node scripts/verify-opening-chekhover-early-design.mjs --check
git diff --check
```

Esito: PASS. Fonti, 134 file congelati e hash protetti, baseline semantiche, legalità, quattro scelte del bivio, sei transizioni nei due colori, trasposizione esatta, fatti delle note e 60 repliche immediate verificati. Proiezione ricalcolata sulle 12.322 posizioni. Otto job preparati, **zero ricerche eseguite**. Nessuna modifica applicativa; suite, build e browser del lotto saranno eseguiti nell’implementazione.

**Prossimo passo: GPT-6.1 Sol / High**, per eseguire il prompt operativo. È la configurazione di implementazione concordata per la roadmap. Fermarsi qui per il cambio manuale richiesto da Carlo e riprendere al suo «continua».
