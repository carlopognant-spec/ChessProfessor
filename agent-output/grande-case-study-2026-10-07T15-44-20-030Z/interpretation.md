# Grande — lettura scacchistica dei 24 esempi

7 ottobre 2026. Studio descrittivo, non nuova taratura. 14 mosse delle personali P1–P6 e 10 delle due storiche. Dati, FEN, linee e hash in cases.json; tutte le PV root considerate sono state legalmente ripercorse con chess.js (zero PV illegali). Nessuna nuova ricerca motore.

## Cosa possiamo stabilire

[Chess.com](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) include in Grande mosse decisive per l'esito, anche transizioni perso/pari/vinto e unica buona mossa; dichiara maggiore generosità per principianti. Non pubblica criteri operativi completi.

Di seguito separiamo il motivo scacchistico osservabile dalla possibile ragione dell'etichetta. Presenza di una forchetta, cattura, scacco o matto non è condizione sufficiente né prova dell'algoritmo Chess.com. Le fixture contengono categorie, non spiegazioni ufficiali per posizione; non è possibile attribuire con certezza una motivazione privata.

Valutazioni delle cinque root nella tabella: Stockfish 19 large/200k, cp dal giocatore. Depth possono essere diverse; non sono confronti esaustivi né prove di unicità. M significa score mate. Le due colonne riportano PV1/PV2, non necessariamente la valutazione della giocata e della sua miglior alternativa alla medesima depth. In questi 24 esempi la giocata coincide comunque con PV1 della cache.

## Le tue partite: 14 casi

| Caso | Motivo osservabile / possibile lettura | PV1 / PV2 | Cosa non è dimostrato |
|---|---|---|---|
| P1, 23.Qxc7 | Prende un pedone, attacca Nd7, dopo 22...g5 annotata Errore. La PV prosegue Qd8 Qxa7: altri guadagni e pressione. Plausibile sfruttamento dell'errore. | +265 / +147 | Non è una forchetta di due pezzi maggiori; non sappiamo perché sia Grande invece di Migliore. |
| P1, 24.Qe5 | Dopo Nf8 annotata Errore, crea minaccia di matto Qg7 con sostegno dell'alfiere c3. La PV salvata mostra difesa f6 e prosecuzione Qxf6. | +1189 / +275 | Non è uno scacco immediato. Minaccia verificata con una risposta d'attesa, non prova di matto contro tutte le difese. |
| P2, 11.Bxf7 | Cattura una torre; in Kxf7 cede poi l'alfiere: guadagno di qualità convenzionale +2 rispetto a prima della giocata. Segue Kf8 annotata Errore grave. | +76 / −138 | Non è necessariamente unica difesa non perdente: copertura incompleta. |
| P2, 16.Rxf2 | Sotto scacco, cattura l'alfiere che ha giocato Bxf2+ annotata Errore grave; elimina lo scacco e guadagna il pezzo. | +764 / +733 | Kxf2 è quasi equivalente nei dati. L'unicità non spiega l'etichetta: plausibile occasione decisiva sfruttata, algoritmo esatto ignoto. |
| P2, 37.Rd7+ | Avvia il matto: linea legale Kg8 Ra8#. Segue Rxh3 annotata Errore. | M2 / M2 | Anche un'altra root conserva mate2: non è unica mossa che dà matto nei dati. |
| P3, 10.Nxd6+ | Cattura Bd6 e dà scacco; attacca anche Bc8. La difesa cxd6 riprende il cavallo, quindi il doppio attacco non implica guadagno gratuito. Il punto è trovare la risorsa tattica che conserva la posizione. | +118 / −458 | Il beneficio non è “vince anche Bc8”: la PV non lo mostra. La verifica completa v3 del ramo A ora sostiene l'unicità secondo il nostro budget/politica. |
| P3, 21...Bxe6 | Sotto scacco da Re6+ annotata Errore grave, cattura la torre e ottiene netto vantaggio. Difesa concreta e guadagno materiale. | +608 / −608 | È caso coerente anche con l'esperimento esaustivo, non prova della definizione privata Chess.com. |
| P4, 11...Qb4 | Dopo e5 annotata Errore, attacca b2; la PV Nf3 Qxb2 Qd2 Qxd2 Nfxd2 mostra guadagno di pedone e semplificazione. | +280 / +83 | La mossa stessa non dà scacco né cattura. Non tutte le alternative sono perdenti. |
| P4, 15.Nd6+ | Forchetta re e donna b5. La linea Kd7 Nxb5 cxb5 realizza donna contro cavallo, guadagno convenzionale +6 lungo questa sequenza. Punisce Qb5 annotata Errore grave. | +661 / −472 | Non basta rilevare attacco a due pezzi: la prosecuzione rende concreta la forchetta. Verifica esaustiva ancora incompleta. |
| P5, 8...Nxh1 | Cattura una torre dopo Qe2 annotata Errore grave. La PV salvata non recupera subito il cavallo: forte guadagno materiale. | +684 / +128 | Non chiamarlo Geniale: è cattura vantaggiosa, non sacrificio documentato. Altre root non sono tutte perdenti. |
| P5, 14.Qxa8 | Cattura una torre dopo Nf2 annotata Errore; guadagno materiale immediato +5, PV prosegue Bf5 Qxa7. | +632 / +199 | Non è unica buona mossa secondo il ramo A; riferimento può premiare l'occasione sfruttata. |
| P5, 19.Bh6+ | Sequenza di matto legalmente ripercorsa: Kg8 Rxe8+ Bf8 Rxf8#. Segue Kf8 annotata Errore. | M3 / +1537 | L'altra root conserva enorme vantaggio cp; non confondere “unica linea mate mostrata” con “unica mossa vincente”. |
| P6, 7.d4 | Forchetta di pedone su Bc5 e Ne5. La PV Bd6 dxe5 Bxe5 scambia un pedone per un cavallo: +2 convenzionali lungo la sequenza. | +25 / −426 | Il cp prima/dopo resta circa pari: Grande non richiede grande vantaggio assoluto. Il nostro filtro low>=0 con guardia50 la esclude. |
| P6, 16.Nd5 | Centralizza il cavallo e attacca Nf6; nella PV Ned7 Rad1 Qa5 Ne3 cresce l'attività, senza cattura immediata. | +429 / +217 | Motivo meno netto; non c'è forchetta geometrica di due pezzi maggiori e una seconda root conserva vantaggio. Necessita spiegazione contestuale, non soglia costruita per questo caso. |

## Partite storiche: 10 casi

| Caso | Motivo osservabile / possibile lettura | PV1 / PV2 | Limite |
|---|---|---|---|
| Chigorin–Steinitz, 13.Nc4 | Attacca Ba5 e d6, migliora l'attività del cavallo; PV Bb6 a4 c6 Ba3 aumenta pressione su d6. | +134 / +58 | Vantaggio moderato e piccolo distacco; non è prova di tattica vincente. |
| Chigorin–Steinitz, 14...c6 | Mossa strutturale: controlla b5/d5; la PV affronta Ba3 Bc7 e5 dxe5. Possibile risorsa difensiva. | −110 / −205 | La nostra cache valuta comunque il Nero peggio: una soglia “giocata almeno pari” non può coprire questo riferimento. |
| Chigorin–Steinitz, 16.Nd6+ | Scacco, avamposto di cavallo in d6; PV Kf8 a5 Bd8 a6 mostra re costretto a spostarsi e pressione sul lato di donna. | +303 / +117 | Non è forchetta re/donna: i bersagli aggiuntivi immediati sono pedoni. |
| Chigorin–Steinitz, 20.e6+ | Il pedone attacca re f7 e donna d7; ma Kxe6 elimina il pedone. La PV Re1+ Kf6 Bxe7+ continua l'attacco al re. | +186 / +83 | Doppio attacco geometrico NON significa donna vinta: il re può catturare il pedone. Plausibile attrazione/esposizione del re. |
| Chigorin–Steinitz, 22.Re1 | Coordina la torre sulla colonna del re esposto e del proprio cavallo e5; la PV Ba5 Qh5 Rf8 g4 Bxe1 Rxe1 mostra prosecuzione dell'attacco. | +264 / +4 | Nessuna cattura/scacco/forchetta immediata; serve analisi di coordinazione e iniziativa, non solo materiale. |
| Chigorin–Steinitz, 23.Qh5 | Porta la donna verso il re, attacca Nf5; PV g6 Ng4+ Kf7 Rxe7+ Nxe7 Nh6+ continua con scacchi e sacrificio di torre nella linea. | +404 / +180 | La PV non arriva a matto; non dichiarare matto forzato o sacrificio verificato contro ogni difesa. |
| Saint Amant–Staunton, 28...axb4 | Cattura un pedone attaccando Nc3; dopo axb4, Rc4 e Rxb4 attivano la torre e creano pressione su pedoni/cavallo/donna. | +54 / −65 | Non è un grande salto cp; il motivo sembra attività e struttura, con causalità dell'etichetta incerta. |
| Saint Amant–Staunton, 38...Ne4 | Centralizza il cavallo e attacca Nc3; PV d5 Nxc3 Qxc3 Bxd5 introduce scambio e guadagno di pedone. | +84 / +64 | Due root molto vicine: il distacco numerico non spiega Grande. |
| Saint Amant–Staunton, 40...Nxc3 | Cattura il cavallo e attacca entrambe le torri e2/d1. La donna può riprenderlo, ma Qxc3 Bf3 produce un attacco successivo alle torri e guadagno di qualità nella PV. | +328 / +66 | Il motivo è una combinazione su più mosse, non un guadagno automatico della sola forchetta. |
| Saint Amant–Staunton, 41...Bf3 | Attacca Re2; dietro c'è Rd1 sulla stessa diagonale. La PV Rdd2 Qe7 d5 Bxe2 Rxe2 porta alfiere per torre, guadagno di qualità. | +353 / +162 | È pressione/attacco in successione alle torri; non inchiodatura al re. Nessuna prova esaustiva di unicità. |

## Controllo della minaccia Qe5

Eseguito con chess.js dalla FEN dopo P1 24.Qe5: 24...a6 25.Qg7# è una sequenza legale e isCheckmate=true. a6 è una risposta d'attesa scelta per rendere visibile la minaccia, NON la miglior difesa. La cache propone f6. Questa verifica non è nuova ricerca Stockfish né prova di matto contro tutte le risposte.

## Perché Rxg8 può essere un falso positivo del nostro riconoscitore

P3 contiene 23.Rxg8 Rxg8: la seconda cattura riprende la torre appena scambiata. La fixture assegna Migliore al Nero. Il ramo A la chiama Grande perché tutte le altre radici analizzate sono molto peggiori, ma una ricattura naturale può risultare unica senza ricevere etichetta speciale.

Questo suggerisce di studiare il contesto delle catture/ricatture, non di aggiungere subito un'esclusione universale. Bxe6 è anch'essa cattura di torre, ma risponde a Re6+ annotata Errore grave: non è lo stesso scambio immediato. Non sappiamo se Chess.com usi formalmente un filtro “ricattura”; non inventarlo come criterio ufficiale.

## Conseguenza per il progetto

Il primo ramo “unica mossa almeno pari e tutte le altre perdenti” copre soltanto una famiglia. I dati sostengono uno studio di famiglie separate: occasioni materiali/tattiche, matto/attacco al re, risorse difensive, mosse di attività/pressione. Questi sono descrittori dei motivi, non regole già sufficienti per assegnare Grande.

Prima di altre soglie o ricerche, estendere lo studio ai negativi: catture di torre, forchette, scacchi, linee mate e ricatture annotate Migliore/Ottima/altro nelle stesse partite. Se una proprietà ricorre anche nei negativi non è discriminante. Studiare i soli 24 positivi non basta a costruire un classificatore preciso.

Non sommare questi conteggi come categorie esclusive: una mossa può avere più motivi. I numeri geometrici automatici sono descrittivi e non misurano “forchette vincenti”. Le due storiche sono materiale di studio, non diventano validazione indipendente se usate per scegliere regole. Partite 7–10 restano escluse.

## Esito

ESEGUITO: 24 casi identificati, ricostruzione FEN/mosse, attacchi geometrici, controllo PV con chess.js, verifica illustrativa Qe5, controllo hash delle 16 fixture/cache, lettura scacchistica e confronto Rxg8.

NON ESEGUITO: nuovi go Stockfish, modifica app/classificatore/soglie/cache, attribuzione certa di motivazioni Chess.com, taratura, test suite/build/browser, commit/push. File precedenti intatti. STOP.
