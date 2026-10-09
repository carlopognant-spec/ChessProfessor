# Recupero dell'equilibrio — counterfactual-v5

Il confronto completo sulle 592 semimosse autorizzate recupera **11.Bxf7, personale 2/ply 21**, passando da 14 a **15 categorie speciali corrette su 37**. Nessun nuovo discordante e nessun riconoscimento precedente perso. Il richiamo totale passa dal 37,8% al 40,5%; la verifica resta sul campione di sviluppo, non indipendente.

| Categoria | Prima | Ora | Attese | Discordanti ora |
|---|---:|---:|---:|---:|
| Grande | 10 | 11 | 24 | 0 |
| Geniale | 1 | 1 | 3 | 0 |
| Mossa mancata | 3 | 3 | 10 | 0 |

La nuova famiglia cerca una decisione che recupera una posizione circa equilibrata dopo un errore numerico avversario, anche con una presa. Usa le bande già esistenti: situazione precedente nell'indice povero, risultato mantenuto circa equilibrato, miglioramento contestuale almeno 0,20. Richiede Migliore/PV1, varianti legali e score unbounded, concordanza tra ricerche adiacenti e conferma indipendente dopo la candidata. Le alternative disponibili devono essere confrontabili alla stessa profondità e restare tutte sotto la banda buona. I recuperi materiali già identificati non vengono promossi automaticamente. Geniale conserva la priorità.

Per Bxf7, l'ultima mossa avversaria è Kf8. L'indice dal lato di chi gioca Bxf7 passa da 0,318 prima dell'avversario a 0,547 nella posizione disponibile, con miglioramento 0,229. Bxf7 vale +0,76 e la ricerca dopo la giocata conferma +0,82. Le cinque varianti sono a depth 13; la seconda, a3, vale −1,38 e le altre sono inferiori. La copertura riguarda cinque delle 42 mosse legali, non tutte: la spiegazione dichiara «alternative analizzate».

È una famiglia autonoma. Non modifica il modello empirico congelato né toglie indiscriminatamente il suo divieto di presa. Non contiene eccezioni su SAN, partita o annotazioni. Il protocollo è `agent-output/equilibrium-recovery-v1-protocol.md`, fissato prima del confronto. La scelta della famiglia nasce comunque dall'esame di una mossa già nota, quindi il risultato non dimostra una precisione generale del 100%.

## Verifiche

- 216 test applicativi superati, un TODO preesistente. I nuovi test coprono entrambi i colori, score bound, alternative favorevoli, cronologia incoerente, disaccordo tra ricerche e migrazione dagli archivi v4.
- Dieci test browser superati. Il caso reale Bxf7 viene salvato Migliore e riaperto Grande offline, con spiegazione del recupero e zero worker. Conservati i casi Nxe5, d4, Nxd6+, le mosse mancate e la navigazione.
- Build riuscita con configurazione senza `.env`; rimane l'avviso preesistente sulla dimensione del repertorio.
- Audit completo: input e venti file congelati invariati; zero nuove ricerche, chiamate LLM, letture delle partite riservate, modifiche delle baseline, commit o push.
- `git diff --check` senza errori.

Restano **22 discordanti**: 13 Grande, due Geniale e sette mosse mancate. La diagnosi aggiornata è in `agent-output/move-diagnostics-2026-10-09T12-17-42-275Z/`. Geniale e Mossa mancata non migliorano in questo intervento: non sono state cambiate le loro condizioni per adattarle alle annotazioni.
