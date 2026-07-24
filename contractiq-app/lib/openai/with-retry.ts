const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1000

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status
    if (typeof status === 'number') {
      return status >= 500 || status === 429
    }
  }
  // Network/timeout errors carry no status — treat as retryable.
  return true
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 3-attempt exponential-backoff retry wrapper for OpenAI calls, per
// docs/engineering/engineering-doc.md §6 and the PRD's OpenAI-outage mitigation.
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === MAX_ATTEMPTS - 1 || !isRetryableError(error)) {
        throw error
      }
      await delay(BASE_DELAY_MS * 2 ** attempt)
    }
  }

  throw lastError
}
