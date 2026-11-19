<script setup lang="ts">
import { computed } from 'vue'
import DegreeValue from './DegreeValue.vue'
import { ayanamshaLabel } from '../lib/zodiac'
import type { Angles } from '../api/types'

/**
 * The chart points of a moment and place (`points` in the API) as a horizontal definition
 * list with short labels; each label's tooltip gives the full name. The points are tropical.
 * When an ayanamsha is given, the list starts with the sidereal ascendant, the only point
 * adjusted by it.
 */
const props = defineProps<{
  points: Angles
  /** The ayanamsha of the response, if one was chosen: its name and value in degrees. */
  ayanamsha?: { name: string; value: number } | null
  title?: string
}>()

const POINTS: [keyof Angles, string, string][] = [
  ['ascendant', 'Trop. asc.', 'Tropical ascendant'],
  ['mc', 'MC', 'Midheaven'],
  ['ic', 'IC', 'Imum Coeli'],
  ['armc', 'ARMC', 'Right Ascension of Midheaven'],
  ['vertex', 'Vertex', 'Vertex'],
  ['equasc', 'Equ. asc.', 'Equatorial ascendant'],
  ['coasc1', 'Co-asc. 1', 'Co-ascendant 1'],
  ['coasc2', 'Co-asc. 2', 'Co-ascendant 2'],
  ['polasc', 'Pol. asc.', 'Polar ascendant'],
]

interface PointItem {
  key: string
  label: string
  name: string
  value: number
  /** Display name of the ayanamsha the value is measured by; null for tropical. */
  ayanamsha: string | null
}

const items = computed<PointItem[]>(() => {
  const list: PointItem[] = POINTS.filter(([key]) => typeof props.points[key] === 'number').map(([key, label, name]) => ({
    key,
    label,
    name,
    value: props.points[key],
    ayanamsha: null,
  }))
  const aya = props.ayanamsha
  if (aya && Number.isFinite(aya.value) && typeof props.points.ascendant === 'number') {
    const name = ayanamshaLabel(aya.name)
    list.unshift({
      key: 'sidasc',
      label: 'Sid. asc.',
      name: `Sidereal ascendant (${name})`,
      value: (((props.points.ascendant - aya.value) % 360) + 360) % 360,
      ayanamsha: name,
    })
  }
  return list
})
</script>

<template>
  <div class="points-list">
    <p v-if="title" class="points-list-title">{{ title }}</p>
    <dl class="points-list-items">
      <div v-for="item in items" :key="item.key" class="points-list-item" :class="`is-${item.key}`">
        <dt><b-tooltip :label="item.name" position="is-top" dashed>{{ item.label }}</b-tooltip></dt>
        <dd><DegreeValue :value="item.value" :ayanamsha="item.ayanamsha" /></dd>
      </div>
    </dl>
  </div>
</template>
