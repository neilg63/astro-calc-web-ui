<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { useReferenceStore } from '../stores/reference'
import { momentParams, useMomentForm, useViewForm, viewParams } from '../lib/queryForms'
import MomentFields from '../components/MomentFields.vue'
import ViewFields from '../components/ViewFields.vue'
import AyanamshaFields, { type AyanamshaFormValue } from '../components/AyanamshaFields.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { coordColumns, round } from '../lib/format'
import type { AyanamshaValue, BodyPosition, GeoJson } from '../api/types'

const reference = useReferenceStore()
onMounted(() => reference.loadAll())

const moment = useMomentForm()
const view = useViewForm()
const body = reactive({ key: 'su' })
// A ref, not a reactive object: the field replaces the whole value on every change.
const aya = ref<AyanamshaFormValue>({ aya: [], sid: false })

interface PositionResult {
  date: unknown
  geo: GeoJson
  cs: string
  ps: string
  sidereal: boolean
  ayanamshas: AyanamshaValue[]
  body: BodyPosition
}

const { data, error, loading, run, lastUrl } = useEndpoint<PositionResult>('/position')
/** The angle columns follow the coordinate system of the response. */
const cols = computed(() => coordColumns(data.value?.cs))

function submit() {
  run({ body: body.key, ...momentParams(moment), ...viewParams(view), aya: aya.value.aya, sid: aya.value.sid ? 1 : undefined })
}
</script>

<template>
  <section class="view-page view-position">
  <h1 class="view-title title">Position</h1>
  <p class="view-subtitle subtitle">One body's ecliptic, equatorial or horizontal position.</p>

  <div class="view-form box horizontal-form">
    <b-field label="Body" label-position="on-border">
      <b-select size="is-small" v-model="body.key">
        <option v-for="b in reference.bodies" :key="b.key" :value="b.key" :disabled="!b.available">{{ b.name }} ({{ b.key }})</option>
      </b-select>
    </b-field>
    <MomentFields :form="moment" />
    <ViewFields :form="view" />
    <AyanamshaFields v-model="aya" show-sidereal />
    <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
  </div>

  <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
    <template #default="{ data: res }">
      <b-table :data="[(res as PositionResult).body]" striped narrowed>
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

      <b-table v-if="(res as PositionResult).ayanamshas.length" class="mt-4" :data="(res as PositionResult).ayanamshas" striped narrowed>
        <b-table-column field="key" label="Ayanamsha" v-slot="props">{{ props.row.name }}</b-table-column>
        <b-table-column field="value" label="Value" v-slot="props">{{ round(props.row.value) }}</b-table-column>
      </b-table>
    </template>
  </ResultPanel>
  </section>
</template>
