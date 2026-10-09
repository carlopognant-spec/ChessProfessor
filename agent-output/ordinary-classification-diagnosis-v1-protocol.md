# Diagnosi categorie ordinarie e mosse forzate

9 ottobre 2026. Usare il risultato v6 e le otto cache consentite (592 mosse), senza ricerche motore, modifica delle classificazioni/soglie congelate o lettura .env/partite 7–10. Verificare gli hash del risultato prima dell'analisi.

Per tutte le mosse registrare classificazione numerica, perdita prima del taglio a zero, score root e child nella stessa prospettiva, profondità, presenza della giocata in MultiPV, radici duplicate e disponibilità dello snapshot completato. Distribuire le discordanze per riferimento, fonte numerica e partita. Un confronto root/child è una diagnosi della ricerca, non una dimostrazione che il child sia sempre corretto.

Esaminare separatamente i tre Errore grave non corrispondenti al riferimento: legalità e materiale delle PV, contesto precedente, fascia vincente disponibile, alternativa e motivo di mancata assegnazione Mossa mancata. Non promuovere un errore a Mossa mancata perché il calo è grande.

Enumerare tutte le posizioni con una sola mossa legale; verificare che la giocata sia quella e che la catena FEN sia corretta. Tenere distinto «unica mossa legale» da «unica mossa buona». La prima è verificabile senza motore; la seconda richiede un confronto tra alternative.

Confronto isolato preventivo delle bande pubbliche (Migliore 0, Ottima 2, Buona 5, Imprecisione 10, Errore 20 punti) con quelle locali (1, 3, 5, 10, 20), mantenendo score e categorie speciali fissi. Nessuna scansione o ricerca delle soglie migliori. Il risultato mostra soltanto l'effetto diretto delle bande, non simula tutte le conseguenze sulle categorie contestuali. Non applicare la variante automaticamente e non confondere l'indice sigmoid locale con Expected Points della piattaforma.

Salvare dettagli, distribuzioni e primi blocchi in una nuova cartella, con hash invariati. Fonti pubbliche: documentazione Chess.com su Expected Points e AMA del direttore prodotto; riportare i limiti delle informazioni disponibili sul riferimento.
