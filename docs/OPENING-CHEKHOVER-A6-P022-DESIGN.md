# P02.2-SIC-04 — Chekhover con 4...a6

**Implementazione completata il 21 ottobre 2026.** [Risultati e punto di ripresa](OPENING-CHEKHOVER-A6-P022-RESULTS.md). Il progetto sottostante conserva la baseline e le decisioni precedenti all’integrazione; non rigenerare il suo verificatore sui 288 corsi attuali.

Progetto del 21 ottobre 2026. **Progettazione verificata, implementazione pendente.** L’applicazione resta a 286 corsi e 286 esercizi. Nessuna ricerca motore eseguita in questo lotto.

Leggere insieme alla [roadmap e al protocollo comune](ROADMAP-E-PROMPT-OPERATIVI.md), alla [specifica fissata](data/opening-chekhover-a6-p022-plan.json) e alla [prova offline](data/opening-chekhover-a6-p022-design-verification.json). Baseline: [risultato SIC-03](OPENING-CHEKHOVER-P022-RESULTS.md). Il perimetro completo A è già confermato; non richiedere una nuova approvazione.

## Risultato da realizzare

Due percorsi brevi completano le cinque posizioni del ramo sorgente `e4 c5 Nf3 d6 d4 cxd4 Qxd4 a6` ancora assenti. Si collegano ai percorsi Chekhover esistenti: non sostituiscono gli itinerari più lunghi e non vengono presentati come due partite complete fino al mediogioco.

| ID dopo `sicilian:` | Sequenza dopo 4...a6 | Fonte | Scelta didattica | Totale semimosse |
| --- | --- | ---: | --- | ---: |
| `chekhover-a6-be3` | 5.Ae3 Cf6 | 9 | 5...Cf6 | 10 |
| `chekhover-a6-c4` | 5.c4 Cc6 6.Dd2 g6 | 12 | Nessuna | 12 |

Sono **21 semimosse documentate e una didattica**, sommate sulle due linee, con prefissi ripetuti; zero mosse generate dal motore. Una risposta nera nel ramo Ae3 consente una mossa attiva a ciascun colore anche riprendendo dal bivio Ae3/c4. Non aggiungere ulteriori continuazioni per uniformare la lunghezza dei corsi.

Fonte già fissata nel corpus: JeffML/eco.json, revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, MIT; catalogo locale SHA256 `5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2`. Le cinque voci B53 sono:

| Record | Posizione | Termine |
| --- | --- | --- |
| `eco:24be9805605f8f1b` | `position:f2e47e14c999e271` | 4...a6, nodo condiviso |
| `eco:9e4633e9957e3be8` | `position:361cee22134b6e85` | 5.Ae3 |
| `eco:cb682ad7bfde697e` | `position:9c7d8bc61708b20b` | 5.c4 |
| `eco:8afdf35a92cd2b0c` | `position:1c190014685b03ee` | 6.Dd2 |
| `eco:f80ad3ed0fd0919e` | `position:8d835bf138067435` | 6...g6 |

Il replay del corpus fissato conferma che non ci sono altri discendenti di questo prefisso. Nessun riferimento Lichess per queste posizioni, nessuna nuova ancora ECO. Il nodo 4...a6 compare in entrambi i corsi ma si conta una volta. Non trattare il catalogo aggregato e le sue fonti come conferme indipendenti.

## Spiegazioni legate alla posizione

La specifica contiene piani per entrambi i colori, contrasto fra percorsi, motivazione dell’endpoint, dichiarazione delle fonti e testi italiani UTF-8. Fissare `editorialLine` alla sequenza completa di ciascun corso. Sono cinque voci di coppia, quattro testi distinti: la spiegazione di Dxd4/a6 è identica nei due percorsi.

- La risposta ...a6 è all’indice **7**, quindi la sua nota appartiene alla coppia che inizia all’indice **6**. Il cavallo b8 resta fermo; il pedone a6 controlla b5 e non attacca la donna d4. Non riutilizzare la nota del vecchio corso che descrive ...Cc6.
- Ae3 sostiene la donna d4. Nel seguito scelto ...Cf6 attacca e4, ma la donna d4 difende quel pedone; non dichiarare una perdita forzata. Il cavallo b8 e gli alfieri neri restano da sviluppare.
- c4 controlla d5. Dopo ...Cc6 il cavallo nero attacca la donna d4, difesa dal cavallo f3: la difesa non rende conveniente perdere la donna per un cavallo.
- Dd2 sottrae la donna all’attacco, ma occupa la diagonale c1-d2-e3 dell’alfiere. Dopo ...g6 il fianchetto è soltanto preparato: l’alfiere è in f8, il cavallo g8 non è sviluppato, entrambi i re sono al centro.

Il verificatore controlla questi fatti e alcuni controesempi sulla scacchiera. La copertura editoriale complessiva va ricalcolata nell’implementazione; non dedurre corsi interamente commentati dal numero di note nuove. La revisione completa resta P03.

## Bivi e ripresa: usare il comportamento esistente

Il flusso attuale supporta i casi richiesti; non è emersa una nuova dipendenza che richieda modifiche applicative alla navigazione.

1. **Bivio nero all’indice 7:** il corso `sicilian:chekhover-bd7` prosegue con ...Cc6, i due nuovi con ...a6. Verificare ciascun nuovo corso contro il vecchio, in entrambe le direzioni. Il checkpoint mostra la posizione dopo Dxd4 prima di giocare la risposta nera. Con il Bianco ...a6 viene eseguita solo dopo l’avvio; con il Nero è il giocatore a eseguirla.
2. **Bivio bianco all’indice 8:** Ae3 contro c4. Verificare entrambe le direzioni e i due colori. Con il Nero la scelta bianca viene mostrata dopo l’avvio, poi il giocatore esegue ...Cf6 o ...Cc6. Restano mosse attive per entrambi.
3. **Cambio durante il gioco:** al bivio nero la mossa ...a6 corrisponde a due nuovi corsi. Il selettore corrente propone il primo, Ae3, seguendo l’ordine dei moduli; non fingere che la singola mossa distingua già Ae3 da c4. Mantenere l’ordine Ae3, poi c4. Il secondo bivio permette al Bianco di passare a c4; per il Nero restano selezione del percorso e ripresa. Testare ...Cc6 ↔ ...a6 col Nero e Ae3 ↔ c4 col Bianco.
4. **Completamenti:** nessun progresso prima di «Segui» o del gioco effettivo dopo il checkpoint. Ae3 termina dopo una sola coppia dal bivio 8: dopo averla realmente eseguita è corretto registrare un completamento. Il test non deve aspettarsi zero anche dopo quella coppia.
5. **Alternativa non coperta:** nel percorso c4, all’indice 10, Dd3 è legale ma non ha un corso corrispondente. Mantenerla come alternativa fuori dalla linea, senza giudicarla errore scacchistico. Non proporre il corso esistente chiamato Dd3: la sua posizione e il suo prefisso sono differenti.
6. Conservare il controllo `contained-route` aggiunto nel lotto precedente e i suoi test. Qui tutti i collegamenti nuovi sono bivi reali: nessuna nuova prosecuzione o destinazione contenuta.

La prova offline esercita sei transizioni dirette, ciascuna nei due colori, oltre ai percorsi completi e al selettore del ramo. Non verifica interfaccia, storage o browser: tali controlli restano obbligatori dopo l’integrazione.

## Due esercizi costruiti

I casi non provengono da partite personali e non hanno una frequenza misurata. `beforeIndex` conta le semimosse prima della deviazione; la posizione giocabile è `beforeIndex + 1`.

| Percorso | beforeIndex | Deviazione | Risposta | Colore | Repliche immediate | Saldo minimo |
| --- | ---: | --- | --- | --- | ---: | ---: |
| Ae3 | 9 | 5...Db6 | 6.Dxb6 | Bianco | 21 | +9 |
| c4 | 10 | 6.Cc3 | 6...Cxd4 | Nero | 33 | +6 |

Tutte le **54 repliche immediate legali** sono enumerate nel JSON. Il materiale è confrontato con la posizione prima dell’errore, con valori p=1, C/A=3, T=5, D=9. È unica la cattura immediata della donna nei due casi; non è provata l’unicità di tutte le mosse vincenti o l’esito della partita.

Nel primo caso a6 ha rimosso la possibilità di ...axb6. Il Nero può poi giocare ...Cd7 attaccando la donna: il saldo immediato non autorizza a ignorare le minacce successive. Nel secondo il cavallo **f3** può riprendere in d4, limitando il guadagno a donna contro cavallo; il cavallo c3 non attacca d4.

Mostrare prima della risposta soltanto obiettivo e posizione. Soluzione, spiegazione completa e possibile prevenzione seguono il normale flusso di rivelazione. Ricavare la prevenzione dalla prova raccolta, senza dichiararla unica o attribuirla alla fonte. Il builder deve mantenere gli ID `practice:<courseId>` e il colore previsto.

## Piano motore per l’implementazione

Usare il driver immutato `scripts/opening-bounded-engine.mjs`, un nuovo collector e una nuova cartella di prove. **Non avviare collector storici.** Stockfish 16 nativo, SHA256 dell’eseguibile nella specifica, Threads 1, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash prima di ogni ricerca, 200.000 nodi per `go`, timeout 30 secondi.

Le FEN complete e gli ID sono in `engineJobs` della prova offline, in quest’ordine:

| Job | Posizione | Uso |
| ---: | --- | --- |
| 1 | Dopo 5.Ae3 | Libero: controllo della continuazione e baseline esercizio Ae3 |
| 2 | Stessa FEN | `searchmoves g8f6`: scelta didattica ...Cf6 |
| 3 | Dopo 5...Db6 | Libero: bestmove richiesto Dxb6, `d4b6` |
| 4 | Dopo 5...Cc6 nel ramo c4 | Libero: baseline esercizio c4 |
| 5 | Dopo 6.Cc3 | Libero: bestmove richiesto ...Cxd4, `c6d4` |

Cinque ricerche primarie = **1.000.000 nodi richiesti**. Una sola conferma per job è ammessa esclusivamente in assenza di score/PV completi corrispondenti al bestmove, secondo il driver fissato. Limite totale **10 `go` e 2.000.000 nodi richiesti**, incluse richieste fallite/interrotte e conferme. Registrare separatamente i nodi riportati. Il job 1 si riusa: niente doppia ricerca della stessa baseline.

Prima di eseguire, fissare manifest, hash di piano/prova/collector/driver/helper/eseguibile, opzioni, FEN, radici e criteri. Salvare ogni richiesta prima del `go`, riusare risultati soltanto con firma identica, non cancellare lock o log per forzare tentativi e non rilanciare automaticamente job falliti/interrotti.

Gate obbligatori:

1. Rileggere i log offline, verificare bestmove, score cp completo e PV coerenti, poi riprodurre legalmente la PV. Non accettare automaticamente score mate o dati incompleti.
2. Continuazione: stessa FEN e lato al tratto nei job 1/2; registrare differenza `cp1 - cp2` e perdita `max(0, cp1 - cp2)`, massimo **100 cp**.
3. Esercizi: bestmove richiesti nei job 3/5 e variazioni `cp3 + cp1`, `cp5 + cp4`, almeno **200 cp**. La somma tiene conto del cambio del lato al tratto.
4. Verificare anche conteggi 21/33, saldi minimi 9/6 e soglia materiale minima 2 contro tutte le repliche immediate, senza confondere questa prova con una verifica profonda dell’intera partita.
5. Pubblicare i due corsi e gli esercizi insieme solo dopo tutti i gate. Se uno fallisce, conservare le prove e fermarsi per revisione **GPT-6 Astra / High**. Non cambiare candidati, allungare linee, ridurre soglie o aumentare budget automaticamente. Le soglie di questo lotto non modificano il classificatore.

## Prompt operativo — GPT-6.1 Sol / High

Realizza esclusivamente P02.2-SIC-04 seguendo questo documento, il piano JSON, la prova offline e il protocollo comune. Non richiedere nuovamente il perimetro A. Procedi fino alle verifiche salvo fallimento dei gate o necessità concreta di riprogettazione. Rispetta il cambio manuale concordato con Carlo; non aggirarlo con agenti secondari.

1. **Ripresa.** Controlla istruzioni locali e Git senza aggiornare automaticamente il checkout. Prima delle modifiche applicative esegui il verificatore di questo progetto in `--check`, i tre builder precedenti e il reporter Chekhover corrente in `--check`. Non leggere `.env`. Mantieni identici i 108 file `preserveFiles` e gli hash protetti P02.1. Conserva i 286 corsi (ID/famiglia/titolo/sequenza) e tutti i 286 esercizi mediante i digest e il sottoinsieme della baseline; niente normalizzazione dei file congelati.
2. **Raccolta.** Crea `scripts/collect-opening-chekhover-a6-evidence.mjs`, usando il precedente come schema senza modificarlo. Prepara prima il manifest offline; poi esegui i cinque job con `runFrozenOpeningJobs`. Riuso del job 1 e limiti devono essere controllati esplicitamente. Salva richieste, risposte, risultati e firma nella nuova cartella indicata da `plannedFiles`; niente motore browser o nuove ricerche sulle prove storiche.
3. **Builder offline.** Crea `scripts/build-opening-chekhover-a6-content.mjs`. Ricontrolla sorgenti, preservazione, log, radici, PV, budget, cp, legalità e materiale prima di scrivere. `--check` deve ricostruire deterministicamente gli stessi output senza avviare motori. Mantieni la distinzione fonte/scelta didattica, la baseline condivisa e gli esercizi a colori diversi; non costruire un nuovo sistema generale di puzzle.
4. **Contenuto.** Genera `openingChekhoverA6Courses.js` e `openingChekhoverA6PracticalCases.js`, con l’ordine Ae3/c4, i testi UTF-8 e le cinque voci editoriali fissate. Integra negli aggregatori esistenti senza cicli d’importazione, includendo policy e riferimenti alle prove. `editorialLine` deve coincidere con l’intera linea. Dichiarare la verifica completata solo dopo i gate; conservare le spiegazioni prima della mossa e la risposta avversaria effettiva. Non copiare al nuovo indice 6 la spiegazione storica di ...Cc6.
5. **Navigazione.** Usare il flusso esistente: i nuovi checkpoint sono ai prefissi 7 e 8. Non riprogettare P04 e non ripetere la correzione `contained-route` già presente. Verificare la selezione del rappresentante Ae3 al bivio nero condiviso. Se emerge un difetto concreto che impedisce uno dei percorsi previsti, correggere solo quel comportamento e aggiungere una regressione; una riprogettazione sostanziale richiede la pausa concordata.
6. **Test mirati.** Aggiungere `tests/opening-chekhover-a6-roadmap.test.js`: preservazione dei 286 corsi/esercizi, cinque posizioni distinte, provenienza 9+1 e 12+0, note della risposta nera alla coppia 6, completamento nei due colori, sei transizioni dirette e relativo turno, selettore del ramo condiviso, esercizi/materiale e gate. Integrare le nuove prove nei test aggregati di espansione, varianti, scope e commenti senza indebolire gli assert storici. Usare conteggi effettivi esatti, non limiti inferiori. Per la lunghezza aggiungere esplicitamente 10/12 alla politica dei corsi sorgenti brevi, senza ridurre il requisito delle vecchie linee.
7. **Browser.** Conservare i 39 casi del gruppo `roadmap Sicilian`. Aggiungere quattro completamenti dei nuovi corsi (entrambi i colori, desktop e mobile nel gruppo), due esercizi sulla scacchiera senza soluzione anticipata, quattro cambi durante il gioco (due direzioni del bivio nero fra corso padre/Ae3 e del bivio bianco fra Ae3/c4), dodici riprese da checkpoint (sei transizioni dirette × due colori) e il caso legale non coperto Dd3. Sono **23 scenari aggiuntivi, 62 complessivi** se si mantiene un test per scenario. Ogni checkpoint deve aspettare l’avvio, avere mosse attive e non attribuire credito prematuro. Nel cambio c4 → Ae3 il completamento dopo l’ultima coppia è previsto. Includere reload, persistenza dei nuovi progressi e dei precedenti preferiti/risultati. Worker disabilitato, Explorer simulato; non aggiungere ricerche durante il browser. Riportare i casi realmente eseguiti, senza sommare ripetizioni.
8. **Rapporto corrente.** Creare reporter, JSON e documento risultati nei percorsi `plannedFiles`. Replay dell’intero corpus P01 con tutte le posizioni intermedie; attesi 288 corsi/esercizi, 27 siciliani, 1.949 posizioni esatte, 201 solo trasposte, 10.172 assenti, zero nuove ancore ECO e tre residui Chekhover. Misurare semimosse, coppie scritte e corsi interamente commentati dopo l’integrazione. Aggiornare i due inventari, biblioteca, README dei dati e roadmap con risultati reali.
9. **Storia congelata.** Non rigenerare vecchi audit, piani, prove o report per adattarli ai nuovi totali. Dopo l’integrazione il reporter SIC-03 e questo verificatore di progetto diventano fotografie storiche: il nuovo reporter ne controlla hash e sottoinsiemi. I tre builder precedenti restano invece controlli isolati da eseguire in `--check`; non alterare i loro output.
10. **Consegna.** Eseguire test mirati, suite completa, build no-env, browser del gruppo aggiornato e verifiche offline dei quattro builder/report corrente, poi `git diff --check`. Registrare comandi/esiti, budget richiesti e nodi riportati, firme, controlli e limiti. Nessun commit, push o deploy. Al termine fermarsi prima del progetto seguente: **GPT-6 Astra / High** per i tre residui Chekhover con 4...Cf6, 5.Cc3 e 4...Ad7, mantenendo tutto il resto del corpus A in P02.

Comandi applicativi per l’implementazione:

```powershell
npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false
npm.cmd run build -- --config scripts/qa-no-env-build.config.js
npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "roadmap Sicilian"
```

Per testi italiani usare `apply_patch` o scrittura esplicitamente UTF-8; evitare here-string PowerShell inviate a Node con codifica implicita. Il prompt richiede implementazione e verifiche del lotto, senza cambiare classificatore, Libro, Mossa mancata, soglie o studi congelati.

## Verifiche del progetto e punto di ripresa

| Misura | Pubblicata e ricontrollata | Proiezione condizionata ai gate |
| --- | ---: | ---: |
| Corsi / esercizi | 286 / 286 | 288 / 288 |
| Corsi siciliani | 25 | 27 |
| Posizioni con ordine esatto | 1.944 | 1.949 |
| Solo per trasposizione | 201 | 201 |
| Assenti nel corpus A | 10.177 | 10.172 |
| Assenti nel sottoalbero Chekhover | 8 su 22 | 3 su 22 |

I tre residui progettati sono `position:c9c6ddc7d60aa2cf` (4...Ad7), `position:7161d5217d6da902` (4...Cf6) e `position:2b356881d43ce8ce` (4...Cf6 5.Cc3). Restano assenti, non vengono esclusi dal perimetro. 4...Ad7 è un ordine diverso dal 5...Ad7 già presente.

Controlli offline eseguiti per questo progetto:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/build-opening-zaitsev-content.mjs --check
node scripts/build-opening-chekhover-content.mjs --check
node scripts/report-opening-chekhover-result.mjs --check
node scripts/verify-opening-chekhover-a6-design.mjs
node scripts/verify-opening-chekhover-a6-design.mjs --check
git diff --check
```

Esito: PASS. Fonti, 108 file congelati e hash protetti, baseline semantiche, cinque posizioni nuove nel replay delle 12.322 posizioni, sei transizioni nei due colori, geometria dei commenti e 54 repliche immediate verificati. Cinque job preparati nel rapporto, **zero ricerche eseguite**. Suite applicativa, build e browser nuovi non eseguiti: sono parte dell’implementazione.

**Prossimo passo: GPT-6.1 Sol / High**, per il prompt operativo sopra. È la configurazione di implementazione concordata per la roadmap, non un nuovo confronto prestazionale fra modelli. Fermarsi qui per il cambio manuale richiesto da Carlo e riprendere al suo «continua».
