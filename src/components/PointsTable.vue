<script setup lang="ts">
import { computed } from 'vue'
import DegreeValue from './DegreeValue.vue'
import type { Angles } from '../api/types'

/** The chart points of a moment and place (`points` in the API): the ascendant and its relatives. */
const props = defineProps<{ points: Angles; title?: string }>()

const LABELS: [keyof Angles, string][] = [
  ['ascendant', 'Ascendant'],
  ['descendant', 'Descendant'],
  ['mc', 'MC (midheaven)'],
  ['ic', 'IC'],
  ['armc', 'ARMC'],
  ['vertex', 'Vertex'],
  ['equasc', 'Equatorial ascendant'],
  ['coasc1', 'Co-ascendant 1'],
  ['coasc2', 'Co-ascendant 2'],
  ['polasc', 'Polar ascendant'],
]

const rows = computed(() => LABELS.filter(([key]) => typeof props.points[key] === 'number').map(([key, label]) => ({ key, label, value: props.points[key] })))
</script>

<template>
  <div class="points-table">
    <p v-if="title" class="points-table-title">{{ title }}</p>
    <b-table :data="rows" striped narrowed>
      <b-table-column field="label" label="Point" v-slot="props"><span :title="props.row.key">{{ props.row.label }}</span></b-table-column>
      <b-table-column field="value" label="Longitude" v-slot="props"><DegreeValue :value="props.row.value" :ayanamsha="null" /></b-table-column>
    </b-table>
  </div>
</template>
