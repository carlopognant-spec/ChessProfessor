# Primo confronto fuori dal campione personale

9 ottobre 2026. [Report](report.md), [risultati e analisi complete](results.json), [verifica offline](offline-evidence-review.json). Classificatore v5 e soglie invariati.

Partita pubblica yosoyfood–TheByzantineEmperor, 11 agosto 2022, rating 1028/1058. Il PGN è stato verificato attraverso la [API pubblica Chess.com](https://api.chess.com/pub/player/yosoyfood/games/2022/08). Le quattro etichette sono riportate dal recensore nel suo [articolo](https://adventuresofachessnoob.com/2022/08/22/brilliant-vienna-gambit-my-subscriber-goes-super-saiyan/), non ricavate da un nuovo Game Review. La fonte distingue esplicitamente due Geniale e due Grande; non abbiamo interpretato ogni `!` del PGN come Grande.

| Mossa | Etichetta esterna riportata | Classificatore attuale |
|---|---|---|
| 8.Bxf4 | Geniale | Migliore; candidata per accettazione senza copertura |
| 9.Bxf7+ | Geniale | Geniale |
| 10.Qxf3 | Grande | Migliore |
| 11.Qh5+ | Grande | Grande |

Due concordanze su quattro esempi positivi, senza cambiare regole per questa partita. È una prima evidenza di trasferimento delle famiglie, non una stima generale di affidabilità. Le altre 21 mosse non hanno etichette complete e restano sconosciute; nessuna assegnazione speciale fra esse, ma questo non autorizza una misura di falsi positivi. Il campione di sviluppo rimane separato: 15/37.

## Perché i due riconoscimenti funzionano

Bxf7+ offre l'alfiere dopo aver preso un pedone. Kxf7 porta la perdita netta a due punti rispetto a prima della mossa. La variante salvata mantiene compensazione favorevole, non ripristina immediatamente il saldo e termina con due mosse senza presa. Le alternative dello snapshot completato non superano la fascia vincente locale. La famiglia già esistente riconosce il sacrificio senza eccezioni sulla SAN.

Qh5+ è la risposta migliore senza presa dopo Ke8, errore grave numerico derivato dagli score. La famiglia empirica riconosce Grande. La ricerca child trova mate -5 dal lato del Nero e una PV completa fino al matto. Le alternative analizzate conservano un vantaggio inferiore: la famiglia empirica non pretende di aver dimostrato l'unicità fra tutte le 48 mosse legali.

## Bxf4: un limite concreto e un criterio da studiare

Bxf4 lascia il cavallo f3 alla cattura gxf3. L'analisi child MultiPV 1 contiene d5, la difesa migliore stimata, e non valuta gxf3: il classificatore resta candidato. Questo è un limite di copertura, non una valutazione negativa del sacrificio.

L'analisi root della mossa successiva è però della stessa FEN e contiene uno snapshot completo a depth 12: gxf3 vale -416 cp per il Nero. L'analisi indipendente dopo gxf3 vale +442 cp per il Bianco, depth 17. Sono due stime concordi sulla compensazione, non due prove di vittoria e non necessariamente ricerche della stessa profondità.

Nella verifica secondaria offline abbiamo sostituito soltanto la fonte delle accettazioni con quel vero snapshot della stessa FEN. Bxf4 resta Migliore: il blocco cambia da `missing-acceptance-analysis` a `unresolved-tactical-sequence`. La PV termina con Bxh8 Be6, quindi fallisce il requisito delle ultime due mosse senza presa. Nessuna variante inventata, allungata o modificata per superare la guardia.

Nuova ipotesi di lavoro: una compensazione confermata da una seconda ricerca della posizione **dopo l'accettazione** potrebbe essere una prova migliore del semplice requisito «PV che termina con due mosse tranquille». La lunghezza arbitraria della PV può fermarsi subito dopo una presa, anche quando la combinazione è favorevole. Mantenere score senza bound, FEN esatte, tutte le accettazioni coperte, controllo degli scambi ordinari, attribuzione e alternative già vincenti. Riutilizzare altre analisi disponibili della medesima FEN può migliorare la copertura senza nuovi go; non unire indiscriminatamente depth o scegliere lo score più favorevole.

Questa è un'ipotesi da confrontare con tutte le offerte del campione, compresi O-O, Rf3 e Rac1, prima di adottarla. Dopo tale modifica questa partita sarebbe dato di sviluppo, e servirebbero nuovi esempi esterni per un confronto indipendente.

## Qxf3: non basta allentare una soglia

Qxf3 è la migliore root, +360 cp a depth 12; O-O è la seconda dello snapshot, +149 cp. Gli indici locali sono circa 0,711 e 0,592: non superano il criterio fissato di conversione decisiva, che richiede almeno 0,75 alla giocata e un distacco di 0,20. Kxf7 precedente non crea abbastanza vantaggio nuovo per la famiglia di recupero. La famiglia empirica senza presa esclude Qxf3.

È una continuazione dell'attacco iniziato con i sacrifici precedenti, ma il motore mostra anche altre mosse favorevoli. Abbassare le soglie solo per riconoscere questo esempio non è giustificato. Possibile famiglia futura: decisioni critiche nella prosecuzione di una combinazione, con confronto delle difese e delle alternative; l'aspetto tattico da solo non basta.

## Riscontro delle fonti ufficiali

La [documentazione Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) descrive Grande come scelta critica per l'esito e Geniale come buon sacrificio, con condizioni aggiuntive e maggiore tolleranza per principianti. Non pubblica le nostre soglie locali. Nell'[AMA del direttore prodotto](https://www.reddit.com/r/Chesscom/comments/1tp1pc9/ama_about_game_review_puzzles_brilliant_moves/) la risposta diretta sulle Grande conferma anche l'esclusione di ricatture troppo ovvie. Questo sostiene la distinzione logica già implementata fra incasso materiale e nuova decisione, ma non dimostra equivalenza fra gli algoritmi.

## Esecuzione e verifica

Raccolta ripresa: 50 record verificabili, uno riutilizzato e 49 nuovi go, 9.630.726 nodi registrati entro il cap 10.200.000. Raw UCI, legalità delle PV, snapshot, telemetria e hash verificati offline; tutte le categorie salvate riprodotte. Due ricerche hanno ultima root senza bound diversa da bestmove, situazione gestita come dal worker dell'app, senza forzare uno snapshot.

Il primo tentativo era stato interrotto dopo 1.e4 per una guardia troppo rigida del runner. La seconda ricerca del tentativo iniziale non fu salvata: i suoi nodi effettivi restano sconosciuti e non possiamo dichiarare un totale esatto attraverso i due tentativi. Il [protocollo correttivo](../external-specials-v1/transport-fix-protocol.md) e il manifest separato sono stati scritti prima della ripresa. Il runner ora salva raw e telemetria prima delle verifiche che possono fallire. Nessuna predizione delle quattro mosse era stata osservata prima della correzione tecnica.

35 test mirati del classificatore superati, controllo sintattico dei due script e verifica offline dei 50 record completati. Nessuna modifica al codice dell'app o alle soglie, nessuna nuova assegnazione nel campione precedente, nessuna lettura di .env o delle partite riservate, nessun commit/push. Suite completa, browser e build non rieseguiti perché l'app non è stata modificata.
