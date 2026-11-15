<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReferenceStore } from '../stores/reference'

/** `aya` holds at most one key for now: empty means tropical (no ayanamsha). */
export interface AyanamshaFormValue {
  aya: string[]
  sid: boolean
}

const props = defineProps<{
  modelValue: AyanamshaFormValue
  showSidereal?: boolean
  label?: string
  /** Text of the "no ayanamsha" option. */
  emptyLabel?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [AyanamshaFormValue] }>()
const reference = useReferenceStore()

onMounted(() => reference.loadAll())

const selected = computed({
  get: () => props.modelValue.aya[0] ?? '',
  // Going back to tropical also clears the sidereal flag, which needs an ayanamsha.
  set: (key: string) => emit('update:modelValue', key ? { ...props.modelValue, aya: [key] } : { aya: [], sid: false }),
})

const sidereal = computed({
  get: () => props.modelValue.sid,
  set: (value: boolean) => emit('update:modelValue', { ...props.modelValue, sid: value }),
})
</script>

<template>
  <b-field class="ayanamsha-fields" :label="label ?? 'Ayanamsha'">
    <div class="ayanamsha-fields-row">
      <b-select v-model="selected" size="is-small">
        <option value="">{{ emptyLabel ?? 'Tropical' }}</option>
        <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ a.name.replace(/_/g, ' ') }}</option>
      </b-select>
      <b-checkbox v-if="showSidereal && selected" size="is-small" v-model="sidereal" class="ayanamsha-fields-sidereal">Sidereal</b-checkbox>
    </div>
  </b-field>
</template>
