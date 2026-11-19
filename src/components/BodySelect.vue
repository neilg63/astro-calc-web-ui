<script setup lang="ts">
import { withBodySymbol } from '../lib/bodies'
import { computed, onMounted, ref, watch } from 'vue'
import { useReferenceStore } from '../stores/reference'
import { hiddenBodies, perspective, perspectiveBodies, perspectiveNote } from '../lib/perspectives'
import TagPicker from './TagPicker.vue'

/**
 * The bodies of a request. Given the `perspective`, the list follows it: bodies that cannot be
 * observed from there leave the list and the Earth joins it away from the Earth, with a note
 * below saying so. A return to a perspective that shows them puts those bodies back.
 */
const props = defineProps<{ modelValue: string[]; label?: string; perspective?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

/** Names astrologers use for bodies the API lists under another name. */
const ALIASES: Record<string, string> = { ra: 'Rahu', ke: 'Ketu' }

/**
 * The bodies on offer: those the perspective can show. The API lists the Earth as unavailable,
 * as it is from the Earth; from another centre it is a body like any other.
 */
const options = computed(() => {
  const hidden = props.perspective ? hiddenBodies(props.perspective) : []
  const offEarth = props.perspective !== undefined && !perspective(props.perspective).earth
  return reference.bodies
    .filter((b) => (b.available || (offEarth && b.key === 'ea')) && !hidden.includes(b.key))
    .map((b) => ({ key: b.key, label: withBodySymbol(b.key, ALIASES[b.key] ? `${ALIASES[b.key]} (${b.name})` : b.name) }))
})

/** The bodies the present perspective took out of the list, with the places they held. */
const suppressed = ref<{ key: string; index: number }[]>([])
/** Whether the Earth in the list was put there by the perspective. */
const earthAdded = ref(false)

/** Undoes what the last perspective did to the list, then applies the new one. */
function follow(ps: string) {
  let keys = [...props.modelValue]
  if (earthAdded.value) keys = keys.filter((k) => k !== 'ea')
  for (const s of suppressed.value) {
    if (!keys.includes(s.key)) keys.splice(Math.min(s.index, keys.length), 0, s.key)
  }
  const adapted = perspectiveBodies(keys, ps)
  suppressed.value = adapted.dropped.map((key) => ({ key, index: keys.indexOf(key) }))
  earthAdded.value = adapted.earthAdded
  if (adapted.keys.join() !== props.modelValue.join()) emit('update:modelValue', adapted.keys)
}

watch(
  () => props.perspective,
  (ps) => {
    if (ps) follow(ps)
  },
  { immediate: true },
)

function bodyName(key: string): string {
  return reference.bodies.find((b) => b.key === key)?.name ?? key
}

const note = computed(() => {
  if (!props.perspective) return ''
  // The Earth is only "added" while it is still in the list: it can be taken out again by hand.
  return perspectiveNote(suppressed.value.map((s) => bodyName(s.key)), earthAdded.value && props.modelValue.includes('ea'))
})
</script>

<template>
  <b-field class="body-select" :label="label ?? 'Bodies'" :message="note">
    <TagPicker :model-value="props.modelValue" @update:model-value="(v: string[]) => emit('update:modelValue', v)" :options="options" placeholder="Add a body" item-name="body" />
  </b-field>
</template>
