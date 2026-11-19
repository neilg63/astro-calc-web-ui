<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import axios from 'axios'
import { fetchZoneInfo, formatUtcOffset, lookupPlaces, MIN_PLACE_QUERY, type PlaceMatch, type ZoneInfo } from '../api/geotz'
import { currentPlace, type PlaceTarget } from '../stores/preferences'

/** The moment whose local time is shown for the chosen place. */
interface PlaceMoment {
  mode: 'now' | 'dt' | 'jd'
  dt: string
  jd: number
}

/**
 * A place-name search box. Choosing a suggestion sets the target's latitude and longitude and
 * remembers the place with its time zone; the zone's offset and the local time at `moment`
 * are then shown below the box.
 */
const props = defineProps<{ target: PlaceTarget; moment?: PlaceMoment }>()

const TYPING_DELAY_MS = 250

const current = computed(() => currentPlace(props.target))

const typed = ref(current.value?.text ?? '')
const matches = ref<PlaceMatch[]>([])
const searching = ref(false)
const searchError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let lookupAbort: AbortController | undefined

// The box follows the place: it empties when the coordinates are edited by hand.
watch(current, (place) => {
  if (place) typed.value = place.text
  else if (props.target.place && typed.value === props.target.place.text) typed.value = ''
})

function onTyping(value: string | number | undefined) {
  const text = String(value ?? '').trim()
  clearTimeout(timer)
  lookupAbort?.abort()
  searchError.value = ''
  if (text.length < MIN_PLACE_QUERY || text === current.value?.text) {
    matches.value = []
    searching.value = false
    return
  }
  searching.value = true
  timer = setTimeout(() => search(text), TYPING_DELAY_MS)
}

async function search(text: string) {
  const abort = new AbortController()
  lookupAbort = abort
  try {
    matches.value = await lookupPlaces(text, abort.signal)
  } catch (err) {
    if (axios.isCancel(err)) return
    matches.value = []
    searchError.value = 'Place search is unavailable'
  }
  if (lookupAbort === abort) searching.value = false
}

function choose(match: PlaceMatch | null | undefined) {
  if (!match) return
  const target = props.target
  target.lat = match.lat
  target.lng = match.lng
  // The search gives no elevation, and the previous altitude belonged to the previous place.
  target.alt = 0
  target.place = { text: match.text, zone: match.zone_name, lat: match.lat, lng: match.lng }
  // The offset comes with the place's zone, once the time-zone service has answered.
  target.tzOffset = null
  target.tzManual = false
  matches.value = []
}

// ---- Time zone of the chosen place at the moment ----

const zone = ref<ZoneInfo | null>(null)
let zoneAbort: AbortController | undefined

const zoneQuery = computed(() => {
  const place = current.value
  if (!place) return null
  const moment = props.moment
  if (moment?.mode === 'dt' && moment.dt) return { zone: place.zone, dt: moment.dt }
  if (moment?.mode === 'jd' && Number.isFinite(moment.jd)) return { zone: place.zone, jd: moment.jd }
  return { zone: place.zone }
})

watch(
  zoneQuery,
  async (query) => {
    zoneAbort?.abort()
    if (!query) {
      // Coordinates set by hand have no known zone, so no offset either.
      zone.value = null
      props.target.tzOffset = null
      props.target.tzManual = false
      return
    }
    const abort = new AbortController()
    zoneAbort = abort
    try {
      const { zone: name, ...moment } = query
      const info = await fetchZoneInfo(name, moment, abort.signal)
      if (zoneAbort !== abort) return
      zone.value = info
      if (!props.target.tzManual) props.target.tzOffset = info.gmt_offset
    } catch (err) {
      if (!axios.isCancel(err) && zoneAbort === abort) zone.value = null
    }
  },
  { immediate: true, deep: true },
)

/** e.g. `Europe/London · BST (UTC+1) · local 1969-12-28 13:00:00`. */
const zoneLine = computed(() => {
  const place = current.value
  if (!place) return ''
  const info = zone.value
  if (!info || info.zone_name !== place.zone) return place.zone
  const byHand = props.target.tzManual && props.target.tzOffset !== null ? ` · set by hand to ${formatUtcOffset(props.target.tzOffset)}` : ''
  return `${info.zone_name} · ${info.abbreviation} (${formatUtcOffset(info.gmt_offset)})${byHand} · local ${info.local_dt.replace('T', ' ')}`
})

onBeforeUnmount(() => {
  clearTimeout(timer)
  lookupAbort?.abort()
  zoneAbort?.abort()
})
</script>

<template>
  <b-field class="place-search" label="Place" label-position="on-border" :message="searchError || zoneLine" :type="searchError ? 'is-danger' : undefined">
    <b-autocomplete
      v-model="typed"
      :data="matches"
      field="text"
      :loading="searching"
      size="is-small"
      icon="map-marker"
      placeholder="Search for a town or city"
      clearable
      keep-first
      @typing="onTyping"
      @select="choose"
    >
      <template #default="{ option: o }">
        <span class="place-search-name">{{ o.text }}</span>
        <span class="place-search-zone">{{ o.zone_name }}</span>
      </template>
      <template v-if="typed.trim().length >= MIN_PLACE_QUERY && !searching && !searchError && typed !== current?.text" #empty>No match</template>
    </b-autocomplete>
  </b-field>
</template>
