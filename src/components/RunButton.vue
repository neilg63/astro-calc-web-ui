<script setup lang="ts">
import { effect, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { usePreferencesStore } from '../stores/preferences'

/**
 * The button that sends a form's query: a large play arrow with no visible label, named
 * "Calculate" by its tooltip and to screen readers.
 *
 * It also knows when the results on the page are out of date. The click handler builds the
 * query, so everything it reads while doing so is what the results depend on: the form's
 * fields, the place, the API address. When any of that changes afterwards the button is
 * marked `is-stale` and a note below it says so. Nothing is sent until it is clicked again,
 * unless the "Recalculate automatically" preference is on: then the query is sent again once
 * the form has been left alone for `AUTO_DELAY_MS`, so a run of edits costs one request.
 */
const props = defineProps<{ loading?: boolean }>()
const prefs = usePreferencesStore()

/** How long the form must be left alone before it is recalculated automatically. */
const AUTO_DELAY_MS = 1200
const emit = defineEmits<{ click: [] }>()

/** Whether the form has changed since the query on show was sent. */
const stale = ref(false)
let stopTracking: (() => void) | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function untrack() {
  stopTracking?.()
  stopTracking = undefined
  clearTimeout(timer)
}

/** Starts, or restarts, the wait before an automatic recalculation. */
function schedule() {
  clearTimeout(timer)
  if (prefs.autoRecalc) timer = setTimeout(send, AUTO_DELAY_MS)
}

async function send() {
  untrack()
  stale.value = false
  // The handler runs once, here; each later change to what it read calls the scheduler instead.
  const runner = effect(() => emit('click'), {
    scheduler: () => {
      stale.value = true
      schedule()
    },
  })
  stopTracking = () => runner.effect.stop()
  // A handler that sent nothing (a form it would not accept) left no results to go stale.
  await nextTick()
  if (!props.loading && !stale.value) untrack()
}

// Turning the preference on or off applies to a form that is already waiting.
watch(
  () => prefs.autoRecalc,
  () => {
    if (stale.value) schedule()
  },
)

onBeforeUnmount(untrack)
</script>

<template>
  <div class="run-button" :class="{ 'is-stale': stale }">
    <b-tooltip :label="stale ? 'Recalculate' : 'Calculate'" position="is-left">
      <b-button type="is-primary" icon-left="play" :aria-label="stale ? 'Recalculate' : 'Calculate'" :loading="loading" @click="send" />
    </b-tooltip>
    <p v-if="stale" class="run-button-note" role="status">{{ prefs.autoRecalc ? 'Settings changed: recalculating…' : 'Settings changed: recalculate to update the results' }}</p>
  </div>
</template>
