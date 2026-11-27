import { GoogleGenerativeAI } from '@google/generative-ai'
import { env, GEMINI_MODEL, SYSTEM_PROMPT } from '../config'

/**
 * The Gemini API supports CORS, so the browser can talk to it directly — no
 * server of our own. The key is exposed in the bundle, which is acceptable
 * for a personal build and not for a public deploy.
 */
const genAI = new GoogleGenerativeAI(env.geminiKey)

export type Msg = { role: 'user' | 'model'; parts: string }

export type AskHandlers = {
  /** Fires for each chunk of the spoken answer. */
  onText: (delta: string) => void
  /** Fires when the model starts running a tool (unused on Gemini for now). */
  onTool: (name: string) => void
}

let active: (() => void) | null = null
let cancelled = false

/**
 * One turn of conversation. Streams text deltas to onText as they arrive so
 * the assistant can speak in real time, mirroring the Anthropic direct path.
 */
export async function ask(
  history: Msg[],
  handlers: AskHandlers,
): Promise<{ text: string; tools: string[] }> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
  cancelled = false

  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.parts }],
  }))

  try {
    const stream = await model.generateContentStream({
      contents,
      systemInstruction: SYSTEM_PROMPT,
    })

    let text = ''
    let abort = false
    active = () => {
      abort = true
    }

    for await (const chunk of stream.stream) {
      if (abort || cancelled) break
      const delta = chunk.text()
      if (delta) {
        text += delta
        handlers.onText(delta)
      }
    }

    return { text: text.trim(), tools: [] }
  } finally {
    active = null
  }
}

/** Barge-in. Stops the generation. */
export function cancel(): void {
  cancelled = true
  active?.()
}

/** Labels for the HUD's SYSTEMS rail. */
export function connectedLabels(): string[] {
  return ['Gemini']
}
