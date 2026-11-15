<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { CORE_BODY_KEYS } from '../stores/reference'
import { aspectsParam, momentParams, useMomentForm } from '../lib/queryForms'
import { usePreferencesStore, type AspectDef } from '../stores/preferences'
import MomentFields from '../components/MomentFields.vue'
import BodySelect from '../components/BodySelect.vue'
import AyanamshaSelect from '../components/AyanamshaSelect.vue'
import AspectOrbsEditor from '../components/AspectOrbsEditor.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import { formatMoment, round } from '../lib/format'
import type { AspectTarget, BulkChart, BulkError, BulkLabel, BulkMatch } from '../api/types'

type BulkKind = 'charts' | 'pairs' | 'one-to-many' | 'many-to-many'

const PATHS: Record<BulkKind, string> = {
  charts: '/bulk/charts',
  pairs: '/bulk/aspects/pairs',
  'one-to-many': '/bulk/aspects/one-to-many',
  'many-to-many': '/bulk/aspects/many-to-many',
}

const A = { ref: 'RecordA', lat: 62.1854, lng: 16.6714, dt: '1973-04-17T11:23:19Z', tags: { sex: 'm' } }
const B = { ref: 'RecordB', lat: 44.8993, lng: 12.39373, dt: '1976-12-08T17:39:45Z', tags: { sex: 'f' } }
const C = { ref: 'RecordC', lat: 48.1462, lng: 11.38975, dt: '1969-07-06T09:24:37Z', tags: { sex: 'f' } }

const EXAMPLES: Record<BulkKind, string> = {
  charts: JSON.stringify([A, B, C], null, 1),
  pairs: JSON.stringify([{ a: A, b: B }, { a: A, b: C }], null, 1),
  'one-to-many': JSON.stringify({ source: A, target: [B, C] }, null, 1),
  'many-to-many': JSON.stringify([A, B, C], null, 1),
}

const prefs = usePreferencesStore()
const moment = useMomentForm()
const form = reactive({
  kind: 'charts' as BulkKind,
  body: EXAMPLES.charts,
  bodies: [...CORE_BODY_KEYS],
  bodies2: [] as string[],
  ps: 'geo' as 'geo' | 'topo',
  aya: '',
  tags: '',
  prog: '',
})
const aspects = reactive<{ defs: AspectDef[] }>({ defs: prefs.aspects.map((a) => ({ ...a })) })
const parseError = reactive({ message: '' })

const isAspects = computed(() => form.kind !== 'charts')

// Swap in the example for the newly chosen endpoint, unless the records have been edited.
watch(
  () => form.kind,
  (kind, previous) => {
    if (form.body.trim() === '' || form.body === EXAMPLES[previous]) form.body = EXAMPLES[kind]
  },
)

interface BulkResult {
  ps: string
  sidereal: string | null
  count: number
  bodies?: string[]
  bodies2?: string[]
  targets?: AspectTarget[]
  progressed?: { date: { jd: number; utc: string | null; unix: number | null }; a: string; b: string }
  source?: BulkLabel
  charts?: BulkChart[]
  matches?: BulkMatch[]
  errors: BulkError[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<BulkResult>(PATHS.charts)

const chartRows = computed(() =>
  (data.value?.charts ?? []).flatMap((chart) => chart.bodies.map((body) => ({ ref: chart.ref, when: formatMoment(chart.date), engine: chart.engine, ...body }))),
)

const matchRows = computed(() => {
  const res = data.value
  if (!res?.matches) return []
  return res.matches.flatMap((match) =>
    match.aspects.map((hit) => ({
      ref_a: match.a?.ref ?? res.source?.ref ?? '',
      ref_b: match.b?.ref ?? match.ref ?? '',
      closest: match.closest,
      ...hit,
    })),
  )
})

function submit() {
  let body: unknown
  try {
    body = JSON.parse(form.body)
    parseError.message = ''
  } catch (err) {
    parseError.message = `The records are not valid JSON: ${err instanceof Error ? err.message : String(err)}`
    return
  }
  run(
    {
      bodies: form.bodies,
      ps: form.ps,
      aya: form.aya,
      sid: form.aya ? 1 : undefined,
      ...(isAspects.value
        ? {
            bodies2: form.bodies2,
            aspects: aspectsParam(aspects.defs),
            prog: form.prog,
            ...(form.prog ? momentParams(moment) : {}),
          }
        : {}),
      // The tag filter is not applied to pairs.
      tags: form.kind === 'pairs' ? undefined : form.tags,
    },
    { path: PATHS[form.kind], body },
  )
}
</script>

<template>
  <section class="view-page view-bulk">
    <h1 class="view-title title">Bulk</h1>
    <p class="view-subtitle subtitle">Charts and aspect searches over many records (POST). Record dates are UTC.</p>

    <div class="view-form box horizontal-form">
      <b-field label="Endpoint" label-position="on-border">
        <b-select size="is-small" v-model="form.kind">
          <option value="charts">Charts</option>
          <option value="pairs">Aspects: pairs</option>
          <option value="one-to-many">Aspects: one to many</option>
          <option value="many-to-many">Aspects: many to many</option>
        </b-select>
      </b-field>
      <BodySelect v-model="form.bodies" :label="isAspects ? 'Bodies (chart A)' : 'Bodies'" />
      <BodySelect v-if="isAspects" v-model="form.bodies2" label="Bodies (chart B, empty = same)" />
      <b-field label="Perspective" label-position="on-border">
        <b-select size="is-small" v-model="form.ps">
          <option value="geo">Geocentric</option>
          <option value="topo">Topocentric</option>
        </b-select>
      </b-field>
      <AyanamshaSelect v-model="form.aya" />
      <b-field v-if="form.kind !== 'pairs'" label="Tag filter (key:value,…)" label-position="on-border">
        <b-input size="is-small" v-model="form.tags" placeholder="sex:f" />
      </b-field>
      <template v-if="isAspects">
        <b-field label="Progressed" label-position="on-border">
          <b-select size="is-small" v-model="form.prog">
            <option value="">Natal charts</option>
            <option value="a">Chart A progressed</option>
            <option value="b">Chart B progressed</option>
            <option value="ab">Both progressed</option>
          </b-select>
        </b-field>
        <MomentFields v-if="form.prog" :form="moment" label="Progressed to" />
        <AspectOrbsEditor v-model="aspects.defs" />
      </template>
      <b-field class="bulk-records" label="Records (JSON)">
        <b-input size="is-small" type="textarea" rows="7" v-model="form.body" spellcheck="false" />
      </b-field>
      <b-button size="is-small" type="is-primary" class="run-button" @click="submit" :loading="loading">Run</b-button>
    </div>

    <b-notification v-if="parseError.message" type="is-danger" :closable="false">{{ parseError.message }}</b-notification>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default="{ data: res }">
        <p class="result-summary">
          POST · {{ (res as BulkResult).ps }} · {{ (res as BulkResult).sidereal ? `sidereal (${(res as BulkResult).sidereal})` : 'tropical' }} ·
          {{ (res as BulkResult).count }} {{ (res as BulkResult).charts ? 'charts' : 'matches' }}
          <template v-if="(res as BulkResult).progressed">
            · progressed to {{ formatMoment((res as BulkResult).progressed!.date) }} (A {{ (res as BulkResult).progressed!.a }}, B
            {{ (res as BulkResult).progressed!.b }})
          </template>
        </p>

        <b-table v-if="(res as BulkResult).charts" :data="chartRows" striped narrowed paginated per-page="25" pagination-size="is-small">
          <b-table-column field="ref" label="Record" v-slot="props">{{ props.row.ref }}</b-table-column>
          <b-table-column field="when" label="Date (UTC)" v-slot="props">{{ props.row.when }}</b-table-column>
          <b-table-column field="key" label="Body" v-slot="props">{{ props.row.key }}</b-table-column>
          <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" /></b-table-column>
          <b-table-column field="lat" label="Latitude" numeric v-slot="props">{{ round(props.row.lat) }}</b-table-column>
          <b-table-column field="lng_speed" label="Lng speed" numeric v-slot="props">{{ round(props.row.lng_speed) }}</b-table-column>
          <b-table-column field="dist" label="Distance" numeric v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
          <b-table-column field="engine" label="Engine" v-slot="props">{{ props.row.engine }}</b-table-column>
        </b-table>

        <b-table v-else :data="matchRows" striped narrowed paginated per-page="25" pagination-size="is-small">
          <b-table-column field="ref_a" label="Record A" v-slot="props">{{ props.row.ref_a }}</b-table-column>
          <b-table-column field="a" label="Body A" v-slot="props">{{ props.row.a }}</b-table-column>
          <b-table-column field="lng_a" label="Longitude A" v-slot="props"><DegreeValue :value="props.row.lng_a" /></b-table-column>
          <b-table-column field="ref_b" label="Record B" v-slot="props">{{ props.row.ref_b }}</b-table-column>
          <b-table-column field="b" label="Body B" v-slot="props">{{ props.row.b }}</b-table-column>
          <b-table-column field="lng_b" label="Longitude B" v-slot="props"><DegreeValue :value="props.row.lng_b" /></b-table-column>
          <b-table-column field="aspect" label="Aspect" numeric v-slot="props">{{ round(props.row.aspect, 1) }}°</b-table-column>
          <b-table-column field="orb" label="Orb" numeric v-slot="props">{{ round(props.row.orb, 2) }}</b-table-column>
          <b-table-column field="divergence" label="Divergence" numeric v-slot="props">{{ round(props.row.divergence, 3) }}</b-table-column>
          <template #empty><p class="has-text-grey">No aspects found.</p></template>
        </b-table>

        <template v-if="(res as BulkResult).errors.length">
          <p class="result-summary mt-4">Records left out ({{ (res as BulkResult).errors.length }})</p>
          <b-table :data="(res as BulkResult).errors" striped narrowed>
            <b-table-column field="ref" label="Record" v-slot="props">{{ props.row.ref ?? `#${props.row.index}` }}</b-table-column>
            <b-table-column field="error" label="Error" v-slot="props">{{ props.row.error }}</b-table-column>
          </b-table>
        </template>
      </template>
    </ResultPanel>
  </section>
</template>
