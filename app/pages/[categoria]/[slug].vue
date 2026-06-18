<script setup lang="ts">
import type { Article } from '~/types/article'

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()

function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push(`/${catSlug}`)
  }
}
const catSlug = route.params.categoria as string
const artSlug = route.params.slug as string

const { data: article } = await useAsyncData<Article | null>(`article-${catSlug}-${artSlug}`, async () => {
  const { data } = await client
    .from('articles')
    .select('*, category:categories(*)')
    .eq('slug', artSlug)
    .eq('published', true)
    .single()
  return data
})

if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Artigo não encontrado' })
}

const formattedDate = computed(() =>
  new Date(article.value!.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
)

const SITE_URL = 'https://geolendasbrasil.netlify.app'
const canonicalUrl = `${SITE_URL}/${catSlug}/${artSlug}`
useSeoMeta({
  title: `${article.value!.title} — GeoLendas Brasil`,
  description: article.value!.excerpt,
  ogTitle: article.value!.title,
  ogDescription: article.value!.excerpt,
  ogUrl: canonicalUrl,
  ogType: 'article',
  ogImage: `${SITE_URL}/icon-512x512.png`,
  articlePublishedTime: article.value!.created_at,
  articleModifiedTime: article.value!.updated_at,
  twitterCard: 'summary',
})
useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.value!.title,
      description: article.value!.excerpt,
      datePublished: article.value!.created_at,
      dateModified: article.value!.updated_at,
      url: canonicalUrl,
      inLanguage: 'pt-BR',
      publisher: {
        '@type': 'Organization',
        name: 'GeoLendas Brasil',
        url: SITE_URL,
      },
    }),
  }],
})
</script>

<template>
  <div class="page-root">
    <div class="article-hero">
      <div class="hero-inner">
        <button class="back-link" @click="goBack">
          ← Voltar
        </button>

        <div class="article-meta">
          <span v-if="article!.state" class="meta-badge">{{ article!.state }}</span>
          <span v-if="article!.type" class="meta-badge meta-badge--type">{{ article!.type }}</span>
        </div>

        <h1 class="article-title">{{ article!.title }}</h1>

        <p class="article-date">{{ formattedDate }}</p>
      </div>
    </div>

    <div class="article-body">
      <div class="article-excerpt">{{ article!.excerpt }}</div>

      <div v-if="article!.content" class="article-content" v-html="article!.content" />

      <div class="article-footer">
        <NuxtLink :to="`/${catSlug}`" class="footer-back">
          ← Ver todos de {{ article!.category?.name }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-root {
  min-height: 100vh;
  background: var(--pg-bg);
  font-family: 'Inter', sans-serif;
  color: var(--pg-text);
  transition: background 0.3s ease, color 0.3s ease;
}

.article-hero {
  padding: 60px 40px 48px;
  background: var(--pg-hero-bg);
  color: var(--pg-hero-text);
}

.hero-inner {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: var(--pg-back-link);
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  margin-bottom: 32px;
  cursor: pointer;
  transition: color 0.2s ease;
}
.back-link:hover {
  color: var(--pg-hero-text);
}

.article-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.meta-badge {
  display: inline-block;
  padding: 5px 12px;
  background: var(--pg-meta-badge-bg);
  border: 1px solid var(--pg-meta-badge-border);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pg-hero-text);
}

.meta-badge--type {
  background: rgba(212, 132, 92, 0.25);
  border-color: rgba(212, 132, 92, 0.45);
  color: #e8a87c;
}

.article-title {
  font-family: 'Merriweather', serif;
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 20px 0;
  color: var(--pg-hero-text);
}

.article-date {
  font-size: 14px;
  color: var(--pg-hero-muted);
  margin: 0;
}

.article-body {
  background: var(--pg-article-bg);
  border-radius: 16px 16px 0 0;
  padding: 56px 40px 80px;
  min-height: 60vh;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
}

.article-excerpt {
  max-width: 800px;
  margin: 0 auto 40px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--pg-article-lead);
  font-weight: 400;
  padding-bottom: 32px;
  border-bottom: 2px solid var(--pg-section-border);
  font-family: 'Merriweather', serif;
  font-style: italic;
}

.article-content {
  max-width: 800px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.8;
  color: var(--pg-article-text);
}

.article-content :deep(p) {
  margin: 0 0 1.25em 0;
}

.article-content :deep(h2) {
  font-family: 'Merriweather', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--pg-h2);
  margin: 2em 0 0.6em 0;
  line-height: 1.3;
}

.article-content :deep(h3) {
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--pg-h3);
  margin: 1.75em 0 0.5em 0;
  line-height: 1.3;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 1.25em 0;
}

.article-content :deep(li) {
  margin-bottom: 0.4em;
}

.article-content :deep(blockquote) {
  border-left: 4px solid var(--pg-accent);
  padding: 12px 20px;
  margin: 1.5em 0;
  background: var(--pg-blockquote-bg);
  border-radius: 0 8px 8px 0;
  color: var(--pg-blockquote-text);
  font-style: italic;
}

.article-content :deep(a) {
  color: var(--pg-article-link);
  text-decoration: underline;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.5em 0;
  display: block;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.article-content :deep(strong) {
  color: var(--pg-strong);
  font-weight: 700;
}

.article-footer {
  max-width: 800px;
  margin: 56px auto 0;
  padding-top: 32px;
  border-top: 1px solid var(--pg-article-footer-border);
}

.footer-back {
  color: var(--pg-article-link);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: color 0.2s ease;
}
.footer-back:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .article-hero {
    padding: 40px 20px 36px;
  }

  .article-title {
    font-size: 32px;
  }

  .article-body {
    padding: 40px 20px 60px;
  }

  .article-excerpt {
    font-size: 16px;
  }

  .article-content {
    font-size: 15px;
  }
}
</style>
