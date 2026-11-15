<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { useReferenceStore } from '../stores/reference'
import { round } from '../lib/format'
import type { AyanamshaValue } from '../api/types'
import { onMounted } from 'vue'

const moment = useMomentForm()
const reference = useReferenceStore()
onMounted(() => reference.loadAll())
const selection = reactive({ keys: [] as string[] })

interface AyanamshaResult {
  date: unknown
  ayanamshas: AyanamshaValue[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<AyanamshaResult>('/ayanamsha')

function submit() {
  run({ ...momentParams(moment), aya: selection.keys.length ? selection.keys : 'all' })
}
</script>

<template>
  <section class="view-page view-ayanamsha">
  <h1 class="view-title title">Ayanamsha</h1>
  <div class="view-form box horizontal-form">
    <MomentFields :form="moment" />
    <b-field label="Ayanamshas (none = all)" label-position="on-border">
      <b-select size="is-small" multiple expanded native-size="6" v-model="selection.keys">
        <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ a.name }}</option>
      </b-select>
    </b-field>
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
