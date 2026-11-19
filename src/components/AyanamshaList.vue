<script setup lang="ts">
import { formatSignedDms } from '../lib/degrees'
import { round } from '../lib/format'
import { ayanamshaLabel } from '../lib/zodiac'

/**
 * The ayanamshas of a response and their values, laid out like the points list: a horizontal
 * definition list with the name as the label and the offset in degrees beneath it. A single
 * ayanamsha takes one line instead: heading, name and degrees side by side.
 */
defineProps<{ ayanamshas: { key?: string | null; name: string; value: number }[]; title?: string }>()
</script>

<template>
  <div v-if="ayanamshas.length" class="points-list ayanamsha-list" :class="{ 'is-single': ayanamshas.length === 1 }">
    <p class="points-list-title">{{ title ?? (ayanamshas.length > 1 ? 'Ayanamshas' : 'Ayanamsha') }}</p>
    <dl class="points-list-items">
      <div v-for="a in ayanamshas" :key="a.key ?? a.name" class="points-list-item">
        <dt>{{ ayanamshaLabel(a.name) }}</dt>
        <dd><b-tooltip :label="formatSignedDms(a.value)" position="is-top" dashed>{{ round(a.value, 4) }}°</b-tooltip></dd>
      </div>
    </dl>
  </div>
</template>
