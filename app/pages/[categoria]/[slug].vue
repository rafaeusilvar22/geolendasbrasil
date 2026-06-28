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

const { data: relatedArticles } = await useAsyncData<Article[]>(
  `related-${catSlug}-${artSlug}`,
  async () => {
    const { data } = await client
      .from('articles')
      .select('id, title, excerpt, content, state, category_id, type, slug, published, has_audio, created_at, updated_at, category:categories(id,name,slug,gradient)')
      .eq('published', true)
      .eq('category_id', article.value!.category_id as number)
      .neq('id', article.value!.id)
      .order('created_at', { ascending: false })
      .limit(3)
    return data ?? []
  },
)

const formattedDate = computed(() =>
  new Date(article.value!.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }),
)

const copySuccess = ref(false)

const shareLinks = computed(() => ({
  whatsapp: `https://wa.me/?text=${encodeURIComponent(article.value!.title + ' — ' + canonicalUrl)}`,
  twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(article.value!.title)}&url=${encodeURIComponent(canonicalUrl)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`,
}))

async function copyLink() {
  await navigator.clipboard.writeText(canonicalUrl)
  copySuccess.value = true
  setTimeout(() => { copySuccess.value = false }, 2000)
}

const SITE_URL = 'https://geolendasbrasil.netlify.app'
const canonicalUrl = `${SITE_URL}/${catSlug}/${artSlug}`

const ogDescription = article.value!.excerpt.length > 120
  ? article.value!.excerpt.slice(0, 117) + '...'
  : article.value!.excerpt

defineOgImage('ArticleCard', {
  title: article.value!.title,
  description: ogDescription,
  state: article.value!.state || undefined,
  category: article.value!.category?.name || undefined,
})

useSeoMeta({
  title: `${article.value!.title} — GeoLendas Brasil`,
  description: article.value!.excerpt,
  ogTitle: article.value!.title,
  ogDescription: article.value!.excerpt,
  ogUrl: canonicalUrl,
  ogType: 'article',
  articlePublishedTime: article.value!.created_at,
  articleModifiedTime: article.value!.updated_at,
  twitterCard: 'summary_large_image',
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

// --- Immersive reading mode ---
const isImmersive = ref(false)
const immersiveScrollRef = ref<HTMLElement | null>(null)
const readingProgress = ref(0)
const immersiveFontSize = ref(18)

function enterImmersive() {
  isImmersive.value = true
  document.body.style.overflow = 'hidden'
  nextTick(() => {
    if (immersiveScrollRef.value) immersiveScrollRef.value.scrollTop = 0
  })
}

function exitImmersive() {
  isImmersive.value = false
  document.body.style.overflow = ''
  readingProgress.value = 0
}

function onImmersiveScroll() {
  const el = immersiveScrollRef.value
  if (!el) return
  const total = el.scrollHeight - el.clientHeight
  readingProgress.value = total > 0 ? (el.scrollTop / total) * 100 : 0
}

function increaseFontSize() {
  if (immersiveFontSize.value < 24) {
    immersiveFontSize.value++
    localStorage.setItem('immersive-font-size', String(immersiveFontSize.value))
  }
}

function decreaseFontSize() {
  if (immersiveFontSize.value > 14) {
    immersiveFontSize.value--
    localStorage.setItem('immersive-font-size', String(immersiveFontSize.value))
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isImmersive.value) exitImmersive()
}

onMounted(() => {
  const stored = localStorage.getItem('immersive-font-size')
  if (stored) immersiveFontSize.value = parseInt(stored)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// --- Audio player ---
const { isOpen: playerOpen, play: playAudio } = useAudioPlayer()

function openPlayer() {
  if (!article.value?.audio_url) return
  playAudio({
    url: article.value.audio_url,
    title: article.value.title,
    category: article.value.category?.name,
  })
}
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
      <div class="excerpt-wrapper">
        <button class="immersive-inline-btn" @click="enterImmersive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Ler no escuro
        </button>
        <div class="article-excerpt">{{ article!.excerpt }}</div>
      </div>

      <div v-if="article!.content" class="article-content" v-html="article!.content" />

      <section v-if="relatedArticles?.length" class="related-section">
        <h2 class="related-title">Leia também</h2>
        <div class="related-grid">
          <ArticleCard v-for="rel in relatedArticles" :key="rel.id" :article="rel" />
        </div>
      </section>

      <div class="article-footer">
        <button class="footer-back" @click="goBack">
          ← Voltar
        </button>

        <div class="share-bar">
          <span class="share-label">Compartilhar</span>
          <a :href="shareLinks.whatsapp" target="_blank" rel="noopener" class="share-btn" title="Compartilhar no WhatsApp">
            <NuxtImg src="/icons/share-whatsapp.svg" alt="WhatsApp" width="36" height="36" />
          </a>
          <a :href="shareLinks.twitter" target="_blank" rel="noopener" class="share-btn" title="Compartilhar no X">
            <NuxtImg src="/icons/share-twitter.svg" alt="X" width="36" height="36" />
          </a>
          <a :href="shareLinks.facebook" target="_blank" rel="noopener" class="share-btn" title="Compartilhar no Facebook">
            <NuxtImg src="/icons/share-facebook.svg" alt="Facebook" width="36" height="36" />
          </a>
          <button class="share-btn share-btn--copy" :title="copySuccess ? 'Copiado!' : 'Copiar link'" @click="copyLink">
            <svg v-if="!copySuccess" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="17" height="17"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="article!.audio_url && !playerOpen"
      class="audio-fab"
      title="Ouvir narração"
      @click="openPlayer"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="5,3 19,12 5,21"/></svg>
      Ouvir
    </button>

    <Teleport to="body">
      <Transition name="immersive-fade">
        <div v-if="isImmersive" class="immersive-overlay">
          <div class="immersive-topbar">
            <div class="immersive-progress-bar" :style="{ width: readingProgress + '%' }" />
            <span class="immersive-logo">GeoLendas Brasil</span>
            <div class="immersive-controls">
              <button class="immersive-ctrl" title="Diminuir fonte" @click="decreaseFontSize">A−</button>
              <span class="immersive-font-size">{{ immersiveFontSize }}</span>
              <button class="immersive-ctrl" title="Aumentar fonte" @click="increaseFontSize">A+</button>
              <button class="immersive-ctrl immersive-close" title="Fechar (Esc)" @click="exitImmersive">✕</button>
            </div>
          </div>

          <div ref="immersiveScrollRef" class="immersive-scroll" @scroll="onImmersiveScroll">
            <div class="immersive-inner">
              <div class="immersive-meta">
                <span v-if="article!.state" class="immersive-badge">{{ article!.state }}</span>
                <span v-if="article!.type" class="immersive-badge immersive-badge--type">{{ article!.type }}</span>
              </div>
              <h1 class="immersive-title">{{ article!.title }}</h1>
              <p class="immersive-date">{{ formattedDate }}</p>
              <div class="immersive-excerpt">{{ article!.excerpt }}</div>
              <div
                class="immersive-body"
                :style="{ fontSize: immersiveFontSize + 'px' }"
                v-html="article!.content"
              />
              <div class="immersive-end">
                <span class="immersive-end-mark">✦ ✦ ✦</span>
                <button class="immersive-exit-btn" @click="exitImmersive">Fechar modo imersivo</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.footer-back {
  color: var(--pg-article-link);
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: color 0.2s ease;
}
.footer-back:hover {
  text-decoration: underline;
  color: var(--pg-article-link);
}

.share-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--pg-text-muted);
  font-family: 'Inter', sans-serif;
  margin-right: 4px;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  cursor: pointer;
  background: transparent;
  text-decoration: none;
  padding: 0;
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.share-btn:hover {
  transform: scale(1.2);
  opacity: 0.75;
}

.share-btn img {
  width: 22px;
  height: 22px;
  display: block;
}

.share-btn--copy {
  color: var(--pg-text-muted);
  width: 20px;
  height: 20px;
}

[data-theme="forest"] .share-btn img[alt="X"] {
  filter: invert(1);
}

.related-section {
  max-width: 800px;
  margin: 56px auto 0;
  padding-top: 40px;
  border-top: 2px solid var(--pg-section-border);
}

.related-title {
  font-family: 'Merriweather', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--pg-h2);
  margin: 0 0 28px 0;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}

/* FAB "Ouvir" */
.audio-fab {
  position: fixed;
  bottom: 28px;
  right: 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: var(--pg-accent, #2D6A4F);
  border: none;
  border-radius: 24px;
  color: #f5f1e6;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(45, 106, 79, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.audio-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(45, 106, 79, 0.55);
}

/* Wrapper do excerpt + botão imersivo inline */
.excerpt-wrapper {
  max-width: 800px;
  margin: 0 auto 40px;
}

.immersive-inline-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-bottom: 14px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid rgba(200, 149, 107, 0.25);
  border-radius: 20px;
  color: var(--pg-text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.immersive-inline-btn:hover {
  border-color: rgba(200, 149, 107, 0.65);
  color: #c8956b;
  background: rgba(200, 149, 107, 0.06);
}


/* Immersive overlay transition */
.immersive-fade-enter-active,
.immersive-fade-leave-active {
  transition: opacity 0.35s ease;
}
.immersive-fade-enter-from,
.immersive-fade-leave-to {
  opacity: 0;
}

/* Immersive overlay */
.immersive-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0e0b08;
  display: flex;
  flex-direction: column;
}

.immersive-topbar {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(14, 11, 8, 0.97);
  border-bottom: 1px solid rgba(192, 168, 130, 0.08);
  position: relative;
}

.immersive-progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: #c8956b;
  transition: width 0.15s linear;
  border-radius: 0 2px 2px 0;
}

.immersive-logo {
  font-family: 'Merriweather', serif;
  font-size: 13px;
  color: rgba(192, 168, 130, 0.45);
  letter-spacing: 0.3px;
}

.immersive-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.immersive-ctrl {
  background: transparent;
  border: 1px solid rgba(192, 168, 130, 0.15);
  border-radius: 8px;
  color: rgba(192, 168, 130, 0.6);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}
.immersive-ctrl:hover {
  background: rgba(200, 149, 107, 0.12);
  border-color: rgba(200, 149, 107, 0.4);
  color: #c8956b;
}

.immersive-font-size {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: rgba(192, 168, 130, 0.35);
  min-width: 22px;
  text-align: center;
}

.immersive-close {
  margin-left: 8px;
  border-color: rgba(192, 168, 130, 0.2);
  font-size: 14px;
  padding: 5px 9px;
}

.immersive-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  padding: 64px 24px 100px;
}
.immersive-scroll::-webkit-scrollbar {
  width: 5px;
}
.immersive-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.immersive-scroll::-webkit-scrollbar-thumb {
  background: rgba(200, 149, 107, 0.25);
  border-radius: 3px;
}
.immersive-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(200, 149, 107, 0.45);
}

.immersive-inner {
  max-width: 680px;
  margin: 0 auto;
}

.immersive-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.immersive-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(192, 168, 130, 0.08);
  border: 1px solid rgba(192, 168, 130, 0.2);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(192, 168, 130, 0.65);
}
.immersive-badge--type {
  background: rgba(200, 149, 107, 0.1);
  border-color: rgba(200, 149, 107, 0.3);
  color: rgba(200, 149, 107, 0.8);
}

.immersive-title {
  font-family: 'Merriweather', serif;
  font-size: 40px;
  font-weight: 700;
  color: #ede3d4;
  line-height: 1.25;
  margin: 0 0 16px 0;
}

.immersive-date {
  font-size: 13px;
  color: rgba(192, 168, 130, 0.4);
  margin: 0 0 44px 0;
  font-family: 'Inter', sans-serif;
}

.immersive-excerpt {
  font-family: 'Merriweather', serif;
  font-style: italic;
  font-size: 19px;
  color: #d4c0a0;
  line-height: 1.8;
  margin-bottom: 44px;
  padding-bottom: 36px;
  border-bottom: 1px solid rgba(192, 168, 130, 0.12);
}

.immersive-body {
  color: #b8a48a;
  line-height: 1.95;
  font-family: 'Merriweather', serif;
}

.immersive-body :deep(p) {
  margin: 0 0 1.3em 0;
}
.immersive-body :deep(h2) {
  font-family: 'Merriweather', serif;
  font-size: 26px;
  font-weight: 700;
  color: #ddd0be;
  margin: 2.2em 0 0.7em 0;
  line-height: 1.3;
}
.immersive-body :deep(h3) {
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  color: #cfc3ae;
  margin: 1.8em 0 0.5em 0;
  line-height: 1.3;
}
.immersive-body :deep(ul),
.immersive-body :deep(ol) {
  padding-left: 1.5em;
  margin: 0 0 1.3em 0;
}
.immersive-body :deep(li) {
  margin-bottom: 0.45em;
}
.immersive-body :deep(blockquote) {
  border-left: 3px solid #c8956b;
  padding: 12px 20px;
  margin: 1.75em 0;
  background: rgba(200, 149, 107, 0.07);
  border-radius: 0 8px 8px 0;
  color: #c4ad8e;
  font-style: italic;
}
.immersive-body :deep(a) {
  color: #c8956b;
  text-decoration: underline;
}
.immersive-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.75em 0;
  display: block;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.immersive-body :deep(strong) {
  color: #e0d0b8;
  font-weight: 700;
}

.immersive-end {
  margin-top: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.immersive-end-mark {
  font-size: 14px;
  color: rgba(200, 149, 107, 0.35);
  letter-spacing: 8px;
}

.immersive-exit-btn {
  background: transparent;
  border: 1px solid rgba(200, 149, 107, 0.3);
  border-radius: 24px;
  color: rgba(200, 149, 107, 0.7);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.immersive-exit-btn:hover {
  background: rgba(200, 149, 107, 0.1);
  border-color: rgba(200, 149, 107, 0.6);
  color: #c8956b;
}

@media (max-width: 640px) {
  .immersive-title {
    font-size: 28px;
  }
  .immersive-excerpt {
    font-size: 16px;
  }
  .immersive-scroll {
    padding: 48px 20px 80px;
  }
  .immersive-logo {
    display: none;
  }
  .audio-fab {
    bottom: 20px;
    right: 16px;
  }
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
