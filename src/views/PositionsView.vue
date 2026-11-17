<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import { perspectiveBodies } from '../lib/perspectives'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import BodySelect from '../components/BodySelect.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { coordColumns, round } from '../lib/format'
import type { AyanamshaValue, BodyPosition, GeoJson } from '../api/types'

const moment = useMomentForm()
const view = useViewForm()
const bodies = reactive({ keys: [...CORE_BODY_KEYS] })
// A ref, not a reactive object: the field replaces the whole value on every change.
const aya = ref<AyanamshaFormValue>({ aya: [], sid: false })

interface PositionsResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  bodies: BodyPosition[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<PositionsResult>('/positions')
/** The angle columns follow the coordinate system of the response. */
const cols = computed(() => coordColumns(data.value?.cs))

function submit() {
  run({ bodies: perspectiveBodies(bodies.keys, view.ps).keys, ...momentParams(moment), ...viewParams(view), aya: aya.value.aya, sid: aya.value.sid ? 1 : undefined })
}
</script>

<template>
  <section class="view-page view-positions">
  <h1 class="view-title title">Positions</h1>
  <p class="view-subtitle subtitle">Several bodies at one moment.</p>

  <div class="view-form box horizontal-form">
    <BodySelect v-model="bodies.keys" />
    <MomentFields :form="moment" />
    <ViewFields :form="view" :bodies="bodies.keys" />
    <AyanamshaFields v-model="aya" show-sidereal />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="(res as PositionsResult).bodies" striped narrowed>
        <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
        <b-table-column :field="cols.first" :label="cols.firstLabel" v-slot="props">
          <DegreeValue v-if="cols.ecliptic" :value="props.row[cols.first]" />
          <template v-else>{{ round(props.row[cols.first]) }}°</template>
        </b-table-column>
        <b-table-column :field="cols.second" :label="cols.secondLabel" v-slot="props">{{ round(props.row[cols.second]) }}</b-table-column>
        <b-table-column :field="`${cols.first}_speed`" :label="`${cols.firstLabel} speed`" v-slot="props">{{ round(props.row[`${cols.first}_speed`]) }}</b-table-column>
        <b-table-column :field="`${cols.second}_speed`" :label="`${cols.secondLabel} speed`" v-slot="props">{{ round(props.row[`${cols.second}_speed`]) }}</b-table-column>
        <b-table-column field="dist" label="Distance" v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
        <b-table-column field="dist_speed" label="Dist speed" v-slot="props">{{ round(props.row.dist_speed, 6) }}</b-table-column>
      </b-table>

      <b-table v-if="(res as PositionsResult).ayanamshas.length" class="mt-4" :data="(res as PositionsResult).ayanamshas" striped narrowed>
        <b-table-column field="key" label="Ayanamsha" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
