// Constructed deviations checked by this lot's frozen engine ledger.
export default {
  "schema": 1,
  "lot": "P02.2-SIC-05",
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
      "id": "practice:sicilian:chekhover-nf6",
      "courseId": "sicilian:chekhover-nf6",
      "family": "sicilian",
      "title": "Chekhover: 4...Cf6 e sostegno con 5.Cc3: Sviluppare un alfiere sotto attacco",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Nf6",
        "Nc3",
        "Bf5",
        "exf5"
      ],
      "startIndex": 10,
      "exerciseSide": "w",
      "variant": true,
      "practice": true,
      "signature": "714106175976def806faad4d02bea87c129d8f2d116f0611e2cb757f0f5472b1",
      "kind": "constructed-deviation-v1",
      "objective": "Il Nero ha portato l’alfiere in f5. Controlla quali pedoni bianchi attaccano quella casa prima di proseguire lo sviluppo.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Sviluppa Cc3 e aggiungi una difesa al pedone e4, già sostenuto dalla donna d4. Completa poi lo sviluppo degli alfieri e valuta la sicurezza del re: il percorso termina ancora in apertura.",
      "blackPlan": "Sviluppa Cf6 con pressione su e4. Nell’esempio didattico, Ad7 porta poi l’alfiere c8 fuori dalla casa iniziale; il cavallo b8 resta da sviluppare e il re è ancora in e8.",
      "prevention": "Prima della deviazione, Nc6 è una possibilità proposta dal controllo. Confrontala con la scelta del corso: il controllo non dimostra che sia l’unica mossa valida.",
      "explanation": "exf5 cattura l’alfiere con il pedone e4. Il saldo minimo rispetto a prima dell’errore è +3 dopo tutte le 27 repliche immediate legali. Il controllo è limitato a quell’orizzonte: dopo ...Cc6, per esempio, la donna d4 viene attaccata e richiede una nuova decisione."
    },
    {
      "id": "practice:sicilian:chekhover-early-bd7",
      "courseId": "sicilian:chekhover-early-bd7",
      "family": "sicilian",
      "title": "Chekhover: 4...Ad7 prima dello sviluppo dei cavalli: La diagonale libera dell’alfiere d7",
      "moves": [
        "e4",
        "c5",
        "Nf3",
        "d6",
        "d4",
        "cxd4",
        "Qxd4",
        "Bd7",
        "Qa4",
        "Bxa4"
      ],
      "startIndex": 9,
      "exerciseSide": "b",
      "variant": true,
      "practice": true,
      "signature": "abf2bb4dfef7517a35651d8dec51da290a580ea0d8b2dce3947c35615efc83e8",
      "kind": "constructed-deviation-v1",
      "objective": "Il Bianco ha spostato la donna in a4. Controlla le diagonali dell’alfiere già sviluppato in d7.",
      "contrast": "Una deviazione costruita per riconoscere una minaccia concreta. Non è una partita storica né un errore di frequenza misurata.",
      "whitePlan": "Nell’esempio scelto, sviluppa Cc3 sostenendo e4 e prepara lo sviluppo degli alfieri. Controlla la diagonale dell’alfiere d7 prima di spostare la donna verso l’ala di donna.",
      "blackPlan": "Sviluppa l’alfiere c8 in d7 prima dei cavalli. La diagonale verso a4 è libera perché il cavallo b8 non è ancora in c6. Nel seguito didattico Cf6 attacca e4, difeso dalla donna d4 e dal cavallo c3.",
      "prevention": "Prima della deviazione, Be3 è una possibilità proposta dal controllo. Confrontala con la scelta del corso: il controllo non dimostra che sia l’unica mossa valida.",
      "explanation": "Axa4 cattura la donna lungo d7-c6-b5-a4. Il cavallo b8 non interrompe questa diagonale. Dopo tutte le 33 repliche immediate legali il saldo resta +9 rispetto a prima dell’errore; non è una prova del risultato dell’intera partita."
    }
  ],
  "uncovered": []
}
