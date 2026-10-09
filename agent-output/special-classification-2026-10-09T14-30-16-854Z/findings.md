# Compensazione corroborata: implementazione v6

9 ottobre 2026. [Audit delle 592 mosse](report.md), [confronto con v5 e controlli](migration-and-controls.json), [esperimento iniziale sulle 617 mosse](../stable-compensation-2026-10-09T14-27-08-495Z/report.md), [protocollo preventivo](../stable-compensation-v1-protocol.md).

La modifica recupera **8.Bxf4 come Geniale** nella partita pubblica già analizzata. Le 592 classificazioni precedenti restano identiche: 11 Grande, 1 Geniale e 3 Mosse mancate riconosciute, per 15/37. Nessun riconoscimento perso o nuovo falso positivo osservato nel campione. La partita pubblica passa da 2 a 3 concordanze sui quattro esempi annotati: Bxf4 e Bxf7+ Geniale, Qh5+ Grande, Qxf3 ancora Migliore. Le altre mosse non hanno etichette complete: non è possibile stimare falsi positivi generali su quella partita.

## Che cosa cambia logicamente

Una PV che termina subito dopo una presa non dimostra che il sacrificio sia incompleto o sfavorevole: la lunghezza della variante è limitata dalla ricerca. La nuova famiglia può corroborare la compensazione mediante una seconda analisi della posizione esatta **dopo l'accettazione**. Richiede due score favorevoli, senza bound e concordi entro il margine già esistente di 0,10, con PV legalmente ripercorse. Non modifica la fascia good 0,45 o gli altri limiti.

Bxf4: la root gxf3 dello snapshot avversario successivo stima +416 cp dal lato Bianco, depth 12. L'analisi della posizione dopo gxf3 stima +442 cp dal lato Bianco, depth 17. Gli indici locali sono 0,739 e 0,751. Entrambe sostengono la compensazione, mentre la prima PV termina Bxh8 Be6 e fallisce il vecchio requisito delle ultime due mosse senza presa. Non interpretiamo il loro accordo come prova contro ogni difesa.

L'esperimento separa copertura e criterio: riutilizzare soltanto le root della stessa FEN non recupera Bxf4; aggiungere la corroborazione la recupera. Su 617 mosse cambia soltanto quella categoria. La regola non contiene SAN, identificativi di partite o numeri di turno.

## Protezioni conservate

La corroborazione sostituisce soltanto il requisito finale di quiete. Restano obbligatorie tutte le accettazioni legali dell'offerta e i controlli di qualità numerica, catena FEN/ply, scambio ordinario, recupero immediato, attribuzione dell'offerta e alternative vincenti. Uno score presente ma invalido, ambiguo o discordante non viene sostituito con uno più favorevole. Snapshot esplicitamente vuoti non vengono ricostruiti dalle righe legacy del medesimo motore.

O-O personale 2 rimane Ottima e Rf3 storica rimane Migliore, entrambi bloccati come offerte persistenti. Rac1 rimane Ottima: nei dati runtime la copertura dell'accettazione è ancora insufficiente, quindi questo confronto non dimostra da solo come si comporterebbe con ogni prova supplementare possibile. Rb3 e Rxf5+ non cambiano. Le protezioni esistenti su alternative vincenti e scambi ordinari mantengono inoltre i loro test.

## Live, archivio e QA

`sacrificeEvidence.js` riutilizza snapshot coerenti già disponibili dalla FEN corretta; non avvia ricerche. `specialClassification.js` usa policy `counterfactual-v6` e conserva nella motivazione la fonte della conferma. Nell'analisi live la mossa candidata precedente viene aggiornata quando arriva la ricerca avversaria dopo la cattura. Non si ricalcola tutta la partita a ogni mossa. La restituzione finale e i callback mostrano la categoria aggiornata.

Gli archivi v1–v5 vengono ricalcolati dalle classificazioni numeriche e dalle evidenze già salvate, usando anche l'entrata successiva. La ricalcolazione è idempotente, non modifica gli input e il toggle sperimentale può ancora mostrare la categoria numerica. Il QA corrente usa lo stesso percorso aggiornato.

## Verifica e limiti

- 225 test unitari superati, 1 TODO preesistente, 33 file di test.
- Nove nuovi test: caso reale, colori invertiti, invalidità/discordanza delle prove, mancata sostituzione di score invalidi, migrazione idempotente e aggiornamento live senza chiamate motore aggiuntive.
- 10 scenari browser superati: nove al primo giro e il nuovo Bxf4 dopo la correzione dei metadata sintetici dell'archivio di test. Il primo giro conservato mostra quel singolo fallimento: l'archivio era correttamente considerato obsoleto perché child MultiPV 1 non coincideva con il profilo corrente richiesto dall'UI. Nessuna modifica ai dati originali o alle regole di compatibilità per aggirarlo.
- Build di produzione con config senza .env superata; avviso preesistente sulla dimensione del chunk del repertorio.
- Audit v6 completato sulle otto partite consentite, hash congelati e input invariati; confronto esatto di tutte le 592 categorie con v5 senza differenze. Diff check senza errori.

Nessuna nuova ricerca motore in questo intervento, nessun commit/push e nessuna lettura delle partite riservate o di .env. La partita pubblica ha motivato la nuova ipotesi: ora è dato di sviluppo, non una validazione indipendente. Le etichette pubblicate nel 2022 non equivalgono necessariamente alle classificazioni attuali di Chess.com. Occorrono nuovi esempi per misurare il trasferimento del criterio v6.
