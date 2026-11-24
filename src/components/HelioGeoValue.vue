<script setup lang="ts">
import { computed } from 'vue'
import { formatDecimalDegrees, formatFullDms, formatSignDms } from '../lib/degrees'
import { round } from '../lib/format'

/**
 * A table cell for a body seen from two places at once: the heliocentric value is shown, and
 * the hover tooltip gives the same quantity as seen from the Earth, one line for each.
 *
 * A longitude is shown round the whole circle (signs mean little from the Sun); its tooltip
 * gives both by sign and in decimal degrees. Any other value with no geocentric counterpart
 * (the Earth's own) is shown plain, with no tooltip.
 */
const props = withDefaults(
  defineProps<{
    /** The value seen from the Sun. */
    helio?: number | null
    /** The same quantity seen from the centre of the Earth. */
    geo?: number | null
    /** `longitude` is shown as degrees, minutes and seconds; `degrees` and `number` are rounded, the first with a degree sign. */
    kind?: 'longitude' | 'degrees' | 'number'
    /** Decimal places for `degrees` and `number`. */
    decimals?: number
  }>(),
  { helio: null, geo: null, kind: 'number', decimals: 4 },
)

function plain(value: number): string {
  return props.kind === 'degrees' ? `${round(value, props.decimals)}°` : round(value, props.decimals)
}

const mainText = computed(() => {
  if (props.helio === null) return '—'
  return props.kind === 'longitude' ? formatFullDms(props.helio) : plain(props.helio)
})

/** A part of a tooltip line: what it is (its class is `helio-geo-<kind>`) and its text. */
interface Part {
  kind: 'sign' | 'dms' | 'decimal' | 'zodiac' | 'number'
  text: string
}

/**
 * The tooltip's lines, each a perspective and what it sees, in parts; none where there is
 * nothing to add. Parts in the same place on each line share a column.
 */
const lines = computed(() => {
  const out: { view: string; parts: Part[] }[] = []
  if (props.kind === 'longitude') {
    if (props.helio !== null) {
      out.push({
        view: 'Heliocentric',
        parts: [
          { kind: 'sign', text: formatSignDms(props.helio) },
          { kind: 'decimal', text: formatDecimalDegrees(props.helio, props.decimals) },
          { kind: 'zodiac', text: 'tropical' },
        ],
      })
    }
    if (props.geo !== null) {
      out.push({
        view: 'Geocentric',
        parts: [
          { kind: 'sign', text: formatSignDms(props.geo) },
          { kind: 'dms', text: formatFullDms(props.geo) },
          { kind: 'decimal', text: formatDecimalDegrees(props.geo, props.decimals) },
        ],
      })
    }
  } else if (props.geo !== null) {
    out.push({ view: 'Geocentric', parts: [{ kind: 'number', text: plain(props.geo) }] })
  }
  return out
})
</script>

<template>
  <b-tooltip v-if="lines.length" position="is-top" dashed class="helio-geo-value degree-value">
    {{ mainText }}
    <template #content>
      <span class="helio-geo-lines">
        <span v-for="line in lines" :key="line.view" class="helio-geo-line" :class="`is-${line.view.toLowerCase()}`">
          <span class="helio-geo-view">{{ line.view }}</span>
          <template v-for="(part, i) in line.parts" :key="part.kind">
            <span v-if="i > 0" class="helio-geo-pipe">|</span>
            <span class="helio-geo-part" :class="`helio-geo-${part.kind}`">{{ part.text }}</span>
          </template>
        </span>
      </span>
    </template>
  </b-tooltip>
  <span v-else class="helio-geo-value is-helio-only">{{ mainText }}</span>
</template>
