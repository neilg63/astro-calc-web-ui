<script setup lang="ts">
import { ayanamshaLabel } from '../lib/zodiac'
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
  // Leaving tropical turns sidereal longitudes on; going back clears the flag, which needs an
  // ayanamsha. Changing from one ayanamsha to another keeps the flag as it was set.
  set: (key: string) => {
    if (!key) emit('update:modelValue', { aya: [], sid: false })
    else emit('update:modelValue', { aya: [key], sid: props.modelValue.aya.length ? props.modelValue.sid : true })
  },
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
        <option v-for="a in reference.ayanamshas" :key="a.key" :value="a.key">{{ ayanamshaLabel(a.name) }}</option>
      </b-select>
      <b-tooltip v-if="showSidereal && selected" label="Show sidereal longitudes" position="is-top" class="ayanamsha-fields-sidereal">
        <b-checkbox size="is-small" v-model="sidereal">Sidereal</b-checkbox>
      </b-tooltip>
    </div>
  </b-field>
</template>
