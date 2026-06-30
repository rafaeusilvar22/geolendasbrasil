// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  hooks: {
    async 'nitro:config'(nitroConfig) {
      if (nitroConfig.dev) return

      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!,
      )

      const [{ data: categories }, { data: articles }] = await Promise.all([
        supabase.from('categories').select('slug'),
        supabase
          .from('articles')
          .select('slug, category:categories!inner(slug)')
          .eq('published', true),
      ])

      const routes: string[] = [
        '/',
        '/mapa',
        ...(categories?.map(c => `/${c.slug}`) ?? []),
        ...(articles?.map(a => `/${(a.category as { slug: string }).slug}/${a.slug}`) ?? []),
      ]

      nitroConfig.prerender = nitroConfig.prerender ?? {}
      nitroConfig.prerender.routes = [...(nitroConfig.prerender.routes ?? []), ...routes]
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@nuxt/fonts', '@nuxt/icon', '@nuxt/image', '@netlify/nuxt', '@vite-pwa/nuxt', 'nuxt-og-image'],
  supabase: {
    redirectOptions: {
      login: '/admin/login',
      callback: '/admin/confirm',
      exclude: ['/**'],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Descobertas Brasil',
      short_name: 'Descobertas',
      description: 'Histórias, lendas, tradições e geografia dos estados brasileiros',
      theme_color: '#2D6A4F',
      background_color: '#f5f1e6',
      display: 'standalone',
      lang: 'pt-BR',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
    },
  },
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#2D6A4F' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Descobertas' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  image: {
    domains: [
      process.env.SUPABASE_URL
        ? new URL(process.env.SUPABASE_URL).hostname
        : '',
    ].filter(Boolean),
  },
  css: ['~/assets/css/theme.css'],
  fonts: {
    families: [
      { name: 'Merriweather', weights: ['400', '700'] },
      { name: 'Inter', weights: ['400', '500', '600', '700'] },
    ],
  },
})