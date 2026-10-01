---
ID: chess-study-app
Origin: PLAN.md
UUID: chess-study-app-2026-09-29
Status: Active
---

# Implementation Report — Chess Study App

## Plan Reference
- Source plan: [PLAN.md](PLAN.md)
- Scope addressed: automatic analysis flow, Explorer threshold persistence, and classification foundation

## Date
- 2026-10-01

## Changelog
| Date | Handoff/Request | Summary |
|------|-----------------|---------|
| 2026-09-29 | Continue implementation | Added evaluation helpers, hardened stale Stockfish re-requests, and updated the plan status to in progress. |
| 2026-09-29 | Ulteriore verifica e prosecuzione del piano | Added TDD coverage for sequential game analysis, persistent Explorer stopping, centralized classification thresholds, full classification ladder, and EnginePanel integration. |
| 2026-09-29 | Continua il piano | Added Stockfish MultiPV support and classification enrichment from played/best evaluations with contextual missed opportunities. |
| 2026-09-29 | Procedi con il successivo passo | Added post-move engine evaluation and automatic per-ply classification to the game-analysis flow. |
| 2026-09-29 | Continua | Added Passo 8 analysis summary with all categories, color-separated counts, semimove rows, and position reconstruction. |
| 2026-09-29 | Continua | Added critical-only LLM routing, verified context construction, and first book-deviation detection. |
| 2026-09-29 | Completa tutto il residuo del piano | Added verified board facts, FEN position editor, piece palette, FEN validation, and README alignment. |
| 2026-09-29 | Correggilo allora | Fixed FEN editor draft flow so temporary incomplete positions are edited without mutating the validated game until Apply Position. |
| 2026-10-01 | QA Failed: correzioni 2a-2e | Collegate frecce MultiPV, navigazione per semimossa, eval numeriche, parser PGN nativo e copertura TDD aggiuntiva; corretto URL CDN Stockfish pubblicato. |

## Implementation Summary
This milestone advances the plan by connecting automatic analysis to the current move sequence. The analyzer reconstructs each pre-move FEN, reuses cached entries, reports progress, stops Explorer permanently after the first below-threshold position, and aborts cleanly. Classification thresholds are centralized and the complete ten-category ladder is covered by tests, including contextual missed opportunities.

This directly improves the project’s value statement by making board-state transitions, evaluations, and move quality analysis coherent and testable before the later phases of the chess study workflow are layered on top.

## Milestones Completed checklist
- [x] Failing TDD test written for evaluation helpers
- [x] Evaluation module created and validated
- [x] Stockfish stale-result guard implemented
- [x] Engine panel aligned with normalized evaluation values
- [x] Test suite and production build pass
- [x] Sequential analysis, cache, progress, cancellation, and Explorer threshold tested
- [x] EnginePanel uses configured depth and starts automatic analysis after moves
- [x] Classification thresholds centralized and ten-category ladder tested
- [x] Stockfish requests and returns configured MultiPV lines
- [x] Analysis entries can be enriched with eval delta and classification
- [x] Automatic analysis evaluates the played position from the mover's perspective
- [x] Automatic entries now include best/played evaluations and classification
- [x] Summary includes all ten categories with zero counts
- [x] Summary separates White and Black counts
- [x] Semimove rows reconstruct the position before the selected move
- [x] LLM calls are limited to critical classifications and first book deviation
- [x] Critical context contains verified FEN, opening, engine, and move facts
- [x] Verified position facts include pawn structure, king locations, king safety, and development
- [x] FEN editor supports import/export, side to move, castling, en passant, and piece placement
- [x] Invalid FEN positions are rejected before loading into the game
- [x] README reflects the implemented runtime behavior and limitations
- [x] FEN draft editing is separate from validated game state

## Files Modified table
| Path | Changes | Lines |
|------|---------|-------|
| [src/lib/stockfish.js](src/lib/stockfish.js) | Added latest-request-only behavior and stale rejection for superseded analyses. | Updated implementation |
| [src/components/EnginePanel.jsx](src/components/EnginePanel.jsx) | Normalized scoreboard output and mate labels; caught stale engine rejections. | Updated implementation |
| [PLAN.md](PLAN.md) | Status set to in progress and added changelog entry. | Updated implementation |
| [src/lib/gameAnalysis.js](src/lib/gameAnalysis.js) | Added sequential analysis orchestration, cancellation checks, and persistent Explorer stop state. | Updated implementation |
| [src/lib/engineConfig.js](src/lib/engineConfig.js) | Added centralized classification thresholds. | Updated implementation |
| [src/lib/classification.js](src/lib/classification.js) | Implemented complete classification ladder and contextual missed opportunity. | Updated implementation |
| [src/components/EnginePanel.jsx](src/components/EnginePanel.jsx) | Connected automatic sequence analysis, cache session, progress, and configured depth. | Updated implementation |
| [src/lib/stockfish.js](src/lib/stockfish.js) | Added MultiPV option, parsing, ordering, and backward-compatible primary line fields. | Updated implementation |
| [src/lib/classification.js](src/lib/classification.js) | Added `classifyAnalysisEntries` for played/best evaluation deltas and opponent-error context. | Updated implementation |
| [src/lib/gameAnalysis.js](src/lib/gameAnalysis.js) | Added optional post-move analysis and automatic classification of new entries. | Updated implementation |

## Files Created table
| Path | Purpose |
|------|---------|
| [src/lib/evaluation.js](src/lib/evaluation.js) | Pure evaluation helpers for centipawn normalization, win probability, and mate labels. |
| [tests/evaluation.test.js](tests/evaluation.test.js) | TDD coverage validating evaluation behavior and sign consistency. |
| [tests/automatic-analysis.test.js](tests/automatic-analysis.test.js) | TDD coverage for sequential analysis, cache reuse, cancellation, and persistent Explorer threshold. |
| [tests/stockfish.test.js](tests/stockfish.test.js) | TDD worker contract test for MultiPV requests and ordered lines. |
| [tests/analysis-classification.test.js](tests/analysis-classification.test.js) | TDD tests for analysis-entry enrichment and missed-opportunity context. |
| [tests/automatic-analysis.test.js](tests/automatic-analysis.test.js) | Added integration coverage for post-move evaluation and per-ply classification. |
| [src/components/AnalysisSummary.jsx](src/components/AnalysisSummary.jsx) | Added Passo 8 report table and selectable semimove rows. | New component |
| [tests/analysis-summary.test.js](tests/analysis-summary.test.js) | TDD tests for complete category counts and semimove rows. | New test |
| [src/index.css](src/index.css) | Added compact summary table and semimove row styles. | Updated implementation |
| [src/context/GameContext.jsx](src/context/GameContext.jsx) | Added move-sequence reconstruction for summary navigation. | Updated implementation |
| [src/App.jsx](src/App.jsx) | Connected summary state and clears stale results on reset/import. | Updated implementation |
| [src/lib/llm/criticalContext.js](src/lib/llm/criticalContext.js) | Added critical classification filter and verified context builder. | New module |
| [src/components/ChatPanel.jsx](src/components/ChatPanel.jsx) | Prevented non-critical provider calls and passed critical context. | Updated implementation |
| [src/lib/llm/systemPrompt.js](src/lib/llm/systemPrompt.js) | Added verified critical facts to the provider prompt. | Updated implementation |
| [tests/llm-critical-context.test.js](tests/llm-critical-context.test.js) | TDD tests for critical-only routing and context construction. | New test |
| [src/lib/positionEditor.js](src/lib/positionEditor.js) | Added FEN validation, export, and piece placement helpers. | New module |
| [src/lib/positionFacts.js](src/lib/positionFacts.js) | Added chess.js-derived verified board facts. | New module |
| [src/components/PositionEditor.jsx](src/components/PositionEditor.jsx) | Added FEN controls, castling, en passant, side-to-move, and piece palette UI. | New component |
| [tests/fen-editor.test.js](tests/fen-editor.test.js) | TDD tests for FEN validation and piece placement. | New test |
| [tests/position-facts.test.js](tests/position-facts.test.js) | TDD test for verified local board facts. | New test |
| [README.md](README.md) | Updated setup, runtime behavior, limits, Explorer, engine, LLM, and editor documentation. | Updated documentation |
| [src/App.jsx](src/App.jsx) | Owns draft FEN and applies palette changes without loading invalid intermediate states. | Updated implementation |
| [src/components/Board.jsx](src/components/Board.jsx) | Renders draft FEN during editing while retaining a safe valid game fallback. | Updated implementation |
| [src/components/PositionEditor.jsx](src/components/PositionEditor.jsx) | Uses controlled draft state and validates only on apply. | Updated implementation |

## Code Quality Validation checklist
- [x] Compilation: `npm run build` passed
- [x] Lint/test: Vitest suite passed
- [x] Compatibility: existing smoke test still passes
- [x] Regression risk: stale engine results addressed at the service boundary
- [x] Full suite: 6 test files and 16 tests passed
- [x] Production build: Vite build passed
- [x] MultiPV worker contract: 8 test files and 19 tests passed
- [x] Full validation after post-move evaluation: 8 test files and 20 tests passed
- [x] Full validation after Passo 8: 9 test files and 22 tests passed
- [x] Full validation after Passo 9: 10 test files and 24 tests passed
- [x] Full validation after Passi 10–11: 12 test files and 29 tests passed
- [x] Full validation after draft editor fix: 12 test files and 29 tests passed

## Value Statement Validation
Original value statement:
> As a studente di scacchi, voglio analizzare aperture e partite con valutazioni verificabili, classificazioni coerenti e spiegazioni contestuali, così da capire sia la teoria sia gli errori commessi quando la partita esce dal libro.

Implementation delivers:
- Normalized engine values are consistent from the White perspective.
- Win probability stays within a verifiable probability range.
- Mate states have explicit labels and are displayed consistently.
- Stale engine answers no longer override newer board states, improving trust in the analysis pipeline.
- Imported or played sequences now trigger cached automatic analysis with visible progress.
- Classification behavior is deterministic and configurable rather than embedded in UI code.
- The engine now provides the configured two principal variations for later comparison and explanation.
- Each newly analyzed move can now be compared with the engine's best line using a consistent player-to-move perspective.
- Students can inspect category totals by color and jump back to the position before any analyzed move.
- Non-critical questions no longer trigger an LLM request; critical explanations receive structured local facts.
- Position editing is validated locally before it can feed the engine or chatbot.
- Temporary editor changes no longer corrupt or prematurely replace the validated game state.

## TDD Compliance
| Function/Class | Test File | Test Written First? | Failure Verified? | Failure Reason | Pass After Impl? |
|----------------|-----------|---------------------|-------------------|----------------|------------------|
| `normalizeEvalToWhite()` | [tests/evaluation.test.js](tests/evaluation.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `calculateWinProbability()` | [tests/evaluation.test.js](tests/evaluation.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `formatMateLabel()` | [tests/evaluation.test.js](tests/evaluation.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `parsePgnMoves()` | [tests/pgn-classification.test.js](tests/pgn-classification.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `classifyMove()` | [tests/pgn-classification.test.js](tests/pgn-classification.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `createAnalysisCache()` | [tests/pgn-classification.test.js](tests/pgn-classification.test.js) | ✅ Yes | ✅ Yes | ModuleNotFoundError | ✅ Yes |
| `analyzeGame()` | [tests/automatic-analysis.test.js](tests/automatic-analysis.test.js) | ✅ Yes | ✅ Yes | TypeError: analyzeGame is not a function | ✅ Yes |
| `StockfishEngine.analyze()` MultiPV behavior | [tests/stockfish.test.js](tests/stockfish.test.js) | ✅ Yes | ✅ Yes | AssertionError: missing MultiPV option | ✅ Yes |
| `classifyAnalysisEntries()` | [tests/analysis-classification.test.js](tests/analysis-classification.test.js) | ✅ Yes | ✅ Yes | TypeError: classifyAnalysisEntries is not a function | ✅ Yes |
| `analyzeGame()` post-move classification | [tests/automatic-analysis.test.js](tests/automatic-analysis.test.js) | ✅ Yes | ✅ Yes | AssertionError: expected 2 engine calls, received 1 | ✅ Yes |
| `buildAnalysisSummary()` | [tests/analysis-summary.test.js](tests/analysis-summary.test.js) | ✅ Yes | ✅ Yes | TypeError: buildAnalysisSummary is not a function | ✅ Yes |
| `shouldUseCriticalLlm()` | [tests/llm-critical-context.test.js](tests/llm-critical-context.test.js) | ✅ Yes | ✅ Yes | Failed to load criticalContext.js | ✅ Yes |
| `buildCriticalContext()` | [tests/llm-critical-context.test.js](tests/llm-critical-context.test.js) | ✅ Yes | ✅ Yes | Failed to load criticalContext.js | ✅ Yes |
| `parseAndValidateFen()` | [tests/fen-editor.test.js](tests/fen-editor.test.js) | ✅ Yes | ✅ Yes | Failed to load positionEditor.js | ✅ Yes |
| `setPieceAtFen()` | [tests/fen-editor.test.js](tests/fen-editor.test.js) | ✅ Yes | ✅ Yes | TypeError: setPieceAtFen is not a function | ✅ Yes |
| `getPositionFacts()` | [tests/position-facts.test.js](tests/position-facts.test.js) | ✅ Yes | ✅ Yes | Failed to load positionFacts.js | ✅ Yes |

## Test Coverage
- Unit: evaluation normalization, sign handling, probability bounds, and mate formatting
- Unit: PGN parsing with move-number stripping and comment filtering
- Unit: classification thresholds for all ten categories and contextual missed opportunities
- Unit: analysis cache retrieval and key expiry semantics
- Unit: sequential analysis, cancellation, progress, and persistent Explorer threshold
- Unit: Stockfish MultiPV request and ordered principal variations
- Unit: analysis-entry classification and contextual missed opportunities
- Integration: existing chess smoke validation remains green
- Integration: complete suite and production build pass after editor/LLM changes

## Test Execution Results
- Command: `npm test -- --run`
- Result: 12 test files passed, 29 tests passed, exit code 0
- Command: `npm run build`
- Result: Vite production build succeeded, exit code 0

## Outstanding Items
- Cached entries created before post-move classification may not contain the new fields until the analysis session is cleared or those FENs expire.
- The reference-game calibration and exact chess.com acceptance measurements remain pending because reference PGNs/tables were not supplied in the repository.
- Reference-game calibration against chess.com and manual Brilliant/Great fixtures are still missing.
- PGN position navigation and the Passo 8 summary remain incomplete.
- Richer local board facts (pawn structure, king safety, and development) are not yet included in the critical context.
- The optional arrow explanation (Passo 12) remains excluded as allowed by STOP 5.
- The optional serverless proxy remains excluded as allowed by STOP 5.
- Quantitative chess.com calibration cannot be completed until the requested 3–5 reference PGNs and annotation tables are supplied.
- CDN-vs-bundled Stockfish timing measurements cannot be honestly completed from unit tests alone; the current runtime choice remains CDN with fallback depth configured.
- Browser-level interaction coverage for dragging through an incomplete editor position remains outside the Node-based Vitest suite.

## Next Steps
1. Run QA/UAT against supplied reference games and calibration fixtures.
2. Measure Stockfish runtime on target devices if a deployment decision between CDN and bundled WASM is required.
3. Implement optional arrow explanation or serverless proxy only when explicitly requested.

## Correction Milestone 2a-2e

### Implementation Summary
- `Board.jsx` now derives up to three colored arrows from the current entry's MultiPV lines and removes generated arrows when the FEN changes.
- `MoveList.jsx` now exposes one button per half-move and reconstructs the corresponding position through `loadMoveSequence`.
- Analysis rows now show numeric `playedEval` and `bestEval` values when available.
- `parsePgnMoves()` delegates to `new Chess().loadPgn(pgn)`, covering comments, NAGs and nested variations.
- Session eviction now removes the evicted key from both the in-memory session and TTL cache.

### TDD Compliance

| Function/Class | Test File | Test Written First? | Failure Verified? | Failure Reason | Pass After Impl? |
|----------------|-----------|---------------------|-------------------|----------------|------------------|
| `buildEngineArrows()` | [tests/analysis-presentation.test.js](tests/analysis-presentation.test.js) | Yes | Yes | ModuleNotFoundError | Yes |
| `buildMoveNavigation()` | [tests/analysis-presentation.test.js](tests/analysis-presentation.test.js) | Yes | Yes | ModuleNotFoundError | Yes |
| `parsePgnMoves()` nested variations | [tests/pgn-classification.test.js](tests/pgn-classification.test.js) | Yes | Yes | AssertionError | Yes |
| `createGameAnalysisSession()` eviction/clear | [tests/game-analysis-flow.test.js](tests/game-analysis-flow.test.js) | Yes | Yes | AssertionError | Yes |
| `shouldStopExplorerAtThreshold()` missing data | [tests/game-analysis-flow.test.js](tests/game-analysis-flow.test.js) | Yes | Yes | AssertionError | Yes |
| `buildAnalysisProgress()` bounds | [tests/game-analysis-flow.test.js](tests/game-analysis-flow.test.js) | Yes | Yes | AssertionError | Yes |
| `summarizeAnalysis()` incomplete entries | [tests/game-analysis-flow.test.js](tests/game-analysis-flow.test.js) | Yes | Yes | AssertionError | Yes |

### Validation
- `npm test -- --run`: 13 test files passed, 35 tests passed.
- `npm run build`: passed.
- PGN fixture includes `{main}`/`{end}` comments and nested `( ... ( ... ) )` variations; only the main line is returned.
- Manual browser check: import a PGN, confirm 2-3 colored engine arrows update after selecting another move, then click each SAN button and verify the board reaches that half-move.

### Benchmark and Outstanding Items
- CDN URL corrected from the 404 path to `stockfish-nnue-16.js`.
- The CDN asset was downloaded and initialized, but no reliable depth-12 elapsed time could be obtained in this environment: Node 24 lacks the release wrapper's UCI `ccall` path and the published `stockfish@16.0.0` adapter has a broken `main` path. No timing is fabricated.
- Passo 7 remains untouched and is explicitly deferred pending reference games. This implementation stops here and awaits explicit user authorization before any further plan step.

## Correction Milestone 1-3

- Updated `buildEngineArrows()` to the react-chessboard v5 object format `{ startSquare, endSquare, color }`.
- Preserved the complete move timeline in `GameContext` so keyboard navigation can move backward and forward after selecting an earlier position.
- Added ArrowLeft/ArrowRight handling in `App.jsx`, excluding input, textarea, select and contenteditable targets.
- Runtime verification of `https://explorer.lichess.ovh/lichess` returned `401 Unauthorized` both without Authorization and with an invalid token. README and OpeningPanel now state the token requirement explicitly.
- Final focused verification: 2 test files, 6 tests passed. Full suite/build had already passed with 13 files and 36 tests before the additional 401 test.
