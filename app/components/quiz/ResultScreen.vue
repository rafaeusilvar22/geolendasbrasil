<script setup lang="ts">
const props = defineProps<{ quizType: QuizType }>()

const { questions, answered, score, percentage, difficulty, resetQuiz, startQuiz } = useQuiz()
const { logAttempt } = useQuizAnalytics()
const client = useSupabaseClient()

const SITE_URL = 'https://geolendasbrasil.netlify.app'

const level = computed(() => {
  if (percentage.value >= 90) return { name: 'Lenda Viva', emoji: '🏆' }
  if (percentage.value >= 70) return { name: 'Mestre do Folclore', emoji: '🌟' }
  if (percentage.value >= 40) return { name: 'Conhecedor de Lendas', emoji: '📖' }
  return { name: 'Iniciante Curioso', emoji: '🌱' }
})

const shareTitle = computed(() => `Fiz ${score.value}/${questions.value.length} no quiz de lendas brasileiras! ${level.value.emoji}`)
const shareUrl = computed(() => `${SITE_URL}/quiz`)
const { shareLinks, copySuccess, copyLink } = useQuizShare(shareTitle, shareUrl)

interface RelatedArticle {
  id: number
  title: string
  slug: string
  category: { slug: string } | null
}

const relatedArticle = ref<RelatedArticle | null>(null)

onMounted(async () => {
  logAttempt(props.quizType, score.value, questions.value.length, answered.value)

  const incorrectFirst = [...answered.value].sort((a, b) => Number(a.correct) - Number(b.correct))
  const articleId = incorrectFirst.find((a) => a.question.related_article_id)?.question.related_article_id
  if (!articleId) return

  const { data } = await client
    .from('articles')
    .select('id, title, slug, category:categories(slug)')
    .eq('id', articleId)
    .single()

  relatedArticle.value = data as RelatedArticle | null
})

function tryAgain() {
  const previousDifficulty = difficulty.value
  resetQuiz()
  startQuiz(props.quizType, previousDifficulty)
}
</script>

<template>
  <div class="result-screen">
    <div class="score-circle">
      <span class="score-percentage">{{ percentage }}%</span>
      <span class="score-fraction">{{ score }}/{{ questions.length }}</span>
    </div>

    <p class="level-badge">{{ level.emoji }} Você é um {{ level.name }}!</p>

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

    <div class="result-actions">
      <button type="button" class="btn-secondary" @click="tryAgain">Tentar Novamente</button>
      <NuxtLink
        v-if="relatedArticle && relatedArticle.category"
        :to="`/${relatedArticle.category.slug}/${relatedArticle.slug}`"
        class="btn-primary"
      >
        Ver Lenda Completa
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.result-screen {
  max-width: 480px;
  margin: 0 auto;
  padding: 48px 24px;
  text-align: center;
}

.score-circle {
  width: 160px;
  height: 160px;
  margin: 0 auto 20px;
  border-radius: 50%;
  border: 6px solid var(--pg-accent);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--pg-card-bg);
}

.score-percentage {
  font-family: 'Merriweather', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--pg-heading);
}

.score-fraction {
  font-size: 13px;
  color: var(--pg-text-muted);
}

.level-badge {
  font-size: 17px;
  font-weight: 600;
  color: var(--pg-text);
  margin: 0 0 32px;
}

.share-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 36px;
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

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: none;
  text-align: center;
}

.btn-primary {
  background: var(--pg-accent);
  color: #fff;
}

.btn-secondary {
  background: transparent;
  color: var(--pg-heading);
  border: 1.5px solid var(--pg-card-border);
}

[data-theme="forest"] .share-btn img[alt="X"] {
  filter: invert(1);
}
</style>
