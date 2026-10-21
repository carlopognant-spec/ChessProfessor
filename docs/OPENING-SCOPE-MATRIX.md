# P01 — Matrice della copertura delle posizioni di apertura

Fotografia: 2026-10-20. Generata da `node scripts/audit-opening-scope.mjs`; verifica offline con `--check`.

Questa misura riguarda il raggiungimento delle posizioni nominate dalle fonti. Non certifica la completezza di un corso, dei suoi commenti, degli esercizi o di tutta la teoria. Il perimetro è una proposta da discutere.

Fonti: 12377 record eco.json + 3865 record Lichess = 16242 riferimenti; 12723 ordini distinti; **12322 posizioni finali distinte**.

I 280 corsi raggiungono 1919 posizioni con almeno un ordine delle fonti e altre 201 solo per trasposizione. 0 posizioni proseguono oltre un corso terminato; 10202 non compaiono nei corsi e richiedono rami diversi.

Lichess aggiunge 346 sequenze e 216 posizioni rispetto al catalogo locale. Non sono altrettanti nuovi corsi. 655 gruppi richiedono una revisione della famiglia; 897 riferimenti hanno un nome primario esplicito in conflitto con il raggruppamento attuale.

Per altre 2030 posizioni la famiglia resta quella dell'app senza una regola sul nome primario: sono assegnazioni non revisionate, non conferme di correttezza. I conflitti segnalati e queste assegnazioni possono sovrapporsi.

Il flag upstream isEcoRoot individua 499 ancore ECO; manca il flag per A00. Copertura delle posizioni di queste ancore: {"exact":291,"absent":184,"transposition":24}. Le ancore sono una tappa di ampiezza, non un elenco di tutte le varianti.

## Legenda

- **Esatta / completo-posizione:** almeno un ordine di mosse documentato è prefisso di un corso. Non equivale a variante didatticamente completa.
- **Trasposizione / parziale:** stessa posizione con turno, arrocco ed en passant legale, ma ordine documentato non giocabile per intero.
- **Oltre corso / parziale:** un corso è prefisso della fonte e finisce prima della sua posizione caratteristica.
- **Assente / mancante:** posizione non raggiunta e nessun corso intero è prefisso della fonte.
- **Duplicato-alias-posizione:** riferimenti raggruppati sullo stesso stato; nomi e ordini restano conservati. Non dimostra che gli ordini siano didatticamente equivalenti.
- **Incerto:** flag `classificationReview` per famiglie discordanti o conflitti fra nome primario e assegnazione attuale. Può trattarsi di una vera trasposizione o di un errore di instradamento. La presenza della posizione resta misurabile.

## Tutte le famiglie attuali

Le posizioni sono attribuite alla famiglia proposta dal nome primario del riferimento canonico, quando esplicito; negli altri casi resta il raggruppamento attuale. Le regole sono solo nello script di audit: il catalogo applicativo non è modificato. I corsi che raggiungono una posizione possono appartenere ad altre famiglie. I conteggi sono additivi, ma la proposta di tassonomia richiede revisione editoriale.

| Famiglia | Corsi | Posizioni fonte | Esatta | Trasposizione | Oltre corso | Assente | Famiglia incerta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Partita Italiana | 11 | 402 | 95 | 7 | 0 | 300 | 2 |
| Partita Spagnola | 14 | 815 | 134 | 13 | 0 | 668 | 1 |
| Difesa Siciliana | 19 | 1726 | 191 | 17 | 0 | 1518 | 0 |
| Difesa Francese | 14 | 547 | 122 | 3 | 0 | 422 | 2 |
| Difesa Caro-Kann | 16 | 368 | 87 | 15 | 0 | 266 | 23 |
| Difesa Scandinava | 6 | 134 | 37 | 3 | 0 | 94 | 0 |
| Difesa Pirc e Moderna | 6 | 210 | 38 | 2 | 0 | 170 | 5 |
| Difesa Alekhine | 6 | 145 | 44 | 1 | 0 | 100 | 16 |
| Difesa Petrov | 6 | 104 | 23 | 2 | 0 | 79 | 4 |
| Partita Scozzese | 5 | 116 | 31 | 0 | 0 | 85 | 2 |
| Partita Viennese | 5 | 138 | 28 | 6 | 0 | 104 | 3 |
| Gambetto di Re | 6 | 259 | 35 | 1 | 0 | 223 | 12 |
| Difesa Philidor | 5 | 85 | 26 | 2 | 0 | 57 | 1 |
| Gambetto di Donna | 17 | 1581 | 148 | 42 | 0 | 1391 | 140 |
| Sistema di Londra | 5 | 49 | 13 | 5 | 0 | 31 | 2 |
| Difesa Est-Indiana | 14 | 798 | 114 | 15 | 0 | 669 | 4 |
| Difesa Grünfeld | 5 | 426 | 49 | 7 | 0 | 370 | 12 |
| Difesa Nimzo-Indiana | 5 | 437 | 55 | 2 | 0 | 380 | 13 |
| Difesa Ovest-Indiana | 5 | 327 | 55 | 1 | 0 | 271 | 0 |
| Apertura Catalana | 5 | 191 | 33 | 3 | 0 | 155 | 3 |
| Difesa Olandese | 6 | 311 | 20 | 13 | 0 | 278 | 5 |
| Difesa Benoni e Benko | 6 | 505 | 73 | 2 | 0 | 430 | 4 |
| Gambetto di Budapest | 5 | 33 | 17 | 0 | 0 | 16 | 0 |
| Apertura Inglese | 10 | 722 | 90 | 22 | 0 | 610 | 178 |
| Apertura Réti | 6 | 235 | 20 | 1 | 0 | 214 | 96 |
| Partita dei Quattro Cavalli | 6 | 124 | 40 | 3 | 0 | 81 | 62 |
| Apertura Larsen | 6 | 24 | 14 | 0 | 0 | 10 | 1 |
| Apertura Bird | 6 | 91 | 32 | 0 | 0 | 59 | 4 |
| Attacco Trompowsky | 6 | 81 | 31 | 0 | 0 | 50 | 0 |
| Sistemi Colle e Torre | 6 | 100 | 22 | 8 | 0 | 70 | 2 |
| Difesa Bogo-Indiana | 6 | 80 | 37 | 0 | 0 | 43 | 1 |
| Difesa Vecchia Indiana | 6 | 170 | 24 | 0 | 0 | 146 | 1 |
| Difesa Nimzowitsch | 6 | 65 | 16 | 0 | 0 | 49 | 36 |
| Difesa Owen | 6 | 29 | 14 | 0 | 0 | 15 | 1 |
| Altre aperture di Re | 6 | 277 | 47 | 0 | 0 | 230 | 12 |
| Aperture di Donna e sistemi | 6 | 244 | 34 | 5 | 0 | 205 | 3 |
| Altre aperture e sistemi | 6 | 373 | 30 | 0 | 0 | 343 | 4 |

## Esempi verificabili per famiglia

Selezione meccanica: fino a quattro posizioni assenti per famiglia, dando precedenza ai nomi primari riconosciuti e poi a lunghezza della linea e nome. Non è una graduatoria di importanza o frequenza. La proposta editoriale e le priorità sono nel rapporto P01.

### Partita Italiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:10472364e7419646 | Italian Game | e4 e5 Nf3 Nc6 Bc4 a6 |
| position:de9014fd06f09bf2 | Italian Game: Anti-Fried Liver Defense | e4 e5 Nf3 Nc6 Bc4 h6 |
| position:99644c526119d8b1 | Italian Game: Blackburne-Kostić Gambit | e4 e5 Nf3 Nc6 Bc4 Nd4 |
| position:b9446450a94c63c9 | Italian Game: Paris Defense | e4 e5 Nf3 Nc6 Bc4 d6 |

### Partita Spagnola

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:8fc5e17d80cb76cc | Ruy Lopez - 3...Qf6!? | e4 e5 Nf3 Nc6 Bb5 Qf6 |
| position:af80ce80d8ea9375 | Ruy Lopez: Alapin Defense | e4 e5 Nf3 Nc6 Bb5 Bb4 |
| position:12f3df2bf49b8675 | Ruy Lopez: Bird Variation | e4 e5 Nf3 Nc6 Bb5 Nd4 |
| position:8378feea9d7ac26b | Ruy Lopez: Brentano Gambit | e4 e5 Nf3 Nc6 Bb5 g5 |

### Difesa Siciliana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:8bec05e3bc99e0d7 | Sicilian Defense: Amazon Attack | e4 c5 Qg4 |
| position:30015cdf230a4dfb | Sicilian Defense: Bowdler Attack | e4 c5 Bc4 |
| position:5d892eead997127c | Sicilian Defense: Brick Variation | e4 c5 Nh3 |
| position:302d3c474a286a87 | Sicilian Defense: Grob Variation | e4 c5 g4 |

### Difesa Francese

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:fb58b653eec426c0 | French Defense: Banzai-Leong Gambit | e4 e6 b4 |
| position:a8f7c3dac8b951f5 | French Defense: Bird Invitation | e4 e6 Bb5 |
| position:6d67eb5829828651 | French Defense: Chigorin Variation | e4 e6 Qe2 |
| position:8cfacde59207d69c | French Defense: Horwitz Attack | e4 e6 b3 |

### Difesa Caro-Kann

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:339fd59d88c4637f | Caro-Kann Defense | e4 c6 Nc3 |
| position:c41b55b635e5df42 | Caro-Kann Defense: Breyer Variation | e4 c6 d3 |
| position:aa27f4b4a59f5d74 | Caro-Kann Defense: Euwe Attack | e4 c6 b3 |
| position:8b0b895cde80069d | Caro-Kann Defense: Labahn Attack | e4 c6 b4 |

### Difesa Scandinava

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:d436671759544801 | Scandinavian Defense | e4 d5 b3 |
| position:cb607f91418ddba9 | Scandinavian Defense: Zilbermints Gambit | e4 d5 b4 |
| position:f99c6fcc88b945ad | Scandinavian: 2.d3 | e4 d5 d3 |
| position:28bc34e4710a4026 | Scandinavian: 2.e5 | e4 d5 e5 |

### Difesa Pirc e Moderna

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:2e8e3742de1bf6cb | Pirc | e4 d6 g3 |
| position:5fc7648d76cae32a | Pirc | e4 d6 c4 |
| position:aa647ab24076de88 | Pirc: 2.Nc3 | e4 d6 Nc3 |
| position:c57e36096da091bd | Pirc: 2.Nf3 | e4 d6 Nf3 |

### Difesa Alekhine

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:411c1a59186e799b | Alekhine Defense: Krejcik Variation | e4 Nf6 Bc4 |
| position:d3671f5491ea814e | Alekhine Defense: Maróczy Variation | e4 Nf6 d3 |
| position:92107e9053faeb81 | Alekhine Defence: Krejcik Variation | e4 Nf6 Bc4 Nxe4 |
| position:2dcb1c645251fd2f | Alekhine Defense, QGD | d4 d5 c4 g6 |

### Difesa Petrov

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:222ad559aecda0e4 | Russian Game: 3.d3 | e4 e5 Nf3 Nf6 d3 |
| position:49319fbc34e17d4f | Petrov's Defense: Damiano Variation | e4 e5 Nf3 Nf6 Nxe5 Nxe4 |
| position:1efdacbf3b413c37 | Petrov's Defense: Modern Attack, Symmetrical Variation | e4 e5 Nf3 Nf6 d4 d5 |
| position:e607158f86972b59 | Petrov's Defense: Stafford Gambit | e4 e5 Nf3 Nf6 Nxe5 Nc6 |

### Partita Scozzese

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:d305d105a78aa738 | Scotch Game: Lolli Variation | e4 e5 Nf3 Nc6 d4 Nxd4 |
| position:f5a08cce23bebb3c | Scotch Game: Relfsson Gambit | e4 e5 Nf3 Nc6 d4 exd4 Bb5 |
| position:5d85664193016c77 | Scotch Game: Malaniuk Variation | e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bb4+ |
| position:8437f32cbbf7c5e9 | Scotch Game: Scotch Gambit, Göring Gambit Declined | e4 e5 Nf3 Nc6 d4 exd4 c3 d5 |

### Partita Viennese

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:a2b7ad2da2ae8ca8 | Vienna Game: Anderssen Defense | e4 e5 Nc3 Bc5 |
| position:29affa999a692158 | Vienna: 2...Bb4 | e4 e5 Nc3 Bb4 |
| position:b8c712624b054de6 | Vienna: 2...d6 | e4 e5 Nc3 d6 |
| position:32538e3b95bf3cd2 | Vienna Gambit, with Max Lange Defense | e4 e5 Nc3 Nc6 f4 |

### Gambetto di Re

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:c0a73987e04237d1 | King's Gambit Declined: Keene's Defense | e4 e5 f4 Qh4+ |
| position:178c87b1cd6b90a6 | King's Gambit Declined: Mafia Defense | e4 c5 f4 e5 |
| position:be28c1e0bd005da8 | King's Gambit Declined: Norwalde Variation | e4 e5 f4 Qf6 |
| position:6d6fdbd167778462 | King's Gambit Declined: Panteldakis Countergambit | e4 e5 f4 f5 |

### Difesa Philidor

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:0bcfe56d62421d33 | Philidor Defense | e4 e5 Nf3 d6 Bc4 |
| position:a58482e82d784f03 | Philidor Defense | e4 e5 Nf3 d6 Bc4 Be7 |
| position:462626f62528bead | Philidor Defense: 3...Nc6 | e4 e5 Nf3 d6 d4 Nc6 |
| position:d2efc6f044625ddb | Philidor Defense: Lopez Countergambit | e4 e5 Nf3 d6 Bc4 f5 |

### Gambetto di Donna

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:f22b3de21713bacf | Queen's Gambit Declined: Austrian Defense | d4 d5 c4 c5 |
| position:4cc5dea386d37843 | Queen's Gambit Declined: Baltic Defense | d4 d5 c4 Bf5 |
| position:0b2d32db8c70ec3e | Queen's Gambit Declined: Marshall Defense | d4 d5 c4 Nf6 |
| position:0cfd395775958876 | Queen's Gambit Declined: Zilbermints Gambit | d4 d5 c4 b5 |

### Sistema di Londra

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:fca0791a1f178c56 | London System Indian Setup with early Bf4 and Black ...e6 | d4 Nf6 Bf4 e6 |
| position:b6a3dae05233c0c2 | London System Main Base Position with ...d5 | d4 d5 Bf4 Nf6 |
| position:c814711fe6ba89a9 | London System Indian Setup with 2. Bf4 e6 | d4 Nf6 Bf4 e6 e3 |
| position:d28a97c9db345ee7 | London System Main Line with ...d5 | d4 Nf6 Bf4 d5 e3 |

### Difesa Est-Indiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:068ac9242676752b | King's Indian: 3.Bg5 | d4 Nf6 c4 g6 Bg5 |
| position:3d4b7c060400c1bd | King's Indian: 3.g3 | d4 Nf6 c4 g6 g3 Bg7 |
| position:f83693ca375ef083 | King's Indian: 3.Nc3 c5 | d4 Nf6 c4 g6 Nc3 c5 |
| position:f6c9ac74946c2a5f | King's Indian: 3.Nc3 c6 | d4 Nf6 c4 g6 Nc3 c6 |

### Difesa Grünfeld

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:e9871f93912d947e | Neo-Grünfeld Defense: Goglidze Attack | d4 Nf6 c4 g6 f3 d5 |
| position:b668f51d16ee1c75 | Neo-Grünfeld Defense: with Nf3 | d4 Nf6 c4 g6 Nf3 d5 |
| position:d956bb15ebadb5f1 | Gruenfeld: 4.e3 | d4 Nf6 c4 g6 Nc3 d5 e3 |
| position:e4a296cbd9b344a9 | Gruenfeld: 4.g3 | d4 Nf6 c4 g6 Nc3 d5 g3 |

### Difesa Nimzo-Indiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:6bc1c1d284afb7c9 | Nimzo-Indian Defense: Dilworth Gambit | d4 Nf6 c4 e6 Nc3 Bb4 e4 |
| position:ac5897f26faa4055 | Nimzo-Indian Defense: Kmoch Variation | d4 Nf6 c4 e6 Nc3 Bb4 f3 |
| position:25d62ec48f5cdff8 | Nimzo-Indian Defense: Mikenas Attack | d4 Nf6 c4 e6 Nc3 Bb4 Qd3 |
| position:8eea9ca3cd4d6437 | Nimzo-Indian Defense: Romanishin Variation | d4 Nf6 c4 e6 Nc3 Bb4 g3 |

### Difesa Ovest-Indiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:020310dda880cd30 | Pseudo Queen's Indian Defense | d4 Nf6 Nf3 b6 |
| position:3e956f9cc5b4d183 | Queen's Indian Accelerated | d4 Nf6 c4 b6 |
| position:bfd31a4e5761694f | Queen's Indian Defense: Miles Variation | d4 Nf6 c4 e6 Nf3 b6 Bf4 |
| position:250ae771e33e0e43 | Queen's Indian: 4.Bg5 | d4 Nf6 c4 e6 Nf3 b6 Bg5 |

### Apertura Catalana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:9d39d93a4ed59931 | Catalan Opening: Hungarian Gambit | d4 Nf6 c4 e6 g3 e5 |
| position:55fa00c02ec956af | Catalan: 3...c5 | d4 Nf6 c4 e6 g3 c5 |
| position:a7c0d1fc6757aed9 | Catalan: 3...c6 | d4 Nf6 c4 e6 g3 c6 |
| position:b42cd12bcf60ff2b | Catalan: 3...Bb4+ 4.Nd2 | d4 Nf6 c4 e6 g3 Bb4+ Nd2 |

### Difesa Olandese

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:c420bd07325b8308 | Dutch Defense | d4 f5 c4 |
| position:64f54c6afdaad248 | Dutch Defense: Alapin Variation | d4 f5 Qd3 |
| position:2910110d8f354f69 | Dutch Defense: Korchnoi Attack | d4 f5 h3 |
| position:23c9ebd0a8009b70 | Dutch Defense: Krejcik Gambit | d4 f5 g4 |

### Difesa Benoni e Benko

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:64256935ba1705f0 | Benko Opening | g3 e5 |
| position:647478eed73fe06c | Benko Opening | g3 d5 |
| position:6ac16847d53e247f | Benko Opening | g3 b6 |
| position:143b3dbdae653b8c | Benko Opening | g3 d5 Bg2 |

### Gambetto di Budapest

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:ba5ccdb7d6ae4054 | Budapest: 3.d5 | d4 Nf6 c4 e5 d5 |
| position:f7f257bca2613fc0 | Budapest: 3.e3 | d4 Nf6 c4 e5 e3 |
| position:c14eee2a283900d2 | Budapest: 3...Ng4 4.e3 | d4 Nf6 c4 e5 dxe5 Ng4 e3 |
| position:b8a3e05ef8e8598a | Budapest: Fajarowicz, 4.Nd2 | d4 Nf6 c4 e5 dxe5 Ne4 Nd2 |

### Apertura Inglese

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:0189b3eea90287be | English Opening, 1...a6 | c4 a6 |
| position:b9a4f622afd270e9 | English Opening: Anglo-Lithuanian Variation | c4 Nc6 |
| position:f211cf2b133a9d28 | English Opening: Anglo-Scandinavian Defense | c4 d5 |
| position:a8cb699cfcbdb0d1 | English Opening: Caro-Kann Defensive System | c4 c6 |

### Apertura Réti

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:ce36891acfcdb69e | Zukertort Opening: Arctic Defense | Nf3 f6 |
| position:e086a9523329834a | Zukertort Opening: Basman Defense | Nf3 h6 |
| position:f533973f1b17fabb | Zukertort Opening: Black Mustang Defense | Nf3 Nc6 |
| position:bb5e07ade98ef339 | Zukertort Opening: Dutch Variation | Nf3 f5 |

### Partita dei Quattro Cavalli

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:4b421c3f63a159fa | Four Knights Game: Gunsberg Variation | e4 e5 Nf3 Nc6 Nc3 Nf6 a3 |
| position:30896ee1bbda1e12 | Four Knights Game: Halloween Gambit | e4 e5 Nf3 Nc6 Nc3 Nf6 Nxe5 |
| position:ff34e1d2a986547d | Four Knights Game: Naroditsky Variation | e4 e5 Nf3 Nc6 Nc3 Nf6 Nd5 |
| position:34145f114771bf56 | Four Knights: Van der Wiel Variation | e4 e5 Nf3 Nc6 Nc3 Nf6 Be2 |

### Apertura Larsen

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:447eb62b4d1173ad | Nimzo-Larsen Attack: Polish Variation | b3 b5 |
| position:20b00b9c814ff06a | Nimzo-Larsen Attack: Classical Variation | Nf3 d5 b3 |
| position:72e98c39be1270fd | Nimzo-Larsen Attack: Graz Attack | b3 d5 Ba3 |
| position:3092cf3221bf45cd | Nimzo-Larsen Attack: Norfolk Gambit | Nf3 d5 b3 c5 e4 |

### Apertura Bird

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:20210f8708386ebc | Bird Opening: Hobbs Gambit | f4 g5 |
| position:c3442bce5c9e4dff | Bird Opening: Horsefly Defense | f4 Nh6 |
| position:91fb1c1d9a041022 | Bird Opening: Myers Defense | f4 b5 |
| position:f4bb7e1733760e91 | Bird: 1..d6 | f4 d6 |

### Attacco Trompowsky

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:b4cf1c05b7f381dd | Trompowsky 2...d6 | d4 Nf6 Bg5 d6 |
| position:fad0193fad37e4b5 | Trompowsky 2...g6 | d4 Nf6 Bg5 g6 |
| position:d22d217d75b364f3 | Trompowsky 2...d6 3.Bxf6 | d4 Nf6 Bg5 d6 Bxf6 |
| position:ecf502847bede82e | Trompowsky 2...d6 3.Nc3 | d4 Nf6 Bg5 d6 Nc3 |

### Sistemi Colle e Torre

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:35d6e9886ce8da7a | Colle: 3...Bg4 | d4 d5 Nf3 Nf6 e3 Bg4 |
| position:420b83cf1e4037ae | Colle: 3...c6 | d4 d5 Nf3 Nf6 e3 c6 |
| position:9ec958d31cad2e6d | Colle: 3...g6 | d4 d5 Nf3 Nf6 e3 g6 |
| position:9a3902a0c6647627 | Torre Attack: 3...b6 | d4 Nf6 Nf3 e6 Bg5 b6 |

### Difesa Bogo-Indiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:5dee45403ba83957 | Bogo-Indian Defense: New England Variation | d4 Nf6 c4 e6 Nf3 Bb4+ Nfd2 |
| position:4a419fc25dbef7fc | Bogo-Indian Defense: Vitolins Variation | d4 Nf6 c4 e6 Nf3 Bb4+ Bd2 c5 |
| position:6ffa506f18a299e9 | Bogo-Indian: 4.Nbd2 b6 | d4 Nf6 c4 e6 Nf3 Bb4+ Nbd2 b6 |
| position:54da6f734273b082 | Bogo-Indian: 4.Nbd2 d5 | d4 Nf6 c4 e6 Nf3 Bb4+ Nbd2 d5 |

### Difesa Vecchia Indiana

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:70e3078305ac3fad | Old Indian Defense | d4 d6 c4 |
| position:7d455e074637d97c | Old Indian Defense: Aged Gibbon Gambit | d4 Nf6 c4 d6 g4 |
| position:36ef67961d69bb32 | Old Indian: 3.g3 | d4 Nf6 c4 d6 g3 |
| position:152b3f1853e03681 | Old Indian Defense: Czech Variation, with Nc3 | d4 Nf6 c4 d6 Nc3 c6 |

### Difesa Nimzowitsch

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:98e9ae33f140fb2f | Nimzowitsch Defence: 2.Nc3 | e4 Nc6 Nc3 |
| position:3a5590ae7a143850 | Nimzowitsch Defense: Pseudo-Spanish Variation | e4 Nc6 Bb5 |
| position:1917e1614dcc66cc | Nimzowitsch Defense: Wheeler Gambit | e4 Nc6 b4 |
| position:656ccf79f53a2859 | Nimzowitsch Defence, 2...e6 | e4 Nc6 d4 e6 |

### Difesa Owen

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:28479c0e7d18d044 | Owen Defence: French | e4 b6 d4 e6 |
| position:7ece55d3ac285f8b | Owen Defense: Naselwaus Gambit | e4 b6 d4 Bb7 Bg5 |
| position:88f1e3acf300d872 | Owen Defence: 3.Bd3 Nf6 | e4 b6 d4 Bb7 Bd3 Nf6 |
| position:66450724ce5bb755 | Owen Defense: Hekili-Loa Gambit | e4 b6 d4 c5 dxc5 Nc6 |

### Altre aperture di Re

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:20c1a8211612d479 | Bishop's Opening | e4 e5 Bc4 Nc6 |
| position:3e7f7b6445230b0a | Bishop's Opening: 2... b6? | e4 e5 Bc4 b6 |
| position:b310489a8f510ee7 | Bishop's Opening: 2... Be7? | e4 e5 Bc4 Be7 |
| position:9246dc5bda9e3d9c | Bishop's Opening: 2... c5?! | e4 e5 Bc4 c5 |

### Aperture di Donna e sistemi

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:4ae292ddbc8e5d1c | Queen's Pawn Game | d4 d6 |
| position:baf011833697955c | Queen's Pawn: 1...c6 | d4 c6 |
| position:842c2a51eb6d3a09 | Amazon Attack | d4 d5 Qd3 |
| position:2fddd6bc77318262 | Englund Gambit Declined | d4 e5 d5 |

### Altre aperture e sistemi

| ID posizione | Nome fonte | Sequenza caratteristica |
| --- | --- | --- |
| position:8e08ab38f1435343 | Amar Opening | Nh3 |
| position:df61a5151056f8f4 | Anderssen's Opening | a3 |
| position:70b6742d72f7032b | Barnes Opening | f3 |
| position:e52928dd7d828c67 | Clemenz Opening | h3 |

## Matrice integrale e riproduzione

- [Matrice JSON](data/opening-scope-audit.json): tutte le posizioni, i record delle fonti, gli alias, i corsi e le prime diramazioni mancanti.
- `positions`: ID, famiglia/e, nome, ECO, posizione caratteristica, sequenza, genitori, stato, motivazione e corsi collegati.
- `records`: riferimenti originali, nomi, alias, gerarchia sintattica del nome e ordini di mosse; conserva famiglia applicativa e proposta. Il prefisso `eco:` rimanda a `src/data/openingCatalog.json`; `lichess:` a file e riga dello snapshot.
- `frontier`: prima mossa non coperta lungo ogni ordine documentato, con posizione precedente e corsi disponibili. Gruppi sovrapposti: non sommare i target come corsi necessari.
- `missingEdges`: tutte le prime diramazioni mancanti, comprese quelle di ordini alternativi verso posizioni già raggiunte; gli ordini di ingresso restano distinti.
- `courses`: tutti i 280 percorsi correnti con collegamenti alle posizioni raggiunte e provenienza disponibile.
- [Snapshot Lichess e hash](data/opening-audit-sources/manifest.json).
- [Fonte Lichess fissata](https://github.com/lichess-org/chess-openings/tree/a6189a30dc273ccb21fc2536a9a2fefd5592a67a).
- [Fonte eco.json fissata](https://github.com/JeffML/eco.json/tree/36cfd9227f553dec1d39ee20fa0775eea8f8e165).

Controlli: 22948 archi SAN del trie rigiocati legalmente; ID unici, riferimenti ai genitori/corsi e riconciliazione dei conteggi verificati. Nessun motore avviato.
Il confronto delle fonti non è una validazione indipendente: eco.json incorpora anche dati Lichess. Il dataset può contenere linee rare, trappole, errori e nomi ambigui; presenza nel catalogo non significa raccomandazione di giocare la linea.
