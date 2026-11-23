<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { PERSPECTIVES, perspective, type PerspectiveKey } from '../lib/perspectives'
import { withBodySymbol } from '../lib/bodies'
import type { PerspectiveOption } from '../lib/perspectives'

/**
 * The perspective dropdown. `allow` limits it to the perspectives an endpoint accepts. What the
 * perspective does to the selected bodies is noted under the bodies list (`BodySelect`).
 * A centre away from the Earth is shown with the symbol of the body it is in: `☀︎ Heliocentric`.
 */
const props = defineProps<{ modelValue: PerspectiveKey; allow?: PerspectiveKey[]; horizontal?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [PerspectiveKey] }>()

const options = computed(() => PERSPECTIVES.filter((p) => !props.allow || props.allow.includes(p.key)))
const onEarth = computed(() => options.value.filter((p) => p.earth))
const elsewhere = computed(() => options.value.filter((p) => !p.earth))

/** The name of a centre away from the Earth, with its body's symbol in front where it has one. */
function centreLabel(p: PerspectiveOption): string {
  return p.centre ? withBodySymbol(p.centre, p.name) : p.name
}

// A remembered perspective that this endpoint does not accept falls back to the first one it does.
watchEffect(() => {
  const first = options.value[0]
  if (first && !options.value.some((p) => p.key === props.modelValue)) emit('update:modelValue', first.key)
})
</script>

<template>
  <b-field class="perspective-select" label="Perspective" :label-position="horizontal ? undefined : 'on-border'" :horizontal="horizontal">
    <b-select size="is-small" :model-value="modelValue" :expanded="horizontal" :title="perspective(modelValue).observer" @update:model-value="(v: PerspectiveKey) => emit('update:modelValue', v)">
      <optgroup v-if="onEarth.length" label="On the Earth">
        <option v-for="p in onEarth" :key="p.key" :value="p.key" :title="p.observer">{{ p.name }}</option>
      </optgroup>
      <optgroup v-if="elsewhere.length" label="Other centres">
        <option v-for="p in elsewhere" :key="p.key" :value="p.key" :title="p.observer">{{ centreLabel(p) }}</option>
      </optgroup>
    </b-select>
  </b-field>
</template>
