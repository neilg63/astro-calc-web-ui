<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { PERSPECTIVES, perspective, perspectiveBodies, type PerspectiveKey } from '../lib/perspectives'
import { useReferenceStore } from '../stores/reference'

/**
 * The perspective dropdown. `allow` limits it to the perspectives an endpoint accepts.
 * Given the selected `bodies`, it notes which of them the perspective changes.
 */
const props = defineProps<{ modelValue: PerspectiveKey; allow?: PerspectiveKey[]; bodies?: string[]; horizontal?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [PerspectiveKey] }>()
const reference = useReferenceStore()

const options = computed(() => PERSPECTIVES.filter((p) => !props.allow || props.allow.includes(p.key)))
const onEarth = computed(() => options.value.filter((p) => p.earth))
const elsewhere = computed(() => options.value.filter((p) => !p.earth))

// A remembered perspective that this endpoint does not accept falls back to the first one it does.
watchEffect(() => {
  const first = options.value[0]
  if (first && !options.value.some((p) => p.key === props.modelValue)) emit('update:modelValue', first.key)
})

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

const note = computed(() => {
  if (!props.bodies) return ''
  const { dropped, earthAdded } = perspectiveBodies(props.bodies, props.modelValue)
  const parts = []
  if (dropped.length) parts.push(`not observable, left out: ${dropped.map(bodyName).join(', ')}`)
  if (earthAdded) parts.push('Earth added')
  return parts.length ? `${perspective(props.modelValue).name}: ${parts.join('; ')}.` : ''
})
</script>

<template>
  <b-field class="perspective-select" label="Perspective" :label-position="horizontal ? undefined : 'on-border'" :horizontal="horizontal" :message="note">
    <b-select size="is-small" :model-value="modelValue" :expanded="horizontal" :title="perspective(modelValue).observer" @update:model-value="(v: PerspectiveKey) => emit('update:modelValue', v)">
      <optgroup v-if="onEarth.length" label="On the Earth">
        <option v-for="p in onEarth" :key="p.key" :value="p.key" :title="p.observer">{{ p.name }}</option>
      </optgroup>
      <optgroup v-if="elsewhere.length" label="Other centres">
        <option v-for="p in elsewhere" :key="p.key" :value="p.key" :title="p.observer">{{ p.name }}</option>
      </optgroup>
    </b-select>
  </b-field>
</template>
