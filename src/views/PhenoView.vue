<script setup lang="ts">
import { reactive } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import { round } from '../lib/format'
import type { PhenoEntry } from '../api/types'

const DEFAULT_BODIES = ['su', 'mo', 'me', 've', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl']

const moment = useMomentForm()
const bodies = reactive({ keys: [...DEFAULT_BODIES] })

interface PhenoResult {
  date: unknown
  bodies: PhenoEntry[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<PhenoResult>('/pheno')

function submit() {
  run({ bodies: bodies.keys, ...momentParams(moment) })
}
</script>

<template>
  <h1 class="title">Phenomena</h1>
  <p class="subtitle">Phase, elongation, apparent diameter and magnitude of each body.</p>

  <div class="box">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <b-button type="is-primary" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as PhenoResult).bodies" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column field="phase_angle" label="Phase angle" v-slot="props">{{ round(props.row.phase_angle) }}</b-table-column>
        <b-table-column field="illuminated" label="Illuminated" v-slot="props">{{ round(props.row.illuminated, 3) }}</b-table-column>
        <b-table-column field="elongation" label="Elongation" v-slot="props">{{ round(props.row.elongation) }}</b-table-column>
        <b-table-column field="diameter" label="Diameter (arcsec)" v-slot="props">{{ round(props.row.diameter, 4) }}</b-table-column>
        <b-table-column field="magnitude" label="Magnitude" v-slot="props">{{ props.row.magnitude ?? '—' }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
</template>
