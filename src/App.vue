<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ALL_LINKS } from './lib/navLinks'

const navOpen = ref(false)
</script>

<template>
  <nav class="app-navbar navbar is-dark">
    <div class="app-navbar-brand navbar-brand">
      <a role="button" class="app-navbar-burger navbar-burger" :class="{ 'is-active': navOpen }" aria-label="menu" @click="navOpen = !navOpen">
        <span /><span /><span />
      </a>
      <RouterLink class="app-navbar-title navbar-item" to="/" @click="navOpen = false"><strong>AstroCalc Demo</strong></RouterLink>
    </div>
    <div class="app-nav-menu" v-show="navOpen" @click="navOpen = false">
      <RouterLink v-for="l in ALL_LINKS" :key="l.to" class="app-nav-menu-item" :to="l.to">
        <span class="icon"><i class="mdi" :class="`mdi-${l.icon}`" /></span>
        <span>{{ l.label }}</span>
      </RouterLink>
    </div>
  </nav>
  <div v-if="navOpen" class="app-nav-backdrop" @click="navOpen = false" />
  <main class="app-main container is-fluid px-4 py-4">
    <RouterView />
  </main>
</template>
