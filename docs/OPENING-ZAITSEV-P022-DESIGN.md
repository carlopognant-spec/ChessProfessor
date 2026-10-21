# P02.2-SIC-02 — Chekhover Zaitsev: progetto e prompt di implementazione

Data: 20 ottobre 2026. Configurazione del progetto: GPT-6 Astra / High.

> Esito del 21 ottobre: lotto implementato e verificato. Vedere [risultati e ripresa attuali](OPENING-ZAITSEV-P022-RESULTS.md). Questo documento conserva il progetto e i criteri fissati prima dell'esecuzione; i verificatori del progetto restano legati alla baseline precedente di 282 corsi.

**Progetto verificato offline; implementazione e controlli motore ancora da eseguire.** Il lotto aggiungerà un percorso sul bivio 5...Dd7 e un esercizio. I 282 corsi e i 282 esercizi attuali restano invariati durante questa progettazione. P02 e il perimetro completo A rimangono aperti.

- [Specifica fissata](data/opening-zaitsev-p022-plan.json).
- [Prova offline e baseline dei 282 corsi](data/opening-zaitsev-p022-design-verification.json).
- [Verificatore del progetto](../scripts/verify-opening-zaitsev-design.mjs).
- [Risultato del lotto precedente](OPENING-SICILIAN-P022-RESULTS.md).

## Confine delle fonti e decisione didattica

Il record locale `77915f5f49601838` e la riga `b.tsv#L642` della [fonte primaria Lichess fissata](https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a30dc273ccb21fc2536a9a2fefd5592a67a/b.tsv) documentano esattamente:

`1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 Nc6 5. Bb5 Qd7`

Sono due riferimenti alla stessa posizione B53, non due conferme indipendenti: il catalogo aggregato include dati Lichess. Il gruppo P01 è `position:c2707909c4c54697`; non è una nuova ancora ECO. Le due fonti fissate non contengono un seguito più lungo con questo prefisso. La ricognizione esterna non è stata adottata come prova di una continuazione ulteriore; non si importano partite, commenti o valutazioni esterne. Una richiesta all'Explorer non ha restituito JSON utilizzabile e non costituisce evidenza.

Il percorso previsto è:

`1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 Nc6 5. Bb5 Qd7 6. Bxc6 Qxc6`

Le prime dieci semimosse sono documentate; le ultime due sono **un seguito didattico scelto dall'autore**, da verificare secondo il piano sotto. Non sono mosse generate dal motore e non vanno attribuite al catalogo. La fonte e il confine devono risultare visibili anche nel corso. Il controllo motore sarà un filtro al budget dichiarato, non una certificazione di teoria o unicità.

Fermarsi a ...Dd7 non darebbe al Bianco una decisione da esercitare dopo il bivio. Il cambio in c6 rende invece osservabile la differenza rispetto al corso già disponibile: qui riprende la donna, nel ramo ...Ad7 riprende l'alfiere. Dopo ...Dxc6 entrambi i re sono ancora sulle case iniziali e lo sviluppo è incompleto. La donna nera attacca e4, che è difeso dalla donna bianca d4: non promettere un guadagno di pedone. Questo è un modulo breve sul cambio, non una trattazione di tutte le continuazioni Zaitsev.

## Percorso, dipendenze e spiegazioni

| Campo | Scelta fissata |
| --- | --- |
| ID | `sicilian:chekhover-zaitsev` |
| Titolo | Chekhover Zaitsev: 5...Dd7 e cambio in c6 |
| Famiglia | `sicilian` |
| Ramo già disponibile | `sicilian:chekhover-bd7` |
| Prefisso comune | Nove semimosse; scelta del Nero all'indice 9 |
| Percorso | Dodici semimosse: dieci documentate, due didattiche |
| Note nuove minime | Coppie agli indici 8 e 10, legate alla sequenza completa |
| Dati e progressi preesistenti | Tutti i 282 corsi/esercizi preservati; nessuna nuova versione dello storage |

Le mosse fino a 4...Cc6 possono riusare le spiegazioni già presenti per lo stesso prefisso. La nota su 5.Ab5 ...Dd7 deve essere specifica: dopo Ab5, ...Cxd4 è illegale per l'inchiodatura al re; dopo ...Dd7 il vincolo sul re scompare, ma resta da calcolare la donna d7 sulla diagonale dell'alfiere. Non trasferire il testo di ...Ad7 alla nuova risposta.

La specifica contiene piani per entrambi i colori, note e motivazione della conclusione. Con il Bianco il checkpoint del bivio mostra prima il tratto al Nero, poi applica ...Dd7 e lascia giocare Axc6; con il Nero lascia scegliere ...Dd7 e poi riprendere in c6. Le simulazioni offline completano sei turni per colore, con almeno un turno attivo dopo il bivio. Il comportamento del checkpoint nell'interfaccia resta da verificare nel browser.

Controesempi legali verificati, da conservare nei controlli e nelle spiegazioni senza trasformarli in nuovi corsi:

- `6. Nc3 Nxd4 7. Bxd7+ Bxd7 8. Nxd4`: le donne vengono cambiate e il saldo materiale finale è pari. Non prova una valutazione di parità a gioco ottimale.
- `6. Ba4 Nxd4 7. Bxd7+ Bxd7 8. Nxd4`: anche questo ritiro dell'alfiere conserva la risorsa sulla diagonale. Non descrivere ogni ritiro come perdita gratuita della donna.

## Esercizio costruito dopo il bivio

`practice:sicilian:chekhover-zaitsev`: dalla posizione dopo 5...Dd7, il Bianco devia con **6.Ad3**; il Nero deve trovare **6...Cxd4**. È un caso costruito, non un errore estratto da una partita personale. L'alfiere sostiene e4 ma abbandona la diagonale verso d7; il cavallo può prendere la donna senza offrire in risposta Axd7.

La legalità e tutte le 36 repliche immediate dopo ...Cxd4 sono state enumerate con `chess.js`. Il saldo minimo rispetto alla posizione prima di Ad3 è +6 per il Nero, dopo Cxd4 del Bianco; valori p=1, C/A=3, T=5, D=9. È unica la cattura immediata della donna, non necessariamente l'intera classe delle mosse vincenti. L'enumerazione non dimostra il risultato dell'intera partita.

Il testo iniziale chiede la cattura della donna senza mostrare la risposta, la soluzione o il suggerimento di prevenzione. Le spiegazioni complete compaiono dopo il tentativo. Il controllo motore dell'esercizio è **pendente**.

## Piano motore per il prossimo lotto

Usare il driver isolato esistente senza modificarlo e un nuovo collector con una nuova cartella `docs/data/opening-zaitsev-p022-engine`. Non lanciare il collector del lotto precedente né ricampionare prove raccolte.

Motore e opzioni sono fissati nella specifica: Stockfish 16 nativo, eseguibile SHA256 `5568b400df3425718d310050b5b77fcc81d30b82fdf231a90f40b520c74de3bf`, un thread, Hash 32 MiB, MultiPV 1, nuova partita e Clear Hash prima di ogni ricerca, 200.000 nodi per `go`, timeout 30 secondi. Non usare le impostazioni del motore browser o cambiare il classificatore.

| Job | Posizione e vincolo | Uso |
| --- | --- | --- |
| `zaitsev:root-control` | Dopo 5...Dd7, ricerca libera | Controllo della scelta Axc6 e baseline dell'esercizio, riutilizzata |
| `zaitsev:authored-Bxc6` | Stessa FEN, `searchmoves b5c6` | Valutazione del seguito scelto per il Bianco |
| `zaitsev:recapture-control` | Dopo 6.Axc6, ricerca libera | Controllo della ripresa nera |
| `zaitsev:authored-Qxc6` | Stessa FEN, `searchmoves d7c6` | Valutazione della ripresa scelta |
| `zaitsev:deviation` | Dopo 6.Ad3, ricerca libera | Verifica della risorsa ...Cxd4 |

Le FEN complete e i job sono già nel rapporto offline. Cinque ricerche primarie = 1.000.000 nodi richiesti. Ammessa al massimo una conferma per job esclusivamente se bestmove e riga score/PV non corrispondono, secondo il driver esistente. Limite complessivo dieci `go` e 2.000.000 nodi richiesti, incluse conferme, fallimenti e interruzioni. Registrare separatamente i nodi effettivi, che possono eccedere leggermente il valore richiesto per ricerca.

Criteri fissati prima dell'esecuzione:

1. Salvare manifest e richieste prima dei `go`, con hash di piano, prova del progetto, collector, driver, helper, eseguibile, FEN, vincoli e opzioni. Riusare risultati solo a firma identica; non riprovare automaticamente job interrotti o falliti e non eliminare lock residui per forzare una ripresa.
2. Riprodurre legalmente bestmove e PV dai log; accettare soltanto score cp completi collegati al bestmove e rispettare le radici vincolate. Score mate o prove incomplete lasciano il controllo irrisolto.
3. Per ciascuna delle due mosse didattiche confrontare le due ricerche **dalla stessa posizione e dallo stesso lato al tratto**. Registrare `cp_libero - cp_vincolato`; la perdita di controllo `max(0, differenza)` deve essere al massimo 100 cp. È un limite operativo di questo lotto, non una nuova soglia del classificatore. Non confrontare score di posizioni con tratto opposto senza correggerne il segno.
4. La ricerca dopo Ad3 deve avere bestmove `c6d4`. La variazione dell'esercizio è `cp_dopo_Ad3 + cp_root_control`, perché cambia il lato al tratto: almeno 200 cp. Conservare anche il requisito materiale minimo di 2 punti della politica precedente; qui la prova completa delle repliche immediate deve riprodurre esattamente +6 e 36 repliche.
5. Nessuna ricerca aggiuntiva per migliorare uno score, cercare un altro candidato o scegliere una linea più lunga. Se un requisito fallisce, conservare le prove, lasciare corso ed esercizio non pubblicati e tornare alla progettazione, con cambio ad Astra / High. Non dichiarare concluso il lotto.

## Prompt operativo — implementazione con GPT-6.1 Sol / High

Leggi questo progetto, la specifica JSON, la prova offline e il protocollo della roadmap. Realizza soltanto P02.2-SIC-02. Il perimetro completo A è già autorizzato; non richiedere una nuova approvazione del perimetro.

1. Prima di modificare, esegui il verificatore del progetto in `--check` e il builder offline del lotto precedente. Controlla Git e mantieni tutti i file preservati nella specifica identici byte per byte. Non leggere `.env`. La baseline semantica comprende ora 282 corsi e tutti i relativi esercizi, compresi Najdorf/Ag5 e Chekhover/Ad7.
2. Implementa il nuovo collector con il piano sopra e raccogli soltanto i cinque job fissati. Riusa `runFrozenOpeningJobs`; non modificare il driver o i collector storici vincolati dai manifest. Esegui prima una verifica offline del manifest preparato. Rendi esplicito il calcolo dei confronti cp e l'uso condiviso del primo job.
3. Prepara un builder offline dedicato che rilegga e verifichi le trascrizioni, i vincoli delle due mosse didattiche e l'esercizio. Scrivi i nuovi dati soltanto se tutte le condizioni sono soddisfatte. La modalità `--check` non deve avviare motori. Non riutilizzare automaticamente il builder Siciliana precedente, che presuppone linee interamente documentate.
4. Aggiungi `openingZaitsevCourses.js` e `openingZaitsevPracticalCases.js`, poi integra i loro dati in `openingJourneys.js` e `openingPracticalLibrary.js`. Mantieni i due moduli di P02.2-SIC-01 intatti. Usa il nuovo ID, `editorialLine` esatta, le due note specifiche e una provenienza mista con 10 semimosse documentate, 2 scritte e 0 generate. Collega l'esercizio alla sequenza e alle nuove prove, con la politica motore dichiarata.
5. Estendi la presentazione della provenienza per il nuovo tipo. L'attuale condizione `kind === 'documented-line'` non basta: non far apparire «linea completa documentata» per questo percorso e non perdere i testi specifici della variante. Fonte fino a ...Dd7, esempio fino a ...Dxc6 e conclusione didattica devono essere comprensibili senza esporre dettagli interni. Conserva la presentazione dei due corsi già pubblicati.
6. Verifica il bivio ...Ad7/...Dd7 per entrambi i colori, cambio avanti/indietro e ripresa dal prefisso comune di nove semimosse. Il precedente test browser «uncovered Zaitsev» va sostituito da un test di ramo disponibile; conserva il controllo sulle alternative non coperte usando, per esempio, **6.Dd3 dopo ...Dd7**, legale ma assente dal nuovo percorso. Non etichettarla come errore scacchistico né completare il corso automaticamente.
7. Crea un rapporto attuale nuovo con baseline di 282 corsi preservata come sottoinsieme, prove del nuovo esercizio, copertura e residui. Mantieni i JSON P01, P02.1 e P02.2-SIC-01 come fotografie storiche. `report-opening-sicilian-result.mjs` e i verificatori dei progetti fissano i conteggi del loro momento: dopo l'integrazione non rigenerarli per sovrascrivere le fotografie e non usarli come controllo globale corrente. Il builder dei due contenuti precedenti deve invece continuare a passare in `--check`.
8. Aggiorna inventario, commenti e conteggi soltanto con misure effettive. Adegua le aspettative esatte necessarie dei test conservando tutti gli ID, le sequenze e i vincoli precedenti; non sostituire conteggi esatti con controlli più deboli per far passare la suite. Il nuovo seguito non deve essere contato come dodici semimosse di teoria documentata.
9. Esegui verifiche mirate, suite completa e build con le configurazioni no-env. Nel browser verifica completamento per entrambi i colori, checkpoint avversario, entrambi i sensi del bivio, esercizio con mosse sulla scacchiera e senza soluzione anticipata, alternativa legale non coperta, persistenza dei vecchi dati e del nuovo completamento dopo reload; includi desktop e mobile. Mantieni worker disabilitato e Explorer simulato nei test dei corsi. Esegui anche i test browser del lotto precedente aggiornati soltanto per il nuovo ramo.
10. Registra comandi, risultati, ricerche effettive, nodi richiesti/riportati e limiti nel rapporto nuovo e nella roadmap. Nessun commit, push o deploy. Al termine fermati prima della progettazione successiva e indica **GPT-6 Astra / High**. Primo gruppo successivo proposto: residui Chekhover con ...Ad7, 7.c4 e finali di linea 10.Dd3/11.Dd2, da progettare insieme secondo dipendenze e fonti; non avviarlo con Sol.

## Verifiche del progetto e impatto previsto

Comandi offline eseguiti:

```powershell
node scripts/build-opening-sicilian-content.mjs --check
node scripts/report-opening-sicilian-result.mjs --check
node scripts/verify-opening-zaitsev-design.mjs
node scripts/verify-opening-zaitsev-design.mjs --check
git diff --check
```

Il controllo iniziale ha corretto un'ipotesi sulla difesa di e4: il pedone è difeso dalla donna d4. La verifica finale riproduce legalità, geometria, controesempi, tutte le repliche dell'esercizio, completamento offline per entrambi i colori, fonti fissate e hash protetti. Nessuna nuova ricerca motore. Build e browser del nuovo lotto restano da eseguire in implementazione.

| Misura | Attuale verificata | Proiezione dopo implementazione valida |
| --- | ---: | ---: |
| Corsi / esercizi | 282 / 282 | 283 / 283 |
| Posizioni del corpus raggiunte con un ordine esatto | 1.939 | 1.940 |
| Solo per trasposizione | 201 | 201 |
| Assenti nel corpus A | 10.182 | 10.181 |
| Nuove ancore ECO | — | 0 |
| Assenti nel sottoalbero Chekhover | 13 su 22 | 12 su 22 |

La proiezione deriva dal replay di tutte le sequenze contro l'intero corpus fissato, includendo le posizioni intermedie; non dal numero di alias. Le due semimosse didattiche non aggiungono altre posizioni del corpus. I dodici residui sono elencati nella prova JSON. Questo lotto non chiude la Chekhover, né tutte le varianti della Siciliana, né P02.

**Prossimo passo: GPT-6.1 Sol / High**, per raccolta controllata delle prove, implementazione e verifica. Fermarsi qui per il cambio manuale richiesto da Carlo; riprendere al suo «continua».
