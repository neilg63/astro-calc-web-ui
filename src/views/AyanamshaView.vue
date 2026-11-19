<script setup lang="ts">
import RunButton from '../components/RunButton.vue'
import { ayanamshaLabel, orderAyanamshas } from '../lib/zodiac'
import { ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import { formatSignedDms } from '../lib/degrees'
import type { AyanamshaValue } from '../api/types'

const moment = useMomentForm()
// A ref, not a reactive object: the field replaces the whole value on every change.
const selection = ref<AyanamshaFormValue>({ aya: [], sid: false })

interface AyanamshaResult {
  date: unknown
  ayanamshas: AyanamshaValue[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<AyanamshaResult>('/ayanamsha')

function submit() {
  run({ ...momentParams(moment), aya: selection.value.aya.length ? selection.value.aya : 'all' })
}
</script>

<template>
  <section class="view-page view-ayanamsha">
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <AyanamshaFields v-model="selection" empty-label="All" />
    <RunButton :loading="loading" @click="submit" />
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="orderAyanamshas((res as AyanamshaResult).ayanamshas)" striped narrowed>
        <b-table-column field="name" label="Ayanamsha" v-slot="props">{{ ayanamshaLabel(props.row.name) }}</b-table-column>
        <b-table-column field="value" label="DMS" numeric v-slot="props">{{ formatSignedDms(props.row.value) }}</b-table-column>
        <b-table-column field="value" label="Degrees" numeric v-slot="props">{{ props.row.value.toFixed(5) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
