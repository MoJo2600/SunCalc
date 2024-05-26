import { createApp } from 'vue'
import App from './App.vue'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'dark',
    },
  })

createApp(App).use(vuetify).mount('#app')
