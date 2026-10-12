# Caso fornito da Carlo: 4...Nxe4 nella variante Glek

12 ottobre 2026. Ricostruzione dalle due schermate: 1.e4 e5 2.Nf3 Nc6
3.Nc3 Nf6 4.g3 Nxe4. La prima schermata indica 4...Bc5 come PV1 a depth 18;
la seconda assegna Geniale a Nxe4 a depth 20. Non assumere che siano ricerche
comparabili o che i valori numerici nelle due immagini siano definitivi.

Prima di cercare: fissare cinque FEN, da dopo 3.Nc3 fino a dopo 5.Nxe4.
Stockfish npm 19.0.0 large-single, un thread, Hash 16 MB, MultiPV 5,
200.000 nodi per ricerca, ucinewgame + Clear Hash prima di ciascuna.
Budget nominale 1.000.000 nodi, tetto telemetrico 1.025.000, riserva 5.000
per ricerca. Nessuna ricerca supplementare, nessun rilancio automatico dopo
errore. Conservare subito raw, bestmove, snapshot e telemetria di ogni ricerca.

Usare le regole attive review-reliability-v1 e counterfactual-v6 senza modifiche,
prima senza e poi con la corroborazione della posizione dopo 5.Nxe4.
Le annotazioni dell'immagine non entrano nei classificatori. Verificare libro,
scarto dalla migliore, score confrontabili, copertura delle prese legali,
offerta nuova e compensazione. Riportare il primo motivo di rifiuto o candidato.

Le cinque ricerche sono una diagnosi di un esempio selezionato dall'utente,
non una misura di accuratezza su partite indipendenti. Non cambiare soglie,
rating, regole speciali o i 20 input congelati per recuperare questo caso.
Non leggere .env, partite riservate 7–10 o rilanciare esperimenti precedenti.
