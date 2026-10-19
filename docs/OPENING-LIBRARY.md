# Biblioteca e allenamento delle aperture

Aprire **Biblioteca aperture** nella navigazione principale, oppure usare
`#aperture` nell'indirizzo dell'app. La partita e il PGN correnti restano
conservati mentre si consulta la biblioteca. La scacchiera di studio e autonoma.

Il catalogo contiene 12.377 record di aperture e varianti, distribuiti su tutti
i 500 codici ECO, dalla revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`
di [eco.json](https://github.com/JeffML/eco.json). Le fonti originali possono
contenere nomi diversi per la stessa sequenza. Il catalogo non pretende di
enumerare ogni continuazione teorica possibile. Licenza MIT e attribuzione:
`src/data/openingBook.LICENSE.txt`.

## Percorsi guidati e bivi

La schermata iniziale offre 280 percorsi in 37 famiglie. L'Est-Indiana ha quattordici
percorsi: centro chiuso classico, Fianchetto, Quattro Pedoni, Averbakh,
Makogonov, Petrosian, Gligoric-Taimanov, Cambio, Baionetta, Sämisch,
Panno nella Sämisch e nel Fianchetto, Smyslov e sistema semiclassico.
Questi sono percorsi commentati fino al mediogioco; non sono tutte le voci del
catalogo trasformate in corsi. Le continuazioni didattiche non sono dichiarate
come uniche mosse corrette né come partite storiche.
Le linee di base hanno il corpus narrativo già presente; le varianti combinano
piani specifici, note scritte per i passaggi chiave e spiegazioni dei cambiamenti
effettivi sulla scacchiera. Non tutte le mosse delle 280 linee hanno un commento
scritto individualmente. Tutti i 188 nuovi percorsi delle 37 famiglie hanno
almeno due note strategiche individualmente scritte sui passaggi chiave:
388 note in totale, comprese le 36 dei dodici nuovi percorsi della Caro-Kann.
Le note collegano la mossa del giocatore alla risposta avversaria e ai cambiamenti
del centro. Si leggono dopo la mossa; gli aiuti che indicano il pezzo restano facoltativi.
Le sequenze revisionate sono congelate in `openingReviewedLines.js` e
`openingCaroNotes.js`: una modifica alle mosse richiede una nuova revisione dei testi.
Gli altri passaggi mantengono le spiegazioni derivate dalla posizione e il corpus
narrativo precedente; i commenti individuali non coprono ancora ogni mossa.

Il corpus aggiuntivo comprende 230 note: le 91 di Londra e Catalana e 139 per
Nimzo-Indiana, Ovest-Indiana e Bogo-Indiana. Tutti i 26 percorsi di queste cinque
famiglie hanno una nota scritta per ogni coppia di mosse. Le sequenze complete
sono fissate in `openingFullReviewedLines.js`; le note aggiuntive non sostituiscono
quelle sui passaggi chiave già presenti. Le nuove note indiane distinguono anche
pressione attuale e preparazione, colonne aperte e semiaperte, pezzi che bloccano
le proprie torri e minacce scoperte dopo un cambio o una ritirata.
La copertura complessiva è di 1.974 coppie con testo scritto su 4.492,
con 58 percorsi interamente commentati per coppia. Gli altri percorsi non
vengono dichiarati interamente revisionati sulla base delle spiegazioni automatiche.

Ogni mossa giocata ha ora un riepilogo distinto da quello della risposta avversaria,
anche quando l'allievo usa il Nero. La sezione richiudibile «La sequenza appena giocata»
mostra gli effetti della propria mossa e poi quelli della risposta effettiva,
con al massimo due osservazioni per mossa: bersagli, sostegni, colonne e trasformazioni
dei pedoni. Le note scritte restano un approfondimento separato; i vecchi paragrafi
generici non vengono ripetuti insieme a queste spiegazioni. Nulla viene anticipato
prima di giocare. La [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md)
distingue le 8.930 semimosse spiegate dai passaggi con una nota individuale.

L'[inventario di copertura](OPENING-COVERAGE.md) elenca i 197 rami dichiarati
nell'espansione e distingue percorsi precedenti, nuovi, fonti e verifiche.
Le 188 nuove linee partono da posizioni documentate nel catalogo fissato;
si preferisce proseguire sulla fonte quando contiene una continuazione utile.
La parte restante fino alla mossa 16 è un modello didattico costruito offline,
separato dalla teoria documentata. I piani sono specifici della variante;
non viene attribuita alle risposte del modello una frequenza misurata.

I conteggi per famiglia indicano i percorsi presenti, non la quantità di teoria
esistente. Caro-Kann ed Est-Indiana hanno avuto approfondimenti dedicati prima
delle altre famiglie. La [seconda revisione delle lacune](OPENING-EXPANSION-AUDIT.md)
aggiunge 37 rami distinti a Siciliana, Gambetto di Donna, Spagnola, Francese,
Italiana e Inglese, senza duplicare come nuove lezioni i sinonimi dei sistemi già coperti.

La progressione segue l'albero degli ordini di mosse dei percorsi della famiglia:
prima la linea principale del corso, poi le alternative, mantenendo vicine le
diramazioni annidate. Dopo il completamento si può continuare con la variante
successiva. La scacchiera torna al prefisso comune più lungo già studiato,
prima della mossa che distingue il nuovo ramo. «Inizia questa variante» avvia
il ramo: se tocca all'avversario, viene prima giocata la sua scelta. L'allievo
muove sempre soltanto il proprio colore.

Un pannello richiudibile segnala i bivi raggiunti e consente di cambiare ramo
manualmente. Anche i bivi della risposta avversaria vengono annunciati prima
della mossa dell'allievo che la attiva. Le opzioni consentono di disattivare
la progressione automatica e ripassare una sola linea.

Per ordinare le alternative si interroga soltanto ai bivi il
[Lichess Opening Explorer](https://lichess.org/api#tag/Opening-Explorer/operation/openingExplorerLichess):
partite rapid e classical, fasce 0/1000/1200/1400, complessivamente sotto 1600
Lichess. La linea principale del corso conserva la precedenza: non è una
dichiarazione che sia la più frequente del campione. Le alternative sono
ordinate per numero di partite al bivio, non per forza della mossa o tasso di
vittoria. Il campione è indicato nel pannello. Senza dati, oppure senza rete,
rimane l'ordine didattico e il corso funziona normalmente. Le richieste hanno
timeout, cache di sessione limitata e pausa dopo HTTP 401/403/429; non usano Stockfish.
L'API richiede autenticazione: viene usata la configurazione
`VITE_LICHESS_TOKEN` già prevista dal progetto, senza introdurre nuove
credenziali. Una verifica HTTP anonima in questa sessione ha restituito 401;
l'ordinamento con frequenze è stato verificato con risposte simulate, non con
un account autenticato. Senza configurazione valida resta l'ordine didattico.
Vedi l'[annuncio ufficiale del cambiamento](https://lichess.org/forum/lichess-feedback/lichess-changelog-april-2026).

Il conteggio delle linee affrontate nella progressione riguarda la sessione
corrente e viene azzerato da riavvio o cambio colore. I completamenti dei singoli
percorsi restano salvati con le chiavi precedenti. Un ramo ripreso da un bivio
non riceve un completamento «senza errori o indizi» per l'intera linea saltata.

## Frecce dell'avversario

Le lezioni mostrano frecce dalla posizione del pezzo appena mosso alle case e
ai bersagli descritti nel testo: oro per controllo, rosso per attacco e verde
per difesa. Le frecce rispettano i pezzi che bloccano le linee e distinguono
un pezzo difeso da uno attaccato; uno scacco di scoperta può avere origine
dal pezzo che effettivamente attacca il re. Non anticipano la mossa richiesta
all'allievo. Sono controlli geometrici, non una certificazione che una cattura
futura sia legalmente possibile o vantaggiosa.
Anche gli attacchi scoperti contro altri pezzi partono dall'attaccante effettivo:
nella Lasker, ...Ce4 può liberare l'alfiere e7 contro h4; quella freccia parte
da e7, mentre il cavallo e4 esercita una pressione distinta sul cavallo c3.

Cambiano con la posizione, scompaiono al completamento e durante il ritorno al
bivio e si possono nascondere nelle opzioni. Il testo rimane disponibile anche
senza frecce. La selezione di un pezzo non cancella le frecce dell'istruttore.

## Consultazione

- Fondamentali: linee di ingresso selezionate per le famiglie didattiche.
- Tutte: l'intero catalogo, con paginazione.
- Approfondimenti: record diversi dalle linee di ingresso; non e un punteggio
  di difficolta o una raccomandazione basata sull'Elo.
- Ricerca per nome originale, alias, nome italiano, ECO e mosse. La ricerca
  include l'intero catalogo anche dalla vista Fondamentali.
- Esplora le continuazioni: seleziona soltanto gli ordini di mosse che
  proseguono esattamente la sequenza scelta. Le trasposizioni non vengono
  accorpate in un unico albero.
- Preferiti e completamenti degli esercizi vengono salvati nel browser con
  la chiave `chessprofessor.openings.v1`; non sono sincronizzati fra dispositivi.

I contenuti in italiano comprendono lezioni sulle famiglie, piani per entrambi
i colori e avvertenze strategiche. Alcune varianti principali hanno una nota
specifica aggiuntiva. Le altre usano esplicitamente i piani della famiglia:
non vengono presentati come commenti individuali su tutte le 12.377 linee.
Le sequenze piu rare possono ricevere soltanto un orientamento generale.

## Esercizi e trappole

Ogni famiglia offre anche una sezione richiudibile di deviazioni da riconoscere.
Questi esercizi partono da posizioni dei percorsi e aggiungono una scelta legale
che trascura un bersaglio. L'allievo gioca direttamente la risorsa sulla
scacchiera, senza dover ripetere l'apertura. Dopo la soluzione vengono
spiegati il bersaglio e una possibile alternativa alla deviazione.

Sono scenari costruiti e verificati, non partite storiche né un campione degli
errori più frequenti. Il guadagno materiale viene verificato contro tutte le
repliche legali immediate. I confronti del motore restano
stime a budget finito: non certificano una vittoria nell'intera partita.
Conteggi e copertura per percorso sono nell'inventario.

Ogni linea si puo ripassare con il Bianco o il Nero. Le risposte dell'altro
colore sono quelle della linea selezionata; non vengono scelte da Stockfish.
Si puo muovere trascinando, selezionando partenza e arrivo, o scrivendo SAN.
Le promozioni della linea includono le sottopromozioni.

Una mossa legale diversa viene descritta come un'altra linea, non come un
errore scacchistico. Il completamento senza errori o indizi viene contato
separatamente da quello assistito. Un singolo completamento non costituisce
una certificazione di padronanza dell'apertura.

La raccolta iniziale comprende sei trappole didattiche: matto del barbiere,
Legal, Englund, elefante, sottopromozione di Lasker e Kieninger. Ogni sequenza
viene controllata legalmente e il suo esito verificato: quattro terminano in
matto, due in un vantaggio materiale. Non sono promesse contro ogni difesa.
Sono incluse indicazioni per riconoscere o evitare il motivo tattico.

## Dati e verifiche

`npm run openings:build` ricostruisce `src/data/openingCatalog.json` dalla
fonte fissata. Controlla gli hash delle cinque fonti e riproduce legalmente
tutte le sequenze; non cambia `openingPositions.json` o la classificazione Libro.
La cache di download e opzionale; il normale build usa il catalogo versionato
e non scarica dati. Il catalogo viene caricato soltanto aprendo la biblioteca.

```sh
npm test -- --config scripts/qa-no-env-test.config.js tests/opening-library.test.js tests/opening-journeys.test.js tests/opening-variants.test.js tests/opening-opponent.test.js tests/opening-curriculum.test.js tests/opening-expansion.test.js tests/opening-engine-evidence.test.js tests/opening-strategic-notes.test.js tests/opening-scope.test.js tests/opening-teaching-checkpoint.test.js tests/opening-move-review.test.js tests/opening-full-notes.test.js tests/opening-indian-full-notes.test.js
npx playwright test --config scripts/qa-opening-browser.config.js
npm run build -- --config scripts/qa-no-env-build.config.js
```

I test browser verificano ricerca e continuazioni, navigazione, esercizi
per entrambi i colori, input da scacchiera e SAN, progressi e preferiti dopo
ricaricamento, sottopromozioni, layout mobile e conservazione della partita.
Controllano anche ritorni ai bivi annidati con entrambi i colori, ordine delle
alternative, assenza di rete e frecce SVG reali. Non avviano Stockfish;
le risposte dell'esploratore esterno sono simulate con campioni espliciti.

I seguiti sono già versionati: il build normale e i test non li rigenerano.
Gli script `build-opening-expansion.mjs`, `build-opening-practical-cases.mjs`
e `verify-opening-evidence.mjs` operano offline sul solo materiale didattico,
con Stockfish 16 nativo presente nel repository. Conservano le evidenze nei
file sotto `docs/data/`; non modificano cache di analisi, benchmark congelati,
soglie o classificazione Libro. Il lettore UCI associa ogni valutazione alla
PV della mossa selezionata e richiede conferma quando una ricerca interrotta
non ha stampato una linea completa per quella scelta.
I checkpoint conservano i corsi e gli esercizi compatibili delle famiglie non
ancora visitate; un errore su una nuova linea non cancella il materiale successivo.
