// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    preset: 'netlify',
  },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@nuxt/fonts', '@nuxt/icon', '@nuxt/image'],
  supabase: {
    redirectOptions: {
      login: '/admin/login',
      callback: '/admin/confirm',
      exclude: ['/', '/lendas', '/lendas/**', '/historias', '/historias/**', '/geografia', '/geografia/**', '/tradicoes', '/tradicoes/**'],
    },
  },
  fonts: {
    families: [
      { name: 'Merriweather', weights: ['400', '700'] },
      { name: 'Inter', weights: ['400', '500', '600', '700'] },
    ],
  },
})