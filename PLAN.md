# Piano di implementazione — Chess Study App

## Value Statement and Business Objective

As a studente di scacchi, voglio analizzare aperture e partite con valutazioni verificabili, classificazioni coerenti e spiegazioni contestuali, così da capire sia la teoria sia gli errori commessi quando la partita esce dal libro.

**Release target:** nessuna.
**Status:** approvato per implementazione fase per fase.

## 1. Stato attuale del repository

L’app è una SPA Vite/React con `react-chessboard`, `chess.js` `^1.0.0` e React `^19.0.0`.

- `src/context/GameContext.jsx` gestisce FEN, mosse SAN e undo.
- `src/lib/stockfish.js` usa un Web Worker con Stockfish da CDN e supporta una sola analisi alla volta.
- `src/components/EnginePanel.jsx` analizza la posizione corrente a profondità 16.
- `src/lib/lichessExplorer.js` richiede attualmente `VITE_LICHESS_TOKEN`, mentre il README dichiara che il token non serve.
- Import PGN, analisi automatica, classificazione delle mosse ed editor FEN non sono presenti.

## 2. Architettura proposta

### Moduli

Nuovi moduli:

- `src/lib/engineConfig.js`: profondità, MultiPV, soglia Explorer e soglie classificazione.
- `src/lib/evaluation.js`: valutazioni, probabilità di vittoria e gestione dei matti.
- `src/lib/classification.js`: categorie e precedenza.
- `src/lib/gameAnalysis.js`: analisi completa, progresso e cancellazione.
- `src/lib/pgn.js`: parsing PGN/lista mosse.
- `src/lib/positionFacts.js`: fatti verificati per il chatbot.
- `src/lib/analysisCache.js`: cache FEN ed Explorer.
- Componenti per analisi, resoconto ed editor di posizione.
- Test Vitest per funzioni pure e integrazioni selezionate.

Modifiche principali:

- `src/lib/stockfish.js`: servizio singleton con coda, priorità, MultiPV e cancellazione.
- `src/context/GameContext.jsx`: partita importata, navigazione e stato analisi.
- `src/components/Board.jsx`: frecce e posizione editoriale.
- `src/components/EnginePanel.jsx`: barra normalizzata.
- `src/components/OpeningPanel.jsx`: libro fino alla prima deviazione.
- `src/components/ChatPanel.jsx`: contesto critico e validazione mosse.
- `src/lib/llm/systemPrompt.js`: prompt fuori libro e fatti strutturati.
- `README.md`: comportamento effettivo, configurazione, tempi attesi e limiti.

### Modello dati della semimossa

Ogni semimossa contiene:

`ply`, `moveNumber`, `side`, `fenBefore`, `playedMove`, `bestMove`, `playedEval`, `bestEval`, `secondBestEval`, `classification`, `isBookMove`, `opening`, `pv`, `critical`, `facts`.

Le valutazioni sono normalizzate dal punto di vista del Bianco. La perdita è calcolata dal punto di vista del giocatore che muove.

## 3. Passi di implementazione

### Passo 0 — Infrastruttura di test Vitest

**Dipendenze:** stato attuale del progetto.
**Agenti:** implementer, code-reviewer, QA.

Configurare Vitest e gli script di test. Preparare fixture con posizioni note e risultati attesi scritti manualmente per:

- probabilità di vittoria;
- parsing PGN e lista mosse;
- classificazione;
- validazione FEN/editor;
- punteggi di matto.

**Criterio di accettazione:** il comando di test è ripetibile e ogni funzione pura nuova dispone di fixture indipendenti dall’implementazione.

### Passo 1 — Verifica del comportamento reale dell’Explorer Lichess

**Dipendenze:** Passo 0.
**Agenti:** implementer, code-reviewer, QA.

Verificare l’endpoint effettivamente utilizzato da `src/lib/lichessExplorer.js`, con e senza `VITE_LICHESS_TOKEN`, controllando autenticazione, CORS, formato della risposta, limiti e comportamento per posizioni senza dati.

Confermare se il token è realmente necessario nell’ambiente target. Questa decisione deve precedere l’implementazione della cache e del rilevamento fuori libro.

**Criterio di accettazione:** è documentato il comportamento osservato dell’endpoint e il contratto locale del modulo Explorer; il codice previsto dal Passo 6 può distinguere risposta valida, errore di autenticazione, rate limit e posizione senza partite.

### Fase 1 — Motore, frecce e barra

#### Passo 2 — Servizio Stockfish e scelta della build

**Dipendenze:** Passi 0 e 1.
**Agenti:** implementer, code-reviewer, QA.

Trasformare Stockfish in un servizio unico con coda, priorità alle richieste live, una sola richiesta attiva per worker, cancellazione, MultiPV e gestione completa di successo, errore e interruzione.

Valutare build WASM inclusa nel progetto rispetto alla build CDN, misurando dimensione, compatibilità con Vite/Web Worker, caricamento e tempi a profondità 12. Definire una profondità inferiore come fallback per dispositivi lenti.

**Criterio di accettazione:** le richieste non si sovrappongono, quelle live precedono il lavoro in background, nessuna promessa resta pendente e la build scelta è documentata con tempi misurati e fallback.

#### Passo 3 — Valutazioni, probabilità di vittoria e matti

**Dipendenze:** Passo 2.
**Agenti:** implementer, code-reviewer, QA.

Creare funzioni pure per normalizzare centipawn e mate score dal punto di vista del Bianco, applicare un modello logistico documentato in stile Lichess, calcolare la perdita dal punto di vista del giocatore e rappresentare i matti agli estremi.

**Criterio di accettazione:** i test verificano simmetria tra colori, intervallo `[0, 1]`, monotonicità e gestione dei matti.

#### Passo 4 — Frecce e barra di valutazione

**Dipendenze:** Passi 2 e 3.
**Agenti:** implementer, code-reviewer, QA.

Mostrare le 2 o 3 linee migliori con colori distinti per rango. La barra deve essere dal punto di vista del Bianco; per i matti deve essere piena e mostrare un’etichetta come `M3`.

**Criterio di accettazione:** frecce, etichetta e barra rappresentano la stessa risposta del motore e i risultati obsoleti vengono rimossi al cambio posizione.

### Fase 2 — Analisi della partita

#### Passo 5 — Import e navigazione PGN

**Dipendenze:** Passo 0 e `src/context/GameContext.jsx`.
**Agenti:** implementer, code-reviewer, QA.

Aggiungere input PGN o lista di mosse, parsing con `chess.js`, navigazione e messaggi con numero della mossa.

**Criterio di accettazione:** PGN valido ricostruisce tutte le posizioni; una mossa illegale identifica numero e colore; input invalido non altera la partita corrente; le partite molto brevi funzionano.

#### Passo 6 — Analisi automatica, cache ed Explorer

**Dipendenze:** Passi 1, 2, 3 e 5.
**Agenti:** implementer, code-reviewer, QA.

Analizzare automaticamente la partita a profondità 12 e MultiPV 2, configurati in un unico file. Aggiungere progresso, cancellazione, cache per FEN, cache Explorer e soglia configurabile sul numero totale di partite.

Interrogare Explorer dall’inizio della partita e fermarsi definitivamente alla prima posizione sotto soglia.

**Criterio di accettazione:** l’analisi parte al caricamento, la partita resta navigabile, la cancellazione mantiene uno stato coerente e richieste duplicate usano la cache.

#### Passo 7 — Classificazione delle dieci categorie

**Dipendenze:** Passi 0, 3 e 6.
**Agenti:** implementer, code-reviewer, QA.

Implementare una funzione unica con precedenza:

1. Libro;
2. Geniale;
3. Grande;
4. Migliore;
5. Ottima;
6. Buona;
7. Imprecisione;
8. Errore;
9. Errore grave;
10. Mossa mancata come controllo contestuale sull’errore precedente dell’avversario.

Le soglie sono configurabili e devono essere tarate su tutte le 3–5 partite di riferimento fornite dall’utente, con PGN e tabella chess.com, includendo stili tattico, posizionale e sacrifici. Devono inoltre essere presenti posizioni annotate manualmente con categoria attesa, soprattutto per Geniale e Grande.

**Criterio di accettazione misurabile:**

- ogni partita raggiunge almeno l’80% di corrispondenza esatta tra categoria prodotta e categoria chess.com;
- per il restante 20%, lo scarto è al massimo di una categoria nella scala ordinata;
- Libro ed Errore grave richiedono almeno il 90% di corrispondenza esatta;
- le posizioni annotate manualmente per Geniale e Grande devono avere corrispondenza esatta al 100%;
- gli eventuali casi non conformi sono elencati con posizione, valutazioni e motivazione.

Questi valori sono criteri iniziali di accettazione e possono essere rivisti solo se la differenza tra il modello locale e chess.com è dimostrata sistematica e documentata.

#### Passo 8 — Resoconto finale

**Dipendenze:** Passi 5–7.
**Agenti:** implementer, code-reviewer, QA.

Creare una tabella con tutte le dieci categorie, icona, nome e conteggi separati per Bianco e Nero. Le righe devono portare alle semimosse corrispondenti. Il grafico della valutazione resta opzionale.

**Criterio di accettazione:** conteggi e navigazione coincidono con i dati delle semimosse; le categorie assenti mostrano zero; i matti sono indicati esplicitamente come matto.

### Fase 3 — LLM ed editor di posizione

#### Passo 9 — Contesto LLM critico e fuori libro

**Dipendenze:** Passi 6 e 7.
**Agenti:** implementer, code-reviewer, QA.

Usare l’LLM solo per Errore, Errore grave, Mossa mancata e prima deviazione dal libro. Inviare materiale, struttura pedonale, sicurezza del re, sviluppo e linea Stockfish, tutti calcolati o verificati localmente.

Usare un prompt distinto fuori libro. Il modello può spiegare soltanto le mosse ricevute.

**Criterio di accettazione:** le richieste non critiche non chiamano il provider; il contesto contiene solo dati verificati; ogni mossa strutturata è validata con `chess.js` prima dell’applicazione.

#### Passo 10 — Editor di posizione

**Dipendenze:** `src/components/Board.jsx` e `src/context/GameContext.jsx`.
**Agenti:** implementer, code-reviewer.

Aggiungere palette pezzi, lato al tratto, arrocco, en passant, import/export FEN e validazione.

**Criterio di accettazione:** vengono rifiutate posizioni con re mancante o duplicato, pedoni sulla prima o ottava traversa, FEN invalida o lato non al tratto sotto scacco; una posizione valida alimenta frecce e chatbot.

#### Passo 11 — Allineamento del README

**Dipendenze:** completamento delle tre fasi.
**Agenti:** implementer, code-reviewer, QA.

Aggiornare `README.md` per descrivere il comportamento effettivo, configurazione, tempi attesi, fallback Stockfish, soglia Explorer, limiti delle chiavi LLM lato client e requisito reale del token Lichess stabilito al Passo 1.

**Criterio di accettazione:** README, codice e configurazione descrivono lo stesso comportamento, senza dichiarare accesso anonimo se il runtime richiede un token.

### Passo 12 opzionale — Spiegazione della freccia

**Dipendenze:** Passi 4 e 9.
**Agenti:** implementer, code-reviewer.

Cliccando una freccia, inviare al chatbot soltanto mossa, valutazione e PV ricevuta.

**Criterio di accettazione:** il chatbot spiega la freccia selezionata; errori del modello o di rete non modificano la posizione.

### Passo finale opzionale — Proxy serverless

**Dipendenze:** indipendente; attivare solo per pubblicazione online.
**Agenti:** implementer, code-reviewer, QA.

Valutare un proxy, ad esempio Cloudflare Workers, per nascondere chiavi LLM e token Lichess. L’ambiente locale può mantenere le chiamate client-side.

**Criterio di accettazione:** nella modalità online nessuna chiave privata appare nel bundle pubblico; il proxy mantiene il contratto usato dall’interfaccia e gestisce limiti ed errori.

## 4. Punti di stop della pipeline

### STOP 1

Dopo il Passo 0 e la verifica del token Lichess. Il riepilogo deve riportare se l’Explorer richiede il token, la risposta dell’endpoint e i limiti della verifica.

### STOP 2

Dopo la Fase 1. Il riepilogo deve riportare tempi a profondità 12, confronto tra build inclusa e CDN, raccomandazione e profondità di fallback. La build deve restare sostituibile; la scelta finale spetta all’utente.

### STOP 3

Dopo i Passi 5 e 6, prima del Passo 7. Richiedere all’utente da 3 a 5 partite di riferimento, ciascuna con PGN e tabella chess.com, di stile diverso.

### STOP 4

Dopo la Fase 2. Includere il report di taratura con corrispondenza per partita e categoria, discrepanze e soglie scelte.

### STOP 5

A fine lavoro, dopo la Fase 3 e l’aggiornamento del README. Il Passo 12 opzionale e il proxy serverless restano esclusi finché l’utente non li richiede esplicitamente.

## 5. Decisioni ancora aperte

- La scelta finale tra build WASM inclusa e CDN sarà presa dopo le misurazioni del Passo 2.
- La soglia temporale per classificare un dispositivo come lento sarà definita sulla base delle misurazioni del Passo 2.
- Il proxy serverless resta escluso dal percorso principale e sarà attivato solo con richiesta esplicita.
- Le partite di riferimento e le relative tabelle chess.com devono essere fornite prima del Passo 7.