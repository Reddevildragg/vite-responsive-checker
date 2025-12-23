import { createApp } from 'vue'
import App from '@/App.vue'

import '@/assets/main.css'


import router from '@/router'
import { createPinia } from 'pinia'

// Import example plugin
// In a real scenario, you might dynamic import this or have a configuration file
import ExamplePlugin from '@plugins/example-plugin'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Use the example plugin
app.use(ExamplePlugin)

app.mount('#app')

