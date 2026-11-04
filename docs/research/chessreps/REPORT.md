# ChessReps → ChessProfessor: ricerca documentale

**Data:** 2 novembre 2026. **Stato:** primo blocco documentale consolidato;
**censimento globale e verifica interattiva non conclusi**.
Worktree: `work/grande-candidate-20261030`, HEAD `6004046e4d3b571790270c5dc71da340035959ff`.
Nessuna implementazione, esecuzione motore, modifica ad aperture o prova applicativa.

## Risultato utile

ChessProfessor possiede già catalogo, percorsi guidati giocati dall'utente, consigli
contestuali, risposte avversarie, bivi e ripasso degli errori. Le lacune più utili
da affrontare sono **ripetizione programmata**, **repertori personali versionati**
e **collegamento tra preparazione, deviazioni nelle proprie partite e mediogioco**.
Non conviene riscrivere la biblioteca per imitare un prodotto esterno.

Consegne: [inventario verificabile](CATALOG.md), [confronto locale e roadmap](TECHNICAL-ROADMAP.md),
[stato di ripresa](PROGRESS.json). Questo rapporto separa evidenza e proposta.

## Metodo, autorizzazioni e copertura

Le prime pagine pubbliche sono state restituite dal servizio di ricerca come
rappresentazioni indicizzate. Durante questo passaggio sono stati letti i
[termini del servizio, §6.2](https://www.chessreps.com/terms-and-conditions),
che vietano accesso/raccolta con strumenti automatici e reverse engineering.
Da quel momento non sono stati aperti altri endpoint ChessReps direttamente:
solo ricerca nell'indice pubblico e fonti esterne. Nessun crawler, API privata,
fetch del client, download di corsi/PGN, account, acquisto, paywall, REA o esame
dei bundle. Non vengono archiviati lezioni, annotazioni o sequenze proprietarie.
La trascrizione riguarda nomi, attribuzioni, conteggi e disponibilità dichiarata.

**Legenda:**

- **OD:** osservato documentalmente: testo/numero presente nella fonte indicizzata.
  Non dimostra l'interazione nel browser né un inventario live completo.
- **D:** caratteristica dichiarata dall'operatore; comportamento non provato.
- **T:** testimonianza di terzi; indizio da verificare, non bug accertato.
- **NV:** non verificato; non equivale ad assente.
- **P:** proposta originale per ChessProfessor, non architettura ChessReps.
- **L:** fatto locale verificato staticamente nei file della worktree.

**Nessun comportamento interattivo ChessReps è stato verificato in questa fase.**
La copertura delle pagine indicizzate non deve essere descritta come QA desktop/mobile.

## Censimento: perché 28 non è il totale

| Superficie | Evidenza | Limite |
| --- | --- | --- |
| Homepage | **59 schede trascritte**, 56 titoli esatti distinti; 2.590 linee sommate dalle schede | Non 59 aperture uniche; rappresentazione indicizzata, non conteggio DOM live |
| Osservazione dell'utente | **63 aperture/schede** contate in homepage | Da riconciliare con data, lingua, sessione e card visibili; quattro elementi non identificati |
| `/openings` | **28 corsi, 647 linee**, ripartiti in 16 White e 12 Black | Indice con titoli/conteggi differenti; non prova che gli altri corsi non esistano |
| Community | **8 record campionati**, con autore, linee e coverage score | Non censita integralmente; nessun denominatore globale verificato |
| Piani | Claim **500+ corsi** | Claim commerciale non validato, potenzialmente include community |
| Store/About | Claim **25+ repertori/corsi** | Testi non allineati agli altri cataloghi; non un conteggio aggiornato certificato |

Fonti: [homepage](https://www.chessreps.com/), [indice](https://www.chessreps.com/openings),
[community](https://www.chessreps.com/community), [piani indicizzati](https://www.chessreps.com/plans).
**95 record di superficie sono inventariati, non 95 corsi unici.** Gli alias,
i corsi omonimi e i repertori composti sono conservati separatamente.
Le somme delle linee non misurano posizioni uniche, qualità o copertura di risposte.

Il confronto documenta differenze concrete: French Defense ha due autori con
64/31 linee nella homepage; Trompowsky tre con 32/31/40; Fried Liver è 46 in
homepage/pagina corso indicizzata contro 15 nell'indice. Non si può stabilire dal
solo nome se si tratti di aggiornamento, vecchio percorso, prodotto diverso o errore.
La disponibilità pubblica dei metadati e della CTA non implica accesso integrale gratuito.

## Funzionalità e didattica: matrice di evidenza

| Area | Stato ed evidenza ChessReps | Idea utile / cosa non assumere |
| --- | --- | --- |
| Catalogo/autori | **OD**, schede titolate, linee e autori; homepage e community distinte [S01–S03] | Identità corso distinta da famiglia ECO; filtri autore/colore/livello. Credenziali e qualità non certificate |
| Organizzazione del repertorio | **OD**, pagine indicizzate di repertori composti da 25 e 969 linee [S08–S09] | Un repertorio può attraversare famiglie. Non duplicare automaticamente ogni posizione o chiamarlo singola apertura |
| Apprendimento | **D**, Learn con consigli brevi e insieme di linee adattato alle difficoltà [S04] | Estendere il coach esistente; evitare promessa di comprensione basata soltanto su mosse ricordate |
| Richiamo autonomo | **D**, Practice senza suggerimenti [S04] | Separare risultato assistito e richiamo indipendente |
| Esercizi | **D**, Drill; Time Trials a tempo; Puzzles legati all'apertura [S04] | Modalità autonome con scopi diversi; velocità facoltativa, non criterio unico di padronanza |
| Ripetizione dilazionata | **D**, dichiarata negli store/indice [S02,S06] | Formula, intervalli, stati di memoria e politica di lapse **NV**. Non attribuire FSRS/SM-2 al sito |
| Errori e progressi | **D**, adattamento e tracciamento [S06] | **NV** il trattamento concreto di errore, suggerimento, alternativa legale, ripresa o versione modificata |
| Sblocchi | **OD**, testo indicizzato mostra modalità e soglie 0/3 o 0/2 in pagine corso [S07–S09] | Non sono risultati di una sessione né regole di sblocco provate; non dedurne un algoritmo |
| Arena | **OD**, alcune pagine mostrano contatori, altre Coming soon [S08,S10] | Disponibilità incoerente per corso; funzione effettiva **NV** |
| Repertori personali | **D**, combinazione di linee dichiarata nello store e creator citato nei piani [S05,S06] | Editor, import PGN, undo, versioni ed export **NV**; non dichiarare confermata una particolare modalità d'importazione |
| Varianti | **OD**, esistono corsi Main Lines/Sidelines e livelli Essentials/Mastery [S01] | Utile mostrare prerequisiti e copertura per ramo; nessuna deduzione sul formato interno |
| Trasposizioni | **OD**, testi di corsi citano ordini trasposti [S11–S12] | Fusione automatica nodi, condivisione progressi o deduplicazione **NV** |
| Scacchiera/input | **D**, apprendimento mossa per mossa [S02,S04] | Drag, clic, SAN, sottopromozioni, annullamento e tastiera non provati |
| Desktop/mobile | **D**, store e sincronizzazione multipiattaforma dichiarata [S05–S06] | Layout 1280/390, touch reale, offline, conflitti sync e prestazioni **NV** |
| Motivazione | **D**, classifiche e modalità a tempo [S04] | Valutare obiettivi personali e costanza prima di classifiche globali; no pressione obbligatoria |
| Accessibilità | **OD**, App Store non elenca funzioni di accessibilità dichiarate [S06b] | Non prova inaccessibilità; screen reader, contrasto, focus e reduced motion **NV** |
| Controllo dell'utente | **T**, una recensione chiede selezione esplicita delle sottovarianti [S06b] | Rischio da prevenire: l'adattività non deve bloccare il ramo scelto. Non è un bug replicato |
| Offline/feedback | **T**, recensioni Play segnalano offline e residui grafici [S06] | Testare in proprio ripresa offline e pulizia degli effetti; non attribuire difetti attuali senza riproduzione |

Non emergono prove sufficienti per certificare una particolare infrastruttura,
libreria scacchiera, database, React, worker, API interna o modello di scheduler
di ChessReps. Nessuna di queste architetture viene presentata come scoperta.

## Confronto e scelte per ChessProfessor

Baseline locale verificata: **12.377 record ECO**, **37 famiglie/percorsi base**,
**286 percorsi totali** in questa worktree. Numeri di altri checkout non trasferiti.
Questi inventari non certificano tutte le varianti né tutte le note didattiche.
Il dettaglio con riferimenti `file:line` è nella [roadmap](TECHNICAL-ROADMAP.md).

| Decisione | Capacità | Motivazione |
| --- | --- | --- |
| Mantenere | Lezioni giocate dall'utente, coach legato alla posizione, risposta avversaria, biblioteca, bivi, spiegazioni e distinzione delle fonti | Sono già il nucleo locale; non sostituirli con una nuova architettura |
| Migliorare | Scelta dei rami, ripresa, copertura editoriale, feedback di alternative legali, navigazione trasposizioni | Conservare controllo umano e accuratezza; conta la sequenza effettiva e il piano, non solo il badge completato |
| Aggiungere | Scadenze di ripasso per decisione/linea e statistiche non assistite | Mancano `dueAt` e calendario nelle aperture; il ripasso della partita è un'altra funzione |
| Aggiungere | Repertori personali separati dai corsi pubblicati | Preferiti/import di una partita non equivalgono a editor di repertorio |
| Valutare dopo | Deviazioni delle partite rispetto al repertorio, tattiche e checkpoint di mediogioco | Collega memoria e impiego reale; richiede provenienza e analisi indipendente, non solo frequenza |
| Differire | Classifiche globali, account/sync, grandi pacchetti di nuovi corsi | Non necessari al primo valore didattico; costi, privacy e carico editoriale maggiori |

## Tre prossimi interventi consigliati, ancora da autorizzare per implementazione

1. **Coda di ripasso locale e progressi versionati.** Riutilizzare le route già
   esistenti; registrare errori, aiuti e richiamo pulito separatamente. Nessuna
   esigenza di rifare prima tutta la biblioteca o di cercare con Stockfish.
2. **Repertorio personale minimo.** Scelta colore, rami da contenuti autorizzati,
   note originali, validazione legale e backup. Namespace separato e migrazione
   non distruttiva, senza alterare corsi/lotti congelati.
3. **Preparazione → partita → piano.** Riconoscere deviazioni dai PGN dell'utente,
   mostrare trasposizioni e proporre checkpoint originali verso il mediogioco.
   Riutilizzare prove disponibili; eventuale analisi indipendente futura resta
   esplicita, limitata e distinta da una nuova validazione del corpus.

La roadmap assegna utilità, complessità, prerequisiti, rischi e accettazione anche
alle idee secondarie. È progettazione autonoma, non un piano per clonare i corsi.

## Contenuti originali: pipeline proposta

1. Definire destinatario, colore, struttura finale e piani di entrambi i lati.
2. Selezionare teoria generale e sole fonti riutilizzabili, con licenza per file,
   URL/revisione e perimetro delle mosse. Il dataset ECO locale non autorizza altri testi.
3. Per frequenze usare, se opportuno, esportazioni Lichess: la pagina ufficiale
   le dichiara CC0 [S13]. Conservare campione, periodo, cadenza, fascia e denominatore;
   popolarità non equivale a correttezza. Non estendere CC0 ai commenti di qualunque study.
4. Scrivere autonomamente consigli pre-mossa, conseguenze dell'errore e spiegazioni
   della risposta avversaria. Non ricostruire la selezione editoriale dei corsi ChessReps.
5. Progettare rami e trasposizioni con provenienza; varianti aggiunte e mosse teoriche
   devono avere stato distinto. Revisionare legalità e aderenza dei commenti alla posizione.
6. Prevedere analisi indipendenti e revisione didattica solo in una fase successiva
   autorizzata, senza riaprire automaticamente gate o cambiare file protetti.

Per uno scheduler più evoluto esiste un'implementazione aperta TS-FSRS con licenza
MIT [S14]. Valutarla in seguito con versione e obblighi di attribuzione; nessuna
dipendenza installata e nessuna ipotesi che ChessReps la usi.

## Fonti e registro di ripresa

Fonti consultate il 2 novembre 2026 tramite testo indicizzato; le date di crawl
variano e non rappresentano uno snapshot atomico del sito.

| ID | Fonte | Uso |
| --- | --- | --- |
| S01 | [Homepage](https://www.chessreps.com/) | Metadati H01–H59; nessuna descrizione didattica riprodotta |
| S02 | [Chess Openings](https://www.chessreps.com/openings) | Metadati L01–L28, categorie e totale dichiarato |
| S03 | [Community](https://www.chessreps.com/community) | Solo campione C01–C08; formula coverage ignota |
| S04 | [About](https://www.chessreps.com/about) | Dichiarazioni sui metodi e modalità |
| S05 | [Plans](https://www.chessreps.com/plans) | Creator, sync e claim 500+; nessun acquisto o verifica prezzo |
| S06 | [Google Play, com.chessreps.app](https://play.google.com/store/apps/details?id=com.chessreps.app&hl=en_US) | Dichiarazioni sviluppatore e testimonianze separate |
| S06b | [App Store, 6744000612](https://apps.apple.com/us/app/chessreps-master-openings/id6744000612) | Identità CHESSREPS LLC, accessibilità non dichiarata, recensioni |
| S07 | [Fried Liver](https://www.chessreps.com/opening/fried-liver-attack) | Testo indicizzato 0/46 e modalità; nessuna lezione percorsa |
| S08 | [Repertorio bianco composto](https://www.chessreps.com/opening/complete-white-opening-repertoire-owvlix4) | Denominatore 969 e Arena; non inventariato tra i 95 |
| S09 | [Positional Black Repertoire](https://www.chessreps.com/opening/positional-black-repertoire-mv1x9ka) | Denominatore 25, esempio multidifesa |
| S10 | [Jobava/KID/Grünfeld](https://www.chessreps.com/opening/jobava-london-kings-indian-defense-and-grunfeld-responses-25mtov0) | Modalità non uniformi; Puzzles Coming soon |
| S11 | [English](https://www.chessreps.com/opening/english) | Trasposizioni descritte, non implementazione verificata |
| S12 | [Profilo Hermzy](https://www.chessreps.com/player/Hermzy) | Esempio di autore e repertori che attraversano aperture |
| S13 | [Database Lichess](https://database.lichess.org/) | Esportazioni dichiarate CC0 |
| S14 | [TS-FSRS: licenza](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/LICENSE) | Opzione tecnica aperta, non attribuita a ChessReps |
| S15 | [Terms of Service](https://www.chessreps.com/terms-and-conditions) | Limite di metodo, §6.2; aggiornamento indicato 18 dicembre 2025 |

Omonimie escluse: l'app del 2020 di Shawn Tobin e `chessreps.io`/Joseph Warner
non sono attribuite a questo prodotto. L'identità usata qui è Chessreps, LLC,
dominio `.com` e applicazione `com.chessreps.app`/App Store 6744000612.

### Stato e prossimo blocco

- Fase 1 parziale: 95 record di superficie, conteggi locali controllati; community
  non completa e 59/63 irrisolto. Non basta la quantità di risultati di una ricerca.
- Fase 2 documentale: matrice compilata; interazioni, SRS effettivo, creator,
  accessibilità, mobile/offline e progressi di un account non provati.
- Fasi 3–4: proposta indipendente e confronto statico salvati, senza implementazione.
- Prossimo blocco possibile senza nuova raccolta: revisione progettuale delle tre
  priorità sui file già elencati. Per colmare le prove sul prodotto serve un
  rilievo manuale consentito dall'operatore o suoi metadati/documentazione autorizzati.
  Il solo accesso pubblico non autorizza un bot; l'accesso a un account non risolve
  da solo questo limite. Nessun aggiramento dei termini proposto.

Per riprendere leggere `PROGRESS.json`, poi soltanto il documento pertinente.
Non ricominciare da zero, non ricontare tutte le pagine e non modificare i lotti
di apertura per far coincidere numeri o categorie tra piattaforme diverse.
