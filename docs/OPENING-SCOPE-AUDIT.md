# P01 — Copertura delle aperture e perimetro proposto

Data: 20 ottobre 2026. Stato: audit completato; perimetro completo A successivamente confermato da Carlo. Le misure restano la fotografia iniziale P01. Per la correzione delle associazioni vedere [P02.1](OPENING-TAXONOMY.md).

## Risultato principale

I 280 percorsi attuali coprono una selezione di varianti. La precedente dichiarazione «0 rami da inserire» riguarda i 197 rami scelti nell'inventario di espansione, non tutte le aperture delle fonti. Per completare la richiesta occorre prima correggere l'organizzazione delle famiglie, poi ampliare sistematicamente le scelte dei corsi.

Il corpus confrontato comprende il catalogo eco.json già usato nell'app e lo snapshot corrente di Lichess verificato il 20 ottobre. La matrice copre tutte le 37 famiglie attuali e conserva separatamente record, nomi, ordini di mosse e posizioni. Non è stato modificato alcun corso o comportamento dell'applicazione.

## Misure confermate

| Misura | Risultato |
| --- | ---: |
| Record eco.json del catalogo locale | 12.377 |
| Record dello snapshot Lichess | 3.865 |
| Riferimenti complessivi prima dei raggruppamenti | 16.242 |
| Sequenze di mosse distinte nell'unione | 12.723 |
| Posizioni caratteristiche distinte nell'unione | 12.322 |
| Posizioni raggiunte con almeno un ordine delle fonti | 1.919 |
| Ulteriori posizioni raggiunte solo per trasposizione | 201 |
| Posizioni non raggiunte da alcun corso | 10.202 |
| Prime diramazioni mancanti che conducono a posizioni assenti | 2.710 |
| Percorsi attuali, senza duplicati di sequenza completa | 280 |
| Semimosse dei percorsi rigiocate | 8.930 |

**10.202 posizioni assenti non significa 10.202 corsi da scrivere.** Un ramo può attraversare più posizioni nominate; diverse denominazioni possono descrivere la stessa posizione. Le 2.710 diramazioni sono punti di ingresso nel materiale assente, non una stima dei corsi necessari: possono convergere e contenere molte scelte successive.

Il raggiungimento di una posizione è una misura di copertura delle mosse. Non dimostra che esistano un commento specifico, un esercizio dedicato o tutte le risposte importanti. Non è una percentuale della qualità didattica o della teoria scacchistica mondiale.

Lichess aggiunge 346 ordini di mosse e 216 posizioni rispetto al catalogo locale. Le due fonti non sono indipendenti: eco.json incorpora anche dati Lichess. I conteggi sono riconciliati per identità della posizione, non per nome o codice ECO.

## Un problema concreto nell'organizzazione attuale

`openingFamily` cerca la prima espressione corrispondente nel nome completo. Una parola nel nome della sottovariante può quindi prevalere sulla famiglia principale.

| Voce del catalogo | Famiglia attuale | Collocazione proposta nell'audit |
| --- | --- | --- |
| French Defense: Two Knights Variation | Italiana | Francese |
| English Opening: Caro-Kann Defensive System | Caro-Kann | Inglese |
| Queen's Gambit Declined: Ragozin Defense, Alekhine Variation | Alekhine | Gambetto di Donna / Ragozin |
| Four Knights Game: Spanish Variation | Spagnola | Quattro Cavalli, con collegamento alla Spagnola dove pertinente |

Gli ID dei primi tre esempi sono `337da71237d2792f`, `a70d219b96c5b79a`, `a7d8aa7013902d08`; il quarto è `3790e68e1130a385`. Le sequenze originali sono nella matrice JSON, con prefisso `eco:`.

Le regole conservative dell'audit, ancorate al nome primario, segnalano **897 riferimenti da riesaminare**, distribuiti fra i dati locali e Lichess. Complessivamente **655 gruppi di posizioni** hanno un conflitto o più attribuzioni di famiglia. Questi non sono 897 errori certificati: alcune differenze riflettono trasposizioni o scelte editoriali legittime.

Per **2.030 posizioni** il nome primario non è risolto dalle regole dell'audit e viene conservata l'assegnazione applicativa, marcata `legacy-unreviewed`. Questa lista può sovrapporsi ai conflitti. Le correzioni proposte non sono state trasferite in produzione.

Conseguenza operativa: il primo lotto P02 deve mettere in ordine la tassonomia e i collegamenti, preservando ID, preferiti e progressi. Aggiungere corsi prima di questo passaggio amplificherebbe le incongruenze.

## Varianti, sottovarianti, sinonimi e trasposizioni

La matrice conserva tre livelli distinti:

1. **Nome della fonte:** famiglia, variante e sottovarianti ricavate dalla sintassi del nome, quando disponibile. È la convenzione della fonte, non una classificazione didattica automaticamente approvata.
2. **Percorso delle mosse:** il genitore di una voce è la precedente posizione nominata lungo quella sequenza. La stessa posizione può avere più genitori; il risultato è un grafo, non un unico albero di nomi.
3. **Posizione:** pezzi, turno, diritti di arrocco ed en passant legalmente disponibile; i contatori sono esclusi. Nomi e ordini diversi restano consultabili nel gruppo.

Sono presenti 386 gruppi con più ordini e 417 gruppi con più nomi primari. Gli alias contenuti nei record sono conservati ulteriormente. Questi numeri non sono lezioni da aggiungere.

Raggiungere la stessa posizione permette di condividere il seguito. Non rende automaticamente equivalenti gli ordini precedenti: una deviazione può essere disponibile solo in uno di essi. P02 dovrà esplicitare quali ingressi sono esercitabili e quali vengono spiegati tramite un collegamento di trasposizione.

## Esempi di lacune effettive

Queste posizioni non sono raggiunte dai 280 corsi, nemmeno tramite trasposizione. La selezione illustra scelte distinte; non attribuisce loro una frequenza di gioco.

| Famiglia | Scelta assente | Sequenza della fonte | ID posizione |
| --- | --- | --- | --- |
| Siciliana | Najdorf con 6.Ag5 | e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 | `328690c82438e111` |
| Siciliana | Chekhover con 4.Dxd4 | e4 c5 Nf3 d6 d4 cxd4 Qxd4 | `00e320f8355c07c4` |
| Spagnola | Difesa Bird | e4 e5 Nf3 Nc6 Bb5 Nd4 | `12f3df2bf49b8675` |
| Francese | Tarrasch, Guimard: linea principale | e4 e6 d4 d5 Nd2 Nc6 Ngf3 Nf6 | `9cc4575b0eed37ed` |
| Gambetto di Donna | Semi-Tarrasch | d4 Nf6 c4 e6 Nf3 d5 Nc3 c5 | `87693e7c08846cff` |
| Nimzo-Indiana | Spielmann con 4.Db3 | d4 Nf6 c4 e6 Nc3 Bb4 Qb3 | `46c3d11deff0f027` |
| Grünfeld | Russa accelerata con 4.Db3 | d4 Nf6 c4 g6 Nc3 d5 Qb3 | `cfa08ded6bff7338` |
| Inglese | Impianto con 1...c6 | c4 c6 | `a8cb699cfcbdb0d1` |

La Nimzo-Indiana è una delle cinque famiglie interamente commentate nei percorsi esistenti. La presenza di varianti assenti dimostra perché **commenti completi sui corsi attuali e copertura completa dell'apertura sono obiettivi diversi**.

## Perimetro consigliato per P02

### Opzione A — Copertura completa del corpus fissato, consigliata

Adottare come inventario di riferimento tutte le **12.322 posizioni nominate** dell'unione, con i **12.723 ordini** conservati. Organizzarle in sistemi, varianti e sottovarianti, raggruppando le posizioni che appartengono alla stessa unità didattica. Nessun obiettivo arbitrario sul numero finale di corsi.

Per ogni posizione si dovrà registrare una destinazione verificabile:

- ramo giocabile con ingresso, piani dei due colori, spiegazione minima della scelta e collegamento al seguito;
- nodo intermedio di un ramo già completo, senza creare una scheda duplicata;
- alias della stessa posizione, con il nome ricercabile;
- ingresso per trasposizione, con ordine di mosse e possibilità di deviazione dichiarati;
- deviazione o trappola trattata come caso da capire e affrontare, senza suggerire che sia una scelta raccomandata.

Se una voce è dubbia, incoerente o non adeguatamente documentata, resta aperta con motivazione. Non si elimina dal denominatore per poter dichiarare il lavoro completo. Un'eventuale esclusione viene proposta esplicitamente a Carlo.

La copertura P02 riguarda mosse, struttura e contenuti minimi utilizzabili. P03 completerà i commenti di ogni passaggio; P04 migliorerà l'esperienza. L'espansione non deve produrre migliaia di schede sullo stesso piano.

Esclusioni del perimetro: continuazioni non presenti nelle due revisioni fissate, varianti di scacchi diverse dagli scacchi standard, statistica delle frequenze, nuovi criteri Libro e analisi delle partite. Questi elementi non vengono dichiarati risolti dalla copertura del corpus. In futuro il perimetro potrà essere ampliato con fonti e revisioni esplicite.

### Opzione B — Prima fermata alle ancore ECO

La fonte eco.json marca 499 posizioni con `isEcoRoot`, una per codice tranne A00. Nei corsi risultano 291 ancore raggiunte con almeno un ordine delle fonti, 24 solo per trasposizione e 184 assenti. A00 richiede comunque un elenco esplicito delle aperture irregolari, non una radice inventata.

Si può completare questo livello e riesaminare lo sforzo successivo prima delle sottovarianti. È una tappa intermedia utile, **non soddisfa da sola la richiesta di tutte le varianti**. Per esempio, la Caro-Kann non ha ancore ECO assenti, ma conserva molte posizioni e scelte delle fonti ancora non raggiunte.

Raccomandazione: scegliere A come obiettivo, usando le ancore di B come prima tappa misurabile. Non stimare tempi o numero definitivo di lezioni prima della revisione della tassonomia e del primo lotto di contenuti.

## Ordine operativo proposto

| Lotto | Lavoro | Dipendenza e criterio di chiusura |
| --- | --- | --- |
| P02.1 | Correggere la tassonomia di catalogo e corsi; documentare i raggruppamenti | Risolvere prima le collisioni certe; assegnazioni dubbie esplicite, ID e progressi preservati |
| P02.2 | Chiudere gli ingressi e le scelte principali assenti usando le ancore ECO come controllo di ampiezza | Per ciascun ramo, prerequisiti e posizione caratteristica prima dei seguiti; 184 ancore assenti e 24 ingressi per trasposizione da trattare |
| P02.3 | Coprire sistematicamente le sottovarianti delle due fonti | Procedere dal genitore al figlio nel gruppo didattico; registrare ogni target raggiunto e ogni residuo |
| P02.4 | Completare i casi di deviazione, gli ordini alternativi e le voci incerte | Non promuovere una trappola o un nome dubbio a teoria raccomandata; chiudere o motivare ogni voce |
| Chiusura P02 | Ricalcolare la matrice e verificare la destinazione didattica di tutti i target del perimetro | Un semplice prefisso giocabile non basta per dichiarare una variante completa |

Dentro P02.2, partire dalle scelte che aprono rami autonomi nei corsi già presenti: Najdorf con Ag5 e Chekhover nella Siciliana; Semi-Tarrasch nel Gambetto di Donna; nuove scelte del quarto tratto nella Nimzo-Indiana e Grünfeld; ingressi mancanti di Spagnola e Inglese. È una priorità editoriale basata sulle diramazioni osservate, non su una graduatoria statistica.

Le fonti marcano anche ancore profonde e più ancore sullo stesso ramo: non creare una lezione separata per ciascuna. All'interno di ogni famiglia affrontare prima il bivio che rende disponibili le continuazioni successive. Le altre famiglie rimangono nel medesimo inventario e non vengono escluse da questa priorità iniziale.

## Artefatti e verifiche

- [Matrice leggibile, con tutte le 37 famiglie](OPENING-SCOPE-MATRIX.md).
- [Matrice integrale JSON](data/opening-scope-audit.json): tutte le posizioni, nomi, ordini, genitori, stato, motivazione, corsi e diramazioni mancanti.
- [Snapshot Lichess con URL e hash](data/opening-audit-sources/manifest.json).
- [Ancore ECO estratte dalle fonti locali con hash verificati](data/opening-audit-sources/eco-roots.json).
- [Verifica indipendente dal generatore](data/opening-scope-verification.json).

Comandi:

```powershell
node scripts/audit-opening-scope.mjs
node scripts/audit-opening-scope.mjs --check
node scripts/verify-opening-scope-audit.mjs
```

Il generatore rigioca 22.948 archi di un albero di prefissi condivisi. Il verificatore usa un algoritmo diverso: rigioca linearmente 12.723 sequenze distinte, per 149.313 semimosse delle fonti, più le 8.930 dei corsi. Verifica tutte le 12.322 posizioni, 12.631 collegamenti ai genitori, riferimenti ai corsi, stati di copertura e hash. Controlla inoltre che turno, arrocco ed en passant distinguano correttamente le posizioni.

Non sono stati avviati motori, rigenerati benchmark, letti `.env` o modificati dati QA protetti. Nessun nuovo collaudo browser: la fase produce inventari e documentazione, senza modifiche applicative. Non è stata eseguita una revisione scacchistica editoriale individuale di tutte le 12.322 posizioni; i conflitti e le assegnazioni non revisionate restano visibili.

## Fonti e loro limiti

- [Lichess chess-openings, revisione a6189a3](https://github.com/lichess-org/chess-openings/tree/a6189a30dc273ccb21fc2536a9a2fefd5592a67a): sequenze e convenzioni dei nomi, licenza CC0. Il README documenta gli ordini alternativi verso una stessa apertura e la struttura famiglia/variante/sottovariante. La revisione è stata confrontata con il ramo corrente via API il 20 ottobre.
- [eco.json, revisione 36cfd92](https://github.com/JeffML/eco.json/tree/36cfd9227f553dec1d39ee20fa0775eea8f8e165): base già fissata nel progetto, licenza MIT conservata in `src/data/openingBook.LICENSE.txt`. Il README descrive aggregazione, alias e priorità delle fonti. Sono usati i cinque file base, non le interpolazioni aggiuntive.

Una raccolta di nomi e mosse non certifica che una linea sia buona, frequente o completa. Per costruire i contenuti P02 servirà la verifica della singola scelta e, quando necessario, una fonte didattica ulteriore. L'assenza dal corpus non dimostra che una continuazione sia fuori dalla teoria.

## Passaggio al lavoro successivo

Decisione successiva all'audit: Carlo ha confermato esplicitamente il perimetro completo A. Non occorre chiedere di nuovo questa scelta. L'opzione B resta documentata come alternativa originariamente presentata.

**P02.1 — tassonomia e preservazione degli identificatori** è stato completato con GPT-6.1 Sol / High; [risultati e prossimo cambio di modello](OPENING-TAXONOMY.md).

I comandi di audit e verifica riportati sopra descrivono il checkpoint P01 e verificano i suoi input tramite hash. Dopo la correzione P02.1 alcuni sorgenti sono intenzionalmente diversi: conservare la fotografia P01 e usare `report-opening-taxonomy.mjs --check` per verificare la tassonomia corrente.
