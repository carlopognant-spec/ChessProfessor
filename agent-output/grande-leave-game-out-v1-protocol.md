# Grande: apprendimento di regole e confronto per partita

Protocollo fissato prima di addestramento e misura. Esperimento supervisionato sui dati esistenti, non modifica dell'app. Non stima l'algoritmo privato Chess.com. Zero ricerche motore; niente .env o partite 7–10, cache/file precedenti invariati, nessun commit/push.

## Campione

Personali 1–6 per sviluppo. A turno addestrare su cinque partite e predire soltanto la sesta: ogni mossa personale riceve una previsione dal modello che non ha visto quella partita. Poi addestrare su tutte le sei e applicare il modello alle due storiche senza riaddestrare. Le storiche sono già state esaminate negli esperimenti precedenti: chiamarle confronto separato, non validazione indipendente. Anche le sei personali hanno guidato ipotesi precedenti; leave-game-out limita l'overfitting nell'addestramento di questa prova, non cancella tale storia.

Filtro indipendente dalle annotazioni: categoria comune v1 Migliore, mossa PV1, niente Libro/matto dato, almeno due mosse legali. Conservare Geniale già assegnata dalla v1. Tutte le altre etichette di riferimento restano negativi per Grande; includere nelle FN le Grande fuori filtro. Non escludere un negativo solo perché il suo riferimento è Libro o Forzata: applicare le esclusioni globali della v1 soltanto alle metriche finali.

## Caratteristiche

Usare soltanto dodici proprietà booleane calcolate dagli input: presa, presa di torre/donna, scacco, attacco geometrico a due pezzi non pedoni, attacco a re/donna, ricattura, risposta allo scacco, precedente errore numerico locale, segnale di matto, guadagno nella PV a quattro ply (orizzonte disponibile), divario root alla stessa depth almeno 200 cp (soglia del vecchio protocollo), probabilità della migliore almeno 0,75 (curva locale esistente). Le due ultime sono evidenze motore; i valori mancanti non devono soddisfarle. Nessun ID partita, SAN, ply, riferimento precedente o etichetta come feature.

Gli attacchi geometrici non dimostrano guadagni tattici; una PV non prova la migliore difesa oltre il budget. Registrare esplicitamente i dati mancanti.

## Modello trasparente, fissato prima della misura

Enumerare regole con uno o due predicati, ciascuno vero/falso. Niente coppie sullo stesso campo. Una regola deve coprire almeno tre positivi di training. Scegliere al massimo due regole in unione, aggiunte in modo greedy sui casi non ancora coperti; richiedere almeno tre nuovi positivi per regola. Ordinamento deterministico.

Due politiche predeterminate, senza scegliere la migliore dopo i risultati:

- Prudente: costo FP=4, TP=1, stima Laplace (TP+1)/(TP+FP+2) almeno 0,80 e guadagno TP−4FP positivo.
- Esplorativa: costo FP=1, TP=1, stima Laplace almeno 0,50 e guadagno TP−FP positivo.

Massimizzare il guadagno; a pari merito meno FP, più TP, meno predicati, ordine lessicografico. Se nessuna regola soddisfa i criteri, non assegnare Grande. La stima Laplace è una misura interna di selezione, non una garanzia statistica di precisione futura.

## Report

Salvare regole scelte in ogni fold e modello finale. Confrontare TP/FP/FN, precisione e richiamo: v1 sui personali (risultato già noto sullo sviluppo), nuove previsioni leave-game-out e storico separato. Riportare per partita tutti i riconoscimenti, gli errori e il numero di assegnazioni; zero assegnazioni = precisione non definita. Non dichiarare miglioramento indipendente dal confronto con una baseline già scelta sui medesimi dati.

Nessuna attivazione. Il punto è verificare se i dati sostengono regole trasferibili tra partite, anziché aggiungere eccezioni a ogni esempio. Non allentare costi, supporto, soglie o numero di predicati dopo la prova. Test sintetici per scelta costi, supporto, doppio predicato, determinismo, immutabilità e separazione dei gruppi.
