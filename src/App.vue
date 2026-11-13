<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const navOpen = ref(false)

const links: Array<{ to: string; label: string }> = [
  { to: '/', label: 'Home' },
  { to: '/position', label: 'Position' },
  { to: '/positions', label: 'Positions' },
  { to: '/progress', label: 'Progress' },
  { to: '/ascendant', label: 'Ascendant' },
  { to: '/angles', label: 'Angles' },
  { to: '/houses', label: 'Houses' },
  { to: '/ayanamsha', label: 'Ayanamsha' },
  { to: '/rise-set', label: 'Rise / Set' },
  { to: '/stations', label: 'Stations' },
  { to: '/moon-phases', label: 'Moon Phases' },
  { to: '/indian-day', label: 'Indian Day' },
  { to: '/pheno', label: 'Phenomena' },
  { to: '/aspects', label: 'Aspects' },
  { to: '/bodies', label: 'Bodies' },
  { to: '/stars', label: 'Stars' },
]
</script>

<template>
  <nav class="navbar is-dark" role="navigation">
    <div class="navbar-brand">
      <RouterLink class="navbar-item" to="/"><strong>astro-calc-web-ui</strong></RouterLink>
      <a role="button" class="navbar-burger" :class="{ 'is-active': navOpen }" @click="navOpen = !navOpen">
        <span /><span /><span />
      </a>
    </div>
    <div class="navbar-menu" :class="{ 'is-active': navOpen }">
      <RouterLink v-for="l in links" :key="l.to" class="navbar-item" :to="l.to" @click="navOpen = false">{{ l.label }}</RouterLink>
      <div class="navbar-end">
        <RouterLink class="navbar-item" to="/settings" @click="navOpen = false">Settings</RouterLink>
      </div>
    </div>
  </nav>
  <main class="container is-fluid px-4 py-4">
    <RouterView />
  </main>
</template>
