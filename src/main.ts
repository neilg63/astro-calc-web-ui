import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Buefy from 'buefy'
import 'bulma/css/bulma.css'
import 'buefy/dist/css/buefy.css'
import '@mdi/font/css/materialdesignicons.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'
import { installPreferencesPersistence, usePreferencesStore } from './stores/preferences'
import { installTheme } from './lib/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Buefy)

installPreferencesPersistence(usePreferencesStore())
installTheme()

app.mount('#app')
