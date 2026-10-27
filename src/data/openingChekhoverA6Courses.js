// Fixed source sequences with separately checked authored continuations.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-04",
  "entries": [
    {
      "id": "sicilian:chekhover-a6-be3",
      "family": "sicilian",
      "title": "Chekhover: 4...a6 e sviluppo con 5.Ae3",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "a6",
        "Be3",
        "Nf6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-04",
      "contrast": "Il Nero gioca a6 al quarto tratto, prima di sviluppare Cc6. Il Bianco sceglie Ae3, mentre il percorso fratello imposta subito il centro con c4.",
      "whitePlan": "Sviluppa l’alfiere c1 in e3, dove sostiene la donna d4. Prosegui poi lo sviluppo dei pezzi e valuta la sicurezza del re. La donna d4 difende e4 anche dopo il Cf6 didattico.",
      "blackPlan": "Con a6 controlli b5 con un pedone. Nel seguito scelto, Cf6 sviluppa il cavallo e attacca e4; quel pedone è però difeso dalla donna d4. Il cavallo b8 e gli alfieri restano da sviluppare.",
      "endpointReason": "La fonte termina a 5.Ae3. Una sola risposta didattica, 5...Cf6, rende giocabile il confronto con entrambi i colori anche dalla scelta Ae3/c4. È un modulo breve collegato ai percorsi Chekhover esistenti, non una partita completa fino al mediogioco.",
      "sourceDisclosure": "Il catalogo documenta nove semimosse, fino a 5.Ae3, e anche il nodo intermedio 4...a6. La risposta 5...Cf6 è scelta didatticamente e deve superare il controllo motore limitato; non viene attribuita a questo record della fonte.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 a6 Be3 Nf6",
      "editorialNotes": {
        "6": "Dxd4 riprende il pedone con la donna. Il Nero risponde a6: il pedone ora controlla b5, mentre il cavallo b8 resta nella casa iniziale. Diversamente da ...Cc6, questa risposta non attacca subito la donna d4.",
        "8": "Ae3 sviluppa l’alfiere c1 e sostiene la donna d4 lungo la diagonale e3-d4. Nel seguito didattico ...Cf6 sviluppa il cavallo g8 e attacca e4, che la donna d4 continua a difendere. Entrambi i re sono ancora al centro: il percorso mostra una scelta iniziale, non lo sviluppo completato."
      },
      "provenance": {
        "kind": "documented-prefix-with-authored-continuation",
        "documentedPlies": 9,
        "authoredContinuationPlies": 1,
        "generatedPlies": 0,
        "continuationStatus": "bounded-engine-checked",
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "9e4633e9957e3be8",
        "sourceName": "Sicilian, Chekhover, 4...a6 5.Be3",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:24be9805605f8f1b",
            "positionId": "position:f2e47e14c999e271",
            "plies": 8
          },
          {
            "id": "eco:9e4633e9957e3be8",
            "positionId": "position:361cee22134b6e85",
            "plies": 9
          }
        ],
        "rootPositionId": "position:f2e47e14c999e271",
        "engineSignature": "407c3fd1f1a542931899ee3e387e70c764d352379ee8cc9ff40fb8e969dde27a"
      }
    },
    {
      "id": "sicilian:chekhover-a6-c4",
      "family": "sicilian",
      "title": "Chekhover: 4...a6, 5.c4 e ritirata Dd2",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "a6",
        "c4",
        "Nc6",
        "Qd2",
        "g6"
      ],
      "variant": true,
      "roadmapLot": "P02.2-SIC-04",
      "contrast": "Dopo 4...a6 il Bianco sceglie c4 invece di Ae3. Il Nero sviluppa poi Cc6 attaccando la donna; il Bianco la ritira in d2 prima della preparazione del fianchetto nero.",
      "whitePlan": "Con c4 controlla d5 e rispondi all’attacco di Cc6 sulla donna spostandola in d2. L’alfiere c1 e il cavallo b1 sono ancora da sviluppare; la donna in d2 interrompe per ora la diagonale c1-e3 dell’alfiere.",
      "blackPlan": "Sviluppa Cc6 con attacco alla donna d4 e prepara Ag7 con g6. L’alfiere f8 non si è ancora mosso e il cavallo g8 è ancora nella casa iniziale: il fianchetto e l’arrocco restano da realizzare.",
      "endpointReason": "La fonte termina a 6...g6. Il modulo permette di giocare l’impostazione c4, l’attacco alla donna con Cc6 e la ritirata Dd2; non estende arbitrariamente la sequenza oltre il termine documentato.",
      "sourceDisclosure": "Tutte le dodici semimosse sono documentate nel catalogo. I nodi 4...a6, 5.c4 e 6.Dd2 sono altri tre record della stessa fonte; il nodo 4...a6 è condiviso con il percorso Ae3 e si conta una sola volta nella copertura.",
      "editorialLine": "e4 c5 Nf3 d6 d4 cxd4 Qxd4 a6 c4 Nc6 Qd2 g6",
      "editorialNotes": {
        "6": "Dxd4 riprende il pedone con la donna. Il Nero risponde a6: il pedone ora controlla b5, mentre il cavallo b8 resta nella casa iniziale. Diversamente da ...Cc6, questa risposta non attacca subito la donna d4.",
        "8": "c4 controlla d5 con un pedone e rinvia lo sviluppo dell’alfiere c1. Il Nero risponde Cc6: il cavallo appena sviluppato attacca la donna d4. La donna è difesa dal cavallo f3, ma scambiarla per un cavallo perderebbe materiale; il Bianco deve occuparsi della minaccia.",
        "10": "Dd2 sottrae la donna all’attacco del cavallo c6. La donna occupa però la diagonale c1-d2-e3: l’alfiere c1 non può ancora seguire lo sviluppo Ae3 dell’altro percorso. Con g6 il Nero prepara Ag7; l’alfiere è ancora in f8 ed entrambi i re restano al centro."
      },
      "provenance": {
        "kind": "documented-line",
        "documentedPlies": 12,
        "authoredContinuationPlies": 0,
        "generatedPlies": 0,
        "source": "https://github.com/JeffML/eco.json",
        "revision": "36cfd9227f553dec1d39ee20fa0775eea8f8e165",
        "sourceCatalogSha256": "5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2",
        "sourceId": "f80ad3ed0fd0919e",
        "sourceName": "Sicilian, Chekhover, 4...a6 5.c4 Nc6 6.Qd2 g6",
        "sourceEco": "B53",
        "sourceRecords": [
          {
            "id": "eco:24be9805605f8f1b",
            "positionId": "position:f2e47e14c999e271",
            "plies": 8
          },
          {
            "id": "eco:cb682ad7bfde697e",
            "positionId": "position:9c7d8bc61708b20b",
            "plies": 9
          },
          {
            "id": "eco:8afdf35a92cd2b0c",
            "positionId": "position:1c190014685b03ee",
            "plies": 11
          },
          {
            "id": "eco:f80ad3ed0fd0919e",
            "positionId": "position:8d835bf138067435",
            "plies": 12
          }
        ],
        "rootPositionId": "position:f2e47e14c999e271",
        "engineSignature": "407c3fd1f1a542931899ee3e387e70c764d352379ee8cc9ff40fb8e969dde27a"
      }
    }
  ]
}
