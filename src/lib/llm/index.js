import { explainMoveWithGroq } from './groq.js'
import { explainMoveWithGemini } from './gemini.js'

/**
 * Punto unico di accesso al chatbot.
 *
 * Il provider può essere passato esplicitamente (es. scelto dall'utente in
 * un selettore nella UI) — utile perché in un'app statica la variabile
 * d'ambiente VITE_LLM_PROVIDER viene fissata una volta per tutte al momento
 * della build e non può più cambiare per chi visita il sito pubblicato.
 * Se non viene passato nulla, si usa comunque VITE_LLM_PROVIDER come default
 * (utile in sviluppo locale).
 *
 * @param {{fen: string, opening: object|null, engineData: object|null, question: string, moveHistorySan: string[]}} context
 * @param {'groq'|'gemini'} [providerOverride]
 * @returns {Promise<{explanation: string, moveToPlay: string|null}>}
 */
export async function explainMove(context, providerOverride) {
  const provider = providerOverride || import.meta.env.VITE_LLM_PROVIDER || 'groq'

  switch (provider) {
    case 'gemini':
      return explainMoveWithGemini(context)
    case 'groq':
      return explainMoveWithGroq(context)
    default:
      throw new Error(`Provider LLM sconosciuto: "${provider}". Usa "gemini" o "groq".`)
  }
}