# ChessProfessor — studio di aperture e partite

App web di studio delle aperture e delle partite con chatbot esplicativo,
scacchiera interattiva, motore Stockfish lato client, database Lichess,
analisi automatica e classificazione delle semimosse.

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
- **Aperture**: ad ogni posizione, l'app interroga la Opening Explorer API di Lichess
  per nome ECO e statistiche. La verifica runtime del 2026-10-01 ha restituito `401
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
  che include la configurazione di analisi. Le richieste Explorer dell'analisi si
  interrompono sotto `15` partite complessive; questa soglia non assegna Libro.
- **Classificazione**: l'app assegna Libro dal repertorio locale, Migliore, Ottima,
  Buona, Imprecisione, Errore, Errore grave e Mossa mancata. Senza valutazioni
  sufficienti mostra Non valutabile. Le categorie **Grande e Geniale** sono
  presenti nel resoconto, ma i loro rilevatori sono sperimentali e non attivati
  nell'app. Le soglie e la politica Mossa mancata sono in
  `src/lib/engineConfig.js`; non riproducono il modello privato di Chess.com.
- **Resoconto**: la tabella separa i conteggi Bianco/Nero e le righe selezionabili
  riportano alla posizione precedente alla semimossa.
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
