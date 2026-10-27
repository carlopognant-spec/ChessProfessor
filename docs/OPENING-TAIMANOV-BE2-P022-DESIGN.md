# SIC-07: Taimanov con Ae3 e Ae2

Progetto verificato il 27 ottobre 2026, **non implementato**. Configurazione di questa fase: Astra / High. Prossima fase: **GPT-6.1 Sol / High**, dopo il cambio manuale di Carlo. L'applicazione contiene ancora 293 corsi e 293 esercizi.

Il lotto prepara insieme nove percorsi ed esercizi, usando la [pipeline comune](OPENING-PIPELINE.md). Non richiede nuovi collector, builder o reporter. Il solo [verificatore di progetto](../scripts/verify-opening-taimanov-be2-design.mjs) usa le funzioni comuni per controllare geometria specifica, navigazione e completezza del sottoramo senza avviare il motore.

## Perimetro e criterio di scelta

Il candidato Taimanov del backlog parte da `e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3`. La ricognizione completa trova 138 record, 126 ordini e 126 posizioni distinte, di cui 122 assenti, e 58 ordini terminali. Il selettore precedente mostrava 133 record perché includeva soltanto quelli delle posizioni assenti: non è un cambiamento del corpus.

Un solo corso non potrebbe coprirli. Il blocco scelto è l'intero sottoramo dopo `5...Qc7 6.Be3 a6 7.Be2`: **21 record, 20 posizioni e nove ordini terminali**. I nove percorsi includono anche quattro ingressi comuni mancanti, corrispondenti alle ancore B45, B47, B48 e B49. La fonte B48 denomina l'ingresso Ae3 “English Attack”; ciò non significa che ogni successiva scelta con Ae2 e arrocco corto sia lo stesso piano con f3 e arrocco lungo.

Motivo didattico: confrontare sviluppo del cavallo nero, espansione b5, a3 contro arrocco immediato, pressione di Ab4 su c3 e conseguenze dei cambi in c6. Il corso esistente `sicilian:taimanov` gioca invece 5.Cb5: il suo ID e le sue mosse restano invariati e costituiscono il primo confronto con 5.Cc3.

Non sono inferite frequenze di gioco né qualità dal numero di record. Dopo questo lotto rimarrebbero **98 posizioni assenti** nel candidato iniziale: tutte sono elencate in `candidateReview.residual` nella prova JSON. Restano nel perimetro A anche gli ingressi Ac4, Ad3 e f3 della Siciliana aperta precedentemente rinviati.

## Percorsi pronti per l'implementazione

Prefisso comune: `e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Be2`. Gli ID hanno prefisso `sicilian:taimanov-be2-`. Le mosse della tabella usano SAN internazionale, come i dati dell'applicazione.

| Suffisso ID | Seguito documentato dopo il prefisso | Seguito didattico | Semimosse fonte + aggiunte |
| --- | --- | --- | --- |
| `nge7` | Nge7 | O-O Ng6 | 14 + 2 |
| `b5-exchange` | b5 Nxc6 | Qxc6 | 15 + 1 |
| `a3-b5` | Nf6 a3 b5 | O-O Bb7 | 16 + 2 |
| `castle-b5` | Nf6 O-O b5 | a3 Bb7 | 16 + 2 |
| `castle-be7` | Nf6 O-O Be7 | f4 d6 | 16 + 2 |
| `a3-be7` | Nf6 a3 Be7 O-O | O-O | 17 + 1 |
| `bb4-exchange` | Nf6 O-O Bb4 Nxc6 | bxc6 | 17 + 1 |
| `na4-castle` | Nf6 O-O Bb4 Na4 O-O | Nxc6 bxc6 | 18 + 2 |
| `na4-be7-nb6` | Nf6 O-O Bb4 Na4 Be7 Nxc6 bxc6 Nb6 | Rb8 | 21 + 1 |

Totale: **150 semimosse documentate e 14 didattiche**, zero mosse generate. Le 46 note di coppia coprono tutti i passaggi dal nuovo bivio in poi; piani, differenze e ragioni dell'endpoint sono nel [piano eseguibile](data/opening-taimanov-be2-p022-plan.json). La revisione generale di tutti i commenti rimane P03.

Le cinque coppie aggiunte risolvono un problema verificato: una fonte che finisce immediatamente dopo un bivio del Nero lascerebbe zero mosse attive al Bianco che riprende dal checkpoint. Ogni destinazione offre ora almeno un turno all'allievo per entrambi i colori, con la replica prevista nella sequenza. Le altre quattro risposte completano cambi, arrocco o risposta all'attacco contro la torre. Sono scelte dichiarate, non attribuite alla fonte; devono superare tutte il confronto motore prima della pubblicazione.

Fatti editoriali importanti, inclusi nei 27 controlli geometrici:

- Dc7 non attacca c2 attraverso il proprio cavallo c6.
- Cge7 blocca la diagonale dell'alfiere f8; il successivo Cg6 controlla e5 e f4, non e4.
- Dopo l'arrocco bianco, Ab4 attacca c3 ma non inchioda quel cavallo al re.
- Ca4 abbandona la difesa di e4. La presenza della linea nella fonte non dimostra un vantaggio bianco.
- Ab7 non attacca e4 attraverso il proprio cavallo c6.
- Cb6 attacca Ta8 e Ac8, non Dc7. Ae3 difende b6; Tb8 salva la torre e difende c8. Il doppio attacco non prova un guadagno gratuito.

## Fonti e copertura prevista

Si conserva il corpus finito già approvato e congelato: [JeffML/eco.json](https://github.com/JeffML/eco.json), revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`, catalogo locale SHA-256 `5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2`, MIT. I riferimenti Lichess sono alla [tabella B fissata](https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a30dc273ccb21fc2536a9a2fefd5592a67a/b.tsv), revisione `a6189a30dc273ccb21fc2536a9a2fefd5592a67a`, CC0. La tabella Lichess è stata consultata anche in questa fase; non si attribuisce una nuova verifica remota del repository JeffML, la cui pagina di revisione non era disponibile nello strumento web. La verifica dei record JeffML usa il catalogo locale congelato e i suoi hash.

Nomi, codici ECO, ID dei record e posizioni sono conservati. I due cataloghi non sono dichiarati testimonianze indipendenti. `sourceRecords` collega ogni percorso ai prefissi documentati; la prova conserva anche tutti i 21 record del sottoramo e i riferimenti alternativi alle stesse posizioni.

| Misura | App attuale | Proiezione dopo tutti i gate |
| --- | ---: | ---: |
| Corsi / esercizi | 293 / 293 | 302 / 302 |
| Posizioni esatte | 1.956 | 1.980 |
| Posizioni solo trasposte | 202 | 203 |
| Posizioni assenti | 10.164 | 10.139 |

Il guadagno è **24 nuove posizioni esatte e una solo trasposta**. Quest'ultima è `position:c3a720339912c99f`, un ordine Scheveningen raggiunto dalla coppia didattica f4/d6: la sua sequenza sorgente non diventa automaticamente giocabile. Le 20 posizioni del sottoramo diventerebbero tutte esatte. Questa è completezza del sottoramo nel corpus, non della Taimanov, della Siciliana o dell'intera teoria.

## Esercizi e budget motore

Nove deviazioni costruite, una per percorso. Non sono partite storiche o errori di frequenza misurata. I temi comprendono controllo dei pedoni sui salti di cavallo, cattura della donna da parte di un cavallo, verifica di uno scacco non protetto e difesa lungo una diagonale. Alcuni temi ricorrono in posizioni diverse: non sono nove temi tattici distinti.

| Percorso | Deviazione / risposta | Repliche legali immediate | Saldo minimo |
| --- | --- | ---: | ---: |
| nge7 | Ndb5 / axb5 | 46 | +2 |
| b5-exchange | Qa5 / Nxa5 | 23 | +9 |
| a3-b5 | Nf5 / exf5 | 48 | +2 |
| castle-b5 | Nf5 / exf5 | 44 | +2 |
| castle-be7 | Nf5 / exf5 | 45 | +2 |
| a3-be7 | Qxh2+ / Kxh2 | 35 | +5 |
| bb4-exchange | Qa5 / Nxa5 | 29 | +6 |
| na4-castle | Nf5 / exf5 | 44 | +2 |
| na4-be7-nb6 | Qxb6 / Bxb6 | 27 | +5 |

Le **341 repliche** sono già state enumerate legalmente. Il saldo è rispetto a prima della deviazione, includendo il pezzo eventualmente catturato dall'errore; non è una valutazione della partita. È verificata una sola cattura legale del tipo di bersaglio dichiarato, non l'unicità di ogni possibile mossa vincente.

**Motore non eseguito.** La fase Sol userà Stockfish 16 già congelato, un thread, hash 32 MB, MultiPV 1, azzeramento hash prima di ciascun `go`, 200.000 nodi richiesti per ricerca, timeout 30 secondi. SHA dell'eseguibile nel piano e verificato.

- 14 confronti di mosse didattiche: controllo libero e ricerca sulla stessa FEN completa con `searchmoves`.
- Nove controlli delle deviazioni; tutte le nove baseline dell'esercizio coincidono con un controllo della prima mossa didattica dello stesso corso e sono condivise esplicitamente.
- **37 job primari**, 7.400.000 nodi richiesti. Nessuna ricerca duplicata per la stessa coppia FEN completa/radici.
- Al massimo una conferma per job soltanto secondo la politica già congelata: tetto **74 `go` e 14.800.000 nodi richiesti**, inclusi tentativi interrotti o falliti. I nodi effettivi saranno riportati separatamente.
- Perdita massima delle mosse didattiche 100 cp; variazione minima degli esercizi 200 cp; saldo materiale immediato almeno +2. Nessuna modifica alle soglie.
- Pubblicare insieme nove percorsi e nove esercizi solo se tutti i gate passano. Un fallimento conserva il ledger e richiede revisione del progetto: niente ricerca automatica di candidati sostitutivi, ripetizioni o aumento del budget.

## Navigazione e verifiche previste

Sono passati **90 confronti diretti** fra le nove nuove linee e il corso Taimanov esistente: checkpoint SAN, cambio esplicito, avanzamento e prosecuzione completa da entrambi i colori. Sono state verificate anche le 18 percorrenze integrali delle nuove linee e la risposta attesa di ogni esercizio. Sono controlli offline delle funzioni attuali, non test browser.

I rami a3/b5 e arrocco/b5 convergono dopo Ab7: primi quattro campi FEN uguali, contatori delle semimosse rispettivamente 2 e 1. Il prefisso comune resta di 14 semimosse. Il progresso deve restare separato; nessun completamento o salto per sola posizione. Le FEN complete rimangono distinte nei job motore.

La scelta 5...d6 dopo Cc3 è legale e fuori dai percorsi attualmente disponibili con questo ordine: mostrarla come limite del corso. Restano invariati il ritorno esplicito per percorsi contenuti, i progressi persistenti e il classificatore.

Per il browser usare le nove coppie in `navigation.browserPairs`: formano un insieme che visita ogni ramo reale, senza moltiplicare tutte le coppie di corsi. Matrice pianificata:

- 18 completamenti di corso, nove esercizi.
- 18 cambi live, nei due sensi, con il colore al tratto del bivio.
- 36 checkpoint, nei due sensi e per entrambi i colori. Nei casi a3/b5 ↔ arrocco/b5 controllare anche che la convergenza finale non completi l'altra linea.
- Un caso di scelta legale scoperta: totale **82 casi nuovi**.
- Otto regressioni esistenti della selezione SIC-06: totale selezionato **90**.

Conservare tutti i 141 casi storici: la matrice completa prevista arriva a **223**. Questi numeri sono un piano, nessun caso browser nuovo è stato eseguito. Prima del run confrontare `--list` con il conteggio previsto; non cambiare timeout per far passare un caso.

Il registro contiene selezione QA e modifiche ammesse ai soli aggregatori. Annullando gli import e gli spread dichiarati si devono ripristinare esattamente gli hash 293 del progetto. Altre modifiche runtime o file sconosciuti impongono QA completa. Per il collaudo circoscritto indicare esplicitamente tutti i moduli e aggregatori del lotto alla pipeline QA, registrando il perimetro; il checkout include altri lavori pendenti e il comando senza perimetro può correttamente scegliere la suite completa.

## Punto di ripresa operativo per Sol / High

Usare [registro](data/opening-pipeline/lots.json), [piano](data/opening-taimanov-be2-p022-plan.json) e [prova](data/opening-taimanov-be2-p022-design-verification.json). `activeLot` è `sic-07`. I 216 file protetti, i 293 percorsi di baseline e gli esercizi precedenti sono verificati con hash e digest. Conservare il piano e la prova dopo la preparazione del manifest.

```powershell
node scripts/verify-opening-taimanov-be2-design.mjs --check
npm.cmd run openings:lot -- verify --lot sic-07
npm.cmd run openings:lot -- report --lot sic-07 --projection
npm.cmd run openings:lot -- prepare --lot sic-07
npm.cmd run openings:lot -- collect --lot sic-07
npm.cmd run openings:lot -- build --lot sic-07
```

I primi tre comandi sono offline. `prepare`, `collect` e `build` sono il lavoro successivo, dopo il cambio manuale di modello. La verifica del progetto va eseguita prima dell'integrazione: i suoi hash fotografano gli aggregatori attuali; dopo l'integrazione usare i controlli di baseline e artefatti della pipeline, senza rigenerare la prova storica.

Integrare i due moduli generati con gli import/spread dichiarati. Aggiungere il test del lotto riusando piano, prova e funzioni comuni per verificare tutti i percorsi, le 90 transizioni, le 341 repliche, i 14 confronti motore, i 27 fatti geometrici e le trasposizioni. Aggiornare i conteggi aggregati dei test a 302 e gli inventari dal runtime, senza riscrivere baseline storiche. Il test della pipeline che verifica l'annullamento degli aggregatori usa oggi SIC-06: aggiornarlo al lotto attivo per quella sola verifica, conservando i controlli storici di SIC-05/SIC-06.

Aggiungere gli 82 scenari browser attraverso le tabelle esistenti, con prefisso `roadmap Sicilian Taimanov Ae2` per i casi specifici. Completare build e QA no-env, poi `build --check`, `report`, `inventories`, controllo documenti e `git diff --check`. Il risultato va scritto soltanto dopo l'integrazione; la proiezione resta distinta. Nessun commit, push o deploy è richiesto.

Fermarsi al prossimo cambio di modello solo se serve una nuova decisione scacchistica, per esempio un gate fallito. Le attività ordinarie di integrazione e collaudo di tutti e nove i percorsi appartengono allo stesso lavoro Sol / High.

## Esito di questa fase

Progetto e controlli offline PASS: nove percorsi, nove esercizi, 216 file preservati, 341 repliche, 90 transizioni, 27 fatti geometrici. La pipeline comune verifica il lotto e produce la proiezione separata. Motore, build applicativa e browser del nuovo lotto non eseguiti: l'app è ancora a 293 corsi/esercizi. P02 rimane aperta; il prossimo risultato atteso è SIC-07 integrato e collaudato, non un altro documento di progettazione.
