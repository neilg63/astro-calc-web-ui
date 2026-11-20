<script setup lang="ts">
import { computed, inject } from 'vue'
import { formatDecimalDegrees, formatFullDms, formatLongitudeTooltip, formatSignDms, formatSignTooltip } from '../lib/degrees'
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
    /**
     * What the tooltip adds. `full` (the default) names the sign and gives full DMS and decimal
     * degrees. `sign` is the variant for a value shown as full DMS: degrees within the sign
     * with its symbol, and decimal degrees.
     */
    tooltip?: 'full' | 'sign'
    /** Text put before the tooltip, e.g. a cusp's place in its set: `1/12`. */
    prefix?: string
  }>(),
  { mode: 'sign', decimals: 4, ayanamsha: undefined, tooltip: 'full' },
)

const formats = computed(() => ({
  sign: formatSignDms(props.value),
  dms: formatFullDms(props.value),
  decimal: formatDecimalDegrees(props.value, props.decimals),
}))

const mainText = computed(() => formats.value[props.mode])
const panelAyanamsha = inject(APPLIED_AYANAMSHA, null)
const tooltipText = computed(() => {
  const zodiac = props.ayanamsha !== undefined ? props.ayanamsha : (panelAyanamsha?.value ?? null)
  const text = (props.tooltip === 'sign' ? formatSignTooltip : formatLongitudeTooltip)(props.value, zodiac, props.decimals)
  return props.prefix ? `${props.prefix} · ${text}` : text
})
</script>

<template>
  <b-tooltip :label="tooltipText" position="is-top" dashed class="degree-value" :class="`degree-value-${mode}`">
    {{ mainText }}
  </b-tooltip>
</template>
