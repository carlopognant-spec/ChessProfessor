# Chess Study App — MVP Aperture

App web di studio delle aperture e delle partite con chatbot esplicativo,
scacchiera interattiva, motore Stockfish lato client, database Lichess,
analisi automatica e classificazione delle semimosse.

## Setup locale

```bash
npm install
cp .env.example .env
# apri .env e inserisci le chiavi LLM e VITE_LLM_PROVIDER
npm test
npm run dev
```

## Come funziona

- **Scacchiera**: react-chessboard + chess.js. Trascina i pezzi per giocare una mossa.
- **Aperture**: ad ogni posizione, l'app interroga la Opening Explorer API di Lichess
  per nome ECO e statistiche. La verifica runtime del 2026-10-01 ha restituito `401
  Unauthorized` sia senza token sia con un token invalido: `VITE_LICHESS_TOKEN` è
  quindi richiesto e viene inviato come Bearer token. Errori 401, rate limit e
  posizioni senza partite vengono mostrati senza alterare la posizione corrente.
- **Motore**: Stockfish gira in un Web Worker nel browser (caricato da CDN via
  `importScripts`, nessun binario da gestire nel repo). Analizza a profondità 12,
  MultiPV 2 e restituisce le linee principali; la profondità di fallback configurata
  è 8. Calcola SOLO eval e mosse candidate — non genera testo.
- **Analisi partita**: dopo le mosse giocate o l'importazione PGN, analizza le
  semimosse, riusa la cache per FEN, mostra il progresso e interrompe l'Explorer alla
  prima posizione sotto soglia (`15` partite complessive per default).
- **Classificazione**: ogni semimossa può essere classificata come Libro, Geniale,
  Grande, Migliore, Ottima, Buona, Imprecisione, Errore, Errore grave o Mossa mancata.
  Le soglie sono centralizzate in `src/lib/engineConfig.js`.
- **Resoconto**: la tabella separa i conteggi Bianco/Nero e le righe selezionabili
  riportano alla posizione precedente alla semimossa.
- **Editor posizione**: la palette modifica le case, mentre lato al tratto, arrocco,
  en passant e FEN possono essere importati o esportati. Le posizioni non valide
  vengono rifiutate prima di alimentare motore e chatbot.
- **Chatbot**: fai una domanda nel pannello a destra. La domanda viene inviata,
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

Vitest è configurato con ambiente Node. Esegui `npm test` per lanciare i test
automatici; il test iniziale verifica che l'infrastruttura carichi `chess.js` e
validi una sequenza di apertura nota.

Per usare l'Opening Explorer, crea un token OAuth su
`lichess.org/account/oauth/token` e valorizza `VITE_LICHESS_TOKEN` nel file `.env`.
Il token non deve essere committato. Senza token l'endpoint risponde `401 Unauthorized`.

## Deploy su GitHub Pages

1. In `vite.config.js`, imposta `base` col nome esatto del tuo repository
   (es. `/chess-study-app/`).
2. Nelle impostazioni del repo GitHub: **Settings → Pages → Source → GitHub Actions**.
3. Push su `main`: il workflow in `.github/workflows/deploy.yml` builda e pubblica
   automaticamente.

⚠️ **Attenzione chiavi API**: questa è un'app statica. Le variabili `VITE_*` finiscono
nel bundle JS pubblico e sono estraibili da chiunque visiti il sito pubblicato. Va bene
per sviluppo locale o uso strettamente personale. Per un deploy pubblico, servirà un
piccolo proxy serverless (es. Cloudflare Workers, gratuito) che tenga la chiave lato
server e nasconda la chiamata diretta al provider LLM.

## Limiti attuali

- Moduli finali di partita (alfiere, torre, pedone passato) — fase successiva.
- La calibrazione quantitativa contro 3–5 tabelle chess.com richiede che l'utente
  fornisca le partite e le annotazioni di riferimento.
- Autenticazione utente e persistenza su database.
- Proxy serverless per nascondere le chiavi: escluso dal percorso principale; richiesto
  solo per una pubblicazione online con segreti non esposti nel bundle.
