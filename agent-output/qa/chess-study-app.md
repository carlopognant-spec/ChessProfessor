---
ID: chess-study-app
Origin: PLAN.md
UUID: chess-study-app-2026-09-29
Status: QA Failed
---

# QA Report: Chess Study App

**Plan Reference**: `PLAN.md`
**QA Status**: QA Failed
**QA Specialist**: qa

## Changelog

| Date | Agent Handoff | Request | Summary |
|------|---------------|---------|---------|
| 2026-09-29 | User | Ulteriore verifica del progetto | Eseguiti test, build, verifica TDD e confronto con i criteri dei Passi 6–7. Suite e build verdi, ma i criteri funzionali dell'analisi automatica e della classificazione non risultano coperti o integrati. |
| 2026-09-29 | User | Verifica QA dello stato completo | 12 test file e build passati dopo Passi 9–11 e fix editor FEN; QA resta fallita per gate TDD incompleto, calibrazione esterna mancante e assenza di test browser end-to-end. |

## Timeline
- **Test Strategy Started**: 2026-09-29
- **Test Strategy Completed**: 2026-09-29
- **Implementation Received**: 2026-09-29
- **Testing Started**: 2026-09-29
- **Testing Completed**: 2026-09-29
- **Final Status**: QA Failed

## Test Strategy (Pre-Implementation)

La verifica è stata progettata dal punto di vista dello studente che importa una partita e si aspetta un’analisi completa:

- verificare che l’analisi parta automaticamente dopo l’importazione o il caricamento della partita;
- verificare che ogni semimossa venga analizzata con profondità, MultiPV, cache e progresso configurati;
- verificare cancellazione e cambio posizione senza risultati obsoleti o stato incoerente;
- verificare che Explorer venga interrogato dall’inizio della partita e si fermi definitivamente sotto soglia;
- verificare la scala completa delle dieci categorie e la precedenza `Libro` prima delle soglie numeriche;
- verificare che `Mossa mancata` dipenda dal contesto dell’errore precedente dell’avversario;
- verificare che il test report TDD copra tutte le funzioni aggiunte.

### Testing Infrastructure Requirements

**Test Frameworks presenti**:
- Vitest `^2.1.9`

**Testing Libraries presenti**:
- `chess.js` per validazione delle mosse

**Configuration Files verificati**:
- `vitest.config.js`
- `package.json`

**⚠️ TESTING INFRASTRUCTURE NEEDED**:
- test di integrazione del flusso partita completa -> analisi automatica;
- fake engine/worker controllabile per testare cancellazione, ordine delle richieste e MultiPV;
- fixture PGN con FEN per ogni semimossa;
- fixture di classificazione con categorie attese e dati di riferimento chess.com.

## Required Tests

### Unit Tests
- `classifyMove`: tutte le dieci categorie, soglie inclusive e precedenza libro.
- `classifyMove`: controllo contestuale per `missed` dopo errore dell’avversario.
- `createGameAnalysisSession`: hit cache, eviction, clear e riuso tra richieste duplicate.
- `shouldStopExplorerAtThreshold`: soglia, dati mancanti e arresto permanente.
- `buildAnalysisProgress`: zero, valori oltre il totale e progressione per semimossa.
- `summarizeAnalysis`: eval, matto e input incompleti.

### Integration Tests
- import PGN -> ricostruzione di tutte le posizioni -> analisi sequenziale;
- cancellazione durante analisi -> stato coerente e nessun risultato tardivo;
- cambio posizione durante Stockfish -> ultimo risultato soltanto;
- Explorer dall’inizio fino alla prima posizione sotto soglia;
- navigazione della lista mosse durante analisi senza alterare il job corrente.

## Implementation Review (Post-Implementation)

### TDD Compliance Gate

Il documento `agent-output/implementation/chess-study-app.md` contiene una tabella TDD valida per le funzioni dichiarate nel milestone precedente. Tuttavia, non contiene righe per tutte le funzioni aggiunte o modificate nella fase successiva:

- `createGameAnalysisSession()`;
- `shouldStopExplorerAtThreshold()`;
- `buildAnalysisProgress()`;
- `summarizeAnalysis()`;
- la scala completa aggiornata di `classifyMove()`.

Il gate TDD è quindi incompleto rispetto allo stato attuale del repository. Secondo il protocollo QA questo comporta un rifiuto immediato, anche con test eseguibili verdi.

### Code Changes Summary

- `src/lib/gameAnalysis.js`: helper di sessione/cache, soglia Explorer, progresso e riepilogo.
- `src/lib/classification.js`: classificazione a categorie, ma senza integrazione nel flusso di analisi.
- `src/lib/engineConfig.js`: profondità e MultiPV configurati, ma non consumati dall’UI di analisi partita.
- `src/components/EnginePanel.jsx`: analisi automatica con profondità e MultiPV configurati.
- `src/components/AnalysisSummary.jsx`: conteggi e navigazione delle semimosse.
- `src/lib/positionEditor.js` e `src/components/PositionEditor.jsx`: draft FEN, palette e validazione.
- `src/lib/positionFacts.js` e `src/lib/llm/criticalContext.js`: fatti verificati e routing LLM critico.

## Test Coverage Analysis

| File | Function/Class | Test File | Test Case | Coverage Status |
|------|---------------|-----------|------------|-----------------|
| `src/lib/gameAnalysis.js` | `createGameAnalysisSession` | `tests/explorer-analysis.test.js` | cache base get/set | PARTIAL |
| `src/lib/gameAnalysis.js` | `shouldStopExplorerAtThreshold` | `tests/game-analysis-flow.test.js` | soglia sotto/sopra | COVERED UNIT ONLY |
| `src/lib/gameAnalysis.js` | `buildAnalysisProgress` | `tests/game-analysis-flow.test.js` | percentuale base | PARTIAL |
| `src/lib/gameAnalysis.js` | `summarizeAnalysis` / `buildAnalysisSummary` | `tests/analysis-summary.test.js` | conteggi e righe | PARTIAL |
| `src/lib/classification.js` | `classifyMove` / `classifyAnalysisEntries` | `tests/pgn-classification.test.js`, `tests/analysis-classification.test.js` | scala e contesto | COVERED UNIT |
| `src/components/EnginePanel.jsx` | automatic game analysis | `tests/automatic-analysis.test.js` | orchestratore simulato | PARTIAL INTEGRATION |
| `src/lib/positionEditor.js` | FEN validation and placement | `tests/fen-editor.test.js` | validation and pure transform | COVERED UNIT |
| `src/lib/positionFacts.js` | verified facts | `tests/position-facts.test.js` | board facts | COVERED UNIT |
| `src/components/PositionEditor.jsx` | browser editor workflow | nessuno | palette/draft/apply | MISSING E2E |
| `src/components/OpeningPanel.jsx` | Explorer UI lifecycle | nessuno | browser request lifecycle | MISSING E2E |

### Coverage Gaps

- Non esistono fixture delle 3–5 partite di riferimento né posizioni manuali per `Geniale` e `Grande`.
- Non esiste copertura browser per import PGN, navigazione, editor FEN e click sulle righe del resoconto.
- Non esiste un test provider che dimostri che `ChatPanel` non invoca la rete per categorie non critiche.
- Non è verificata la spiegazione delle frecce del Passo 12, che resta opzionale.

## Test Execution Results

### Unit Tests

- **Command**: `npm test -- --run`
- **Status**: PASS
- **Output**: 12 test files passed, 29 tests passed.
- **Coverage Percentage**: non configurata.

### Production Build

- **Command**: `npm run build`
- **Status**: PASS
- **Output**: Vite 5.4.21; 60 moduli trasformati; build completata senza errori.

### Acceptance Review

- **Passo 5**: PARZIALMENTE VERIFICATO. Import PGN e mosse legali hanno test unitari; manca una verifica UI della navigazione di tutte le posizioni e della conservazione dello stato in caso di input invalido.
- **Passo 6**: PARZIALMENTE VERIFICATO. Orchestratore, cache, cancellazione, soglia e MultiPV hanno test; manca verifica browser reale e benchmark runtime.
- **Passo 7**: FALLITO COME CRITERIO DI ACCETTAZIONE. La scala è testata, ma mancano le partite/tabelle chess.com necessarie per misurare l’80%/90%/100% richiesto.
- **Passo 8**: PARZIALMENTE VERIFICATO. Modello e componente esistono e hanno test unitari; manca test browser della navigazione e dei conteggi visualizzati.
- **Passo 9**: PARZIALMENTE VERIFICATO. Fatti e filtro sono coperti unitariamente; manca prova provider che confermi l’assenza di chiamate non critiche.
- **Passo 10**: PARZIALMENTE VERIFICATO. Validatore e trasformazioni sono coperti; manca E2E della palette e del draft temporaneamente invalido.
- **Passo 11**: PASS CON RISERVA. README aggiornato, ma token Explorer, CDN e tempi non sono verificati con benchmark runtime.

## Findings

### QA-001 — Gate TDD incompleto nel report di implementazione

**Severity**: Blocker QA.

Il report TDD non elenca tutte le funzioni e integrazioni introdotte. Secondo il protocollo QA il gate deve essere respinto prima dell’approvazione.

### QA-002 — Criteri di calibrazione non dimostrabili

**Severity**: Blocker per Passo 7.

Il repository non contiene le 3–5 partite di riferimento, le tabelle chess.com o le posizioni annotate Geniale/Grande richieste dal piano.

### QA-003 — Mancanza di test browser sui flussi utente

**Severity**: High.

Vitest in ambiente Node non verifica il comportamento reale di react-chessboard, palette FEN, importazione, navigazione o chiamate LLM bloccate.

### QA-004 — Benchmark Stockfish non eseguito

**Severity**: Medium.

Il piano richiede tempi a profondità 12 e confronto CDN/WASM; la suite non dimostra prestazioni browser reali.

## Validazione dei fixture QA in tests/fixtures/qa

**Scope**: [tests/fixtures/qa/README.md](../../tests/fixtures/qa/README.md), [tests/fixtures/qa/game-1-chigorin-steinitz-1892.json](../../tests/fixtures/qa/game-1-chigorin-steinitz-1892.json), [tests/fixtures/qa/game-2-saintamant-staunton-1843.json](../../tests/fixtures/qa/game-2-saintamant-staunton-1843.json).

### Verifica strutturale
- I due file JSON sono ben formati e contengono campi coerenti: `label`, `pgn` e `annotations`.
- La lista `annotations` presenta una voce per ogni semimossa annotata; il file 1 contiene 61 annotazioni e il file 2 contiene 132 annotazioni, coerenti con partite storiche complete di questa lunghezza.
- La documentazione in [tests/fixtures/qa/README.md](../../tests/fixtures/qa/README.md) descrive chiaramente lo scopo: fixture di riferimento per la calibrazione della classificazione delle mosse.

### Risultato di validazione
- **Validi come artefatti di riferimento**: sì, da un punto di vista di integrità del dato e leggibilità del formato.
- **Validi come input diretto per il codice attuale**: no, per un motivo tecnico: il sistema implementato usa la scala in inglese definita in [src/lib/classification.js](../../src/lib/classification.js), mentre i fixture usano categorie in italiano (`Libro`, `Migliore`, `Ottima`, `Buona`, `Imprecisione`, `Errore`, `Grande`, `Geniale`).
- **Allineamento con la configurazione del motore**: la scala numerica in [src/lib/engineConfig.js](../../src/lib/engineConfig.js) definisce solo `brilliant`, `great`, `best`, `excellent`, `good`, `inaccuracy`, `mistake`, `blunder` e `book`, quindi non è direttamente mappabile 1:1 con i nomi italiani dei fixture.
- **Uso nel repository**: nessun test attuale fa riferimento ai fixture di QA, quindi non sono ancora validati dal flusso di test del progetto.

### Finding specifico

**QA-005 — Fixture di classificazione non allineati al modello attuale**

**Severity**: High.

I file di [tests/fixtures/qa](../../tests/fixtures/qa) sono coerenti come dataset storico, ma non sono compatibili come fixture macchina con la classificazione attuale del codice. Prima di usarli in test automatici o in confronto con l’output del sistema, è necessario definire una mappatura esplicita tra categorie italiane e categorie codificate in inglese oppure convertire i fixture nel formato atteso dal sistema.

## Final Assessment

La suite automatica e la build sono verdi: 12 file e 29 test passano, senza diagnostici IDE. QA resta **QA Failed** per gate TDD incompleto, calibrazione esterna mancante, benchmark non eseguiti e assenza di copertura browser sui flussi principali.

**Handing off to uat agent for value delivery validation**
