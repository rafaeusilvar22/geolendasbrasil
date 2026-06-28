<script setup lang="ts">
import type { Article } from '~/types/article'

const props = defineProps<{ article: Article }>()

const formattedDate = computed(() =>
  new Date(props.article.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }),
)

const coverImage = computed(() => {
  if (!props.article.content) return null
  const match = props.article.content.match(/<img[^>]+src="([^"]+)"/)
  return match?.[1] ?? null
})

const fallbackGradient = computed(() => {
  const g = props.article.category?.gradient
  if (g?.[0] && g?.[1]) return { from: `#${g[0]}`, to: `#${g[1]}` }
  return { from: '#2D6A4F', to: '#8B6F47' }
})

const articleUrl = computed(() => {
  const catSlug = props.article.category?.slug
  return catSlug ? `/${catSlug}/${props.article.slug}` : '#'
})
</script>

<template>
  <NuxtLink :to="articleUrl" class="article-card">
    <div class="card-image">
      <img v-if="coverImage" :src="coverImage" class="card-cover" :alt="article.title" loading="lazy" />
      <div
        v-else
        class="card-gradient"
        :style="{ '--from': fallbackGradient.from, '--to': fallbackGradient.to }"
      >
        <div class="card-texture" />
        <span v-if="article.type" class="card-type-label">{{ article.type }}</span>
      </div>
      <div v-if="article.has_audio" class="audio-badge">
        <svg viewBox="0 0 24 24" fill="currentColor" width="9" height="9"><polygon points="5,3 19,12 5,21"/></svg>
        Áudio
      </div>
    </div>

    <div class="card-content">
      <div class="card-badges">
        <span v-if="article.state" class="state-badge">{{ article.state }}</span>
      </div>

      <h3 class="card-title">{{ article.title }}</h3>

      <p class="card-excerpt">{{ article.excerpt }}</p>

      <div class="card-footer">
        <span class="card-date">{{ formattedDate }}</span>
        <span class="read-more">Ler mais →</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.article-card {
  background: var(--pg-card-bg);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  cursor: pointer;
  transition: background 0.3s ease, transform 0.25s ease, box-shadow 0.25s ease;
  transform: translateY(0);
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--pg-card-border);
}
.article-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.13);
}

.card-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--from) 0%, var(--to) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-texture {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
  pointer-events: none;
}

.card-type-label {
  position: relative;
  color: #f5f1e6;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
}

.audio-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  background: rgba(10, 8, 5, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: #f5f1e6;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
  pointer-events: none;
}

.card-content {
  padding: 24px;
}

.card-badges {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  margin-bottom: 12px;
  overflow: hidden;
}

.state-badge {
  display: inline-block;
  padding: 4px 10px;
  background: var(--pg-badge-bg);
  color: var(--pg-badge-text);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
}

.card-title {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--pg-card-title);
  line-height: 1.4;
}

.card-excerpt {
  font-size: 14px;
  color: var(--pg-card-excerpt);
  margin: 0 0 16px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--pg-card-divider);
}

.card-date {
  font-size: 12px;
  color: var(--pg-text-muted);
  font-family: 'Inter', sans-serif;
}

.read-more {
  color: var(--pg-accent);
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
}
</style>
