# Categorie speciali — percorso scelto

7 ottobre 2026. Carlo delega la scelta del percorso con obiettivo di massima somiglianza possibile a Chess.com e precisione dei riconoscimenti. Questa decisione riguarda il percorso; non revoca il divieto vigente di nuove ricerche motore, commit/push o modifiche ai file esistenti/cache.

## Scelta

Procedere per fasi con verifica delle prove e confronto separato di precisione e richiamo. Grande prima, Geniale dopo. Niente attivazione sulla sola presenza di un ampio distacco PV1/PV2 o di un pezzo in presa.

Il protocollo grande-experiment-protocol-v1.md è il primo esperimento prudente, non la definizione completa e definitiva di Grande. Le sue soglie sono ipotesi preventive, non calibrazione completata. Il vincolo giocata almeno pari e alternative sotto −200 cp privilegia precisione, ma esclude deliberatamente molte altre mosse decisive; non si può promettere che massimizzi la concordanza complessiva con Chess.com.

Non scegliere adesso una formula dipendente dal rating, non unificare le curve di Precisione e classificazione e non usare il controfattuale Qb5 come correzione.

## Sequenza concreta

1. Preparare, soltanto quando autorizzata la lettura delle fixture di sviluppo, manifest di tutti i candidati e costo del protocollo Grande v1. Non selezionare soltanto mosse con etichetta attesa Grande. Conteggiare anche attesi fuori dal filtro e motivi di esclusione. Nessun go durante questa ricognizione.
2. Dopo autorizzazione distinta del calcolo, raccogliere tutte le radici ai due budget, con tetto e output separato già proposti. Congelare risultati prima del confronto con le etichette.
3. Valutare precisione e richiamo insieme. Pochi riconoscimenti senza falsi positivi non bastano a dichiarare somiglianza elevata. Distinguere errori di evidenza, filtro iniziale troppo stretto e differenti definizioni delle categorie.
4. Se la v1 è troppo restrittiva, non abbassare automaticamente le soglie. Progettare una v2 esplicita per altre mosse decisive, compresa unica continuazione vincente con alternative circa pari. Fissare prima soglie e guardie del nuovo esperimento, conservando il risultato della v1. Non chiamare una v2 scelta sui medesimi dati validazione indipendente.
5. Solo dopo Grande, definire il protocollo quantitativo di Geniale: offerta reale, saldo materiale dopo sequenze di prese, miglior difesa accettante/rifiutante, compensazione e controfattuale senza sacrificio. Non scrivere una regola per recuperare il singolo esempio Geniale già noto; prevedere nuovi casi annotati indipendenti per la verifica.
6. Prima dell'adozione fissare versione e criteri di validazione. Partite 7–10 restano escluse finché non sono bloccate le regole e autorizzata specificamente la validazione. Nessuna promessa di equivalenza al modello privato Chess.com.

## Cosa conta come successo

Precisione delle etichette assegnate, richiamo sugli attesi, copertura e astensioni riportati separatamente per categoria, più concordanza totale senza nascondere categorie escluse. Rapporto per partita e aggregato; un solo esempio Geniale non consente una stima affidabile.

Il percorso punta a ridurre falsi positivi senza fermarsi a un riconoscitore che non assegna quasi mai categorie speciali. La decisione di attivazione richiederà risultati effettivi e verifica indipendente, non la plausibilità del protocollo.

## Stato

ESEGUITO: scelta e registrazione del percorso in questo nuovo documento.

NON ESEGUITO: manifest, letture fixture, ricerche motore, calibrazione, implementazione, test, build, commit/push. Codice, soglie e cache invariati. Prossimo punto operativo: manifest e costo in sola lettura, previa autorizzazione a usare le fixture P1–P6.
