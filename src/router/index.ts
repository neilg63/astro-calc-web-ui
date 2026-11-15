import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue'), meta: { label: 'Home' } },
  { path: '/longitude', name: 'longitude', component: () => import('../views/LongitudesView.vue'), props: { single: true }, meta: { label: 'Longitude' } },
  { path: '/longitudes', name: 'longitudes', component: () => import('../views/LongitudesView.vue'), meta: { label: 'Longitudes' } },
  { path: '/position', name: 'position', component: () => import('../views/PositionView.vue'), meta: { label: 'Position' } },
  { path: '/positions', name: 'positions', component: () => import('../views/PositionsView.vue'), meta: { label: 'Positions' } },
  { path: '/extended-position', name: 'extended-position', component: () => import('../views/ExtendedPositionsView.vue'), props: { single: true }, meta: { label: 'Extended Position' } },
  { path: '/extended-positions', name: 'extended-positions', component: () => import('../views/ExtendedPositionsView.vue'), meta: { label: 'Extended Positions' } },
  { path: '/progress', name: 'progress', component: () => import('../views/ProgressView.vue'), meta: { label: 'Progress' } },
  { path: '/ascendant', name: 'ascendant', component: () => import('../views/AscendantView.vue'), meta: { label: 'Ascendant' } },
  { path: '/angles', name: 'angles', component: () => import('../views/AnglesView.vue'), meta: { label: 'Angles' } },
  { path: '/houses', name: 'houses', component: () => import('../views/HousesView.vue'), meta: { label: 'Houses' } },
  { path: '/ayanamsha', name: 'ayanamsha', component: () => import('../views/AyanamshaView.vue'), meta: { label: 'Ayanamsha' } },
  { path: '/rise-set', name: 'rise-set', component: () => import('../views/RiseSetView.vue'), meta: { label: 'Rise / Set' } },
  { path: '/rise-sets', name: 'rise-sets', component: () => import('../views/RiseSetsView.vue'), meta: { label: 'Rise / Set by Day' } },
  { path: '/stations', name: 'stations', component: () => import('../views/StationsView.vue'), meta: { label: 'Stations' } },
  { path: '/moon-phases', name: 'moon-phases', component: () => import('../views/MoonPhasesView.vue'), meta: { label: 'Moon Phases' } },
  { path: '/indian-day', name: 'indian-day', component: () => import('../views/IndianDayView.vue'), meta: { label: 'Indian Day' } },
  { path: '/pheno', name: 'pheno', component: () => import('../views/PhenoView.vue'), meta: { label: 'Phenomena' } },
  { path: '/aspects', name: 'aspects', component: () => import('../views/AspectsView.vue'), meta: { label: 'Aspects' } },
  { path: '/bulk', name: 'bulk', component: () => import('../views/BulkView.vue'), meta: { label: 'Bulk' } },
  { path: '/bodies', name: 'bodies', component: () => import('../views/BodiesView.vue'), meta: { label: 'Bodies' } },
  { path: '/stars', name: 'stars', component: () => import('../views/StarsView.vue'), meta: { label: 'Stars' } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { label: 'Settings' } },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
