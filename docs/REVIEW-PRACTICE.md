# Ripassa i miei errori

Apri una partita analizzata o un'analisi archiviata, scegli il tuo colore e premi
**Ripassa i miei errori**. Il resoconto offre anche **Riprova posizione** per una
singola mossa. Ogni sessione comprende al massimo cinque posizioni candidate.

Stockfish verifica ogni posizione prima dell'esercizio. Le etichette archiviate
servono a trovare i candidati, mai a determinare la soluzione o il giudizio.
La verifica usa posizione iniziale e storia UCI ricostruite dal PGN. Le vecchie
analisi e il PGN non vengono sovrascritti.

Gioca sulla scacchiera con clic o trascinamento, oppure inserisci una mossa SAN.
La promozione è selezionabile. I suggerimenti procedono dalla domanda, al pezzo,
alla soluzione. Dopo la decisione puoi vedere una breve continuazione illustrativa.

## Valutazione

La pratica usa Stockfish 19, 200.000 nodi e MultiPV 2. Il profilo ordinario resta
invariato. Una mossa fuori dalle varianti disponibili richiede un confronto
ristretto dalla stessa posizione con la continuazione di riferimento.
Le soglie numeriche riusano la configurazione esistente; il classificatore della
partita non viene modificato. Perdere un matto rilevato o consentirne uno viene
trattato separatamente. Questi giudizi sono stime del motore, non prove di unicità.

Risultati incompleti, discordanti o interrotti non attribuiscono errori all'allievo.
Puoi riprovare la verifica, saltare o chiudere. Un guasto richiede un riavvio
esplicito. L'analisi ordinaria resta sospesa fino a una ripresa esplicita.

## Progressi e limiti

I conteggi sono salvati nel browser, separando successi autonomi, aiuti, errori,
soluzioni viste, salti e verifiche incerte. Sono conservate al massimo 200 posizioni,
identificate anche dal profilo e dalla versione della politica didattica.
Lo storage bloccato o pieno viene segnalato e non impedisce di continuare.

La versione iniziale allena una decisione alla volta; non certifica un'intera
combinazione. Seleziona candidati dalle etichette disponibili: per trovare errori
che una vecchia analisi non aveva segnalato serve una nuova analisi della partita.
Le evidenze verificate restano in una cache limitata della sessione; dopo la
riapertura vengono ricontrollate. Nessun servizio LLM è necessario.
