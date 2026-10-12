# Stabilità delle valutazioni nelle categorie ordinarie

12 ottobre 2026. Regole e selezione fissate prima delle nuove ricerche.

Selezionare per Buona, Imprecisione ed Errore, nell'ordine delle righe della
diagnosi esistente, quattro casi distinti: prima discordanza troppo indulgente
da analisi separate, prima discordanza PV1, prima discordanza root non PV1,
primo caso corretto come controllo. Dodici casi, selezione diagnostica non casuale.
Non usare i riferimenti per decidere score, ricerca o classificazione.

Confrontare la cache originale Stockfish 19.0.0 large-single, MultiPV 5,
200.000 nodi per posizione, con prima/dopo a 1.000.000 nodi per posizione.
24 ricerche, un thread, Hash 16 MB, ucinewgame + Clear Hash prima di ciascuna.
Budget nominale 24.000.000; tetto telemetrico 24.120.000, riserva 5.000 a ricerca.
Non aggiungere, prolungare o ripetere ricerche in base al risultato.

Conservare raw, snapshot e telemetria prima di verificare ogni risposta.
Applicare review-reliability-v1 senza cambiare curva, soglie, rating o regole
dei matti. Confronto numerico isolato: non attribuire categorie speciali senza
il contesto completo della partita. Verificare catene FEN e legalità delle PV.

Riportare etichette recuperate, controlli peggiorati, cambio di PV1, score,
perdite e fonti. Distinguere miglioramento del motore da differenza persistente
del modello; una ricerca più lunga non è verità assoluta. Non estrapolare le
percentuali di questo campione selezionato alle 592 mosse o a nuove partite.

Nessuna modifica automatica dell'app o del suo budget. Manifest monouso prima
del primo go. Preservare cache/report precedenti e i 20 input congelati.
Non leggere .env o partite riservate 7–10. Fermarsi al primo errore motore.
