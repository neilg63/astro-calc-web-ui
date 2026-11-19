<script setup lang="ts">
import { computed, provide } from 'vue'
import { shownTimes, useTimeBasis } from '../lib/timeBasis'
import { APPLIED_AYANAMSHA, appliedAyanamsha } from '../lib/zodiac'
import { useReferenceStore } from '../stores/reference'

const { choice, offset, offsetLabel, mode, note } = useTimeBasis()

const props = defineProps<{ loading: boolean; error: string | null; data: unknown; lastUrl?: string }>()

// Longitudes inside the panel say in their tooltips which zodiac the response is in.
const reference = useReferenceStore()
provide(
  APPLIED_AYANAMSHA,
  computed(() => appliedAyanamsha(props.data, (key) => reference.ayanamshaName(key))),
)
</script>

<template>
  <div class="result-panel">
    <b-notification v-if="error" type="is-danger" class="result-panel-error" :closable="false">{{ error }}</b-notification>
    <div v-if="loading" class="result-panel-loading has-text-centered py-4">
      <b-loading :is-full-page="false" active />
    </div>
    <template v-else-if="data">
      <div v-if="shownTimes > 0" class="time-basis">
        <b-field label="Show times as" label-position="on-border">
          <b-select v-model="choice" size="is-small">
            <option value="utc">UTC</option>
            <option value="local" :disabled="offset === null">{{ offset === null ? 'Local time (choose a place)' : `Local time, ${offsetLabel}` }}</option>
            <option value="jd">Julian Day</option>
          </b-select>
        </b-field>
        <span class="time-basis-note" :class="`is-${mode}`">{{ note }}</span>
      </div>
      <div class="result-panel-body">
        <slot :data="data" />
      </div>
      <p v-if="lastUrl" class="result-panel-url is-size-7 has-text-grey mt-4">
        <a :href="lastUrl" target="_blank" rel="noopener">{{ lastUrl }}</a>
      </p>
      <b-collapse class="result-panel-raw-toggle mt-2" animation="slide" :model-value="false">
        <template #trigger="props">
          <a class="is-size-7">{{ props.open ? 'Hide' : 'Show' }} raw JSON</a>
        </template>
        <pre class="result-panel-raw">{{ JSON.stringify(data, null, 2) }}</pre>
      </b-collapse>
    </template>
  </div>
</template>
