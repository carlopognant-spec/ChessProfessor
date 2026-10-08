# Raccolta MultiPV completa: prova limitata

Ipotesi tecnica: i raccoglitori esistenti mantengono l'ultima riga di ciascun indice MultiPV, anche se appartiene a profondità diverse. A fine ricerca questo può produrre un insieme misto o duplicato. Per le categorie speciali provare invece l'ultimo blocco completo di cinque linee alla stessa profondità, senza cambiare classificazione, curve o soglie.

Protocollo scritto prima delle nuove ricerche. App, codice esistente, cache e baseline QA restano invariati. Soltanto nuovo raccoglitore sperimentale, output esterno e test.

## Selezione e budget

- Dal risultato v1 scegliere tutte le mosse con astensione different-root-depths o invalid-or-duplicate-roots. Non leggere le etichette per scegliere.
- Ordinare i giochi con la whitelist personali 1–6, Chigorin–Steinitz, Saint-Amant–Staunton. Per due giri scegliere la prima e poi la seconda posizione irrisolta di ciascun gioco, in ordine di ply. Al massimo 16 posizioni.
- Una ricerca della FEN prima della mossa per posizione, Stockfish npm 19.0.0 large-single, MultiPV 5, Threads 1, Hash 16, hash pulita, 200.000 nodi. Nessuna ricerca per ogni alternativa, nessun aumento del budget a esito noto.
- Massimo nominale 3.200.000 nodi; tetto operativo 4.000.000 nodi totali effettivi. Fermarsi prima di una ricerca se non rimane budget nominale più 2.000 nodi di riserva; riportare gli eventuali sforamenti del singolo go e del totale.
- Salvare tutte le righe UCI, numero reale di nodi e metadati. Nessuna scrittura nella cache QA, nessuna lettura .env o partite 7–10, nessun commit/push.

## Raccolta delle linee

Un blocco inizia con multipv 1 senza bound, a profondità positiva. Accettare le successive linee senza bound soltanto in ordine 2…5 e alla stessa profondità. Radici duplicate o assenti invalidano il blocco. Una nuova PV1 avvia un nuovo blocco; un'iterazione incompleta o un bound non sovrascrivono l'ultimo blocco completo. Questi score restano stime, non prove esatte.

Verificare replay legale di tutte le cinque PV. Se PV1 del blocco completo non coincide col bestmove finale, astenersi: la ricerca ha cambiato raccomandazione durante l'iterazione incompleta. Conservare anche le ultime righe per indice per confrontare le due modalità sulla stessa ricerca reale.

## Confronto

Riutilizzare playedEngine già salvato per la posizione successiva; ricalcolare classificazione comune e applicare la v1 speciale invariata. Conservare il precedente contesto numerico, senza propagare sostituzioni a mosse non selezionate.

Misurare: blocchi completi ottenuti, profondità/nodi del blocco rispetto al budget finale, confronti misti eliminati, astensioni recuperate e nuove astensioni; TP/FP/FN e concordanza sui soli casi selezionati; totale a sostituzione parziale chiaramente indicato. Separare l'effetto del nuovo calcolo da quello del raccoglitore, confrontando l'ultimo blocco e l'ultima riga per indice sullo stesso raw UCI. Nessuna validazione indipendente o attivazione automatica nell'app.
