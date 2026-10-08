# Una regola trasferibile tra le sei partite, con copertura limitata

Protocollo preventivo ../grande-leave-game-out-v1-protocol.md. Nessuna nuova ricerca motore. Dodici caratteristiche booleane, regole con massimo due predicati e due regole in unione. Politiche prudente ed esplorativa fissate prima dell'addestramento. Nessuna eccezione per SAN o partita.

## Risultati reali

| Campione | Metodo | Grande corrette | Grande errate | Grande mancate |
|---|---|---:|---:|---:|
| Personali 1–6 | Prototipo v1 già noto sullo sviluppo | 4 | 3 | 10 |
| Personali 1–6 | Prudente, una partita esclusa a turno | 5 | 0 | 9 |
| Personali 1–6 | Esplorativa, una partita esclusa a turno | 5 | 6 | 9 |
| Due storiche | Prototipo v1 | 0 | 1 | 10 |
| Due storiche | Prudente, training soltanto sui personali | 1 | 0 | 9 |
| Due storiche | Esplorativa, training soltanto sui personali | 1 | 0 | 9 |

La politica prudente produce sei assegnazioni corrette complessive senza falsi positivi osservati; lascia però fuori 18 delle 24 Grande. Il richiamo è 35,7% sui personali e 10% sulle storiche. Non chiamare il risultato 'precisione garantita 100%': sei assegnazioni sono poche e i dati erano già stati esaminati nei precedenti esperimenti.

## Regola emersa

In tutti i sei fold prudenziali emerge la stessa coppia di predicati: precedente errore numerico locale e mossa senza presa. Il filtro iniziale richiede inoltre Migliore locale, giocata PV1, niente Libro o matto dato e almeno due mosse legali. Geniale già assegnata dalla v1 è protetta.

Assegnazioni fuori dalla partita usata per addestrare il rispettivo modello:

- Personale 1 Qe5 (ply 47).
- Personale 2 Rd7+ (73).
- Personale 4 Qb4 (22) e Nd6+ (29).
- Personale 5 Bh6+ (37).
- Storica Chigorin–Steinitz Nd6+ (31), applicando il modello addestrato su tutte le sei personali.

Il comportamento è coerente con la famiglia 'trovare una risposta dopo un errore', ma l'assenza di presa è una correlazione del piccolo campione, non una definizione scacchistica di Grande. La regola non può coprire le nove Grande personali che sono prese o appartengono ad altre situazioni. Non va combinata automaticamente con la vecchia v1: l'unione reintrodurrebbe i suoi falsi positivi.

La politica esplorativa perde precisione senza riconoscere più Grande nei personali. Non è un miglioramento da adottare.

## Cosa dimostra il confronto per partita

Ogni previsione personale deriva da un modello addestrato sulle altre cinque partite. ID, ply, SAN e annotazioni precedenti non sono feature. Le etichette entrano nell'addestramento in modo esplicito e supervisionato. Le storiche non entrano mai nel training. I test verificano anche che cambiare le etichette dei gruppi esclusi non alteri il modello.

Questa separazione riduce l'overfitting diretto tra mosse della stessa partita, ma non rende il campione indipendente dalle scelte fatte durante tutta la sessione. Le storiche erano già state studiate; una nuova raccolta annotata e non usata per scegliere le regole rimane necessaria prima dell'attivazione.

## Stato e verifiche

Conservare la politica prudente come candidata sperimentale per questa famiglia di Grande. Nessuna attivazione nell'app e nessuna modifica a curve/soglie comuni. Geniale invariata; nessun nuovo modello addestrato per quella categoria.

53 test superati, inclusi otto nuovi sull'apprendimento, supporto minimo, costi, predicati mancanti, determinismo e isolamento dei gruppi. Runner eseguito nuovamente dopo l'introduzione della funzione esplicita di separazione del training: modelli e previsioni identici alla prima esecuzione. Hash delle sorgenti invariati. Suite app/build/browser NON ESEGUITI, app invariata. .env e partite 7–10 non letti. Nessun commit/push.
