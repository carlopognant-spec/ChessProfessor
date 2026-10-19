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

La schermata iniziale offre 92 percorsi in 37 famiglie. L'Est-Indiana ha dieci
percorsi: centro chiuso classico, Fianchetto, Quattro Pedoni, Averbakh,
Makogonov, Petrosian, Gligoric-Taimanov, Cambio, Baionetta e Sämisch.
Questi sono percorsi commentati fino al mediogioco; non sono tutte le voci del
catalogo trasformate in corsi. Le continuazioni didattiche non sono dichiarate
come uniche mosse corrette né come partite storiche.
Le linee di base hanno il corpus narrativo già presente; le varianti combinano
piani specifici, note scritte per i passaggi chiave e spiegazioni dei cambiamenti
effettivi sulla scacchiera. Non tutte le mosse delle 92 linee hanno un commento
scritto individualmente. Gli otto nuovi percorsi di Est-Indiana hanno note
dedicate alle decisioni che li distinguono e alle trasformazioni centrali.

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
npm test -- --config scripts/qa-no-env-test.config.js tests/opening-library.test.js tests/opening-journeys.test.js tests/opening-variants.test.js tests/opening-opponent.test.js tests/opening-curriculum.test.js
npx playwright test --config scripts/qa-opening-browser.config.js
npm run build -- --config scripts/qa-no-env-build.config.js
```

I test browser verificano ricerca e continuazioni, navigazione, esercizi
per entrambi i colori, input da scacchiera e SAN, progressi e preferiti dopo
ricaricamento, sottopromozioni, layout mobile e conservazione della partita.
Controllano anche ritorni ai bivi annidati con entrambi i colori, ordine delle
alternative, assenza di rete e frecce SVG reali. Non avviano Stockfish;
le risposte dell'esploratore esterno sono simulate con campioni espliciti.
