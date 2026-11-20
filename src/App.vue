<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ALL_LINKS } from './lib/navLinks'
import { useTheme } from './lib/theme'

const navOpen = ref(false)
const { theme, toggle: toggleTheme } = useTheme()
</script>

<template>
  <nav class="app-navbar navbar is-dark">
    <div class="app-navbar-brand navbar-brand">
      <a role="button" class="app-navbar-burger navbar-burger" :class="{ 'is-active': navOpen }" aria-label="menu" @click="navOpen = !navOpen">
        <span /><span /><span />
      </a>
      <RouterLink class="app-navbar-title navbar-item" to="/" @click="navOpen = false"><strong>AstroCalc Demo</strong></RouterLink>
      <h1 v-if="$route.name !== 'home' && $route.meta.label" class="app-navbar-page-title view-title">{{ $route.meta.label }}</h1>
    </div>
    <b-tooltip class="app-theme-switch" :label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" position="is-left">
      <button type="button" class="app-theme-switch-button" :class="`is-${theme}`" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        {{ theme === 'dark' ? '☀' : '☾' }}
      </button>
    </b-tooltip>
    <div class="app-nav-menu" v-show="navOpen" @click="navOpen = false">
      <RouterLink v-for="l in ALL_LINKS" :key="l.to" class="app-nav-menu-item" :to="l.to">
        <span class="icon"><i class="mdi" :class="`mdi-${l.icon}`" /></span>
        <span>{{ l.label }}</span>
      </RouterLink>
    </div>
  </nav>
  <div v-if="navOpen" class="app-nav-backdrop" @click="navOpen = false" />
  <main class="app-main container is-fluid py-4">
    <RouterView :key="$route.path" />
  </main>
</template>
