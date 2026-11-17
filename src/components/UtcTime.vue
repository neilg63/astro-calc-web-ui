<script setup lang="ts">
import { computed } from 'vue'
import { formatJd, momentJd, type JdDisplayMode, type MomentLike } from '../lib/format'

/**
 * A date-time shown as `YYYY-MM-DD hh:mm:ss`. Its tooltip, in the style of the longitude
 * tooltips, says that the time is UTC and gives the Julian Day.
 */
const props = defineProps<{ value: MomentLike; mode?: JdDisplayMode }>()

const jd = computed(() => momentJd(props.value))
const text = computed(() => formatJd(props.value, props.mode ?? 'utc'))
const tooltip = computed(() => {
  if (jd.value === null) return ''
  return props.mode === 'jd' ? `Julian Day (UT) · ${formatJd(jd.value)} UTC` : `UTC · Julian Day ${jd.value.toFixed(5)}`
})
</script>

<template>
  <b-tooltip v-if="jd !== null" :label="tooltip" position="is-top" dashed class="utc-time has-time">{{ text }}</b-tooltip>
  <span v-else class="utc-time">{{ text }}</span>
</template>
