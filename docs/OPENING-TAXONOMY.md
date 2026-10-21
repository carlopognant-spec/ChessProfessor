# P02.1 — Associazioni delle aperture alle famiglie

Completato il 20 ottobre 2026, dopo la conferma di Carlo del perimetro completo A delle due fonti. Configurazione concordata: GPT-6.1 Sol / High.

## Comportamento ottenuto

La biblioteca assegna la famiglia dal nome principale dell'apertura. Le parole contenute nei nomi delle sottovarianti non prevalgono più sul genitore. Quando il genitore è generico, come Queen's Pawn Game o Indian Defense, un sistema esplicitamente nominato all'inizio del dettaglio può scegliere la propria famiglia: Londra, Colle, Torre, Trompowsky o Budapest.

Esempi verificati:

| Voce | Prima | Adesso |
| --- | --- | --- |
| French Defense: Two Knights Variation | Italiana | Francese |
| English Opening: Caro-Kann Defensive System | Caro-Kann | Inglese |
| Queen's Gambit Declined: Ragozin Defense, Alekhine Variation | Alekhine | Gambetto di Donna |
| Four Knights Game: Spanish Variation | Spagnola | Quattro Cavalli |
| Zukertort Opening: Sicilian Invitation | Siciliana | Réti |
| Grob Opening: London Defense | Londra | Altre aperture |

Il raggruppamento Réti continua a comprendere gli ingressi flessibili di 1.Cf3; non implica che tutte le continuazioni della Zukertort siano la stessa apertura. Le 37 famiglie restano i contenitori attuali della biblioteca: separazioni e gerarchie più dettagliate appartengono ai prossimi lotti.

## Risultati misurati

| Misura | Risultato |
| --- | ---: |
| Voci preparate per la biblioteca | 12.377 |
| Associazioni cambiate rispetto al catalogo sorgente | 807 |
| Associazioni dal nome principale | 11.978 |
| Associazioni da un sistema sotto un genitore generico | 45 |
| Ripiego sul codice ECO | 185 |
| Senza regola specifica, nel gruppo Altre aperture | 169 |
| Assegnazioni da revisionare complessivamente | 497 |
| Percorsi di base ancora collegati | 37 su 37 |
| Percorsi guidati con identità, famiglia e mosse conservate | 280 su 280 |

Le 497 assegnazioni da revisionare comprendono i ripieghi ECO, i nomi non riconosciuti e alcuni titoli generici o misti. Non sono 497 errori dimostrati e non vengono eliminati dall'inventario del perimetro completo. I 137 riferimenti Lichess che richiedono revisione sono elencati separatamente; questo lotto non importa le nuove voci Lichess nell'applicazione.

Le regole nuove risolvono collisioni del nome e gestiscono abbreviazioni, accenti e le grafie Defense/Defence. L'assegnazione di navigazione non è una valutazione della correttezza della linea, della sua frequenza o della sua appartenenza al Libro.

## Compatibilità con dati e progressi esistenti

`openingCatalog.json` è anche una fonte delle prove già raccolte sui corsi: la sua firma è registrata negli artefatti di espansione. Per preservare questa provenienza, il file sorgente resta identico byte per byte. Il suo campo `family` conserva l'assegnazione storica della generazione originale.

`prepareOpeningCatalog` ricalcola la famiglia effettivamente usata da filtri, scheda e ricerca. Il testo italiano della famiglia aggiunto all'indice di ricerca segue l'assegnazione corretta. Nomi, alias, mosse, ECO e ID sono conservati.

Il generatore del catalogo usa esplicitamente `openingCatalogSourceFamily`, che conserva la politica della fonte fissata. I controlli confrontano tutte le 12.377 assegnazioni sorgenti con questo helper; la navigazione usa invece il risolutore corrente. Non è stato necessario cambiare le firme delle prove o allentare i test.

Le chiavi `chessprofessor.openings.v1`, gli ID dei preferiti e le chiavi delle sessioni di ripasso restano compatibili. Le famiglie scelte editorialmente per i corsi rimangono conservate anche quando una continuazione traspone in un'altra apertura: un cambiamento di struttura non deve spostare automaticamente un intero corso già studiato.

## Artefatti e verifiche

- [Rapporto completo con tutte le riassegnazioni e i casi da revisionare](data/opening-taxonomy.json).
- [Baseline di identità e hash da preservare](data/opening-taxonomy-baseline.json).
- [Risolutore della famiglia](../src/lib/openingFamily.js).
- [Test delle collisioni e della compatibilità](../tests/opening-family.test.js).

Verifica riproducibile del rapporto, offline:

```powershell
node scripts/report-opening-taxonomy.mjs
node scripts/report-opening-taxonomy.mjs --check
```

Il rapporto verifica i byte del catalogo, tutti gli ID e i dati originali delle voci, le associazioni del generatore sorgente, i 37 collegamenti di base e il digest dei 280 corsi. Sono verificati anche otto hash iniziali: repertorio Libro, integrazioni, codice Libro, classificazione numerica, configurazione motore, classificazione speciale, percorsi di espansione ed esercizi pratici.

Controlli realmente eseguiti:

| Comando | Esito |
| --- | --- |
| `npm.cmd test -- --config scripts/qa-no-env-test.config.js --cache false` | 74 file, 715 test passati e 1 TODO preesistente; 164,69 s |
| `npm.cmd run build -- --config scripts/qa-no-env-build.config.js` | Riuscita, 129 moduli; 14,89 s |
| `npx.cmd playwright test --config scripts/qa-opening-browser.config.js --grep "corrected families\|catalog search, exact continuations\|both colors train"` | 3 prove browser passate; 55,7 s |

La nuova prova browser parte da preferiti e ripassi già salvati, verifica la famiglia Francese corretta e conserva i conteggi sia dopo la navigazione sia dopo il ricaricamento. Le altre due prove controllano ricerca, continuazioni, scacchiera e ripasso con entrambi i colori. Il worker del motore è disabilitato nei test della biblioteca.

La build mantiene l'avviso sui chunk oltre 500 kB; la soglia non è stata modificata. Non sono state eseguite nuove ricerche motore, rigenerazioni dei benchmark o modifiche alle regole di analisi delle partite. Nessun commit o push.

## Stato della roadmap e ripresa

Aggiornamento successivo: P02.2-SIC-01 è stato implementato; usare il [rapporto Siciliana](OPENING-SICILIAN-P022-RESULTS.md) e il punto di ripresa corrente nella [roadmap](ROADMAP-E-PROMPT-OPERATIVI.md). Le indicazioni sotto documentano il passaggio originario da P02.1 alla progettazione.

P02.1 è completato. P02 rimane in corso: il perimetro completo non è ancora coperto e non sono stati aggiunti nuovi percorsi in questo lotto.

I documenti e i dati P01 restano la fotografia iniziale. I loro hash comprendono i sorgenti precedenti alla correzione: non rigenerarli per cancellare il confronto prima/dopo. Per lo stato delle associazioni attuali usare il rapporto di tassonomia sopra.

Il prossimo lavoro è **P02.2, progettazione della prima tranche di varianti mancanti della Siciliana**, a partire da Najdorf con 6.Ag5, Chekhover e dalla verifica delle relative dipendenze nel corso attuale. Preparare ingressi, bivi, fonti, riuso dei prefissi e un piano limitato per le eventuali nuove verifiche motore; non rilanciare le ricerche storiche.

Per questa parte di progettazione scacchistica consiglio **GPT-6 Astra / High**. Attendere il cambio e il «continua» di Carlo. Al termine della progettazione, rivalutare il passaggio a GPT-6.1 Sol / High per l'implementazione, fermandosi di nuovo prima del cambio.
