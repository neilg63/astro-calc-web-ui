<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import axios from 'axios'
import { fetchZoneInfo, formatOffsetClock, parseOffsetClock, type ZoneInfo } from '../api/geotz'
import { dateTimeStringToJul, julToIsoDateTime } from '../lib/julian-date'
import { currentPlace, type PlaceTarget } from '../stores/preferences'

/**
 * The form's UTC date-time as clock time at the chosen place, with its offset from UTC as
 * `±hh:mm`; both are editable. The form keeps UTC: a local time typed here is converted by
 * the time-zone service and written back as UTC. An offset typed by hand replaces the zone's
 * own until the box is cleared or another place is chosen, and the clock time then stays as
 * it is while UTC moves. Renders nothing unless a place with a time zone is chosen and the
 * form is in date-time mode.
 */
const props = defineProps<{ target: PlaceTarget; form: { mode: string; dt: string } }>()

const EDIT_DELAY_MS = 500

const place = computed(() => (props.form.mode === 'dt' ? currentPlace(props.target) : null))
const local = ref('')
const zone = ref<ZoneInfo | null>(null)
/**
 * Seconds east of UTC typed by hand, or null to use the zone's offset. Either way the offset
 * in force is stored with the location (`tzOffset`, `tzManual`).
 */
const manualOffset = computed<number | null>({
  get: () => (props.target.tzManual && props.target.tzOffset !== null ? props.target.tzOffset : null),
  set: (seconds) => {
    props.target.tzManual = seconds !== null
    if (seconds !== null) props.target.tzOffset = seconds
  },
})
const offsetText = ref('')
const failed = ref(false)
/** A clock time to hold on to when returning from a hand-typed offset to the zone's own. */
let keepClock = ''
let timer: ReturnType<typeof setTimeout> | undefined
let abort: AbortController | undefined

/** The zone's answer, if it is for the place now chosen. */
const zoneNow = computed(() => (zone.value && zone.value.zone_name === place.value?.zone ? zone.value : null))

function showOffset() {
  const seconds = manualOffset.value ?? zoneNow.value?.gmt_offset
  offsetText.value = seconds === undefined ? '' : formatOffsetClock(seconds)
}

/** Asks the service about one moment in the place's zone; a newer request replaces an older one. */
async function ask(moment: { dt: string } | { dtl: string }, fromLocal: boolean) {
  const zoneName = place.value?.zone
  if (!zoneName) return
  abort?.abort()
  const mine = new AbortController()
  abort = mine
  try {
    const info = await fetchZoneInfo(zoneName, moment, mine.signal)
    if (abort !== mine || manualOffset.value !== null) return
    failed.value = false
    zone.value = info
    props.target.tzOffset = info.gmt_offset
    // A clock reading that never existed (clocks going forward) comes back corrected.
    local.value = info.local_dt
    showOffset()
    if (fromLocal && info.utc !== props.form.dt) props.form.dt = info.utc
  } catch (err) {
    if (axios.isCancel(err) || abort !== mine) return
    failed.value = true
  }
}

/** Converts between UTC and clock time with the hand-typed offset, without the service. */
function shift(text: string, offset: number, toUtc: boolean): string {
  const jd = dateTimeStringToJul(text, toUtc ? offset : 0)
  return jd === null ? '' : julToIsoDateTime(jd, toUtc ? 0 : offset)
}

// Another place brings its own zone, so a hand-typed offset no longer applies.
watch(
  () => place.value?.zone,
  () => {
    manualOffset.value = null
  },
)

// The local time follows the UTC date-time and the place.
watch(
  () => [place.value?.zone, props.form.dt, manualOffset.value] as const,
  ([zoneName, dt, manual]) => {
    clearTimeout(timer)
    if (!zoneName || !dt) return
    if (manual !== null) {
      abort?.abort()
      local.value = shift(dt, manual, false)
      showOffset()
      return
    }
    if (keepClock) {
      const clock = keepClock
      keepClock = ''
      ask({ dtl: clock }, true)
      return
    }
    const info = zoneNow.value
    if (info && dateTimeStringToJul(info.utc) === dateTimeStringToJul(dt)) {
      showOffset()
      return
    }
    ask({ dt }, false)
  },
  { immediate: true },
)

function onEdit(value: string | number | undefined) {
  const text = String(value ?? '')
  local.value = text
  clearTimeout(timer)
  if (!text) return
  const manual = manualOffset.value
  if (manual !== null) {
    const utc = shift(text, manual, true)
    if (utc) props.form.dt = utc
  } else {
    timer = setTimeout(() => ask({ dtl: text }, true), EDIT_DELAY_MS)
  }
}

/** A new offset keeps the clock time and moves UTC; an empty box returns to the zone's offset. */
function onOffset(value: string | number | undefined) {
  const text = String(value ?? '').trim()
  offsetText.value = text
  if (text === '') {
    if (manualOffset.value === null) {
      nextTick(showOffset)
      return
    }
    keepClock = local.value
    zone.value = null
    manualOffset.value = null
    return
  }
  const seconds = parseOffsetClock(text)
  if (seconds === null || seconds === (manualOffset.value ?? zoneNow.value?.gmt_offset)) {
    // Put the box back as it was, once the typed text has reached it.
    nextTick(showOffset)
    return
  }
  manualOffset.value = seconds
  showOffset()
  const utc = local.value ? shift(local.value, seconds, true) : ''
  if (utc) props.form.dt = utc
}

const label = computed(() => {
  if (manualOffset.value !== null) return 'Local time'
  return zoneNow.value ? `Local time (${zoneNow.value.abbreviation})` : 'Local time'
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  abort?.abort()
})
</script>

<template>
  <template v-if="place">
    <b-field
      class="local-time-field"
      :label="label"
      label-position="on-border"
      :type="failed ? 'is-danger' : undefined"
      :title="failed ? 'The time-zone service did not answer' : `Clock time in ${place.text} (${place.zone})`"
    >
      <b-input size="is-small" :model-value="local" type="datetime-local" step="1" @update:model-value="onEdit" />
    </b-field>
    <b-field
      class="utc-offset-field"
      :class="{ 'is-manual': manualOffset !== null }"
      :label="manualOffset !== null ? 'Offset (manual)' : 'UTC offset'"
      label-position="on-border"
      title="Hours and minutes ahead of (+) or behind (−) UTC. Type another to override the zone's; clear the box to return to it."
    >
      <b-input size="is-small" :model-value="offsetText" lazy placeholder="+00:00" maxlength="6" :has-counter="false" @update:model-value="onOffset" />
    </b-field>
  </template>
</template>
