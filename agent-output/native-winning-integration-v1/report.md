# Scelte decisive verificate: v22

Integrata la verifica delle scelte forzanti che conservano un esito vincente
nel modello del motore mentre le alternative analizzate non lo conservano.
Ogni alternativa richiede anche una ricerca indipendente della posizione
successiva. Il confronto aggiunge prove alla categoria e conserva i sette
campi numerici dell'analisi mostrata.

Quattro Grandi recuperate: Qxc7, Nc4, e6+ e Nxc3. Nessuna categoria
precedentemente corretta e stata peggiorata nel campione di sviluppo.

| Categoria nel profilo piu completo | v21 | v22 | False attribuzioni |
|---|---:|---:|---:|
| Grande | 24/34 | 28/34 | 0 |
| Geniale | 4/4 | 4/4 | 0 |

Controllate tutte le 1.116 osservazioni delle 13 partite di sviluppo e i
cinque archivi canonici recenti. Prima della misura e stata riprodotta la
baseline v21. Il piano normale, i motori originali, i sette campi numerici
e la vista iniziale restano invariati. Corrispondenze dopo le verifiche:
181/262 sui profili di partenza, 199/262 sui gia approfonditi, 347/592 sui
precedenti. Le sei Grandi ancora aperte rimangono nell'obiettivo.

Il comando **Verifica le scelte decisive** usa prima la coppia prima/dopo
e poi le posizioni delle alternative pertinenti, fino a 12 mosse e 24 FEN
per richiesta. Le prove incomplete vengono conservate senza certificare una
categoria o ripetere automaticamente la ricerca. I risalvataggi di analisi
vecchie o parziali conservano i certificati completi. Quando tutte le prove
sono gia disponibili, il comando funziona offline senza avviare il motore.

Il primo candidato e stato respinto dopo il controllo esteso: promuoveva
Nc3 e Qxf6. La conferma indipendente mostra che anche Ne5 conserva un esito
vincente, escludendo la falsa Nc3. Qxf6 ripristina una rotta di matto gia
disponibile prima dell'interposizione precedente: una prova legale distingue
questa continuazione ordinaria da una nuova decisione. Non sono state aggiunte
eccezioni per partita, mossa, rating o fase di gioco, ne nuove soglie numeriche.

Il modello WDL deriva dai parametri pubblici di
[Stockfish 19](https://github.com/official-stockfish/Stockfish/blob/sf_19/src/uci.cpp).
Dal cp arrotondato si ricavano tutti gli intervalli compatibili, senza
inventare un WDL esatto. Confronto con 538 righe raw cp+wdl: zero discrepanze.
E un modello del motore, non una probabilita umana o il criterio privato di
Chess.com. La copertura dichiarata riguarda le alternative analizzate.

Ricerche nuove per lo studio: 60 posizioni supplementari e 24 conferme delle
alternative, tutte a un milione di nodi; 34 ricerche riusate. 84.029.041 nodi
entro 84.420.000, zero retry. I replay dei raw sono superati. Il verificatore
del flusso pubblico ha riusato 156 packet e non ha avviato ricerche nuove.

QA: 509 test superati, un TODO, 57 file; build superata e cinque prove browser
superate. Compresi: tutte le alternative prima di promuovere Qxc7, Qxf6 ancora
Migliore, confronto numerico identico, salvataggio e riapertura offline,
riuso delle prove senza worker, precedenti verifiche Nxe4/Qd3 e Rb3.

Prove: `verification.json`, `qa-checks.json`, protocolli e snapshot delle
sorgenti in questa cartella. Gli script congelati sono monouso.

Sono dati di sviluppo, non una validazione indipendente. Non e dimostrata
una corrispondenza generale con Chess.com. Le riserve non sono state lette.
