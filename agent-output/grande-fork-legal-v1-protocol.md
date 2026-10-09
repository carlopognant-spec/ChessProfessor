# Audit legale dei doppi attacchi — protocollo v1

Selezione fissata: tutti e soli i dieci casi del manifest
`grande-fork-audit-candidates-v1.json`, senza selezione per etichetta attesa.
Nessuna nuova ricerca motore, fitting o modifica al classificatore.

1. Verificare hash del report sorgente, whitelist delle otto partite consentite,
   configurazione delle cache e corrispondenza ply/SAN/FEN/UCI/bersagli.
2. Ripercorrere la mossa dalla FEN reale. Identificare il pezzo mosso e i
   bersagli geometrici, mantenendo identità anche quando un bersaglio si
   sposta, promuove o arrocca. Il re è un bersaglio di scacco, mai di cattura.
3. Enumerare tutte le risposte avversarie legali. Registrare cattura
   dell'attaccante (anche en passant), spostamento dei bersagli, scacco di
   risposta e attaccanti geometrici che difendono ciascun bersaglio.
4. Per ogni risposta, enumerare le catture legali dei bersagli originali da
   parte dello stesso attaccante. Le inchiodature sono risolte dalla legalità
   delle mosse chess.js, senza cambiare artificialmente il lato al tratto.
5. Dopo ogni cattura enumerare tutte le ricatture legali immediate
   dell'attaccante e calcolare il peggiore saldo materiale relativo alla
   posizione **prima della mossa candidata**. Usare valori descrittivi
   p=1, n=b=3, r=5, q=9, k=0. Le promozioni entrano nel bilancio reale.
   Registrare anche l'incremento dalla posizione dopo la candidata, per
   distinguere il guadagno già acquisito dall'effetto del doppio attacco.
6. Riportare separatamente risposte senza catture possibili, risposte con
   catture ma senza incremento positivo dopo ricattura e risposte con almeno
   una cattura a incremento positivo. Calcolare il minimo sulle risposte del
   miglior incremento osservato a questo orizzonte. Non chiamarlo guadagno
   forzato: mosse quiete intermedie e tattiche successive non sono esplorate.
7. Ripercorrere le PV già salvate del motore dopo la candidata, verificando
   legalità e coerenza della prima risposta con l'enumerazione. Riportare
   depth, score grezzo dalla prospettiva avversaria, bound e saldo lungo la PV;
   nessuno score viene attribuito alle risposte senza analisi salvata.
8. Solo dopo l'estrazione di tutti i casi associare le etichette del report
   sorgente e confrontare i cinque Grande con i cinque altri riferimenti.
   Nessuna assegnazione di una categoria speciale basata su questi risultati.

Hash prima/dopo di tutti gli input e delle 20 dipendenze congelate. Output
in una nuova cartella datata, senza sovrascrivere report precedenti. Registrare
numero di nodi legali enumerati e durata della sola enumerazione. Nessuna
lettura di `.env`, partite 7–10 o cache riservate; nessun commit/push.

Limiti: campione già studiato; geometria e valori materiali sono descrittivi;
difesa geometrica non equivale a ricattura legale; una ricattura immediata non
esaurisce tutte le difese. L'audit non verifica unicità o valore delle alternative
alla candidata e non è una validazione indipendente di Grande.
