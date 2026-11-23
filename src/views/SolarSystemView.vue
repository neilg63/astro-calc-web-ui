<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useEndpoint } from '../api/useEndpoint'
import { momentParams, useMomentForm } from '../lib/queryForms'
import { bodySymbol, withBodySymbol } from '../lib/bodies'
import { useReferenceStore } from '../stores/reference'
import { round } from '../lib/format'
import MomentFields from '../components/MomentFields.vue'
import RunButton from '../components/RunButton.vue'
import ResultPanel from '../components/ResultPanel.vue'
import DegreeValue from '../components/DegreeValue.vue'
import UtcTime from '../components/UtcTime.vue'

/** The nine planets outwards from the Sun, then the Earth's Moon. The selection is fixed. */
const PLANETS = ['me', 've', 'ea', 'ma', 'ju', 'sa', 'ur', 'ne', 'pl']
const BODIES = [...PLANETS, 'mo']
/** The span is chosen in whole years, with one position a day. */
const MIN_YEARS = 1
const MAX_YEARS = 10
const DAYS_PER_YEAR = 365.25

const moment = useMomentForm()
const form = reactive({ years: 2 })
const reference = useReferenceStore()
onMounted(() => reference.loadAll())

interface HelioItem {
  jd: number
  lng: number
  lat: number
  dist: number
  lng_speed: number
  lat_speed: number
  dist_speed: number
}

interface HelioResult {
  ps: string
  span: number
  bodies: { key: string; items: HelioItem[] }[]
}

const { data, error, loading, run, lastUrl } = useEndpoint<HelioResult>('/progress')

// Always from the Sun, on the ecliptic and tropical: no place, perspective or ayanamsha is
// sent, and the ayanamsha preference of the other pages is left as it is.
function submit() {
  run({ bodies: BODIES, ...momentParams(moment), ps: 'helio', cs: 'ecl', days: Math.round(form.years * DAYS_PER_YEAR), pd: 1 })
}

const series = computed(() => new Map((data.value?.bodies ?? []).map((b) => [b.key, b.items])))
const count = computed(() => series.value.get('ea')?.length ?? 0)

/** The day shown on the chart: an index into the series. */
const day = ref(0)
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  clearInterval(timer)
  playing.value = false
}

function togglePlay() {
  if (playing.value) return stop()
  playing.value = true
  // A longer span moves more days at a time, so that any span plays through in about 20 seconds.
  timer = setInterval(() => {
    day.value = (day.value + Math.ceil(count.value / 365)) % Math.max(count.value, 1)
  }, 60)
}

watch(data, () => {
  stop()
  day.value = 0
})
onBeforeUnmount(stop)

/** The moment of the day shown. */
const dayJd = computed(() => series.value.get('ea')?.[day.value]?.jd ?? null)

// ---- The chart: the ecliptic plane seen from the north, the Sun at the centre, 0° Aries to
// ---- the right and longitude increasing anticlockwise.

/**
 * Which bodies the chart shows. The data fetched is the same for all three: only the chart
 * changes, rescaling to the planets shown. The Moon is drawn beside the Earth in the two
 * closer views; with every planet shown the Earth's orbit is too small for it.
 */
type Range = 'inner' | 'core' | 'all'
const RANGES: { key: Range; label: string; last: string; moon: boolean; scale: string }[] = [
  { key: 'inner', label: 'Inner', last: 'ma', moon: true, scale: 'true scale' },
  { key: 'core', label: 'Core', last: 'sa', moon: true, scale: 'distances compressed' },
  { key: 'all', label: 'All', last: 'pl', moon: false, scale: 'distances compressed' },
]
const range = ref<Range>('core')
const chosenRange = computed(() => RANGES.find((r) => r.key === range.value) ?? RANGES[1])

/** The planets of a range: from Mercury out to its last one. */
function planetsOf(r: (typeof RANGES)[number]): string[] {
  return PLANETS.slice(0, PLANETS.indexOf(r.last) + 1)
}

/** What a range's button says on hover: the bodies it shows, by name, and its scale. */
function rangeTooltip(r: (typeof RANGES)[number]): string {
  const names = planetsOf(r).map(bodyName)
  const list = r.moon ? `${names.join(', ')} and the Moon` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  return `${list} (${r.scale})`
}

const shownPlanets = computed(() => planetsOf(chosenRange.value))

/** Radius of the plot area, in SVG units; the view box leaves a margin for the direction labels. */
const R = 300
/** How far the inner view reaches, in AU: just past the aphelion of Mars. */
const INNER_AU = 1.75

/** The greatest distance of any planet shown, over the span, in AU. */
const reach = computed(() => Math.max(1, ...shownPlanets.value.flatMap((key) => (series.value.get(key) ?? []).map((item) => item.dist))))

/** A distance from the Sun in AU as a radius on the chart. */
function radius(dist: number): number {
  if (range.value === 'inner') return (R * dist) / INNER_AU
  // Compressed: the square root keeps every orbit apart, at the cost of true spacing.
  return R * Math.sqrt(dist / reach.value)
}

function point(item: HelioItem): { x: number; y: number } {
  const r = radius(item.dist)
  const a = (item.lng * Math.PI) / 180
  return { x: r * Math.cos(a), y: -r * Math.sin(a) }
}

/** A planet's path over the span. It does not change with the day shown. */
interface Track {
  key: string
  /** Radius of the guide circle: the mean distance over the span. */
  mean: number
  /** The span's travel, as the points of a polyline. */
  points: string
}

const tracks = computed<Track[]>(() => {
  const out: Track[] = []
  for (const key of shownPlanets.value) {
    const items = series.value.get(key)
    if (!items?.length) continue
    const mean = radius(items.reduce((sum, item) => sum + item.dist, 0) / items.length)
    const points = items
      .map((item) => {
        const p = point(item)
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(' ')
    out.push({ key, mean, points })
  }
  return out
})

/** A planet on the day shown, with its label: the symbol and the name. */
interface Orbit {
  key: string
  name: string
  x: number
  y: number
  labelX: number
  labelY: number
  anchor: 'start' | 'middle' | 'end'
}

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/** Height of a label, and the room its symbol and each letter of its name take, in SVG units. */
const LABEL_HEIGHT = 20
const LABEL_SYMBOL_WIDTH = 24
const LABEL_LETTER_WIDTH = 7

/**
 * The planets on the day shown. Each label goes beside its planet, on the side away from the
 * Sun where that is free; otherwise on the first side where it covers no other label or
 * planet, the Sun or a direction label, and stays inside the chart.
 */
const orbits = computed<Orbit[]>(() => {
  const found = tracks.value.flatMap((track) => {
    const now = series.value.get(track.key)?.[day.value]
    return now ? [{ key: track.key, ...point(now) }] : []
  })
  const around = (x: number, y: number, half: number): Box => ({ left: x - half, right: x + half, top: y - half, bottom: y + half })
  const taken: Box[] = [around(0, 0, 9), ...found.map((p) => around(p.x, p.y, 6)), ...DIRECTIONS.map((d) => around(d.x, d.y - 4, 24))]
  const frame: Box = { left: -R - 58, right: R + 58, top: -R - 28, bottom: R + 28 }

  // The outermost planets are placed first: they have the most room, and their labels the least choice.
  const placed = new Map<string, Pick<Orbit, 'labelX' | 'labelY' | 'anchor'>>()
  for (const p of [...found].reverse()) {
    const width = LABEL_SYMBOL_WIDTH + LABEL_LETTER_WIDTH * bodyName(p.key).length
    const right = { labelX: p.x + 9, labelY: p.y, anchor: 'start' as const }
    const left = { labelX: p.x - 9, labelY: p.y, anchor: 'end' as const }
    const above = { labelX: p.x, labelY: p.y - 17, anchor: 'middle' as const }
    const below = { labelX: p.x, labelY: p.y + 17, anchor: 'middle' as const }
    const sideways = p.x >= 0 ? [right, left] : [left, right]
    const upright = p.y <= 0 ? [above, below] : [below, above]
    const options = Math.abs(p.x) >= Math.abs(p.y) ? [sideways[0], upright[0], upright[1], sideways[1]] : [upright[0], sideways[0], sideways[1], upright[1]]
    const boxOf = (o: (typeof options)[number]): Box => {
      const start = o.anchor === 'start' ? o.labelX : o.anchor === 'end' ? o.labelX - width : o.labelX - width / 2
      return { left: start, right: start + width, top: o.labelY - LABEL_HEIGHT / 2, bottom: o.labelY + LABEL_HEIGHT / 2 }
    }
    const inFrame = (b: Box) => b.left >= frame.left && b.right <= frame.right && b.top >= frame.top && b.bottom <= frame.bottom
    const own = around(p.x, p.y, 6)
    const free = (o: (typeof options)[number]) => inFrame(boxOf(o)) && !taken.some((t) => !(t.left === own.left && t.top === own.top) && overlaps(t, boxOf(o)))
    const choice = options.find(free) ?? options.find((o) => inFrame(boxOf(o))) ?? options[0]
    taken.push(boxOf(choice))
    placed.set(p.key, choice)
  }
  return found.map((p) => ({ ...p, name: bodyName(p.key), ...placed.get(p.key)! }))
})

/**
 * The Moon, drawn beside the Earth in its true direction from it. Its real distance, 1/390 of
 * the Earth's from the Sun, would put it inside the Earth's dot, so the gap is not to scale.
 */
const moon = computed(() => {
  const earth = series.value.get('ea')?.[day.value]
  const mo = series.value.get('mo')?.[day.value]
  const drawn = orbits.value.find((o) => o.key === 'ea')
  if (!chosenRange.value.moon || !earth || !mo || !drawn) return null
  const xy = (item: HelioItem) => {
    const a = (item.lng * Math.PI) / 180
    return { x: item.dist * Math.cos(a), y: item.dist * Math.sin(a) }
  }
  const e = xy(earth)
  const m = xy(mo)
  const a = Math.atan2(m.y - e.y, m.x - e.x)
  return { x: drawn.x + 9 * Math.cos(a), y: drawn.y - 9 * Math.sin(a) }
})

/** The cardinal directions of the tropical zodiac, round the edge. */
const DIRECTIONS = [
  { label: '0° ♈︎', x: R + 8, y: 4, anchor: 'start' },
  { label: '90° ♋︎', x: 0, y: -R - 10, anchor: 'middle' },
  { label: '180° ♎︎', x: -R - 8, y: 4, anchor: 'end' },
  { label: '270° ♑︎', x: 0, y: R + 20, anchor: 'middle' },
]

// ---- The tabs: the diagram first, then one table per body.

const activeTab = ref(0)

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

/** The row of the day on the diagram is marked in every body's table. */
function rowClass(row: HelioItem): string {
  return row.jd === dayJd.value ? 'is-current' : ''
}

/** A click on a row moves the diagram to that day. */
function pickDay(row: HelioItem) {
  const index = (series.value.get('ea') ?? []).findIndex((item) => item.jd === row.jd)
  if (index < 0) return
  stop()
  day.value = index
}
</script>

<template>
  <section class="view-page view-solar-system">
    <p class="view-subtitle subtitle">
      The planets and the Moon as they orbit the Sun: heliocentric positions on the tropical zodiac, one a day for up to ten years from the start date.
    </p>

    <div class="view-form box horizontal-form">
      <MomentFields :form="moment" label="Start" />
      <b-field class="span-years" :label="`Years: ${form.years}`">
        <b-slider v-model="form.years" size="is-small" :min="MIN_YEARS" :max="MAX_YEARS" :step="1" ticks :tooltip="false" rounded aria-label="Number of years" />
      </b-field>
      <RunButton :loading="loading" @click="submit" />
    </div>

    <ResultPanel :data="data" :error="error" :loading="loading" :last-url="lastUrl">
      <template #default>
        <p class="result-summary">heliocentric · tropical · {{ count }} days</p>

        <b-tabs v-model="activeTab" size="is-small" :animated="false" class="rise-sets-tabs solar-system-tabs">
          <b-tab-item label="Orbits" icon="orbit">
            <div class="orbit-controls">
              <b-field class="orbit-range" aria-label="Planets shown">
                <b-tooltip v-for="r in RANGES" :key="r.key" class="orbit-range-option" :label="rangeTooltip(r)" position="is-bottom" multilined>
                  <b-radio-button v-model="range" :native-value="r.key" size="is-small">{{ r.label }}</b-radio-button>
                </b-tooltip>
              </b-field>
              <b-button class="orbit-play" size="is-small" :icon-left="playing ? 'pause' : 'play'" :aria-label="playing ? 'Pause' : 'Play the span'" @click="togglePlay" />
              <b-slider v-model="day" class="orbit-day-slider" size="is-small" :min="0" :max="Math.max(count - 1, 0)" :tooltip="false" rounded aria-label="Day shown" @dragstart="stop" />
              <span class="orbit-day"><UtcTime v-if="dayJd !== null" :value="dayJd" /></span>
            </div>

            <svg class="orbit-chart" :class="`shows-${range}`" :viewBox="`${-R - 60} ${-R - 30} ${2 * R + 120} ${2 * R + 60}`" role="img" aria-label="The planets around the Sun on the day shown, seen from north of the ecliptic">
              <line class="orbit-axis" :x1="-R" y1="0" :x2="R" y2="0" />
              <line class="orbit-axis" x1="0" :y1="-R" x2="0" :y2="R" />
              <text v-for="d in DIRECTIONS" :key="d.label" class="orbit-direction" :x="d.x" :y="d.y" :text-anchor="d.anchor">{{ d.label }}</text>

              <g v-for="t in tracks" :key="t.key" class="orbit-body" :class="`orbit-body-${t.key}`">
                <circle class="orbit-guide" cx="0" cy="0" :r="t.mean" />
                <polyline class="orbit-track" :points="t.points" />
              </g>
              <circle class="orbit-sun" cx="0" cy="0" r="6"><title>Sun</title></circle>
              <g v-for="o in orbits" :key="o.key" class="orbit-body" :class="`orbit-body-${o.key}`">
                <circle class="orbit-dot" :cx="o.x" :cy="o.y" r="4.5"><title>{{ o.name }}</title></circle>
                <text class="orbit-label" :x="o.labelX" :y="o.labelY" :text-anchor="o.anchor" dominant-baseline="central">
                  <tspan class="orbit-label-symbol">{{ bodySymbol(o.key) }}</tspan><tspan class="orbit-label-name" dx="4">{{ o.name }}</tspan>
                </text>
              </g>
              <circle v-if="moon" class="orbit-dot orbit-moon" :cx="moon.x" :cy="moon.y" r="2"><title>Moon (its distance from the Earth is not to scale)</title></circle>
            </svg>
            <p class="orbit-note">
              Seen from north of the ecliptic. The solid arcs are the travel over the span, the dashed circles each planet's mean distance. Inner is at true scale; in Core and All, distances are compressed so that every orbit fits.
              <template v-if="chosenRange.moon">The Moon is drawn beside the Earth in its true direction, but not at its true distance.</template>
            </p>
          </b-tab-item>
          <b-tab-item v-for="body in (data as HelioResult).bodies" :key="body.key" :label="withBodySymbol(body.key, bodyName(body.key))">
            <b-table class="jd-table solar-system-table" :data="body.items" :row-class="rowClass" striped narrowed hoverable paginated per-page="100" @click="pickDay">
              <b-table-column field="jd" label="Date-time" v-slot="props"><UtcTime :value="props.row.jd" /></b-table-column>
              <b-table-column field="lng" label="Longitude" v-slot="props"><DegreeValue :value="props.row.lng" :ayanamsha="null" /></b-table-column>
              <b-table-column field="lat" label="Latitude" numeric v-slot="props">{{ round(props.row.lat, 4) }}°</b-table-column>
              <b-table-column field="lng_speed" label="Longitude speed" numeric v-slot="props">{{ round(props.row.lng_speed, 4) }}</b-table-column>
              <b-table-column field="dist" label="Distance (AU)" numeric v-slot="props">{{ round(props.row.dist, 6) }}</b-table-column>
            </b-table>
          </b-tab-item>
        </b-tabs>
      </template>
    </ResultPanel>
  </section>
</template>
