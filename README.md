# Chess Study App — MVP Aperture

App web di studio delle aperture scacchistiche con chatbot esplicativo,
scacchiera interattiva, motore Stockfish lato client e database Lichess.

## Setup locale

```bash
npm install
cp .env.example .env
# apri .env e inserisci le chiavi LLM, il token Lichess e VITE_LLM_PROVIDER
npm test
npm run dev
```

## Come funziona

- **Scacchiera**: react-chessboard + chess.js. Trascina i pezzi per giocare una mossa.
- **Aperture**: ad ogni posizione, l'app interroga la Opening Explorer API di Lichess
  per nome ECO e statistiche. Il codice attuale richiede `VITE_LICHESS_TOKEN`; senza
  token l'endpoint risponde `401 Unauthorized`.
- **Motore**: Stockfish gira in un Web Worker nel browser (caricato da CDN via
  `importScripts`, nessun binario da gestire nel repo). Calcola SOLO eval e mosse
  candidate — non genera testo.
- **Chatbot**: fai una domanda nel pannello a destra. La domanda viene inviata,
  insieme a FEN corrente, dati apertura e valutazione Stockfish, al provider LLM
  scelto (Groq o Gemini, vedi `.env`). Il modello risponde con una spiegazione e,
  se la domanda implica una mossa, la scacchiera si aggiorna automaticamente.
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
Il token non deve essere committato.

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

## Fuori scope in questo MVP

- Moduli finali di partita (alfiere, torre, pedone passato) — fase successiva.
- Analisi delle partite dell'avversario / import PGN — fase successiva.
- Autenticazione utente e persistenza su database.
