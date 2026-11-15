import axios from 'axios'

/** Drops null/undefined/empty-string/non-finite params and joins array values with commas. */
export function cleanParams(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'number' && !Number.isFinite(value)) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      out[key] = value.join(',')
    } else {
      out[key] = String(value)
    }
  }
  return out
}

export function createApiClient(baseURL: string) {
  return axios.create({ baseURL, timeout: 20_000 })
}

export interface ApiErrorBody {
  error?: string
  message?: string
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | string | undefined
    if (typeof body === 'string') return body
    if (body?.message) return body.message
    if (body?.error) return body.error
    if (err.response?.status) return `HTTP ${err.response.status}: ${err.message}`
    return err.message
  }
  return err instanceof Error ? err.message : String(err)
}
