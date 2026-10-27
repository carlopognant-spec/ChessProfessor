// Constructed deviations checked by this lot's frozen engine ledger.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-04",
  "policy": {
    "engine": "Stockfish 16",
    "engineHash": "5568b400df3425718d310050b5b77fcc81d30b82fdf231a90f40b520c74de3bf",
    "nodes": 200000,
    "threads": 1,
    "hashMb": 32,
    "minimumCpChange": 200,
    "minimumImmediateMaterial": 2,
    "kind": "constructed-deviation-v1"
  },
  "entries": [
    {
      "id": "practice:sicilian:chekhover-a6-be3",
      "courseId": "sicilian:chekhover-a6-be3",
      "family": "sicilian",
      "title": "Chekhover: 4...a6 e sviluppo con 5.Ae3: La difesa cambia dopo a6",
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
        "Qb6",
        "Qxb6"
      ],
      "startIndex": 10,
      "exerciseSide": "w",
      "variant": true,
      "practice": true,
      "signature": "804080303f9fe017e342fb10653da08049f2eac1031ebfc0dcb868a140f7e4c2",
      "kind": "constructed-deviation-v1",
      "objective": "Il Nero ha portato la donna in b6 dopo aver spinto il pedone a. Controlla le catture disponibili e le possibilità di ripresa.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Sviluppa l’alfiere c1 in e3, dove sostiene la donna d4. Prosegui poi lo sviluppo dei pezzi e valuta la sicurezza del re. La donna d4 difende e4 anche dopo il Cf6 didattico.",
      "blackPlan": "Con a6 controlli b5 con un pedone. Nel seguito scelto, Cf6 sviluppa il cavallo e attacca e4; quel pedone è però difeso dalla donna d4. Il cavallo b8 e gli alfieri restano da sviluppare.",
      "prevention": "Prima della deviazione, Nc6 è una possibilità proposta dal controllo. Confrontala con la scelta del corso: il controllo non dimostra che sia l’unica mossa valida.",
      "explanation": "Dxb6 cattura la donna lungo d4-c5-b6. Il pedone nero è in a6, quindi non può riprendere in b6 come farebbe un pedone in a7. Dopo tutte le 21 repliche immediate legali il saldo resta +9 rispetto a prima dell’errore. È un controllo a orizzonte limitato: dopo ...Cd7, per esempio, la donna bianca viene attaccata e va nuovamente valutata la posizione."
    },
    {
      "id": "practice:sicilian:chekhover-a6-c4",
      "courseId": "sicilian:chekhover-a6-c4",
      "family": "sicilian",
      "title": "Chekhover: 4...a6, 5.c4 e ritirata Dd2: Sviluppare senza rispondere alla minaccia",
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
        "Nc3",
        "Nxd4"
      ],
      "startIndex": 11,
      "exerciseSide": "b",
      "variant": true,
      "practice": true,
      "signature": "7b1bba90afa960051be6b9c6ef621ebfbc3931f71b7ce60a28e3815aaf5dbcaf",
      "kind": "constructed-deviation-v1",
      "objective": "Il Bianco ha sviluppato Cc3 dopo ...Cc6. Controlla se la mossa ha risolto la minaccia sulla donna.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Con c4 controlla d5 e rispondi all’attacco di Cc6 sulla donna spostandola in d2. L’alfiere c1 e il cavallo b1 sono ancora da sviluppare; la donna in d2 interrompe per ora la diagonale c1-e3 dell’alfiere.",
      "blackPlan": "Sviluppa Cc6 con attacco alla donna d4 e prepara Ag7 con g6. L’alfiere f8 non si è ancora mosso e il cavallo g8 è ancora nella casa iniziale: il fianchetto e l’arrocco restano da realizzare.",
      "prevention": "Prima della deviazione, Qd3 è una possibilità proposta dal controllo. Confrontala con la scelta del corso: il controllo non dimostra che sia l’unica mossa valida.",
      "explanation": "Cxd4 cattura la donna con il cavallo c6. Il Bianco può riprendere quel cavallo con il cavallo f3, ma il saldo minimo dopo tutte le 33 repliche immediate legali è +6 per il Nero rispetto a prima dell’errore: donna contro cavallo. Il cavallo bianco in c3 non attacca d4."
    }
  ],
  "uncovered": []
}
