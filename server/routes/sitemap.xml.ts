import { serverSupabaseClient } from '#supabase/server'

const BASE = 'https://geolendasbrasil.netlify.app'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const [{ data: categories }, { data: articles }] = await Promise.all([
    client.from('categories').select('slug').order('sort_order'),
    client
      .from('articles')
      .select('slug, updated_at, category:categories(slug)')
      .eq('published', true),
  ])

  const urls: string[] = [
    `  <url><loc>${BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...(categories ?? []).map(
      (c) => `  <url><loc>${BASE}/${c.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
    ...(articles ?? [])
      .map((a) => {
        const catSlug = (a.category as { slug: string } | null)?.slug
        if (!catSlug) return null
        const lastmod = a.updated_at ? `<lastmod>${a.updated_at.split('T')[0]}</lastmod>` : ''
        return `  <url><loc>${BASE}/${catSlug}/${a.slug}</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.6</priority></url>`
      })
      .filter(Boolean),
  ]

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
})
