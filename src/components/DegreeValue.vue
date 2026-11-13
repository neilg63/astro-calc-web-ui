<script setup lang="ts">
import { computed } from 'vue'
import { formatDecimalDegrees, formatFullDms, formatSignDms } from '../lib/degrees'

export type DegreeDisplayMode = 'sign' | 'dms' | 'decimal'

const props = withDefaults(
  defineProps<{
    /** Ecliptic longitude (or other 0–360 angle) in decimal degrees. */
    value: number
    /** Which format is shown by default; the other two appear in the hover tooltip. */
    mode?: DegreeDisplayMode
    /** Decimal places for the decimal format. */
    decimals?: number
  }>(),
  { mode: 'sign', decimals: 4 },
)

const formats = computed(() => ({
  sign: formatSignDms(props.value),
  dms: formatFullDms(props.value),
  decimal: formatDecimalDegrees(props.value, props.decimals),
}))

const mainText = computed(() => formats.value[props.mode])
const tooltipText = computed(() =>
  (['sign', 'dms', 'decimal'] as DegreeDisplayMode[])
    .filter((m) => m !== props.mode)
    .map((m) => formats.value[m])
    .join('  ·  '),
)
</script>

<template>
  <b-tooltip :label="tooltipText" position="is-top" dashed multilined class="degree-value" :class="`degree-value-${mode}`">
    {{ mainText }}
  </b-tooltip>
</template>
