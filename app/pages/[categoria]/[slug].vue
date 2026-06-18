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

useHead({
  title: `${article.value?.title} — GeoLendas Brasil`,
  htmlAttrs: { 'data-theme': 'discovery' },
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
  background: #f0ebe0;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
}

.article-hero {
  padding: 60px 40px 48px;
  background: #1b4332;
  color: #f5f1e6;
}

.hero-inner {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: rgba(245, 241, 230, 0.65);
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
  color: #f5f1e6;
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
  background: rgba(245, 241, 230, 0.12);
  border: 1px solid rgba(245, 241, 230, 0.2);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #f5f1e6;
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
  color: #f5f1e6;
}

.article-date {
  font-size: 14px;
  color: rgba(245, 241, 230, 0.55);
  margin: 0;
}

.article-body {
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 56px 40px 80px;
  min-height: 60vh;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06);
}

.article-excerpt {
  max-width: 800px;
  margin: 0 auto 40px;
  font-size: 18px;
  line-height: 1.7;
  color: #3d2817;
  font-weight: 400;
  padding-bottom: 32px;
  border-bottom: 2px solid rgba(212, 132, 92, 0.3);
  font-family: 'Merriweather', serif;
  font-style: italic;
}

.article-content {
  max-width: 800px;
  margin: 0 auto;
  font-size: 16px;
  line-height: 1.8;
  color: #1a1a1a;
}

.article-content :deep(p) {
  margin: 0 0 1.25em 0;
}

.article-content :deep(h2) {
  font-family: 'Merriweather', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1b4332;
  margin: 2em 0 0.6em 0;
  line-height: 1.3;
}

.article-content :deep(h3) {
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  color: #2d6a4f;
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
  border-left: 4px solid #d4845c;
  padding: 12px 20px;
  margin: 1.5em 0;
  background: rgba(212, 132, 92, 0.06);
  border-radius: 0 8px 8px 0;
  color: #3d2817;
  font-style: italic;
}

.article-content :deep(a) {
  color: #2d6a4f;
  text-decoration: underline;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.5em 0;
  display: block;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.article-content :deep(strong) {
  color: #1b4332;
  font-weight: 700;
}

.article-footer {
  max-width: 800px;
  margin: 56px auto 0;
  padding-top: 32px;
  border-top: 1px solid #e8e0d4;
}

.footer-back {
  color: #2d6a4f;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: color 0.2s ease;
}
.footer-back:hover {
  color: #1b4332;
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
