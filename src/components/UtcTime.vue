<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { formatJd, momentJd, type JdDisplayMode, type MomentLike } from '../lib/format'
import { shownTimes, useTimeBasis } from '../lib/timeBasis'

/**
 * A date-time shown as `YYYY-MM-DD hh:mm:ss`: UTC, local clock time at the stored location's
 * offset, or a Julian Day, following the app-wide choice unless `mode` fixes it. Its tooltip,
 * in the style of the longitude tooltips, says which it is and gives the other forms.
 */
const props = defineProps<{ value: MomentLike; mode?: JdDisplayMode }>()

const basis = useTimeBasis()
const shown = computed<JdDisplayMode>(() => (props.mode === 'local' && basis.offset.value === null ? 'utc' : (props.mode ?? basis.mode.value)))
const jd = computed(() => momentJd(props.value))
const text = computed(() => formatJd(props.value, shown.value, basis.offset.value ?? 0))
const tooltip = computed(() => {
  if (jd.value === null) return ''
  if (shown.value === 'jd') return `Julian Day (UT) · ${formatJd(jd.value)} UTC`
  if (shown.value === 'local') return `Local time (${basis.offsetLabel.value}) · ${formatJd(jd.value)} UTC · Julian Day ${jd.value.toFixed(5)}`
  return `UTC · Julian Day ${jd.value.toFixed(5)}`
})

// Times that follow the shared choice make the result panel show its selector.
const follows = props.mode === undefined
onMounted(() => {
  if (follows) shownTimes.value += 1
})
onBeforeUnmount(() => {
  if (follows) shownTimes.value -= 1
})
</script>

<template>
  <b-tooltip v-if="jd !== null" :label="tooltip" position="is-top" dashed class="utc-time has-time" :class="`is-${shown}`">{{ text }}</b-tooltip>
  <span v-else class="utc-time">{{ text }}</span>
</template>
