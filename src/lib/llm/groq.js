import { SYSTEM_PROMPT, buildUserMessage } from './systemPrompt.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function explainMoveWithGroq(context) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  // llama-3.3-70b-versatile è stato spento il 16/08/2026 (tier free/developer).
  // Sostituto ufficiale Groq: https://console.groq.com/docs/deprecations
  const model = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b'

  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY non impostata (vedi .env.example)')
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(context) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Groq API error ${res.status}: ${body}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content ?? '{}'
  return JSON.parse(raw)
}
