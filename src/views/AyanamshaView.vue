<script setup lang="ts">
import { ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import { round } from '../lib/format'
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
  <h1 class="view-title title">Ayanamsha</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <AyanamshaFields v-model="selection" empty-label="All" />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as AyanamshaResult).ayanamshas" striped narrowed>
        <b-table-column field="name" label="Ayanamsha" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
