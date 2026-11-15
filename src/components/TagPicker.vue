<script setup lang="ts">
import { computed, ref } from 'vue'

export interface TagOption {
  key: string
  label: string
}

/** A tag input with autocomplete over a fixed list of options; the model is the selected keys. */
const props = defineProps<{ modelValue: string[]; options: TagOption[]; placeholder?: string; itemName?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

/** The selected keys as tags; a key is shown as it is until the options have loaded. */
const tags = computed(() => props.modelValue.map((key) => props.options.find((o) => o.key === key) ?? { key, label: key }))

const typed = ref('')
const suggestions = computed(() => {
  const text = typed.value.trim().toLowerCase()
  return props.options.filter(
    (o) => !props.modelValue.includes(o.key) && (text === '' || o.label.toLowerCase().includes(text) || o.key.toLowerCase().startsWith(text)),
  )
})

function onTyping(value: string | number | undefined) {
  typed.value = String(value ?? '')
}

function update(next: TagOption[]) {
  emit('update:modelValue', [...new Set(next.map((o) => o.key))])
}
</script>

<template>
  <b-taginput
    class="tag-picker"
    :model-value="tags"
    @update:model-value="update"
    :data="suggestions"
    field="label"
    autocomplete
    open-on-focus
    keep-first
    :allow-new="false"
    size="is-small"
    :placeholder="placeholder ?? 'Add'"
    :aria-close-label="`Remove this ${itemName ?? 'item'}`"
    @typing="onTyping"
  >
    <template #default="{ option: o }">{{ o.label }} ({{ o.key }})</template>
    <template #empty>No match</template>
  </b-taginput>
</template>
