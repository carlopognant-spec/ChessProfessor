# Espansione della biblioteca: ricerca e proposta

Verifica del 19 ottobre 2026. Questo documento descrive la ricerca e il progetto;
non dichiara implementati nuovi percorsi o importate nuove fonti.

## Copertura effettiva del checkout

Conteggio eseguito su `openingCatalog.json` e `ALL_OPENING_JOURNEYS`:

| Materiale | Quantità |
| --- | ---: |
| Sequenze SAN distinte nel catalogo | 12.377 |
| Nomi distinti nel catalogo | 10.978 |
| Famiglie nella selezione dei corsi | 37 |
| Percorsi guidati, incluse le varianti | 84 |
| Percorsi guidati di Est-Indiana | 2 |
| Voci il cui nome indica King's Indian Defense/Defence | 117 |

Gli ultimi due conteggi misurano cose diverse. Le 117 voci non sono 117 lezioni
commentate. I due percorsi disponibili sono «Est-Indiana con centro chiuso» e
«Sistema Sämisch». La maggior parte delle altre famiglie ha anch'essa soltanto
due percorsi. Siciliana, Francese, Caro-Kann e Gambetto di Donna ne hanno quattro;
Italiana e Spagnola tre.

Il collo di bottiglia è la copertura didattica dei rami, non solo la dimensione
del file delle aperture. Anche i percorsi aggiuntivi attuali non hanno tutti un
testo scritto individualmente per ogni posizione: alcune spiegazioni derivano
dai fatti della scacchiera e dai piani del percorso.

## Fonti confrontate

### eco.json: conservare il catalogo esistente

[JeffML/eco.json](https://github.com/JeffML/eco.json) fornisce nomi, codici,
sequenze e collegamenti fra posizioni. È già la fonte del catalogo locale,
alla revisione `36cfd9227f553dec1d39ee20fa0775eea8f8e165`.
Non contiene un corso italiano completo per ogni record. Cambiare libreria
senza aggiungere contenuti didattici lascerebbe intatto il problema dei corsi.

### Lichess chess-openings: integrazione e controllo dei nomi

[Repository ufficiale](https://github.com/lichess-org/chess-openings), CC0.
Scaricati e letti i cinque TSV alla revisione
`a6189a30dc273ccb21fc2536a9a2fefd5592a67a`.
Ogni PGN è stato rigiocato con la dipendenza locale `chess.js` e confrontato
con la sequenza SAN completa dei record locali.

| Risultato | Quantità |
| --- | ---: |
| Record Lichess validati | 3.865 |
| Sequenze Lichess distinte | 3.865 |
| Sequenze assenti dal catalogo locale | 346 |
| Di queste, con nome King's Indian Defense/Defence | 11 |
| Unione delle sequenze delle due fonti | 12.723 |

Il confronto è per ordine esatto delle mosse: una sequenza aggiuntiva può
trasporre in una posizione già conosciuta. Non sono 346 nuove strutture né
346 corsi. Un'importazione futura deve conservare gli ID locali e tracciare
fonte, revisione e licenza dei nuovi record, senza cambiare il Libro usato
nell'analisi delle partite.

### Partite ed esercizi Lichess: il contributo pratico

[Database ufficiale](https://database.lichess.org/), esportazioni CC0:
partite reali ed esercizi con posizione, soluzione, difficoltà e temi.
Gli esercizi hanno `OpeningTags` quando iniziano prima della mossa 20.
La pagina consultata elenca 6.157.341 esercizi complessivi: questo non è
il numero di esercizi di apertura, né quello disponibile per ciascuna variante.

Questa fonte permette di selezionare esempi di pezzi indifesi, forchette,
inchiodature, attacchi al re e rotture centrali realmente comparsi nelle partite.
I tag dell'apertura non bastano a dimostrare che una tattica sia tipica della
variante: occorre verificare posizione, storia della partita e tema.

[Opening Explorer ufficiale](https://github.com/lichess-org/lila-openingexplorer)
è una fonte complementare per le risposte giocate nelle partite.
La frequenza serve a scegliere cosa esercitare, non a stabilire se una mossa
sia corretta. L'Elo del giocatore e la difficoltà di un esercizio sono misure
diverse; le fasce di piattaforme diverse non vanno equiparate automaticamente.

### PGN Mentor: partite modello per variante

[Raccolta ufficiale](https://www.pgnmentor.com/files.html): file separati per
molte aperture e varianti. Per l'Est-Indiana include Averbakh, Fianchetto,
Quattro Pedoni, Sämisch, Classica e Petrosian, oltre ad altre diramazioni.
È utile per cercare partite modello complete. La disponibilità al download
non è stata trattata come una licenza di redistribuzione nell'app; la proposta
di integrazione dei dati si basa sulle fonti CC0 documentate sopra.

## Struttura didattica proposta per tutte le aperture

La selezione deve mostrare prima le basi, poi sistemi e varianti raggruppati,
poi sottovarianti ed esercizi. Non una griglia con migliaia di schede sullo
stesso piano. I raggruppamenti devono tenere conto anche delle posizioni e
delle trasposizioni; un nome alternativo non crea da solo una nuova lezione.

Ogni ramo deve avere:

1. Una posizione riconoscibile e le scelte che la distinguono dai rami vicini.
2. Piani di entrambi i colori, case importanti e rotture di pedone.
3. Bivi giocabili: che cosa cambia se l'avversario sceglie un'altra risposta.
4. Una continuazione commentata fino a una posizione significativa di
   mediogioco. La lunghezza dipende dall'idea, senza allungare le linee a forza.
5. Esempi di deviazioni pratiche, con spiegazione dell'eventuale difetto.
6. Esercizi sulle opportunità e sulle difese, comprese le difese alle trappole.

Per ogni decisione dell'allievo: descrivere il cambiamento prodotto dall'ultima
mossa avversaria, porre un problema strategico o tattico e chiedere di giocare.
Il pezzo e la casa di destinazione restano negli aiuti facoltativi. Dopo la
risposta, spiegare perché l'idea funziona e quale replica richiede attenzione.

Il controllo attuale della mossa attesa non basta per un allenamento aperto.
Una risposta diversa può essere un'altra variante valida; deve consentire di
cambiare ramo. Le continuazioni non ancora coperte vanno riconosciute come tali.
Una mossa non presente nel corso non va chiamata errore. Le lezioni su errori
concreti devono avere una confutazione verificata, considerando anche le difese
avversarie, non soltanto una sequenza cooperativa.

## Est-Indiana: prima mappa da coprire

I nomi e le sequenze di ingresso sono riscontrabili nel
[volume E della fonte Lichess](https://github.com/lichess-org/chess-openings/blob/a6189a30dc273ccb21fc2536a9a2fefd5592a67a/e.tsv).
Questi sono capitoli proposti, non corsi già aggiunti:

- Classica, con rami distinti per sistema classico e attacco di baionetta.
- Sämisch, distinguendo le risposte centrali e le formazioni Panno.
- Fianchetto, con i diversi impianti del Nero.
- Attacco dei Quattro Pedoni.
- Averbakh.
- Makogonov.
- Petrosian.
- Sistema Gligoric-Taimanov.
- Variante di cambio.
- Sistemi con sviluppo e3, per affrontare anche un centro diverso da e4-d4.

Non tutte queste scelte sono sullo stesso livello dell'albero: alcune sono
sistemi iniziali, altre diramazioni della Classica. La navigazione deve
rendere visibile questa relazione.

## Ampiezza e criteri di completamento

Obiettivo iniziale proposto: 250–400 moduli didattici complessivi, da misurare
come contenuti effettivamente giocabili e commentati. Non è una stima dei
contenuti già disponibili nelle fonti, né un requisito di dieci varianti per
ogni apertura. Le famiglie ampie richiedono più capitoli di quelle piccole.

Estendere lo stesso lavoro a Siciliana, Spagnola, Italiana, Francese,
Caro-Kann, Gambetto di Donna/Slava/Semislava, alle altre difese indiane,
Inglese/Réti e poi alle famiglie rimanenti. Separare progressivamente le
famiglie oggi accorpate quando hanno strutture e scelte autonome, ad esempio
Pirc/Moderna e Benoni/Benko. Questi sono raggruppamenti di progetto, non nuovi
conteggi certificati.

Per ogni rilascio pubblicare separatamente: sequenze consultabili, sistemi
distinti, percorsi commentati, bivi coperti, esercizi verificati e lacune.
Prima dell'inserimento verificare legalità di tutte le mosse, identità delle
posizioni, correttezza dei riferimenti ai pezzi, continuità del ramo e
soluzioni degli esercizi. Non considerare completata una variante soltanto
perché esistono il suo nome e una sequenza PGN.
