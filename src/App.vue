<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ALL_LINKS } from './lib/navLinks'

const navOpen = ref(false)
</script>

<template>
  <nav class="navbar is-dark">
    <div class="navbar-brand">
      <a role="button" class="navbar-burger" :class="{ 'is-active': navOpen }" aria-label="menu" @click="navOpen = !navOpen">
        <span /><span /><span />
      </a>
      <RouterLink class="navbar-item" to="/" @click="navOpen = false"><strong>astro-calc-web-ui</strong></RouterLink>
    </div>
    <div class="nav-dropdown" v-show="navOpen" @click="navOpen = false">
      <RouterLink v-for="l in ALL_LINKS" :key="l.to" class="nav-dropdown-item" :to="l.to">
        <span class="icon"><i class="mdi" :class="`mdi-${l.icon}`" /></span>
        <span>{{ l.label }}</span>
      </RouterLink>
    </div>
  </nav>
  <div v-if="navOpen" class="nav-backdrop" @click="navOpen = false" />
  <main class="container is-fluid px-4 py-4">
    <RouterView />
  </main>
</template>

<style scoped>
.navbar-burger {
  display: flex !important;
  margin-left: 0;
}
.nav-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.25rem;
  width: min(32rem, 100vw);
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.75rem;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
}
.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  color: #ddd;
  font-size: 0.9rem;
}
.nav-dropdown-item:hover {
  background: #2a2a2a;
  color: #fff;
}
.nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
}
</style>
