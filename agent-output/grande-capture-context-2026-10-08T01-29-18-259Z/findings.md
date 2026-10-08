# Contesto delle prese: nessun aumento della copertura

8 ottobre 2026. Protocollo preventivo ../grande-capture-context-v1-protocol.md. Aggiunte sette proprietà legali/materiali/temporali alle dodici originali, mantenendo costo dei falsi positivi, supporto minimo e complessità della politica prudente. Una partita personale esclusa dal training a turno; storico mai usato nel training.

## Esito reale

| Campione | Prudente precedente TP / FP / FN | Contesto delle prese TP / FP / FN |
|---|---|---|
| Personali 1–6 | 5 / 0 / 9 | 5 / 1 / 9 |
| Due storiche | 1 / 0 / 9 | 1 / 0 / 9 |
| Totale | 6 / 0 / 18 | 6 / 1 / 18 |

Nessuna vera Grande recuperata o persa. Un solo cambiamento: personale 4 Nxb5 (ply 31), riferimento Migliore, diventa erroneamente Grande. Concordanza totale da 316/586 a 315/586. Geniale invariata.

## Perché il confronto per partita conta

Escludendo personale 4 dal training emerge la regola 'divario root comparabile almeno 200 cp e possibilità legale di ricatturare il pezzo mosso'. Sulle altre cinque personali copre quattro vere Grande senza negativi. Applicata alla personale 4 genera l'errore su Nxb5. Non è una regola aggiunta a mano, né usa la SAN per decidere: è un esempio di correlazione che non trasferisce bene fuori dal gruppo di training.

Il modello addestrato su tutte le sei personali sceglie invece la stessa regola prudente già nota: dopo errore numerico locale, senza presa, entro il filtro Migliore/PV1 e le protezioni documentate. La disponibilità di più caratteristiche non produce da sola una famiglia di prese affidabile.

Decisione: variante respinta; conservare la candidata prudente precedente, con sei riconoscimenti e zero falsi positivi osservati ma diciotto Grande mancate. Non unire automaticamente vecchio e nuovo modello. Non allentare i criteri per recuperare un singolo esempio.

## Stato congelato per prove future

La candidata prudente è esportata in ../grande-prudent-candidate-v1.json, con versione, regola, filtro, origine dei dati e limiti. Serve come riferimento fermo per confrontare nuove partite annotate, senza riaddestrare prima della misura. Non è un modello attivato nell'app e non è una calibrazione conclusa.

Il dataset ha ormai guidato molte ipotesi: ulteriori regole ricavate dagli stessi 24 positivi richiedono un campione nuovo prima dell'adozione. Non sono state lette le partite 7–10. Il risultato zero falsi positivi su sei assegnazioni non è garanzia di precisione futura.

## Verifiche

59 test dedicati superati, inclusi sei nuovi su difensori inchiodati, promozione, en passant, colori, probabilità precedenti, catene interrotte e immutabilità. Hash sorgenti invariati. Nessuna nuova ricerca motore o modifica a file precedenti, app o baseline QA. Runner sintatticamente valido; suite app/build/browser NON ESEGUITI. .env/7–10 non letti. Nessun commit/push.
