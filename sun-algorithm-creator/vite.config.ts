import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import vue from '@vitejs/plugin-vue'
import ViteFonts from 'unplugin-fonts/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue({
    template: { transformAssetUrls },
  }),
    Vuetify(),
    ViteFonts({
      google: {
        families: [{
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
  //    VitePWA({
  //   registerType: 'prompt',
  //   injectRegister: false,

  //   pwaAssets: {
  //     disabled: false,
  //     config: true,
  //   },

  //   manifest: {
  //     name: 'sun-algorithm-creator',
  //     short_name: 'sun-algorithm-creator',
  //     description: 'Creates a sun algorithm to use with homeassisstant',
  //     theme_color: '#ffffff',
  //   },

  //   workbox: {
  //     globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
  //     cleanupOutdatedCaches: true,
  //     clientsClaim: true,
  //   },

  //   devOptions: {
  //     enabled: false,
  //     navigateFallback: 'index.html',
  //     suppressWarnings: true,
  //     type: 'module',
  //   },
  // })
],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
})