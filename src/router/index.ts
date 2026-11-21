import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { label: 'Home' } },
  { path: '/longitude', redirect: '/longitudes' },
  { path: '/longitudes', name: 'longitudes', component: () => import('../views/LongitudesView.vue'), meta: { label: 'Longitudes' } },
  { path: '/position', redirect: '/positions' },
  { path: '/positions', name: 'positions', component: () => import('../views/PositionsView.vue'), meta: { label: 'Positions' } },
  { path: '/extended-position', redirect: '/extended-positions' },
  { path: '/extended-positions', name: 'extended-positions', component: () => import('../views/ExtendedPositionsView.vue'), meta: { label: 'Extended Positions' } },
  { path: '/longitude-progress', name: 'longitude-progress', component: () => import('../views/LongitudeProgressView.vue'), meta: { label: 'Longitude Progress' } },
  { path: '/progress', name: 'progress', component: () => import('../views/ProgressView.vue'), meta: { label: 'Graha Progress' } },
  { path: '/ascendant', name: 'ascendant', component: () => import('../views/AscendantView.vue'), meta: { label: 'Ascendant' } },
  { path: '/ascendant-progress', name: 'ascendant-progress', component: () => import('../views/AscendantProgressView.vue'), meta: { label: 'Ascendant Progress' } },
  // The Angles page showed the same points as Ascendant.
  { path: '/angles', redirect: '/ascendant' },
  { path: '/houses', name: 'houses', component: () => import('../views/HousesView.vue'), meta: { label: 'Houses' } },
  { path: '/ayanamsha', name: 'ayanamsha', component: () => import('../views/AyanamshaView.vue'), meta: { label: 'Ayanamsha' } },
  { path: '/rise-set', name: 'rise-set', component: () => import('../views/RiseSetView.vue'), meta: { label: 'Rise / Set' } },
  { path: '/rise-sets', name: 'rise-sets', component: () => import('../views/RiseSetsView.vue'), meta: { label: 'Rise / Set by Day' } },
  { path: '/transposed-positions', name: 'transposed-positions', component: () => import('../views/TransposedPositionsView.vue'), meta: { label: 'Transposed Positions' } },
  { path: '/transposed-transits', name: 'transposed-transits', component: () => import('../views/TransposedTransitsView.vue'), meta: { label: 'Transposed Transits' } },
  { path: '/stations', name: 'stations', component: () => import('../views/StationsView.vue'), meta: { label: 'Stations' } },
  { path: '/moon-phases', name: 'moon-phases', component: () => import('../views/MoonPhasesView.vue'), meta: { label: 'Moon Phases' } },
  { path: '/tithis', name: 'tithis', component: () => import('../views/TithisView.vue'), meta: { label: 'Tithis' } },
  { path: '/indian-day', name: 'indian-day', component: () => import('../views/IndianDayView.vue'), meta: { label: 'Indian Day' } },
  { path: '/pheno', name: 'pheno', component: () => import('../views/PhenoView.vue'), meta: { label: 'Phenomena' } },
  { path: '/aspects', name: 'aspects', component: () => import('../views/AspectsView.vue'), meta: { label: 'Aspects' } },
  { path: '/bulk', name: 'bulk', component: () => import('../views/BulkView.vue'), meta: { label: 'Bulk' } },
  { path: '/bodies', name: 'bodies', component: () => import('../views/BodiesView.vue'), meta: { label: 'Bodies' } },
  { path: '/stars', name: 'stars', component: () => import('../views/StarsView.vue'), meta: { label: 'Named Stars' } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { label: 'Settings' } },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
