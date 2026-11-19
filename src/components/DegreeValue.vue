<script setup lang="ts">
import { computed, inject } from 'vue'
import { formatDecimalDegrees, formatFullDms, formatLongitudeTooltip, formatSignDms } from '../lib/degrees'
import { APPLIED_AYANAMSHA } from '../lib/zodiac'

export type DegreeDisplayMode = 'sign' | 'dms' | 'decimal'

const props = withDefaults(
  defineProps<{
    /** Ecliptic longitude (or other 0–360 angle) in decimal degrees. */
    value: number
    /** Which format is shown; the hover tooltip gives the sign name, full DMS and decimal degrees. */
    mode?: DegreeDisplayMode
    /** Decimal places for the decimal format. */
    decimals?: number
    /**
     * Name of the ayanamsha this longitude is measured by, or null for tropical. Left out, it
     * follows the response of the result panel the value sits in.
     */
    ayanamsha?: string | null
  }>(),
  { mode: 'sign', decimals: 4, ayanamsha: undefined },
)

const formats = computed(() => ({
  sign: formatSignDms(props.value),
  dms: formatFullDms(props.value),
  decimal: formatDecimalDegrees(props.value, props.decimals),
}))

const mainText = computed(() => formats.value[props.mode])
const panelAyanamsha = inject(APPLIED_AYANAMSHA, null)
const tooltipText = computed(() =>
  formatLongitudeTooltip(props.value, props.ayanamsha !== undefined ? props.ayanamsha : (panelAyanamsha?.value ?? null), props.decimals),
)
</script>

<template>
  <b-tooltip :label="tooltipText" position="is-top" dashed class="degree-value" :class="`degree-value-${mode}`">
    {{ mainText }}
  </b-tooltip>
</template>
