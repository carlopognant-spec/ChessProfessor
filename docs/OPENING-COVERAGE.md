# Inventario e avanzamento delle aperture

Perimetro completo A approvato: le 12.322 posizioni delle fonti fissate in P01, ancora in corso di copertura. L'elenco sotto comprende i 197 rami storici e 6 nuovi percorsi della roadmap; alcuni rami storici corrispondono a corsi già presenti. Alias, posizioni e corsi sono conteggi distinti.

Percorsi giocabili: **286**, di cui **188 dell'espansione storica**, **3 nuove linee integralmente documentate** e **3 con prefisso documentato e seguito didattico scritto**. Rami di questo elenco ancora da inserire: **0**; questo numero non misura le posizioni mancanti nel perimetro A. La [verifica attuale Chekhover](OPENING-CHEKHOVER-P022-RESULTS.md) riporta copertura e residui effettivi.

## Metodo e limiti

Ogni nuova linea ha una posizione caratteristica collegata a un record del catalogo eco.json già fissato nel progetto. Un collegamento per trasposizione richiede la stessa posizione, turno, diritti di arrocco e possibilità di en passant. Gli eventuali passi redazionali successivi sono separati dalla parte documentata.

Nell’espansione storica si preferiscono continuazioni già documentate fino a 24 semimosse; il seguito fino alla mossa 16 è un modello didattico costruito offline con Stockfish 16 nativo, un thread, 32 MiB di hash, 200.000 nodi per mossa e hash azzerata. Non è una nuova fonte di teoria, una partita storica o una prova di unicità. Le prime due linee P02.2 hanno 22 e 20 semimosse interamente documentate. La Zaitsev ha dieci semimosse documentate e due didattiche scritte. Il lotto Chekhover successivo aggiunge 56 semimosse documentate e due didattiche scritte in tre percorsi. I seguiti scritti sono verificati con confronti alla stessa radice e budget fissato; nessuna mossa dei sei percorsi della roadmap è generata dal motore. Il browser non avvia il motore. Stockfish 16 nativo non è lo Stockfish 19 del browser.

Ogni ramo ha piani specifici per entrambi i colori e una spiegazione della scelta caratteristica. I 188 percorsi dell'espansione storica hanno almeno due note strategiche individualmente scritte: 388 note, di cui 36 nella Caro-Kann. I 6 percorsi della roadmap aggiungono 19 note minime specifiche, conteggiate separatamente. Le note compaiono dopo aver giocato e sono legate alle sequenze complete revisionate. La revisione integrale dei commenti resta P03.

Le spiegazioni degli altri passaggi descrivono i fatti della scacchiera e riusano il corpus scritto solo nelle stesse posizioni e sequenze. Non vengono dichiarati commenti individualmente scritti per ogni mossa delle 286 linee. La revisione dei passaggi chiave non equivale alla revisione editoriale integrale di tutte le lezioni.

Il riepilogo del turno distingue la propria mossa dalla risposta realmente giocata dall’avversario. Ogni semimossa dispone di una spiegazione posizionale; le note strategiche individuali restano un conteggio distinto. La [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md) mostra i passaggi ancora da scrivere per ogni famiglia.

Il corpus aggiuntivo di 230 note completa i passaggi scoperti nelle famiglie Sistema di Londra, Difesa Nimzo-Indiana, Difesa Ovest-Indiana, Apertura Catalana, Difesa Bogo-Indiana: tutti i loro percorsi hanno ora una nota scritta per ogni coppia. Queste note aggiuntive sono distinte dalle 388 note sui passaggi chiave già conteggiate. Le sequenze sono fissate in openingFullReviewedLines.js; il controllo della linea completa impedisce il riuso dopo una modifica delle mosse.

Le verifiche automatiche certificano legalità, provenienza della posizione, continuità, assenza di duplicati nella famiglia e corrispondenza delle mosse del seguito ai risultati registrati. Non certificano da sole la correttezza di ogni spiegazione strategica o la completezza della teoria di ogni apertura.

Esercizi sulle deviazioni: **286**. Percorsi senza un esercizio costruito validato: **0**. Ogni esercizio parte da una posizione del percorso, aggiunge una deviazione legale e richiede una risorsa concreta. Il confronto con Stockfish 16 usa 200.000 nodi; il guadagno materiale minimo viene inoltre controllato contro tutte le repliche legali immediate. Sono controlli a orizzonte limitato, non dimostrazioni sull’intera partita. Non viene attribuita una frequenza a questi errori, né vengono presentati come partite storiche. Le sei trappole precedenti restano una raccolta distinta.

## Perché i conteggi sono diversi

I conteggi misurano i percorsi insegnati nel sito, non il numero totale di varianti teoriche di un’apertura. Caro-Kann ed Est-Indiana hanno ricevuto approfondimenti dedicati prima dell’ampliamento generale: il loro numero inizialmente maggiore rifletteva la sequenza del lavoro. Gli ampliamenti successivi cercano decisioni mancanti, strutture e risposte avversarie distinte; non impongono lo stesso numero a tutte le famiglie e non usano la quantità di alias ECO come misura di completezza.

La [revisione delle lacune](OPENING-EXPANSION-AUDIT.md) documenta i 37 rami aggiunti nel secondo ampliamento e le linee già coperte che non sono state ricontate con un altro nome.

## Conteggi per famiglia

| Famiglia | Preesistenti | Nuovi | Totale | Esercizi | Note sui passaggi chiave | Ulteriori note per coppia | Rami da inserire |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Partita Italiana | 3 | 8 | 11 | 11 | 16 | 0 | 0 |
| Partita Spagnola | 3 | 11 | 14 | 14 | 22 | 0 | 0 |
| Difesa Siciliana | 4 | 21 | 25 | 25 | 30 | 0 | 0 |
| Difesa Francese | 4 | 10 | 14 | 14 | 20 | 0 | 0 |
| Difesa Caro-Kann | 4 | 12 | 16 | 16 | 36 | 0 | 0 |
| Difesa Scandinava | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Pirc e Moderna | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Alekhine | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Petrov | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Partita Scozzese | 2 | 3 | 5 | 5 | 6 | 0 | 0 |
| Partita Viennese | 2 | 3 | 5 | 5 | 6 | 0 | 0 |
| Gambetto di Re | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Philidor | 2 | 3 | 5 | 5 | 6 | 0 | 0 |
| Gambetto di Donna | 4 | 13 | 17 | 17 | 26 | 0 | 0 |
| Sistema di Londra | 2 | 3 | 5 | 5 | 6 | 51 | 0 |
| Difesa Est-Indiana | 10 | 4 | 14 | 14 | 8 | 0 | 0 |
| Difesa Grünfeld | 2 | 3 | 5 | 5 | 6 | 0 | 0 |
| Difesa Nimzo-Indiana | 2 | 3 | 5 | 5 | 6 | 43 | 0 |
| Difesa Ovest-Indiana | 2 | 3 | 5 | 5 | 6 | 43 | 0 |
| Apertura Catalana | 2 | 3 | 5 | 5 | 6 | 40 | 0 |
| Difesa Olandese | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Benoni e Benko | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Gambetto di Budapest | 2 | 3 | 5 | 5 | 6 | 0 | 0 |
| Apertura Inglese | 2 | 8 | 10 | 10 | 16 | 0 | 0 |
| Apertura Réti | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Partita dei Quattro Cavalli | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Apertura Larsen | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Apertura Bird | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Attacco Trompowsky | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Sistemi Colle e Torre | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Bogo-Indiana | 2 | 4 | 6 | 6 | 8 | 53 | 0 |
| Difesa Vecchia Indiana | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Nimzowitsch | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Difesa Owen | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Altre aperture di Re | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Aperture di Donna e sistemi | 2 | 4 | 6 | 6 | 8 | 0 | 0 |
| Altre aperture e sistemi | 2 | 4 | 6 | 6 | 8 | 0 | 0 |

## Rami dichiarati

### Partita Italiana

- [x] Difesa Ungherese — fonte 03273dbdf84f9af4; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Due Cavalli: attacco a f7 — fonte da0a54c45c2769b6; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Due Cavalli: gambetto con d4 — fonte 8cab70f7974b246c; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Giuoco Piano: centro con d4 — fonte d824a0ee4f9040bc; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Evans Rifiutato — fonte 60382f6d917dcc53; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Due Cavalli: contrattacco Traxler — fonte 4bfdd92f563a5874; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile
- [x] Due Cavalli: variante Ulvestad — fonte 5bcf4cd5e35c8853; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Due Cavalli: attacco Fegatello — fonte f0da3612cfc06321; 22 semimosse documentate, 10 semimosse del seguito controllate; esercizio disponibile

### Partita Spagnola

- [x] Attacco Marshall — fonte f52099fd9b54c35c; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Spagnola Aperta — fonte 9db6da9195bb1215; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Schliemann — fonte 290094f5b04ee6d9; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Steinitz — fonte 25f1a3fa9bef87b3; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Chiusa: sistema Breyer — fonte cfd005a363b278db; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Chiusa: sistema Zaitsev — fonte 158084458dee739b; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Chiusa: sistema Chigorin — fonte 738af975f669ca03; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Arcangelo — fonte a753cd482fd02b56; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Anti-Marshall con a4 — fonte 42c5326955598b61; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Classica con Ac5 — fonte 30447d88b0e97ec0; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Anti-Berlinese con d3 — fonte 9e782e17ca0b9b71; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile

### Difesa Siciliana

- [x] Sveshnikov — fonte 4c0eb791055bad68; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Taimanov — fonte f8da1bcf6982e548; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Kan — fonte 22b0fb818817a75f; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Dragone accelerato — fonte 8f38b356900a7cb1; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Rossolimo — fonte 65d192b2fc3431e3; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Siciliana Chiusa — fonte 18d9323d2ab9d138; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Kalashnikov — fonte aa61eeab3c03aae8; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: attacco Richter-Rauzer — fonte 51cda5086337dacf; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: attacco Sozin — fonte e7fb08bc9a535843; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Smith-Morra Accettato — fonte 433ce895a1903a25; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Grand Prix — fonte aaaf6d7c0eac71ed; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Variante di Mosca — fonte 64c852f5774f3a65; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Siciliana dei Quattro Cavalli — fonte 36c15ba89add8145; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Variante O’Kelly — fonte 2dce191bd2481628; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Scheveningen: attacco Keres — fonte 429ab453a210df60; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Najdorf con 6.Ag5: sviluppo classico — fonte 55f893191e905f8a; 22 semimosse documentate, 0 semimosse del seguito controllate; esercizio disponibile
- [x] Chekhover: 4.Dxd4 e risposta ...Ad7 — fonte df54a8ff7bf70e37; 20 semimosse documentate, 0 semimosse del seguito controllate; esercizio disponibile
- [x] Chekhover Zaitsev: 5...Dd7 e cambio in c6 — fonte 77915f5f49601838; 10 semimosse documentate, 2 semimosse del seguito controllate; esercizio disponibile
- [x] Chekhover: 7.c4 e preparazione del fianchetto — fonte cab3a0b1cf0331d6; 16 semimosse documentate, 0 semimosse del seguito controllate; esercizio disponibile
- [x] Chekhover: 10.Dd3 e arrocco del Nero — fonte ce70dab23d629d53; 19 semimosse documentate, 1 semimosse del seguito controllate; esercizio disponibile
- [x] Chekhover: 11.Dd2 e coordinazione delle torri — fonte aed1668deddb6fa8; 21 semimosse documentate, 1 semimosse del seguito controllate; esercizio disponibile

### Difesa Francese

- [x] Classica con Ag5 e Ae7 — fonte ff7a0ea904f1e15e; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Rubinstein — fonte 4754ebff2bcc8a14; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: Steinitz — fonte 6bfe1e35658ddefa; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] MacCutcheon — fonte 0668ece1cbb95393; 22 semimosse documentate, 10 semimosse del seguito controllate; esercizio disponibile
- [x] Tarrasch: centro chiuso — fonte 359b3fa4d9793316; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Winawer: pedone avvelenato — fonte 0ddc4621f16c7750; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: variante Burn — fonte e25186ba94fdd82a; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Cambio: sistema Monte Carlo — fonte 49d41f66f0817b9b; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Winawer: sfida immediata con a3 — fonte 318df04944d6269f; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Avanzata: gambetto Milner-Barry — fonte 11eb7a6aa6ba189d; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile

### Difesa Caro-Kann

- [x] Classica: sistema Karpov — fonte 78c6c96a3b1383a5; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: Tartakower — fonte 54fe319bc5b4a348; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: Bronstein-Larsen — fonte fa2e53511ef484df; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema dei Due Cavalli — fonte 40fec2de9580ba47; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Fantasy — fonte 8f6aba4781cfcb57; 8 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Gurgenidze — fonte e35f85d83112683f; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Avanzata: sistema Tal — fonte c275dd554bdfc404; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Avanzata: attacco di Baionetta — fonte b9e21a2b90094ef7; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Avanzata: Botvinnik-Carls — fonte e272b862c9432e9a; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Panov: sviluppo con Cc6 — fonte 8c90b24b207afda1; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Panov accelerato — fonte e7f6d44965e56d4b; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Hillbilly — fonte f5d763e58e5ab0cb; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile

### Difesa Scandinava

- [x] Ripresa con Dd6 — fonte 2efb1083f339c3fe; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Ritorno della donna in d8 — fonte e4e4be0b1ad842d6; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Portoghese — fonte cdb42b0b0904b0a8; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Islandese — fonte 4e0a58afd15e4973; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile

### Difesa Pirc e Moderna

- [x] Pirc: sistema Classico — fonte 5a3c8f01c2309bb7; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Pirc: attacco 150 — fonte 50cefd3630e8fead; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Moderna: centro ampio — fonte a2ffc059bcc8755a; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Pirc: fianchetto bianco — fonte baf8b94c94c64dcb; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile

### Difesa Alekhine

- [x] Variante di Cambio — fonte 777a177711196683; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Moderna — fonte b408f039df768f75; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco dei Due Pedoni — fonte 1168607c0c30d7be; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Risposta prudente con Cc3 — fonte 7d1a2bbdfceb4053; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Difesa Petrov

- [x] Gambetto Cochrane — fonte e6242084c6e4cd02; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Cc3 — fonte 3fcf396cfb54b474; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Classica: sviluppo con Cc3 — fonte 2353e642fb5e9812; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Ac4 — fonte 0c06c7a6879bc0ac; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Partita Scozzese

- [x] Variante Mieses — fonte df11ef6394dad9e0; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Scozzese — percorso preesistente; esercizio disponibile
- [x] Gambetto Göring — fonte dfb57947a07e80ac; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Steinitz con Dh4 — fonte 4c7b6c56397f56bd; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile

### Partita Viennese

- [x] Gambetto Viennese — percorso preesistente; esercizio disponibile
- [x] Sistema con g3 — fonte 3e5e35702be9d1fa; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Ac4 — fonte e20bcea80a115c9f; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Cf3 — fonte 3fcf396cfb54b474; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile

### Gambetto di Re

- [x] Difesa Fischer — fonte 5ecea8eb1b989bec; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto dell’Alfiere — fonte 88787ea719a8270d; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Controgambetto Falkbeer — fonte e072f884fa6b9764; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Rifiutato con Ac5 — fonte 87c8697008c30fe9; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile

### Difesa Philidor

- [x] Cambio centrale — percorso preesistente; esercizio disponibile
- [x] Sistema Hanham — fonte 8208a48434ed0fb4; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Impianto con Cf6 — fonte 69d64e8e3ff3c8d8; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Controgambetto con f5 — fonte 3acbee466a5573dd; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile

### Gambetto di Donna

- [x] Difesa Tarrasch — fonte 3b0020b505812a1a; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Chigorin — fonte 77f15aff8cb2c77e; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Controgambetto Albin — fonte 714beea5694fd1f3; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Slava: sistema Chebanenko — fonte d05aad39e429504a; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Semislava: Anti-Merano con Dc2 — fonte 6eb5f80f386a1dbc; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Semislava: sistema Botvinnik — fonte 995753084e5f4c07; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile
- [x] Semislava: variante di Mosca — fonte 427561ac79357e94; 12 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Cambridge Springs — fonte ad6b7d0dc3a6b3eb; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Rifiutato: sistema Tartakower — fonte 4688297e6f980cd7; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Rifiutato: difesa Lasker — fonte 3d7e2fa2b9bd217e; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Ragozin — fonte 89108cd07fd742b8; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Slava: variante di Cambio — fonte dda896388d655da4; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Accettato: centro immediato con e4 — fonte 1b3b88351ffc8f63; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile

### Sistema di Londra

- [x] Londra: pressione immediata con c5 — fonte 08afba8abe785edc; 6 semimosse documentate, 26 semimosse del seguito controllate; esercizio disponibile
- [x] Londra contro il fianchetto — percorso preesistente; esercizio disponibile
- [x] Sistema Jobava-Londra — fonte 4d6f8789aa401845; 6 semimosse documentate, 26 semimosse del seguito controllate; esercizio disponibile
- [x] Londra: pressione su b2 — fonte 208985e882da9e72; 8 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile

### Difesa Est-Indiana

- [x] Sämisch: formazione Panno — fonte d7cc10fd180e6b90; 21 semimosse documentate, 11 semimosse del seguito controllate; esercizio disponibile
- [x] Fianchetto: sistema Panno — fonte 281fa5767f5379d1; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Smyslov — fonte 3b060912ece6852f; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema semiclassico con e3 — fonte 1de3d41f3b4f6064; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile

### Difesa Grünfeld

- [x] Sistema Russo — percorso preesistente; esercizio disponibile
- [x] Sistema del Fianchetto — fonte abe4429b3579e502; 23 semimosse documentate, 9 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Brinckmann — fonte 642adf7a23d76b81; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Variante di Stoccolma — fonte 9b02e238f44231aa; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile

### Difesa Nimzo-Indiana

- [x] Sistema Rubinstein — fonte 479cec09b206944b; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Classica con Dc2 — percorso preesistente; esercizio disponibile
- [x] Sistema Sämisch — fonte e65a9bc60632839a; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema di Leningrado — fonte 7bd004d3e1a28bb7; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile

### Difesa Ovest-Indiana

- [x] Sistema Petrosian — percorso preesistente; esercizio disponibile
- [x] Fianchetto: alfiere in a6 — fonte 702773ac5e81be74; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con e3 — fonte 8c2dd63ae88ec8cf; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Cc3 — fonte ca24626e1c1b4423; 22 semimosse documentate, 10 semimosse del seguito controllate; esercizio disponibile

### Apertura Catalana

- [x] Catalana Aperta — percorso preesistente; esercizio disponibile
- [x] Catalana Chiusa — fonte 7953ef274cc78ae2; 22 semimosse documentate, 10 semimosse del seguito controllate; esercizio disponibile
- [x] Catalana: scacco in b4 — fonte bab02c739d344a32; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Catalana: rottura immediata c5 — fonte 9f9c7a4541454b57; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile

### Difesa Olandese

- [x] Olandese Classica — fonte 091fd778264f728a; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Olandese di Leningrado — fonte 5aa58adefbef7249; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Staunton — fonte 89351af4942a7d3c; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Hopton — fonte 796cf5458c1de198; 5 semimosse documentate, 27 semimosse del seguito controllate; esercizio disponibile

### Difesa Benoni e Benko

- [x] Benoni Moderna — fonte 2838460141025af9; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Benko Accettato — fonte 705da3dd0ffd5a03; 24 semimosse documentate, 8 semimosse del seguito controllate; esercizio disponibile
- [x] Benoni Ceca — fonte 3b1bc747b308a308; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Vecchia Benoni — fonte d68cafc990872469; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile

### Gambetto di Budapest

- [x] Gambetto Fajarowicz — percorso preesistente; esercizio disponibile
- [x] Sistema Adler — fonte af17f94acd4e7258; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Alekhine — fonte 25b1d772dd21256d; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Rubinstein — fonte 2faabcc8e4c9889f; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile

### Apertura Inglese

- [x] Inglese dei Quattro Cavalli — fonte b5d2d203e2c2ac1a; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Siciliana a colori invertiti — fonte e9767da1fb99a0f7; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Botvinnik — fonte 2808f1d40d726e48; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Anglo-Indiano — fonte 137a51405b1cd107; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile
- [x] Inglese simmetrica: struttura Riccio — fonte 181ffcbfe9b4be08; 22 semimosse documentate, 10 semimosse del seguito controllate; esercizio disponibile
- [x] Neo-Catalana contro la formazione Semislava — fonte e3f1a7dfaed14dcb; 8 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Inglese contro la Difesa Olandese — fonte b317081218a481a2; 6 semimosse documentate, 26 semimosse del seguito controllate; esercizio disponibile
- [x] Bremen: sistema Smyslov con Ab4 — fonte fafa61bc33a2584e; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile

### Apertura Réti

- [x] Gambetto Réti Accettato — fonte c0a7b1aadc149e05; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Est-Indiano — fonte c2e2f83020d773a2; 15 semimosse documentate, 17 semimosse del seguito controllate; esercizio disponibile
- [x] Réti: risposta simmetrica — fonte 8272d11d47661857; 13 semimosse documentate, 19 semimosse del seguito controllate; esercizio disponibile
- [x] Réti: alfiere nero in f5 — fonte 660483eabfce01f3; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Partita dei Quattro Cavalli

- [x] Variante Rubinstein — fonte f930d81865ce072b; 18 semimosse documentate, 14 semimosse del seguito controllate; esercizio disponibile
- [x] Quattro Cavalli: sviluppo italiano — fonte b243bfcd590867de; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema Glek — fonte fa49669d25d8c5d1; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto di Belgrado — fonte 1770eba5c1c99956; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile

### Apertura Larsen

- [x] Larsen contro Cf6 — fonte 89f16258f04b14dc; 5 semimosse documentate, 27 semimosse del seguito controllate; esercizio disponibile
- [x] Larsen contro c5 — fonte 89a90a186076548e; 2 semimosse documentate, 30 semimosse del seguito controllate; esercizio disponibile
- [x] Larsen simmetrica — fonte dbb329cb10fb3020; 2 semimosse documentate, 30 semimosse del seguito controllate; esercizio disponibile
- [x] Larsen contro f5 — fonte e5b8d6924871816e; 3 semimosse documentate, 27 semimosse del seguito controllate; esercizio disponibile

### Apertura Bird

- [x] Bird simmetrica — fonte 5fbb3865d190cfd7; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Bird contro Cf6 — fonte b0f1a12ae79d7899; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Bird contro c5 — fonte d7f6bacb8cf88ff1; 4 semimosse documentate, 28 semimosse del seguito controllate; esercizio disponibile
- [x] Bird: fianchetto di re — fonte aed04ad21a492a83; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile

### Attacco Trompowsky

- [x] Trompowsky contro d5 — fonte 0ecdfcc7cfe33958; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Trompowsky contro c5 — fonte a9ef89087288dd95; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Trompowsky contro e6 — fonte facdd89288bb44d3; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Raptor — fonte 0bd85216fc8755b4; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Sistemi Colle e Torre

- [x] Attacco Torre contro il fianchetto — fonte 085977651c3eea1c; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Stonewall — fonte c86bc75da679ce02; 7 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Colle: pressione con c5 — fonte ef2224c8ef60ec23; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Torre contro d5 — fonte 72e0e612b958bbbc; 14 semimosse documentate, 18 semimosse del seguito controllate; esercizio disponibile

### Difesa Bogo-Indiana

- [x] Bogo-Indiana: sostegno con De7 — fonte 44f31631cfd4b92b; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Bogo-Indiana: ritirata dell’alfiere — fonte a750b9f7eedcc80f; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile
- [x] Bogo-Indiana: sostegno con a5 — fonte e9aecc1a4ac6e7a8; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Bogo-Indiana: sviluppo con Cc6 — fonte fedf1177f943baac; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Difesa Vecchia Indiana

- [x] Variante Janowski con Cf3 — fonte 5be35046547ed7fa; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Janowski: sistema del Fianchetto — fonte b465d9de80605e7c; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Sistema con Cf3 — fonte 59b1f167bdff85c6; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Centro ampio con e4 — fonte ba3d5b5c8aaafd7a; 17 semimosse documentate, 15 semimosse del seguito controllate; esercizio disponibile

### Difesa Nimzowitsch

- [x] Nimzowitsch: risposta e5 — fonte 8b54e92ef398c147; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Variante Scandinava: gambetto Aachen — fonte 5197878b1a4dfaa9; 6 semimosse documentate, 26 semimosse del seguito controllate; esercizio disponibile
- [x] Nimzowitsch: sviluppo con Cf3 — fonte ab9ff382475434e8; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Nimzowitsch: avanzata centrale — fonte 08c6bad35a112e0f; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile

### Difesa Owen

- [x] Owen: centro con d4 — fonte b8a8d2d79607e349; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile
- [x] Owen: sviluppo con Cf3 — fonte 340a18ecb86cabe4; 5 semimosse documentate, 27 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Inglese: centro ampio — fonte b038bcca28f68996; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile
- [x] Difesa Guatemala — fonte 3f48eb68e0169f2b; 4 semimosse documentate, 28 semimosse del seguito controllate; esercizio disponibile

### Altre aperture di Re

- [x] Gambetto Danese — fonte 07cfbe6b93c24942; 20 semimosse documentate, 12 semimosse del seguito controllate; esercizio disponibile
- [x] Apertura Ponziani — fonte 68ff05a318aeaa4b; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Lettone — fonte 4e8ce6a76af18de8; 16 semimosse documentate, 16 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Elefante — fonte 7c6dc7a630bf4d8c; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile

### Aperture di Donna e sistemi

- [x] Gambetto Blackmar-Diemer — fonte d40a494bc9f74761; 19 semimosse documentate, 13 semimosse del seguito controllate; esercizio disponibile
- [x] Richter-Veresov: alfiere in f5 — fonte 97b5fd0a15e0a9e8; 7 semimosse documentate, 25 semimosse del seguito controllate; esercizio disponibile
- [x] Richter-Veresov: sviluppo con Cbd7 — fonte 5fabd331416b8c61; 8 semimosse documentate, 24 semimosse del seguito controllate; esercizio disponibile
- [x] Gambetto Englund — fonte 779b3b6f12377bdb; 10 semimosse documentate, 22 semimosse del seguito controllate; esercizio disponibile

### Altre aperture e sistemi

- [x] Polacca: contro il centro con d5 — fonte 08c57d7b6ec3eda8; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Apertura Grob — fonte cfa8e3e699f523bd; 12 semimosse documentate, 20 semimosse del seguito controllate; esercizio disponibile
- [x] Attacco Sodium — fonte 5c4da68052a34cde; 9 semimosse documentate, 23 semimosse del seguito controllate; esercizio disponibile
- [x] Apertura Dunst: centro con d5 — fonte 9720cb9bb3626619; 11 semimosse documentate, 21 semimosse del seguito controllate; esercizio disponibile

## Evidenze

- [Inventario leggibile dalla macchina](data/opening-coverage.json)
- [Posizioni e risultati del controllo offline](data/opening-expansion-verification.json)
- [Controlli degli esercizi pratici storici](data/opening-practical-verification.json)
- [Controlli dei due esercizi Siciliana](data/opening-sicilian-p022-practical-verification.json)
- [Controlli del seguito e dell’esercizio Zaitsev](data/opening-zaitsev-p022-practical-verification.json)
- [Controlli dei tre percorsi e degli esercizi Chekhover](data/opening-chekhover-p022-practical-verification.json)
- [Fonte del catalogo](https://github.com/JeffML/eco.json)
- [Nomi e convenzioni Lichess](https://github.com/lichess-org/chess-openings)

Aggiornamento del solo inventario: `node scripts/report-opening-coverage.mjs`. Non rilanciare i generatori storici o gli studi congelati per aggiornare un rapporto. Per il lotto Siciliana usare il verificatore offline e le prove separate indicate nel relativo rapporto.
