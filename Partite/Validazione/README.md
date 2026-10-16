# Partite riservate alla validazione

Queste partite vengono raccolte dopo lo sviluppo di review-reliability-v2 e
counterfactual-v11. Restano separate dalle partite usate per sviluppare le regole.
Le classificazioni provengono dagli screenshot e dalle correzioni di Carlo;
il motore da valutare non viene usato per creare le etichette di riferimento.

Le bozze sono in Da-verificare; le liste approvate sono in Validazione/Confermate.
Entrambe restano separate dalla raccolta Partite/Confermate usata nello sviluppo.
Anche dopo la conferma restano riservate al controllo finale, senza usarle
per scegliere o modificare le regole.

| ID | Data | Bianco | Nero | Semimosse | Stato |
|---|---|---|---|---:|---|
| [chesscom-185215805284](Confermate/chesscom-185215805284/lista.md) | 2026.10.12 | Brishka98 | ProprioI0 | 122 | Confermata da Carlo |
| [chesscom-185214643360](Confermate/chesscom-185214643360/lista.md) | 2026.10.12 | Limerick09102025 | ProprioI0 | 108 | Confermata da Carlo |
| [chesscom-185120945476](Confermate/chesscom-185120945476/lista.md) | 2026.10.10 | ProprioI0 | SundarKumar2811 | 111 | Confermata da Carlo |
| [chesscom-184965734932](Confermate/chesscom-184965734932/lista.md) | 2026.10.07 | Pochekin086 | ProprioI0 | 155 | Confermata da Carlo |
| [chesscom-184965243670](Confermate/chesscom-184965243670/lista.md) | 2026.10.07 | ProprioI0 | Pochekin086 | 121 | Confermata da Carlo |

Raccolta estesa: cinque partite ricevute, 617 semimosse complessive.
Tutte e cinque le partite hanno ricevuto le correzioni di Carlo: 617 semimosse
confermate. Carlo ha completato anche il ricontrollo delle cinque liste aggiornate,
confermando l'ultima il 15 ottobre 2026.

Il confronto indipendente della versione review-reliability-v2 / counterfactual-v11
è completo e riprodotto offline il 15 ottobre 2026. [Report completo](../../agent-output/holdout-validation-v1/report.md),
[risultati per tutte le semimosse](../../agent-output/holdout-validation-v1/results.json),
[verifica offline](../../agent-output/holdout-validation-v1/offline-check.json).

| Modalità | Corrispondenze esatte | Concordanza | Correzioni rispetto alla normale | Regressioni |
|---|---:|---:|---:|---:|
| Normale, 200k nodi | 379/617 | 61,4% | — | — |
| Primo approfondimento | 378/617 | 61,3% | 7 | 8 |
| Fino a due approfondimenti | 377/617 | 61,1% | 15 | 17 |

Nessuna modifica alle regole durante il confronto. I riferimenti JSON rimangono
immutati: i loro campi engineAnalysisPerformed/evaluationPerformed descrivono
lo stato alla raccolta delle etichette. L'esecuzione successiva è registrata
separatamente nel manifest, nella collection e nei risultati del confronto.
La raccolta resta esclusa dalla scelta o taratura delle regole.
