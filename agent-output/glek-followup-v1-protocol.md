# Prosecuzione dopo la correzione del riferimento Ag2

12 ottobre 2026. Il riferimento Game Review comunicato da Carlo è Geniale
per tutte le cinque scelte; Esploratore assegna Migliore ad Ag2. Conservare
i report precedenti e registrare questa correzione in un nuovo risultato.

Prima dell'implementazione: migliorare solo la raccolta degli snapshot,
conservando per ciascuna prima scelta l'ultima iterazione completa, esatta,
con radici distinte e stessa profondità. Al bestmove finale restituire l'ultima
iterazione completa con quella prima scelta, senza scegliere per score.
Non mescolare iterazioni; memoria limitata a 256 prime scelte (oltre il massimo
di mosse legali in una posizione ordinaria). Nessuna nuova ricerca motore.

Verificare la raccolta con cambi A -> B -> A, iterazioni incomplete, bounds,
duplicati, ordine temporale e bestmove mai coperto. Rigiocare i tredici raw
della Glek con il nuovo collector, mantenendo i dati originali intatti.

Ab5: esaminare separatamente una sola variante diagnostica già fissata:
consentire anche categoria numerica Buona alla verifica del sacrificio.
Non cambiare i massimi 1/3/5/10/20 e non cercare un margine su misura.
La variante modifica soltanto l'eleggibilità Geniale; se la compensazione
non è confermata conserva l'etichetta originale. Applicarla a tutte le 592
mosse consentite e ai cinque candidati Glek, riportando correzioni/regressioni
e falsi positivi. Nessuna attivazione automatica di questa variante nell'app.

Non usare sviluppo o attività come un criterio sufficiente senza verifica
nelle varianti. Non derivare etichette dall'intenzione presunta del giocatore.
Le Game Review riferite dall'utente non sono una nuova acquisizione dalla
piattaforma. Non leggere partite riservate 7–10 o .env; preservare i 20 input
congelati e tutte le cache. Suite, build e collaudo adeguati prima di pubblicare.
