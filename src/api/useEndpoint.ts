import { ref } from 'vue'
import { cleanParams, createApiClient, extractErrorMessage } from './client'
import { usePreferencesStore } from '../stores/preferences'

/** Runs a GET against the configured API base, exposing loading/error/data state. */
export function useEndpoint<T = unknown>(path: string) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const lastUrl = ref<string>('')

  async function run(params: Record<string, unknown>) {
    const prefs = usePreferencesStore()
    const client = createApiClient(prefs.apiBase)
    const query = cleanParams(params)
    loading.value = true
    error.value = null
    try {
      const res = await client.get(path, { params: query })
      data.value = res.data as T
      lastUrl.value = `${prefs.apiBase}${path}?${new URLSearchParams(query).toString()}`
    } catch (err) {
      error.value = extractErrorMessage(err)
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, lastUrl, run }
}
