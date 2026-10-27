# P02.2-SIC-06 — Siciliana aperta: 4...g6, 4...a6 e 4...e5

Progetto del 27 ottobre 2026. **Implementato e verificato con la nuova pipeline.** Tre corsi/esercizi integrati, totale 293; dodici ricerche primarie e tutti i gate superati. Suite finale 771 PASS e un TODO preesistente, build PASS, 62 scenari browser distinti PASS (uno ripetuto dopo un timeout iniziale). [Rapporto automatico](OPENING-SICILIAN-EARLY-P022-RESULTS.md), [verifiche effettive](OPENING-PIPELINE-RESULTS.md) e [protocollo aggiornato](OPENING-PIPELINE.md). Il progetto e il prompt sotto conservano la fotografia precedente a 290 corsi. I comandi comuni sostituiscono i tre script specifici previsti; piano, prova, mosse e budget sono immutati. La selezione browser revisionata comprende 62 casi, su 141 disponibili; i 79 fuori selezione non sono dichiarati rieseguiti.

Usare con il [protocollo comune e la roadmap](ROADMAP-E-PROMPT-OPERATIVI.md), il [piano fissato](data/opening-sicilian-early-p022-plan.json), la [prova offline](data/opening-sicilian-early-p022-design-verification.json) e la [baseline SIC-05](OPENING-CHEKHOVER-EARLY-P022-RESULTS.md). Il perimetro A è già approvato. Questo documento autorizza il passaggio all'implementazione soltanto dopo il cambio manuale di modello concordato con Carlo.

## Tre percorsi, quattro posizioni esatte e una trasposizione

Prefisso comune: `e4 c5 Nf3 d6 d4 cxd4 Nxd4`.

| ID dopo `sicilian:` | Seguito | Documentate | Didattiche | Totale |
| --- | --- | ---: | ---: | ---: |
| `early-g6-bc4` | g6 Nc3 Bg7 Be3 Nf6 Bc4 Nc6 | 14 | 0 | 14 |
| `early-a6` | a6 Nc3 Nf6 | 8 | 2 | 10 |
| `early-e5` | e5 Nb3 Nf6 | 8 | 2 | 10 |

Totali sulle tre linee, con prefissi ripetuti: **30 semimosse documentate e quattro scelte didattiche scritte**, zero generate dal motore. Il primo percorso è interamente documentato; gli altri aggiungono una coppia per rendere giocabile il confronto dal bivio con entrambi i colori. Sono moduli di apertura collegati ai corsi esistenti, con piani ed esercizi propri. Il piano contiene titoli, spiegazioni, otto note specifiche e confini delle fonti.

Fonti locali già fissate: JeffML/eco.json, revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, MIT; Lichess/chess-openings, revisione `a6189a30dc273ccb21fc2536a9a2fefd5592a67a`, CC0-1.0. Hash e manifest sono nel piano e fra i file preservati. Non aggiornare il corpus durante l'implementazione.

| Posizione nuova con ordine esatto | Record usato dal corso |
| --- | --- |
| `position:37ad4d193ecfba38`, dopo 4...g6 | `eco:2298d57ac45d558b`, 8 semimosse; stesso ordine in `lichess:b.tsv:643` |
| `position:138f2afb197c959e`, dopo 7...Cc6 | `eco:fc2ae42fb689cbe2`, 14 semimosse |
| `position:1c0c85c09af4e9e7`, dopo 4...a6 | `eco:8d1d21aff6e14300`, 8 semimosse |
| `position:90d2577b74c0d2da`, dopo 4...e5 | `eco:5b821d81f6456cf4`, 8 semimosse |

Il replay rileva anche **`position:07f8c6027781d867` dopo Ac4**, raggiunta soltanto per trasposizione. Registrarla come quinta posizione nuova, senza attribuirle un ordine sorgente esatto.

I tre prefissi selezionano cinque record, di cui uno Lichess duplicato dell'ordine con g6. Le quattro posizioni hanno in totale otto riferimenti e comprendono due riferimenti Lichess: quello dell'ingresso g6 e quello dell'endpoint raggiunto attraverso un altro ordine. La prova conserva tutti i riferimenti in `selectedPositionReferences`; non contarli come otto nuove varianti o come conferme indipendenti. Il catalogo aggregato incorpora anche fonti Lichess.

Il record dell'ingresso g6 usa il nome «Accelerated Dragon», pur contenendo d6. Il titolo didattico indica **4...g6 e Ac4**; conservare nome e codice ECO originali nella provenienza. Il corso esistente `sicilian:accelerated-dragon` passa da 2...Cc6, con il pedone ancora in d7 a quel punto. La distinzione è verificata sulle scacchiere. Il nuovo endpoint ha più ordini sorgente, con codici B35/B72; non modificare i record per uniformare i nomi.

## Commenti, confronto con Dragone e Najdorf

Scrivere le otto note del piano agli indici 6/8/10/12 per g6 e 6/8 negli altri due corsi, con `editorialLine` uguale alla sequenza completa. La coppia 6 deve descrivere la nuova risposta nera; non ereditare la spiegazione di ...Cf6 del corso principale.

Fatti verificati:

- Dopo Cc3/Ag7, l'alfiere g7 attacca d4 lungo la diagonale libera. Dopo Ae3/Cf6, il cavallo f6 interrompe quella diagonale, mentre attacca e4. Dopo Ac4/Cc6, il cavallo c6 attacca d4, difeso da donna d1 e alfiere e3. Il Bianco ha ancora il pedone in f2 e i due re sono al centro.
- Nel corso Dragone già presente il Bianco gioca f3 prima di Ac4 e il Nero arrocca prima: non è lo stesso endpoint del nuovo modulo.
- a6 controlla b5 senza attaccare il cavallo d4. Cc3/Cf6 porta alla posizione della Najdorf dopo la decima semimossa, ma il prefisso comune dei due percorsi resta 7.
- e5 attacca immediatamente il cavallo d4, sostenuto dal pedone d6. Cb3 evita quell'attacco; il cavallo b3 non difende e4 dal cavallo f6. Il cavallo bianco b1 resta da sviluppare. Non dichiarare Cb3 l'unica ritirata valida.

Convergenza a6/Najdorf:

```text
Nuovo ordine: rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 6
Najdorf:      rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6
```

Coincidono i primi quattro campi FEN usati dalla matrice di copertura. Il contatore delle semimosse è diverso: **non dichiarare identiche le FEN complete e non riusare una ricerca motore su una FEN diversa**. Nessuna convergenza completa automaticamente il corso Najdorf o salta al suo indice 10.

## Navigazione e browser

Il bivio all'indice 7 offre **...Cf6, ...g6, ...a6, ...e5**. Aggiungere i tre moduli in quest'ordine dopo quelli già pubblicati. Il rappresentante di ...Cf6 resta `sicilian`, quello di ogni nuova risposta è il relativo nuovo corso.

La prova verifica 16 transizioni dirette, ciascuna nei due colori:

- Sei coppie fra il corso principale e i tre nuovi corsi, comprese tutte le coppie fra i nuovi: dodici transizioni per cambi durante il gioco e checkpoint.
- Nuovo g6 ↔ Dragone esistente e nuovo a6 ↔ Najdorf esistente: altre quattro transizioni da selezione esplicita e checkpoint. **Non aspettarsi che una sola mossa ...Cf6 selezioni direttamente Dragone o Najdorf**: in quel bivio il rappresentante è il corso principale.

Tutti questi checkpoint ripartono dall'indice 7. Con il Bianco l'avvio applica la risposta nera e lascia giocare la quinta mossa. Con il Nero l'allievo gioca la quarta, riceve la risposta bianca e deve giocare almeno la quinta. Dopo «Segui» al tratto nero 7 si arriva all'indice 9: nessuno dei tre nuovi corsi è già completo.

Nel nuovo corso g6, 5.c4 è legale e non coperta. Non associarla alla c4 del corso Dragone accelerato, il cui prefisso è diverso. Conservare il trattamento delle alternative legali e la protezione delle destinazioni contenute.

Prevedere **54 scenari aggiuntivi**, oltre agli 87 esistenti, per **141 complessivi**:

1. Sei completamenti: tre corsi per due colori, con reload, preferiti e progressi precedenti.
2. Tre esercizi giocati sulla scacchiera, senza mostrare spiegazione o prevenzione prima della risposta.
3. Dodici cambi durante il gioco col Nero: sei coppie, entrambe le direzioni, senza modifica della scacchiera o credito prima di «Segui».
4. Trentadue checkpoint: otto coppie, entrambe le direzioni e colori. I quattro fra a6 e Najdorf devono provare assenza di credito derivato dalla convergenza, ritorno al prefisso 7, avvio esplicito e completamento solo dopo le mosse residue.
5. Una prova di c4 legale non coperta nel nuovo corso g6.

Nomi dei test univoci per origine, destinazione, direzione e colore. Desktop/mobile nel gruppo, Worker disabilitato ed Explorer simulato. Nessuna nuova architettura delle trasposizioni prevista: correggere soltanto eventuali difetti concreti con regressioni, senza aprire P04.

## Tre esercizi e dodici ricerche fissate

| Corso | Prima della deviazione | Deviazione | Risposta | Lato | Repliche | Saldo minimo |
| --- | ---: | --- | --- | --- | ---: | ---: |
| g6/Ac4 | indice 13 | 7...Ah3 | 8.gxh3 | Bianco | 31 | +2 |
| a6 | indice 8 | 5.Ab5+ | 5...axb5 | Nero | 40 | +2 |
| e5 | indice 8 | 5.Ac4 | 5...exd4 | Nero | 42 | +2 |

Enumerate tutte le **113 repliche immediate**. Nel primo caso ...Cxe4 prende un pedone dopo la cattura dell'alfiere; nel secondo Cxb5 riprende il pedone a; nel terzo Dxd4 o Axf7+ prendono un pedone dopo la perdita del cavallo. Ab5+ è uno scacco autentico e axb5 lo risolve. Materiale p=1, C/A=3, T=5, D=9, misurato rispetto alla posizione prima della deviazione. È unica la cattura immediata del tipo di bersaglio dichiarato, senza prova di unicità di ogni mossa vincente o dell'esito della partita. Casi costruiti, senza frequenze o partite personali attribuite.

Usare il driver congelato `scripts/opening-bounded-engine.mjs` e un collector nuovo. Stockfish 16 nativo, eseguibile/hash nel piano, Threads 1, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash prima di ogni ricerca, 200.000 nodi per richiesta, timeout 30 secondi.

| Job | Radice e uso |
| ---: | --- |
| 1 | Dopo 7.Ac4 nel corso g6: ricerca libera, baseline esercizio |
| 2 | Dopo 7...Ah3: libera, risposta richiesta gxh3 |
| 3 | Dopo 4...a6: libera, controllo Cc3 e baseline esercizio |
| 4 | Stessa FEN: `searchmoves b1c3`, Cc3 |
| 5 | Dopo 4...a6 5.Cc3: libera, controllo Cf6 |
| 6 | Stessa FEN: `searchmoves g8f6`, Cf6 |
| 7 | Dopo 5.Ab5+: libera, risposta richiesta axb5 |
| 8 | Dopo 4...e5: libera, controllo Cb3 e baseline esercizio |
| 9 | Stessa FEN: `searchmoves d4b3`, Cb3 |
| 10 | Dopo 4...e5 5.Cb3: libera, controllo Cf6 |
| 11 | Stessa FEN: `searchmoves g8f6`, Cf6 |
| 12 | Dopo 5.Ac4 nel corso e5: libera, risposta richiesta exd4 |

Dodici primarie = **2.400.000 nodi richiesti**. Una sola conferma per job, esclusivamente se manca score/PV completo corrispondente al bestmove secondo il driver: massimo **24 `go` e 4.800.000 nodi richiesti**, comprese richieste fallite/interrotte. Registrare separatamente i nodi riportati. Persistenza della richiesta prima del `go`; nessun rilancio automatico o cancellazione di lock per forzare tentativi.

Prima delle ricerche preparare il manifest offline con hash di piano, prova, collector, driver/helper/eseguibile, FEN complete, radici, opzioni e criteri. Nessun collector precedente va avviato.

Gate di pubblicazione:

- Trascrizioni coerenti con firma, radici e budget; bestmove e PV legale corrispondenti, score cp completo. Mate o evidenza incompleta richiedono revisione.
- Quattro confronti separati delle coppie **3/4, 5/6, 8/9, 10/11**: perdita `max(0, cp_libero - cp_vincolato)` entro 100 cp, dalla stessa FEN e lato al tratto.
- Esercizi: risposte richieste nei job 2/7/12; variazioni **cp2 + cp1**, **cp7 + cp3**, **cp12 + cp8**, ciascuna almeno 200 cp. Materiale minimo almeno 2, con tutte le repliche previste.
- Pubblicare insieme i tre corsi e i tre esercizi solo se tutti i gate passano. In caso contrario conservare le prove e fermarsi per **Astra / High**; non modificare mosse, soglie, conteggi o budget per ottenere l'accettazione.

## Prompt operativo — GPT-6.1 Sol / High

Implementa esclusivamente SIC-06 dal piano e dalla prova allegati. Il perimetro A è confermato. Procedi fino alle verifiche e alla consegna salvo fallimento dei gate o necessità di riprogettazione. Rispetta i cambi manuali; non delegare a un altro modello per aggirarli.

1. **Baseline.** Controlla Git e istruzioni locali senza aggiornare automaticamente il checkout. Esegui il verificatore SIC-06 in `--check`, i cinque builder precedenti e il reporter SIC-05 corrente in `--check` prima di modificare l'app. Conserva tutti i 169 `preserveFiles`, gli hash protetti e i digest dei 290 corsi/esercizi. Non leggere `.env`.
2. **Collector.** Crea i file previsti in `plannedFiles`, prepara il manifest e raccogli soltanto i dodici job fissati tramite `runFrozenOpeningJobs`. Adatta i controlli del collector SIC-05: ora il primo job è soltanto baseline, ci sono quattro confronti e tre baseline, di cui due condivise. Ricava gli abbinamenti da FEN e usi, senza mantenere indici copiati dal vecchio lotto.
3. **Builder.** Usa `authoredMoves` come array: vuoto per g6, due elementi negli altri corsi. Verifica tutti e quattro gli indici/SAN/UCI e i confronti liberi/vincolati. Emetti quattro `continuationChecks` con `courseId` e `authoredIndex`; tre corsi e tre esercizi. Non assegnare `continuationStatus` al corso interamente documentato. Ogni gate precede la scrittura dei moduli. `--check` ricostruisce gli output senza motore e fallisce sulle incoerenze.
4. **Integrazione.** Aggiungi i moduli agli aggregatori nell'ordine g6/a6/e5. Conserva `editorialLine`, otto note e provenienza 14+0/8+2/8+2. Il riferimento sorgente principale g6 è il record di 14 semimosse; il record di 8 è un nodo intermedio. Mantieni i nomi originali nella provenienza e il titolo didattico del piano. Nessuna fusione di corsi per posizione.
5. **Test mirati.** Aggiungi `tests/opening-sicilian-early-roadmap.test.js`: baseline, hash, legalità, confine fonte, quattro controlli, tre baseline, 113 repliche, fatti delle note e scacco Ab5+. Prova entrambi i colori e le 16 transizioni. Verifica posizione a6/Najdorf uguale nei primi quattro campi ma diversa nel contatore, checkpoint 7 e c4 non coperta. Aggiorna i conteggi aggregati e la politica esplicita dei moduli brevi con lunghezze 14/10/10; non indebolire i requisiti storici.
6. **Browser.** Implementa i 54 scenari descritti, conservando gli 87 precedenti. Per i cambi live usa il rappresentante `sicilian` su ...Cf6; per Dragone e Najdorf prova la selezione esplicita. Se emerge un difetto, correggi solo il comportamento necessario; una riprogettazione sostanziale richiede il cambio concordato.
7. **Rapporto corrente.** Ricalcola tutte le 12.322 posizioni intermedie/sorgenti. Attesi 293 corsi/esercizi, 32 siciliani, **1.956 esatte, 202 solo trasposte, 10.164 assenti**: quattro nuove esatte più una trasposta, zero nuove ancore ECO. Il reporter SIC-05 assumeva tutte le nuove posizioni esatte e una FEN completa condivisa: tali assunzioni non valgono qui. Conserva la distinzione e registra il confronto a6/Najdorf con entrambe le FEN. Ricalcola commenti, inventari, biblioteca e README con misure effettive.
8. **Fotografie storiche.** Dopo l'integrazione il verificatore SIC-06 e il reporter SIC-05 restano fotografie a 290 corsi; non rigenerarli sui nuovi totali. Il nuovo reporter verifica hash e sottoinsiemi precedenti. I sei builder restano controlli isolati.
9. **Verifiche finali.** Test mirati, suite completa no-env, build, 141 scenari browser, sei builder/report corrente offline, UTF-8, collegamenti, lock e `git diff --check`. Registrare risultati effettivi, firma, richieste, nodi richiesti/riportati e limiti. Nessuna modifica a classificatore, Libro, Mossa mancata, soglie o studi congelati; nessun commit, push o deploy.
10. **Consegna.** Aggiorna la roadmap con prove e lacune residue. Fermati per **GPT-6 Astra / High** prima del progetto successivo: alternative bianche 5.Ac4 e 5.Ad3 dopo 4...Cf6, due posizioni identificate in `nextDesign`; 5.f3 resta nel perimetro generale. Non progettare quel gruppo durante SIC-06.

Comandi applicativi per l'implementazione:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
```

Scrivere l'italiano con `apply_patch` o UTF-8 esplicito; evitare here-string PowerShell inviate a Node con codifica implicita.

## Verifiche del progetto

Cinque builder precedenti e reporter SIC-05 in `--check`: PASS. Nuovo verificatore in scrittura e `--check`: PASS. Verificati baseline, 169 file congelati e hash protetti, fonti, note geometriche, legalità, 113 repliche, 16 transizioni nei due colori e proiezione sull'intero corpus. Preparati dodici job, **zero ricerche eseguite**. Nessuna modifica applicativa; build, suite e browser SIC-06 restano da eseguire nell'implementazione.

```powershell
node scripts/verify-opening-sicilian-early-design.mjs --check
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-chekhover-content.mjs --check
node scripts/build-opening-chekhover-a6-content.mjs --check
node scripts/build-opening-chekhover-early-content.mjs --check
node scripts/report-opening-chekhover-early-result.mjs --check
git diff --check
```

**Prossimo passo: GPT-6.1 Sol / High**, per eseguire questo prompt. Fermarsi qui per il cambio manuale richiesto da Carlo e riprendere al suo «continua».
