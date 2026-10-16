# ChessProfessor — studio di aperture e partite

App web di studio delle aperture e delle partite con chatbot esplicativo,
scacchiera interattiva, motore Stockfish lato client, database Lichess,
analisi automatica e classificazione delle semimosse.

Stato del lavoro e limiti attuali: [handoff del 9 ottobre](HANDOFF-2026-10-09.md).

Classificatore speciale corrente: **counterfactual-v24**. Sul campione di
sviluppo riconosce 32/34 Grandi e 4/4 Geniali, senza false attribuzioni di
queste categorie rispetto ai riferimenti storici registrati. Questi numeri
non misurano una corrispondenza verificata con la Game Review: Carlo ha
ricontrollato 14...c6 e non risulta Grande; la categoria precisa non e stata
comunicata. 38...Ne4 resta da verificare. I vecchi riferimenti sono conservati
per tracciabilita, senza usarli per forzare nuove regole.
Il profilo piu completo include le verifiche facoltative.
[Confronto automatico e casi aperti](agent-output/review-automation/latest.md).
Eseguire `npm run review:auto` per aggiornare il rapporto usando le prove
salvate. [Uso e limiti](scripts/qa/REVIEW-AUTOMATION.md).
[Dati versionati e output locali](docs/DEVELOPMENT-EVIDENCE.md).

## Setup locale

Da PowerShell, nella cartella del progetto:

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Configura nel tuo .env il provider LLM, la sua chiave e il token Lichess.
npm test
npm run dev
```

Apri l'indirizzo mostrato da Vite, normalmente
`http://localhost:5173/ChessProfessor/`. Dopo modifiche a `.env`, riavvia Vite.

## Come funziona

- **Scacchiera**: react-chessboard + chess.js. Trascina i pezzi per giocare una mossa.
- **Aperture**: il pannello interroga la Opening Explorer API di Lichess
  per nome ECO e statistiche, indipendentemente dall'analisi Stockfish. Riusa le
  ultime 100 richieste, incluse quelle ancora in corso, durante la navigazione.
  La verifica runtime del 2026-10-01 ha restituito `401
  Unauthorized` sia senza token sia con un token invalido: `VITE_LICHESS_TOKEN` è
  quindi richiesto e viene inviato come Bearer token. Errori 401, rate limit e
  posizioni senza partite vengono mostrati senza alterare la posizione corrente.
- **Motore**: premi **Avvia analisi** per caricare Stockfish 19.0.0, build
  `large-single`, in un Web Worker. La prima analisi scarica circa 100 MB;
  il browser conserva gli asset nella cache se disponibile. Il plugin
  `scripts/stockfish-assets.js` serve e include nella build gli asset del pacchetto
  npm, con nomi `stockfish-19.0.0-single.js` e `.wasm`. Ogni ricerca usa un budget
  nominale di **200.000 nodi**, **MultiPV 5**, un thread e Hash 16 MB;
  `ucinewgame` e `Clear Hash` precedono ogni ricerca. Non usa una profondità fissa
  né un fallback a depth 8. Il motore calcola valutazioni e varianti, senza testo.
- **Analisi partita**: dopo l'avvio, analizza le semimosse giocate o importate,
  mostra il progresso e riusa dati della posizione e della mossa con una chiave
  che include la configurazione di analisi. Navigare cambia la posizione mostrata
  senza riavviare l'analisi o svuotare i risultati. La posizione dopo una mossa
  viene riusata prima della successiva con lo stesso profilo: una partita di N
  semimosse richiede normalmente N+1 ricerche anziché 2N. La cronologia SAN viene
  conservata durante il passaggio sequenziale. L'analisi nell'app non attende
  l'Explorer; Libro continua a dipendere dal repertorio locale.
  Una sola cache di sessione conserva i risultati senza scadenza temporale,
  fino al reset o all'evizione della voce più vecchia, con limite di 250 voci.
  Aggiornare una voce esistente non ne elimina un'altra. Se un chiamante inietta
  una cache personalizzata in `createGameAnalysisSession`, quella cache è
  l'unica fonte dei valori e mantiene la propria eventuale politica di scadenza;
  deve fornire `get`, `set`, `delete` e `clear`. L'indice delle chiavi della
  sessione serve soltanto a gestire il limite e l'ordine di evizione.
- **Classificazione**: l'app assegna Libro dal repertorio locale, Migliore, Ottima,
  Buona, Imprecisione, Errore, Errore grave e Mossa mancata. Senza valutazioni
  sufficienti mostra Non valutabile. Le categorie **Grande e Geniale** sono
  disponibili con l'opzione **Mostra Grande e Geniale sperimentali** nel pannello
  analisi, attiva inizialmente e disattivabile. La qualità numerica resta conservata e
  i candidati non confermati riportano il motivo dell'incertezza. Il criterio
  è in `src/lib/specialClassification.js`; i confronti dichiarano se coprono
  tutte le mosse legali o soltanto le alternative analizzate. Grande include
  anche la famiglia empirica già verificata delle risposte migliori senza
  presa dopo un errore avversario; questa non prova l'unicità della scelta.
    Con prove complete, questa famiglia richiede anche uno scacco, una minaccia
    legale di matto o una nuova minaccia materiale. Un attacco a un pezzo difeso
    di pari valore non basta. I criteri separati di difesa decisiva restano attivi.
    Il contesto usa le valutazioni selezionate dal confronto numerico, evitando
    di mescolarle con iterazioni parziali successive.
    Questa famiglia conserva la categoria numerica quando uno snapshot completo,
    coerente e senza matto documenta un'alternativa entro la soglia Ottima già
    prevista. Il resoconto mostra l'alternativa; prove incomplete o ricerche
    limitate a mosse specifiche non bastano per questo confronto.
  Una ripresa immediata di materiale uguale o superiore sulla stessa casa,
  fuori scacco, conserva la categoria numerica: l'aumento della valutazione
  non basta a promuoverla a Grande. I casi sotto scacco mantengono il controllo
  precedente sulle risorse difensive.
    Nel resoconto, alternative con identico punteggio in uno snapshot completo
    possono essere entrambe Migliore; lo stesso vale per distanze di matto
    identiche in un confronto coerente. La prima variante del motore resta
    indicata dalla freccia e una parità non prova da sola una mossa Grande.
    Anche l'incasso dopo un attacco scoperto alla donna viene distinto da una
    nuova scelta decisiva: il controllo richiede una sequenza coerente, attacchi
    legali e l'assenza di un nuovo grande salto di valutazione. Non basta la
    sola geometria della posizione.
  Per Geniale, un recupero materiale solo legalmente possibile viene
  confrontato con le valutazioni della posizione dopo l'accettazione del
  sacrificio. Il controllo può superarlo quando la compensazione è
  corroborata e uno snapshot completo mostra tutti quei recuperi come
  sfavorevoli. Dati incompleti mantengono il candidato provvisorio;
  la variante della presa deve essere disponibile separatamente.
  Le opportunità vincenti da un vantaggio intermedio richiedono un confronto
  completo sulla risposta e conferme concordi della posizione. Una precedente
  valutazione separata richiede anche una prima scelta stabile e uno snapshot
  completo valido. Il matto perso può essere recuperato dalla variante completa
  della precedente mossa avversaria, con FEN e continuazione verificate.
  La storia delle tre mosse distingue inoltre una nuova occasione da un
  vantaggio già proprio, perso per un Errore grave e restituito dall'avversario:
  con prove concordi conserva Errore grave. Le occasioni di matto e le Mosse
  mancate consecutive mantengono i rispettivi controlli.
  Per Geniale, una
  variante vincente che lascia soltanto offerte già legalmente disponibili
  non dimostra la necessità di un nuovo sacrificio.
  Le soglie numeriche e la politica originaria Mossa mancata sono in
  `src/lib/engineConfig.js`; non riproducono il modello privato di Chess.com.
  `src/lib/moveOpportunities.js` riconosce inoltre la rinuncia a una variante
  di matto completa indicata dal motore e verificata legalmente, anche se la
  posizione rimane materialmente vincente. Le etichette vengono ricalcolate
  anche aprendo le analisi salvate, usando i risultati motore già disponibili.
  Il criterio nuovo valuta anche un'occasione vincente creata dalla scelta
  avversaria senza richiedere che questa riceva prima Errore/Errore grave.
  Il worker conserva separatamente l'ultima iterazione MultiPV completa per
  confrontare alternative coerenti, senza ulteriori ricerche.
  Conserva l'ultima iterazione completa per ogni prima scelta, così un cambio
  temporaneo di PV1 non elimina quella coerente con il bestmove finale.
  Anche il confronto numerico usa quell'iterazione quando valida, mantenendo
  migliore e giocata alla stessa profondità. Le analisi separate vengono
  indicate come valutazioni indicative; le perdite grezze negative come
  valutazioni discordanti. **Forzata** identifica una sola mossa legale e
  conserva la categoria numerica. Per Libro il resoconto mostra separatamente
  la presenza nel repertorio e la valutazione numerica. Curva, soglie e rating
  restano invariati; il percorso corrente è `src/lib/reviewEvaluation.js`.
- **Resoconto**: la tabella separa i conteggi Bianco/Nero e le righe selezionabili
  riportano alla posizione precedente alla semimossa.
- **Approfondimento facoltativo**: dopo l'analisi completa premi
  **Approfondisci le mosse dubbie**. Ogni richiesta considera fino a 12 mosse
  con valutazioni indicative, candidati non confermati o perdite vicine a un
  cambio categoria. Dà precedenza ai sacrifici da verificare e agli altri
  candidati speciali, poi ai confronti ordinari, per raggiungere anche le
  occasioni nelle fasi successive della partita.
  Usa un milione di nodi per posizione e riusa i risultati
  disponibili. Aggiunge fino a quattro verifiche di accettazione dei sacrifici:
  ciascuna ricerca mirata usa 200.000 nodi e, quando manca, una ricerca della
  posizione dopo la presa usa altri 200.000 nodi. Le prove restano separate dalle
  valutazioni generali; una ripresa riusa quelle già completate, dando priorità
  alle conferme approfondite valide anche quando si riapre o risalva una partita.
    Se uno snapshot approfondito completo è meno profondo di quello iniziale
    e contiene la mossa giocata, il confronto iniziale coerente viene conservato.
    Il resoconto segnala la scelta; entrambe le analisi grezze restano salvate.
  Le accettazioni
  vengono scelte prima della richiesta; candidati emersi con l'approfondimento
  possono essere verificati con una richiesta successiva.
  Puoi interromperla e confrontare categoria e punteggio iniziali
  con quelli approfonditi tramite **Mostra analisi approfondita**.
  **Salva partita e analisi** conserva entrambe le versioni, riapribili offline
  senza nuove ricerche. Un cambiamento di etichetta non garantisce maggiore
  concordanza con Chess.com; soglie, rating e analisi iniziale restano invariati.
  Dopo un approfondimento, **Verifica le Grandi** controlla le attribuzioni
  sperimentali basate sulla migliore risposta dopo un errore. Completa le prove
  mancanti e riusa quelle salvate; una coppia già approfondita non viene ripetuta.
  Il comando ha gli stessi limiti per richiesta e conserva il piano normale.
  **Verifica i sacrifici** controlla separatamente accettazioni e riprese
  immediate del materiale: fino a quattro offerte e quattro riprese per
  richiesta, riutilizzando le prove disponibili. Conserva i punteggi ordinari
  e i risultati parziali; una ricerca completata senza confronto conclusivo
  resta non confermata e non viene ripetuta automaticamente.
  **Verifica le scelte decisive** raccoglie prove separate sulla mossa e
  sulle alternative, fino a 12 mosse e 24 posizioni per richiesta. Una
  richiesta successiva controlla le alternative emerse dalle prime ricerche.
  Conserva i punteggi iniziali e riusa le verifiche gia disponibili anche offline.
- **Precisione**: il resoconto include un valore 0–100 per lato con formula pubblica
  Lichess. È un calcolo distinto dalla classificazione delle mosse; dati mancanti
  o analisi incompleta sono segnalati come parziali.
- **Archivio**: salva PGN e analisi in IndexedDB, nello stesso browser e dispositivo.
  Le analisi incompatibili con la configurazione corrente sono indicate come
  obsolete. Puoi esportare i PGN; non c'è sincronizzazione tra dispositivi.
- **Editor posizione**: la palette modifica le case, mentre lato al tratto, arrocco,
  en passant e FEN possono essere importati o esportati. Le posizioni non valide
  vengono rifiutate prima di alimentare motore e chatbot.
- **Chatbot**: apri **Strumenti → Chatbot** e fai una domanda. La domanda viene inviata,
  insieme a FEN corrente e dati verificati, al provider LLM scelto (Groq o Gemini,
  vedi `.env`). Le chiamate vengono effettuate solo per errori, mosse mancate e
  prima deviazione dal libro. Il modello risponde con una spiegazione e, se la
  domanda implica una mossa, la scacchiera la valida con `chess.js` prima di applicarla.
- **Torna indietro**: ogni mossa applicata dalla chat salva uno snapshot prima di
  eseguirla; il pulsante "Torna indietro" ripristina l'ultimo snapshot.

## Cambiare provider LLM

Modifica `VITE_LLM_PROVIDER` in `.env` con `groq` o `gemini`. Nessun'altra modifica
al codice è necessaria: il dispatcher in `src/lib/llm/index.js` sceglie il provider
corretto a runtime.

## Test

Vitest esegue `tests/**/*.test.js` in ambiente Node. I test degli esperimenti
in `scripts/*.test.js` usano il runner Node separato. Per verificare test e build
senza caricare il file `.env`:

```powershell
npm test -- --config scripts/qa-no-env-test.config.js --cache false
$researchTests = @(Get-ChildItem scripts -Filter '*.test.js' | ForEach-Object { $_.FullName })
node --test @researchTests
npm run build -- --config scripts/qa-no-env-build.config.js
```

`npm run test:browser` usa Playwright ed è separato: alcune prove avviano
Stockfish reale. Non è necessario per eseguire i test unitari sopra.
La configurazione corrente è in `src/lib/engineConfig.js`; il QA storico a
depth 12 e i rilevatori sperimentali sono descritti in `scripts/qa/README.md`.

Per usare l'Opening Explorer, crea un token OAuth su
`lichess.org/account/oauth/token` e valorizza `VITE_LICHESS_TOKEN` nel file `.env`.
Il token non deve essere committato. Senza token l'endpoint risponde `401 Unauthorized`.

## Deploy su GitHub Pages

1. In `vite.config.js`, imposta `base` col nome esatto del tuo repository
   (es. `/chess-study-app/`).
2. Nelle impostazioni del repo GitHub: **Settings → Pages → Source → GitHub Actions**.
3. Push su `main`: il workflow in `.github/workflows/deploy.yml` esegue i test
   unitari, poi builda e pubblica automaticamente.

⚠️ **Attenzione chiavi API**: questa è un'app statica. Le variabili `VITE_*` finiscono
nel bundle JS pubblico e sono estraibili da chiunque visiti il sito pubblicato. Va bene
per sviluppo locale o uso strettamente personale. Per un deploy pubblico, servirà un
piccolo proxy serverless (es. Cloudflare Workers, gratuito) che tenga la chiave lato
server e nasconda la chiamata diretta al provider LLM.

## Limiti attuali

- Moduli finali di partita (alfiere, torre, pedone passato) — fase successiva.
- Grande e Geniale rimangono sperimentali: i dati già studiati non sono una
  validazione indipendente e non garantiscono corrispondenza con Chess.com.
- Autenticazione utente, archivio su server e sincronizzazione tra dispositivi.
- Proxy serverless per nascondere le chiavi: escluso dal percorso principale; richiesto
  solo per una pubblicazione online con segreti non esposti nel bundle.
