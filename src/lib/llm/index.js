import { explainMoveWithGroq } from './groq.js'
import { explainMoveWithGemini } from './gemini.js'

/**
 * Punto unico di accesso al chatbot. Il resto dell'app non sa (e non deve
 * sapere) quale provider è attivo: basta cambiare VITE_LLM_PROVIDER nel
 * file .env per passare da uno all'altro senza toccare codice applicativo.
 *
 * @param {{fen: string, opening: object|null, engineData: object|null, question: string, moveHistorySan: string[]}} context
 * @returns {Promise<{explanation: string, moveToPlay: string|null}>}
 */
export async function explainMove(context) {
  const provider = import.meta.env.VITE_LLM_PROVIDER || 'groq'

  switch (provider) {
    case 'gemini':
      return explainMoveWithGemini(context)
    case 'groq':
      return explainMoveWithGroq(context)
    default:
      throw new Error(`Provider LLM sconosciuto: "${provider}". Usa "gemini" o "groq".`)
  }
}
