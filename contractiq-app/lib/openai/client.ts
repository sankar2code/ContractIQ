import OpenAI from 'openai'
import { Agent } from 'node:https'

let client: OpenAI | null = null

// keepAlive: false — Node's default fetch (undici) reuses a keep-alive
// connection for consecutive requests to the same host, and in some hosting
// environments that reused connection gets closed by an intermediary before
// the OpenAI response body finishes, surfacing as
// "FetchError: ... Premature close (ERR_STREAM_PREMATURE_CLOSE)" on every
// call. Forcing a fresh connection per request avoids the reused, silently
// dead socket. The extra TLS handshake per call is negligible next to the
// multi-second extraction/chat latency this client is used for.
const httpAgent = new Agent({ keepAlive: false })

// Lazily instantiated so a missing OPENAI_API_KEY only fails at first use,
// not at build/import time.
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, httpAgent })
  }
  return client
}
