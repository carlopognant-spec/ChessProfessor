# ChessReps: baseline locale e roadmap indipendente

**Snapshot:** 2026-11-02 · worktree `work/grande-candidate-20261030`  
**Perimetro:** lettura mirata dei file locali e conteggi da dataset/moduli presenti. Nessuna navigazione di ChessReps, chiamata engine, test o modifica al catalogo.

## Come leggere questo confronto

Le sezioni **Fatto locale** descrivono ciò che esiste nella worktree, con riferimenti `file:line`. Le sezioni **Proposta** sono un piano possibile per ChessProfessor, ricavato dal riuso dei componenti e dei dati presenti. Le evidenze esterne sono documentali, non test interattivi: vedere [REPORT.md](REPORT.md) per stati OD/D/NV e fonti S01–S15. Non viene ricostruita come fatto l’architettura interna di ChessReps.

## Baseline locale verificata

Conteggi letti direttamente dai dati e dai moduli della worktree con un comando Node read-only: **12.377** record nel catalogo ECO, **37** famiglie, **37** percorsi base e **286** percorsi totali distribuiti sulle stesse famiglie. Dei percorsi totali, **194** hanno un campo `expansion` o `provenance`. I record del catalogo hanno ID univoci nel conteggio. Questi numeri descrivono inventario locale, non copertura teorica o completezza editoriale.

| Area | Fatto locale e prova | Limite attuale rilevante | Osservazione ChessReps |
|---|---|---|---|
| Catalogo | `openingCatalog.json` è importato pigramente e indicizza nome, ECO, alias e sequenza; `openingLibrary.js:6-12`; `OpeningLibrary.jsx:17-19, 76-85, 184-192`. La provenienza snapshot e la licenza MIT sono documentate in `src/data/README.md:7-15, 30-35`. | Dataset finito; i record sono linee di consultazione, non un archivio personale modificabile. | OD: schede H/L differenti; S01–S02. |
| Corsi e varianti | `openingJourneys.js:131-139` crea il percorso base per famiglia e unisce moduli di varianti; `OpeningCourses.jsx:11-39` mostra famiglie, ricerca, lunghezza e avvio. | Ogni percorso conserva una sequenza di mosse; inventario numeroso non implica commento individuale uniforme. | OD/D: corsi di autori/livelli e Learn; S01,S04. |
| Partita guidata | La sessione accetta una mossa dell’utente e fa seguire la risposta codificata della linea (`openingLibrary.js:22-33`; `OpeningLibrary.jsx:120-142, 155-167`). Il lato si sceglie all’avvio (`OpeningLibrary.jsx:91-96, 196`). | Una linea didattica non rappresenta tutte le risposte legali. Fuori dai rami noti una mossa legale può essere spiegata come altra linea oppure richiedere un nuovo tentativo: non viene etichettata automaticamente errore scacchistico (`OpeningLibrary.jsx:127-132`). | D: Learn contro bot con consigli; nessun input provato; S04. |
| Commento e provenienza | `journeyCoach` costruisce consiglio e contesto alla posizione, e distingue la risposta dell’avversario (`openingJourneys.js:241-285`). Le note sono riusate solo con sequenza editoriale corrispondente (`openingJourneys.js:231-238`). I moduli documentano fonte, ECO e continuazioni didattiche (`openingChekhoverCourses.js:98-115`; `openingZaitsevCourses.js:29-47`). | I campi di provenienza esistono solo per i corsi che li portano; non sono un contratto uniforme per tutto il catalogo. | D: spiegazioni brevi; contratti di provenienza NV; S04. |
| Bivi e trasposizioni | `openingCurriculum.js:10-20, 44-60` costruisce un trie sulle mosse SAN condivise, mostra bivi e ordina rami; `OpeningBranchPanel.jsx:7-20`. Il Libro separato include posizioni intermedie e riconosce posizioni trasposte (`src/data/README.md:13-16`). | Il trie dei corsi riconosce prefissi SAN, non fonde rami didattici che arrivano alla stessa posizione con ordini diversi. L’indice del Libro non è il grafo narrativo dei corsi. | OD: repertori con trasposizioni descritte; grafo interno NV; S11–S12. |
| Progressi | Preferiti e contatori completamento/clean/ultima attività sono validati e salvati in `localStorage` (`openingLibrary.js:35-48`; `OpeningLibrary.jsx:38-41`). | Nessuna data di scadenza o ripetizione dilazionata nei progressi dei corsi. La sessione curricolare corrente usa stato React (`OpeningLibrary.jsx:35-36`). | D: tracciamento e adattamento; schema e calendario NV; S06. |
| Ripasso | `reviewPractice.js:32-62, 156-182` ricava fino a cinque posizioni con errori da un PGN e dà hint/spiegazione. `reviewPracticeProgress.js:41-59` conserva conteggi per esito e `updatedAt`. | È ripasso della partita analizzata, non un calendario di ripasso delle aperture; non contiene `dueAt` o intervallo di ripetizione. | D: Practice, Drill e SRS; intervalli NV; S02,S04,S06. |
| Repertorio personale | Sono presenti preferiti e import PGN della partita nell’app (`OpeningLibrary.jsx:195`; `App.jsx:102-109, 217-219`). | La ricerca mirata non ha trovato editor/archivio di linee di repertorio personali. Importare una partita non equivale a gestire un repertorio. | D: combinazione linee/creator; import/export e undo NV; S05–S06. |
| Annullamento e accessibilità | La vista di studio ha indietro/avanti e selezione di mossa (`OpeningLibrary.jsx:214-215`); la partita principale ha `UndoButton` per la chat (`UndoButton.jsx:1-9`). Il percorso accetta drag, tocco e SAN (`OpeningLibrary.jsx:155-167, 177`) e usa etichette/stati ARIA in vari controlli (`OpeningLibrary.jsx:184-200, 220-225`). | Non ho trovato un controllo di annullamento dell’ultima mossa nella partita guidata. La presenza di attributi ARIA non è una verifica di accessibilità; non sono stati eseguiti test con tastiera o screen reader. | NV interazioni; App Store non dichiara funzioni accessibili; S06b. |

### Identità delle posizioni

Il catalogo del Libro conserva per ogni semimossa la posizione con turno, arrocco e presa en passant, ignorando i contatori di mossa (`src/data/README.md:13-16`). Il curriculum invece costruisce il trie dalla sequenza SAN (`openingCurriculum.js:10-20`). La proposta seguente mantiene questa distinzione: identità di posizione per riconoscere trasposizioni; archi e percorsi separati per conservare la spiegazione e le scelte editoriali.

## Proposta: estendere il modello esistente

### Modello minimo

Conservare gli attuali oggetti `journey` (`id`, `family`, `moves`, piani e note) come formato pubblicato compatibile. Aggiungere campi facoltativi solo quando una funzione li richiede:

```js
journey = {
  id, family, title, moves, whitePlan, blackPlan,
  provenance: { kind, sourceName, sourceEco, sourceRevision, license, authoredPlies },
  annotations: [{ afterPly, text, author, provenance }],
  routeGraph: { startNodeId, nodes, edges }
}
node = { id, positionKey }
edge = { id, from, to, san, role, coachNoteId, source }
```

Questo è uno schema proposto, non un formato già implementato. Non duplicare subito tutti i 286 percorsi nel nuovo schema: un adattatore può materializzare il trie attuale dalle sequenze esistenti, mentre `routeGraph` viene usato solo dai moduli con trasposizioni esplicite. `positionKey` deve includere pezzi, lato al tratto, diritti d’arrocco e presa en passant; non fondere automaticamente due nodi se serve mantenere contesto di percorso o ripetizione. Le mosse SAN/UCI e lo storico completo restano sugli archi/percorso.

Riutilizzare `OpeningLibrary`, `OpeningCourses`, `OpeningBranchPanel`, `journeyCoach`, `curriculumTree` e `linePositions`. Estrarre solo stato o rendering che renda verificabili navigazione del grafo, annullamento e revisione; niente sostituzione generale della UI o del catalogo.

### Eventi e stato del ripasso

Introdurre eventi locali piccoli e versionati, con campi stabili e senza FEN o PGN duplicati quando bastano gli ID:

```js
{ id, at, type, journeyId, routeId, side, ply, moveUci, outcome, hints }
```

Tipi iniziali: `journey.started`, `move.accepted`, `move.alternative.followed`, `hint.shown`, `route.completed`, `review.rated`. Mantenere i piccoli contatori attuali in `chessprofessor.openings.v1` leggibili; per repertori ed eventi crescenti valutare uno store IndexedDB separato riusando l’esperienza dell’archivio locale. Migrazione con backup, validazione e retention esplicita, mai reset silenzioso. Non introdurre account o sincronizzazione server nella prima fase.

Separare il calendario dal log di eventi, aggiungendo al record di ripasso soltanto i campi necessari:

```js
{ itemId, dueAt, intervalDays, repetitions, lapses, lastGrade, updatedAt }
```

Un primo scheduler locale può offrire `Again / Hard / Good` con intervalli deterministici, data UTC, selezione degli elementi scaduti e pulsante “Ripassa oggi”. Le regole esatte degli intervalli sono decisione prodotto da fissare prima dell’implementazione. La logica resta una funzione pura; nessuna analisi Stockfish è necessaria per ripetere una linea o valutare se una mossa corrisponde al contenuto didattico.

### Contenuti originali e fonte

- Scrivere in proprio piani, domande pre-mossa, risposte dell’avversario e note di debrief; collegare ogni nota al nodo/semimossa e alla linea sulla quale è stata verificata.
- Per materiale importato, conservare riferimento, licenza e perimetro esatto della sequenza documentata. Marcare separatamente le mosse di continuazione didattica; il codice locale già dimostra questa distinzione nei campi `sourceDisclosure` e `endpointReason` (es. `openingChekhoverCourses.js:98-115`).
- Non copiare annotazioni, prosa o partite altrui nel repertorio dell’utente senza diritti e provenienza. Il catalogo ECO ha una licenza MIT già inclusa; ciò non concede automaticamente diritti sulle altre fonti o sui commenti.
- Quando cambia una sequenza, invalidare o richiedere la revisione delle note legate a quella sequenza; `openingWrittenContext` applica già una guardia basata sulla linea (`openingJourneys.js:231-238`).

## Modelli e algoritmi proposti, non implementati

Separare contenuto, appartenenza a un repertorio e memoria del discente:

```js
Repertoire = { id, version, side, title, publishedRefs, personalRoutes, notes, sources }
TrainingItem = { id, contentRevision, routeContextId, positionKey, side, acceptedMovesUci }
ReviewEvent = { id, itemId, contentRevision, atUtc, outcome, assisted, answerUci }
ReviewState = { itemId, schedulerVersion, dueAtUtc, stage, lapses, lastEventId }
```

Questi sono contratti concettuali. `acceptedMovesUci` è l'insieme editoriale approvato
per quella domanda: non l'insieme di tutte le mosse legali, né l'output di una nuova
ricerca automatica. Un'alternativa legale fuori repertorio va distinta da errore
scacchistico; un aiuto o la soluzione non devono produrre successo non assistito.
Il futuro import PGN deve validare SAN/UCI/FEN, gestire promozioni e RAV, limitare
dimensioni/profondità e trattare commenti/HTML come dati non fidati.

Per trasposizioni usare l'indice di posizione per suggerire collegamenti, non per
fondere indiscriminatamente lezioni. Due ordini possono avere stessa posizione ma
piani diversi: conservare `routeContextId`, archi UCI e storia completa. La chiave
include tratto, arrocco ed en passant canonico; i contatori possono essere esclusi
solo dall'indice didattico, non dalla FEN/storia usata per regole o motore. Un grafo
può contenere cicli: applicare limiti di percorso, non assumere che sia un DAG.
Non trasferire automaticamente la padronanza tra ordini differenti.

Scheduler iniziale **P**, da valutare e approvare: funzioni pure su stato+evento+ora,
intervalli espliciti e versionati, nessun requisito di engine. Un esempio di policy
originale è: richiamo pulito porta alle tappe 1/3/7/14/30 giorni; errore/soluzione
richiede richiamo breve e non fa avanzare; aiuto non può aumentare la tappa come
successo pulito. Le cifre sono una proposta prodotto, non un risultato scientifico
calibrato né l'algoritmo di ChessReps. Conservare il log permette di cambiare policy.
Separare scaduti/nuovi/difficili, limitare il carico quotidiano e lasciare sempre
scegliere manualmente una variante. Orari UTC e giorno locale per “oggi”, eventi
idempotenti e test su DST, ripetizioni, import revisionato e dati corrotti.
Una futura alternativa è [TS-FSRS, MIT](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/LICENSE):
valutazione di licenza/versione e dati prima di dipendenze o migrazione; non risulta
verificato che ChessReps usi FSRS. Nessuna installazione in questa fase.

Componenti React proposti: riusare `OpeningLibrary`, `OpeningCourses`,
`OpeningBranchPanel`, `journeyCoach` e scacchiera; aggiungere soltanto dove servono
un pannello scadenze, un editor personale e una vista di confronto delle deviazioni.
L'albero di navigazione non deve ricalcolare legalità, statistiche o tutti i
progressi a ogni render. Validazione all'import/salvataggio e indici memoizzati;
worker solo dopo prova di un costo bloccante, mai per riscrivere quelli esistenti.

## Roadmap proposta

S/M/L sono complessità relative, non preventivi o tempi promessi. L'implementazione
richiede una nuova autorizzazione; non è iniziata.

| Priorità | Proposta / utilità didattica | Complessità e prerequisiti | Rischi | Accettazione minima |
| --- | --- | --- | --- | --- |
| P0 ricerca | Riconciliare 59/63 e delimitare cataloghi prima di dichiarare completezza | S; rilievo manuale consentito o metadati autorizzati, non nuove richieste automatiche al sito | Catalogo indicizzato scambiato per inventario live; community senza limite | Fonte/data/superficie per record e duplicati conservati; nessun riempimento inventato |
| **P1 — primo intervento** | Eventi e coda “Ripassa oggi”: consolidare decisioni delle route esistenti | M; ID stabili, esiti assistiti distinti, backup e policy intervalli | Sovrastima della memoria, quota dati, fusi e doppio invio | Migrazione conserva completamenti/favoriti; dovuti riproducibili; ripresa, DST e corruzione gestiti; scelta manuale sempre disponibile |
| **P2 — secondo intervento** | Repertorio personale minimo: scegliere cosa studiare e annotare idee proprie | M; riuso trie/route, validatore PGN e namespace separato | Perdita dati, contenuti senza diritti, confusione tra privato e pubblicato | Crea/ramifica/rinomina; mosse legali; undo; backup e round-trip conservano commenti propri e provenienza; nessun file congelato riscritto |
| **P3 — terzo intervento** | Collegare preparazione, deviazioni dei PGN personali e piani di mediogioco | M–L; primo repertorio, chiavi posizione e corpus personale autorizzato | Frequenza scambiata per qualità; falsi errori nelle trasposizioni; analisi costosa | Prima deviazione distinta tra scelta utente/avversario; storia preservata; piano e risposta reale spiegati; prove già disponibili riutilizzate |
| P2 trasversale | Annulla/riprendi nei percorsi e accessibilità di base | S–M; punti di ripresa e focus definiti | Undo che lascia risposta avversaria o ramo incoerente | Ripristino atomico al turno utente; mouse/touch/SAN/tastiera equivalenti; feedback annunciato; test su telefono e reader |
| P3 strutturale | Estendere solo i moduli necessari con trasposizioni esplicite | M; trie già presente, contesto e provenance per arco | Fusione di castling/EP/storie differenti e commenti fuori contesto | Due ordini convergono sul nodo senza perdere percorso, autore o spiegazione; cicli limitati; zero variazioni dei corsi congelati |
| P3 contenuti | Micro-lezioni originali: domanda, risposta avversaria e checkpoint strutturale | L sul catalogo, S su un modulo; fonti riutilizzabili e revisione didattica | Annotazioni generiche, copertura gonfiata, selezione copiata da terzi | Una route pilota completa verso il mediogioco, note legate alle mosse reali, registro delle parti teoriche/originali e limiti dichiarati |
| P4 | Tattiche dalle proprie aperture e test di richiamo senza aiuti | M; consenso/dataset e verifica posizione, eventi già presenti | Puzzles fuori contesto, penalità per mossa equivalente, quota engine | Esercizio ricostruibile da FEN/storia e prova; soluzione verificata; nessuna ricerca nuova implicita |
| P4 opzionale | Drill/tempo e obiettivi personali | S–M; rubriche di apprendimento e modalità accessibile | Premiare velocità/fortuna, frustrazione, animazioni invadenti | Modalità senza timer equivalente; errore spiegato; progressi di memoria separati dal punteggio ludico |
| Differire | Classifiche, pubblicazione community e sincronizzazione account | L; auth, consenso, moderazione, conflitti e recupero dati | Privacy, anti-cheat, plagio e debito operativo | Prima specificare autorizzazioni, licenze, policy contenuti e conflitti offline; nessuna necessità per le prime tre priorità |

Fonti per contenuti originali: teoria scacchistica, note scritte autonomamente,
ECO locale nei limiti della sua licenza, e [esportazioni Lichess dichiarate CC0](https://database.lichess.org/).
CC0 delle esportazioni non autorizza automaticamente annotazioni o corsi di terzi.
Le analisi indipendenti eventuali restano attività futura esplicita: nessuna
rivalutazione automatica dei gate congelati o del lavoro SIC-07 sospeso.

## Fuori perimetro e verifiche

Non propongo riscrittura del catalogo, sostituzione dell’app, servizio account/sync o dipendenza esterna. Nessun engine, test, benchmark o audit screen-reader è stato eseguito per questa ricerca. I numeri sopra vengono dal catalogo JSON e dai moduli caricati localmente; il conteggio non misura la profondità né la qualità delle annotazioni.
