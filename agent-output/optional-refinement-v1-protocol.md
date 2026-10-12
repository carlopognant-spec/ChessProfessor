# Approfondimento facoltativo delle mosse dubbie

12 ottobre 2026, regole fissate prima dell'implementazione.

Analisi iniziale invariata: 200.000 nodi, MultiPV 5, stesso motore, curva,
soglie e rating. Solo su comando esplicito approfondire a 1.000.000 nodi
posizioni prima/dopo mosse con evidenza indipendente, discordante o mancante,
candidato speciale non confermato, oppure perdita entro 1 punto da un confine
numerico. Il margine serve alla selezione, non cambia la classificazione.
Escludere Libro, Forzata e matto dato. Massimo 12 mosse per richiesta; massimo
24 FEN distinte, riusare posizioni condivise e approfondimenti già salvati.
Budget nominale massimo 24 milioni di nodi, tetto effettivo con riserva 5.000
per ricerca. Nessun avvio automatico, nessun retry automatico su errore.

Conservare l'analisi iniziale come dato principale e gli approfondimenti in
un campo separato con profilo e FEN verificati. Se una FEN è approfondita,
usare quella stessa evidenza anche per le righe adiacenti nella vista
approfondita. Mostrare confronto delle categorie e dei punteggi, senza
chiamare un cambiamento un miglioramento certo. Toggle senza nuove ricerche.
Archivio e riapertura offline devono conservare entrambe le versioni.

Interruzione, errore, import, reset e cambio partita devono conservare i
risultati iniziali; nessun risultato tardivo della partita precedente.
Validare budget, posizione, profilo e PV prima di pubblicare ogni risultato.
Le posizioni terminali sono risolte localmente senza go.

Verifiche: unit test di selezione, budget, riuso, interruzione, errori e
coerenza dei dati; archivio con profili distinti e riapertura offline;
browser su partita completa con worker simulato, navigazione, confronto,
salvataggio/reload e cambio partita durante una ricerca. Verifica motore reale
su personal-01 completa usando le cache iniziali intatte e riusando i raw
a 1M già raccolti quando disponibili. Manifest della verifica prima del go,
massimo le 24 posizioni consentite dal piano, nessun ampliamento a posteriori.

Non leggere .env o partite riservate 7–10; preservare i 20 input congelati,
le cache originali e i report precedenti. Le percentuali del confronto
selettivo non sono precisione generale. Commit/push su main già autorizzati.
