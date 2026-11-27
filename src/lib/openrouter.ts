import { env, OPENROUTER_MODEL, SYSTEM_PROMPT } from '../config'

/**
 * OpenRouter is an OpenAI-compatible gateway. The browser talks to it directly
 * (CORS is enabled), so no server of our own is needed. The key is exposed in
 * the bundle, which is acceptable for a personal build and not for a public
 * deploy. Free models are available (see OPENROUTER_MODEL in config.ts).
 */
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type Msg = { role: 'user' | 'assistant'; content: string }

export type AskHandlers = {
  /** Fires for each chunk of the spoken answer. */
  onText: (delta: string) => void
  /** Fires when the model starts running a tool (unused on OpenRouter for now). */
  onTool: (name: string) => void
}

let controller: AbortController | null = null

/**
 * One turn of conversation. Streams text deltas to onText as they arrive so
 * the assistant can speak in real time, mirroring the Anthropic direct path.
 */
export async function ask(
  history: Msg[],
  handlers: AskHandlers,
): Promise<{ text: string; tools: string[] }> {
  controller = new AbortController()

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ]

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openrouterKey}`,
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      stream: true,
    }),
    signal: controller.signal,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OpenRouter error ${res.status}: ${detail.slice(0, 200)}`)
  }

  if (!res.body) throw new Error('OpenRouter: no response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let text = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta) {
            text += delta
            handlers.onText(delta)
          }
        } catch {
          /* ignore partial JSON chunks */
        }
      }
    }
  } finally {
    controller = null
  }

  return { text: text.trim(), tools: [] }
}

/** Barge-in. Stops the generation. */
export function cancel(): void {
  controller?.abort()
  controller = null
}

/** Labels for the HUD's SYSTEMS rail. */
export function connectedLabels(): string[] {
  return ['OpenRouter']
}
