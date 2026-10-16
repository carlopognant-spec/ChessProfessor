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
npm test -- --config scripts/qa-no-env-test.config.js tests/opening-library.test.js --cache false
npx playwright test --config scripts/qa-opening-browser.config.js
npm run build -- --config scripts/qa-no-env-build.config.js
```

I test browser verificano ricerca e continuazioni, navigazione, esercizi
per entrambi i colori, input da scacchiera e SAN, progressi e preferiti dopo
ricaricamento, sottopromozioni, layout mobile e conservazione della partita.
Non avviano Stockfish e non interrogano l'esploratore esterno.
