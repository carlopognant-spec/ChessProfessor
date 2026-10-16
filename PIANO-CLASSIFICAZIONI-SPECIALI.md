# Piano per migliorare le classificazioni speciali

15 ottobre 2026. Stato applicativo: review-reliability-v2, counterfactual-v12.
Questo documento definisce il lavoro successivo; non introduce nuove regole.

Avanzamento successivo: dossier offline completato su 72 posizioni speciali
distinte, con varianti e controlli. Primo lotto integrato v13: due Mosse
mancate distinte recuperate dalle prove esistenti, zero regressioni nei
gruppi di sviluppo, nessun cambiamento delle soglie. Le baseline sotto
restano quelle fissate prima del lavoro.
[Risultati e limiti](agent-output/special-evidence-dossier-v1/report.md).
Secondo lotto: contesto allineato al confronto validato e controllo delle
minacce nella famiglia empirica Grande. Be7 e Nd6 tornano Migliore, false
Grandi recenti 4 -> 2, nessuna Grande corretta persa e zero regressioni.
[Risultati del secondo lotto](agent-output/grande-decision-evidence-v1/report.md).

## Obiettivo e ordine

Priorita: Mossa mancata, Grande, Geniale; successivamente Migliore/Ottima/Buona.
Gli speciali descrivono eventi scacchistici verificabili. Le categorie ordinarie
dipendono anche dalla prima scelta e dalla scala numerica del motore. Cambiare
quelle soglie adesso renderebbe piu difficile attribuire gli effetti delle
modifiche agli speciali.

Il risultato richiesto e maggiore copertura delle etichette confermate oppure
meno false attribuzioni, conservando le classificazioni gia corrette nei gruppi
di sviluppo. Una soluzione nuova richiede comunque una misura: il piano non
garantisce in anticipo che una specifica regola riproduca il riferimento.

## Punto di partenza verificato

Fonte: agent-output/opportunity-sacrifice-batch-v1/verification.json.
Le 262 semimosse recenti approfondite sono le stesse del profilo iniziale.
Le 592 precedenti formano un altro gruppo di sviluppo; non sommare i due
profili recenti come osservazioni indipendenti.

| Categoria | Recenti: riconosciute / attese | Recenti: false attribuzioni | Precedenti: riconosciute / attese | Precedenti: false attribuzioni |
|---|---:|---:|---:|---:|
| Mossa mancata | 8 / 19 | 1 | 3 / 10 | 0 |
| Grande | 7 / 10 | 4 | 11 / 24 | 0 |
| Geniale | 1 / 1 | 0 | 1 / 3 | 0 |

Concordanza complessiva: iniziale 172/262, approfondita 189/262,
precedenti 338/592. Le tre proposte numeriche del confronto successivo sono
state scartate per regressioni. Nessun cambiamento applicativo in quel giro.

## 1. Diagnosi delle varianti, prima delle modifiche

Preparare un unico dossier delle discrepanze speciali, senza avviare il motore.
Per ogni posizione: FEN, mossa giocata, migliore alternativa, risposta migliore
avversaria, esito prima/dopo, valutazioni confrontabili, motivo del rifiuto e
prove disponibili. Riutilizzare i campi e i dati gia presenti negli archivi.

Assegnare ogni caso a una causa verificabile:

- Regola inadeguata: la variante e gia provata ma il criterio la esclude.
- Prova mancante: serve un confronto o una continuazione non registrata.
- Prove discordanti: le ricerche disponibili non sostengono lo stesso esito.
- Differenza con il riferimento non ancora spiegata: nessuna promozione automatica.

Il codice attuale mostra gia due punti concreti: il riconoscimento empirico
Grande esclude tutte le catture; tre delle quattro false Grandi recenti sono
invece promosse dalla famiglia della migliore mossa senza presa dopo errore
avversario. Correggere soltanto l'esclusione delle catture non risolverebbe
la debolezza del criterio positivo.

Dodici Grandi non riconosciute nelle partite precedenti hanno come blocco
registrato un confronto incompleto tra alternative. Verificare se le prove
complete siano recuperabili dai dati grezzi salvati, prima di cercarne altre.

Consegna: tabella delle cause, varianti dimostrative e coppie di esempi positivi
e negativi. Solo dopo questa diagnosi si definisce una modifica generale.

## 2. Mossa mancata: dimostrare quale occasione e andata persa

Per ciascuna delle 11 mancate recenti non riconosciute, ricostruire tre momenti:
posizione prima della mossa avversaria, occasione disponibile, posizione dopo
la risposta giocata. Confrontare la risposta migliore dell'avversario in ogni
variante; una combinazione che funziona soltanto contro una difesa debole non
dimostra un'occasione.

Separare le famiglie: matto perso, occasione vincente persa, difesa per evitare
la sconfitta. L'ultima famiglia e un'ipotesi da verificare, non una nuova
equivalenza automatica con Mossa mancata. Il precedente allargamento generico
al riequilibrio ha gia introdotto un falso positivo e resta escluso.

Cinque casi recenti sono rifiutati per assenza di occasione vincente confermata,
cinque per assenza di errore avversario secondo il criterio numerico, uno per
vantaggio gia presente. Questi sono blocchi del programma, non spiegazioni
scacchistiche sufficienti. La diagnosi deve stabilire quali occasioni esistano
effettivamente prima di rimuovere un blocco.

Controlli rappresentativi: 15.Qe2+ e 20.Be3 di 185262315732;
10...cxd4 e 18.a3 di 184316313800. Controesempio obbligatorio:
31.Nf6+ di 185262315732, attualmente falsa Mossa mancata.

Consegna: regole distinte solo per gli eventi dimostrati, spiegazione della
variante persa e protezione dei casi in cui il vantaggio rimane disponibile.

## 3. Grande: dimostrare la differenza rispetto alle alternative

Studiare insieme le tre Grandi recenti non riconosciute (17...Rxd6 di
184316820266; 8...Nxe4 e 20.Qxf6+ di 185230271130) e le quattro false Grandi.

Per ogni caso identificare la seconda scelta e la conseguenza concreta:
perdita materiale, sconfitta evitata o occasione decisiva mantenuta. Separare
le alternative realmente peggiori da quelle quasi equivalenti. La sola
condizione "prima scelta dopo errore avversario" non costituisce la prova
della decisione decisiva richiesta dal nostro modello.

Una sola mossa legale resta Forzata. Una sola buona scelta fra piu mosse legali
e un caso diverso. Registrare quante alternative sono state esaminate:
MultiPV 5 non dimostra, da solo, l'esclusione di tutte le mosse legali.

La soluzione da progettare e sostituire il criterio empirico troppo generico
con una prova della differenza tra scelte, applicabile anche alle catture.
Preservare i controlli sulle semplici riprese e sull'incasso di tattiche gia
preparate. Le soglie esistenti restano congelate durante questa fase.

Consegna: gestione coerente di catture e mosse senza presa, riduzione delle
false Grandi e motivazione verificabile della scelta decisiva.

## 4. Geniale: verificare il sacrificio e la sua compensazione

Conservare Qxe5, gia riconosciuta nell'approfondimento. Studiare le due
Geniali storiche non riconosciute, Rb3 e Rxf5+, distinguendo fra offerta
persistente, nuovo sacrificio e incasso di una combinazione precedente.

Per ogni candidato: verificare catture legali del materiale offerto, variante
di accettazione, migliore difesa avversaria e compensazione. Cercare anche
un'alternativa valida senza sacrificio. Un pezzo attaccato e una valutazione
favorevole non bastano a provare la genialita secondo il nostro criterio.

Il gruppo recente contiene una sola Geniale confermata: non permette di
dedurre una regola generale affidabile. Conservare i casi dedicati nei test
e verificare in seguito la regola su nuovi esempi. Non usare tempo impiegato
dal giocatore o nuove correzioni numeriche per ottenere l'etichetta attesa.

Consegna: distinguere sacrifici verificati, sacrifici da approfondire e falsi
candidati, preservando l'eliminazione della falsa Geniale 27.Bxc4.

## 5. Misura, budget e criteri di uscita

Prima fase interamente offline. Elaborare casi e controesempi per famiglie,
eseguire un confronto globale dopo una proposta completa per famiglia.
Evitare cicli di ricerca completa o suite browser per ogni singola mossa.

Se servono nuove prove, fissare prima elenco di FEN, domande da risolvere e
budget. Tetto iniziale del lotto: 16 posizioni a 1M nodi e 8 ricerche di
accettazione/conferma a 200k, con le riserve gia previste dall'app. Nessun
retry automatico o ricerca aggiunta per inseguire la classificazione attesa.
Una prova inconcludente rimane tale e viene riportata come limite.

Misurare ogni proposta sui tre gruppi (iniziale, approfondito, precedenti):
riconosciute/attese per categoria, false attribuzioni, correzioni esatte,
regressioni, cambi ancora errati e costo delle nuove prove. Nessuna regola
puo contenere ID, nomi dei giocatori, SAN specifiche o categorie attese.

Integrare quando aumenta la copertura senza nuove false attribuzioni, oppure
riduce false attribuzioni senza perdere speciali corretti; richiedere anche
zero regressioni sulle altre classificazioni del campione di sviluppo.
Se nessuna proposta passa, documentare la causa e fermare quella famiglia:
non moltiplicare soglie o eccezioni fino ad adattarla agli esempi noti.

Per una modifica accettata: test mirati ai casi positivi e negativi, verifica
della riclassificazione degli archivi, poi suite completa/build/browser una
volta sul lotto integrato. Verificare profili e prove salvate senza ricerche
automatiche alla riapertura.

Infine valutare le regole fissate su partite nuove, selezionate prima di
leggerne le etichette. I campioni gia studiati misurano regressioni e sviluppo;
la validazione precedente resta storica. Le cinque partite riservate non
entrano nella scelta delle nuove regole.

## Passaggio alle categorie ordinarie

Passare a Migliore/Ottima/Buona dopo aver completato questo ciclo e separato
i casi dovuti alle prove mancanti. Diagnosi distinta per divergenze nella
prima scelta, confronti non coerenti e scala delle perdite. Eventuali nuove
soglie richiedono un protocollo di calibrazione separato e dati nuovi:
non verranno scelte correggendo una mossa alla volta.

## Avanzamento del 15 ottobre: audit e storia delle occasioni

Completati insieme tre lavori: traccia delle precedenze effettive su 1116
osservazioni, distinzione causale del vantaggio restituito e confronto delle
varianti delle due false Grandi residue. Nove mosse distinte hanno una
candidatura Grande ritirata dalle protezioni materiali: tutti i risultati
finali sono gia corretti. Nessun supporto a categorie speciali diverse e
emerso nei rami eseguiti; i rami non raggiunti restano fuori dalla conclusione.

Integrata v15: 31.Nf6+ conserva Errore grave quando la storia verificata mostra
un vantaggio gia proprio, perso e restituito dall'errore avversario. Restano
Mosse mancate la successiva Rxf6, Bg4/Bxf3 e il matto perso Bh4+. Una mossa
distinta corretta nei due profili, zero regressioni: 176/262 iniziale,
194/262 approfondita e 338/592 precedenti. False Mosse mancate recenti 1 -> 0;
riconosciute corrette invariate. Soglie e valutazioni numeriche invariate.

19.Re1+ e 11.Bc4 restano aperte. La sola uguaglianza o superiorita del
materiale ottenuto dalla seconda variante non basta: declasserebbe anche
Grandi confermate (4.d5 e il caso storico 16.Nd6+). Nessuna nuova regola
materiale integrata; prossima domanda da risolvere e la differenza concreta
fra le scelte, con prove prefissate. Budget motore di questo lotto: zero.

Verifiche: 407 test passati e 1 TODO, build e due prove browser passate,
compresa riclassificazione offline e conservazione delle analisi separate.
Nessun uso delle partite riservate. Risultati di sviluppo, da validare su
nuovi esempi. [Report completo](agent-output/rule-precedence-audit-v1/report.md).

## Avanzamento successivo: prove mancanti e verifica separata

Completato il lotto prefissato di otto casi, prima e dopo la mossa: 16 ricerche
a 1M, 16.004.376 nodi effettivi su tetto 16.080.000, nessun retry. Bc4 si
corregge con il criterio esistente delle alternative vicine; Nxe4 riceve
Grande con una conferma migliore del recupero. I tre casi precedenti ora
hanno confronti completi ma restano non riconosciuti: prove mancanti e regola
insufficiente sono cause distinte.

Il confronto nel flusso reale respinge due estensioni: dare priorità alle
nuove verifiche lascia indietro a6; aggiungere i recuperi corregge Nxe4 ma
regredisce Qd3. Nessuna nuova soglia o eccezione alle SAN è stata integrata.

Accettata soltanto la verifica esplicita delle Grandi empiriche non di matto.
Il comando **Verifica le Grandi** completa le prove disponibili dopo il normale
approfondimento, conservando ordine, budget e classificatore v15. Cinque
archivi verificati, due ricerche aggiuntive registrate: 194 -> 195/262, una
correzione distinta (Bc4), zero regressioni. False Grandi 2 -> 1; corrette
7/10 invariate. Iniziale176/262 e precedenti338/592 invariati. Re1+ resta
aperta, così come Nxe4 nel flusso accettato e gli altri casi non riconosciuti.

I dati sono di sviluppo e il costo include una richiesta facoltativa in più.
Partite riservate non usate. Il prossimo studio sui recuperi deve affrontare
insieme l'effetto sulla mossa successiva; non basta misurare la candidata.
[Report e verifiche](agent-output/empirical-grande-verification-v1/report.md).

## Copertura completa dei casi speciali: v16 e v17

Ledger iniziale su 854 semimosse distinte e 1116 osservazioni. Raccolte 104
FEN prefissate: 40 ricerche riusate, 64 nuove, 61.042.107 nodi entro il tetto
64.320.000, zero retry. Riferimenti riservati esclusi. Studi separati prima
dell'integrazione per cattura dello scaccante, forchetta con scacco, risposta
forzante rinviabile e sacrificio con accettazione obbligata e PV di matto.

Integrate v16/v17: sei mosse distinte corrette, zero regressioni, sette campi
numerici e soglie invariati. Profilo piu completo: Grandi18->21/34, false1->0;
Geniali2->3/4, false0. Corrispondenze180/262 iniziali,198/262 approfondite,
340/592 precedenti. Restano13 Grandi e Rb3 Geniale, non risolte. Confermata
dall'utente la provenienza Game Review delle due Geniali storiche.

La diagnosi dei confronti completi corregge solo Nxe4 aggiuntiva; non autorizza
a sostituire il profilo numerico e regredire Qd3. Infilata breve Bf3 respinta:
Qxc4+ confuta la presa immediata prevista. Prossimo studio sulle offerte
persistenti: confronto della stessa accettazione prima e dopo e delle
alternative quiete, riutilizzando le prove storiche gia raccolte.
[Report del lotto](agent-output/special-completion-v1/report.md).


## v18: confronto causale delle minacce

Il primo candidato di nuova minaccia dopo Imprecisione e stato respinto:
correggeva Qh5 ma promuoveva falsamente Kb6. Un distinto protocollo causale
riconosce che l'obbligo di parare scacco limita le opzioni legali precedenti.
La nuova famiglia offensiva richiede assenza di scacco entrante; le difese
gia riconosciute non cambiano. Qh5 Great,Kb6 Best,tutti1116 casi verificati,
zero regressioni. Ora Grandi22/34 e Geniali3/4,FP0 per entrambe;13casi aperti.
Score e soglie invariati.442test,build e due browserPASS.


## v19/v20: recuperi verificati e attacchi di scoperta

Integrata una verifica supplementare1M della Grande che conserva i profili
numerici;Nxe4Grande,Qd3Errore,nessuna propagazione di nuove valutazioni.
Integrata la preparazione quieta di nuovi scacchi di scoperta dopo errori
avversari: Re1Grande. Ogni estensione verificata su1116osservazioni e flussi
canonici;0regressioni,0FP. Dopo verifica facoltativa:24/34Grandi e3/4Geniali.
Le10Grandi recenti sono tutte corrette;restano10Grandi precedenti eRb3Geniale.
[Report e QA](agent-output/grande-recovery-proof-v1/report.md).


## v21: verifica completa dei sacrifici

Integrato il comando Verifica i sacrifici:accettazioni e riprese immediate
con ricerche dedicate,senza cambiare i sette campi numerici. Conserva anche
i tentativi terminati fra iterazioni MultiPV,senza certificarli o ripeterli
automaticamente. Preserva prove complete nei risalvataggi vecchi/parziali.

Verificati1116 osservazioni e5archivi canonici recenti:zero regressioni,
Grandi24/34 eGeniali4/4,zerofalseattribuzioni. Restano10Grandi. Rb3corretta
eQxe5corretta anche nel profilo di partenza,giaGeniale in quello raffinato.
Dopo verifica181/262,199/262,343/592. Dati di sviluppo,nessunariserva usata.
[Report v21](agent-output/all-sacrifice-proofs-v1/report.md).


## v22: scelte decisive e alternative indipendenti

Verificati1116 casi e5archivi canonici. Qxc7,Nc4,e6+,Nxc3 diventano Grandi
con prove separate e punteggi invariati.28/34Grandi e4/4Geniali,zero false
attribuzioni e regressioni.181/262,199/262,347/592 dopo verifiche facoltative.
Nessuna modifica alle etichette di riferimento;restano6Grandi.

Le prime ipotesi sono state respinte per falseNc3/Qxf6. La versione integrata
verifica tutte le alternative indipendentemente e distingue il ripristino
di una rotta di matto gia disponibile da una nuova decisione. Nuovo comando
Verifica le scelte decisive,max12mosse24FEN per richiesta;risultati incompleti
e prove complete conservati,nessunretryautomatico,riusooffline0worker.
509test+1TODO57file,build e5browserPASS. Dati di sviluppo,nonvalidazione
indipendente. [Report v22](agent-output/native-winning-integration-v1/report.md).

## v23: tre famiglie tattiche con prove separate

Integrati Qxa8, Nd5 e Bf3: fuga della donna con cattura vantaggiosa unica,
fuga di cavallo che sfrutta un'inchiodatura relativa alla donna, infilata
sulle torri con strategia legale verificata entro due proprie mosse.
Il guadagno di Nd5 è condizionale alla cattura del cavallo; la prova di Bf3
ha un orizzonte limitato e non dimostra una vittoria contro ogni difesa.
Niente identificativi di partite, rating, tempi o nuove soglie numeriche.

Le famiglie richiedono la coppia di prove valide a 1M nodi nella vista
approfondita. Il planner seleziona anche la fuga del cavallo quando la
semplice minaccia materiale non la coglie. Archivi v22 riconosciuti; le
prove separate non si applicano alla vista iniziale quando si riapre.

Replay automatico su 1116 osservazioni: +3 corrette, zero regressioni o
falsi positivi speciali, sette campi numerici invariati. Totale 31/34 Grandi,
4/4 Geniali su 854 mosse distinte di sviluppo. Le Grandi c6, axb4 e Ne4
restano aperte; Carlo non ricorda la fonte e i riferimenti non sono cambiati.
Nessuna nuova ricerca del motore durante l'integrazione.

## v24: unica scelta che conserva un vantaggio relativo

axb4 diventa Grande dopo una verifica indipendente di tutte quattro le
alternative. La simmetria del modello SF19 definisce l'asse a mezzo punto:
interi intervalli di arrotondamento sopra tale asse per la scelta giocata,
sotto per ogni alternativa, anche nelle rispettive posizioni figlie.
Questo non equivale a una vittoria probabile o forzata. Nessun nuovo valore
adattato al campione; i limiti di coerenza e le curve numeriche non cambiano.

Necessari nuova conseguenza forzante e tutti i certificati completi. Le
esclusioni delle riprese e dell'incasso di forchette restano attive. La
selezione non legge le etichette attese: fra1116osservazioni,9candidati con
prove compatibili,8giaGrandi euna nuova verifica,4FEN1M. Replay passato.

App v24:32/34Grandi,4/4Geniali,zero false attribuzioni o regressioni nel
campione di sviluppo. 556test+1TODO,60file;3browserPASS,buildPASS. Nuovi
certificati con lo stesso formato e budget1M,visibili solo nell'approfondimento.

Studio separato per l'instabilita: tutte5posizioni che a5M avevano cambiato
bestmove,confronto incompleto o esito discordante,10FENa10M,senza retry.
c6eNe4ora hanno confronti completati concordi,ma distano28e13cp dalla
seconda scelta. Nessuna regola forzata per attribuireGrande: chiesta aCarlo
la verifica delle due etichette,senza modificarle nel riferimento.
