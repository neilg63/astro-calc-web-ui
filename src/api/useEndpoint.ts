import { ref } from 'vue'
import { cleanParams, createApiClient, extractErrorMessage } from './client'
import { usePreferencesStore } from '../stores/preferences'

export interface RunOptions {
  /** Overrides the path given to `useEndpoint`, for views that switch between endpoints. */
  path?: string
  /** A JSON body: when given, the request is a POST. */
  body?: unknown
}

/** Runs a GET (or a POST, when a body is given) against the configured API base, exposing loading/error/data state. */
export function useEndpoint<T = unknown>(path: string) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const lastUrl = ref<string>('')

  /** The request in flight, if any: a newer one cancels it, so only the latest answer is shown. */
  let pending: AbortController | undefined

  async function run(params: Record<string, unknown>, options: RunOptions = {}) {
    const prefs = usePreferencesStore()
    const client = createApiClient(prefs.apiBase)
    const query = cleanParams(params)
    const target = options.path ?? path
    pending?.abort()
    const request = new AbortController()
    pending = request
    const signal = request.signal
    loading.value = true
    error.value = null
    try {
      const res =
        options.body === undefined
          ? await client.get(target, { params: query, signal })
          : await client.post(target, options.body, { params: query, signal })
      if (pending !== request) return
      data.value = res.data as T
      lastUrl.value = `${prefs.apiBase}${target}?${new URLSearchParams(query).toString()}`
    } catch (err) {
      // A cancelled request was replaced by a newer one, which owns the state from here.
      if (pending !== request) return
      error.value = extractErrorMessage(err)
      data.value = null
    } finally {
      if (pending === request) {
        pending = undefined
        loading.value = false
      }
    }
  }

  return { data, error, loading, lastUrl, run }
}
