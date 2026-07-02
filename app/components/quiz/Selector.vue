<script setup lang="ts">
import type { QuizType } from '~/composables/useQuiz'

interface QuizMode {
  type: QuizType
  title: string
  description: string
  icon: string
}

const modes: QuizMode[] = [
  {
    type: 'adivinhe_lenda',
    title: 'Adivinhe a Lenda',
    description: 'Leia a descrição e descubra qual lenda brasileira é essa.',
    icon: 'heroicons:sparkles',
  },
  {
    type: 'qual_caracteristica',
    title: 'Qual Característica?',
    description: 'Teste seu conhecimento sobre os detalhes de cada lenda.',
    icon: 'heroicons:magnifying-glass',
  },
  {
    type: 'qual_estado',
    title: 'De Qual Estado?',
    description: 'Descubra a que região do Brasil cada lenda pertence.',
    icon: 'heroicons:map',
  },
]
</script>

<template>
  <div class="quiz-selector">
    <h1 class="selector-title">Quiz de Lendas Brasileiras</h1>
    <p class="selector-subtitle">Escolha um modo e teste seus conhecimentos sobre o folclore do Brasil.</p>

    <div class="mode-grid">
      <NuxtLink v-for="mode in modes" :key="mode.type" :to="`/quiz/${mode.type}`" class="mode-card">
        <Icon :name="mode.icon" class="mode-icon" />
        <h2 class="mode-title">{{ mode.title }}</h2>
        <p class="mode-description">{{ mode.description }}</p>
        <span class="mode-cta">Jogar →</span>
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.quiz-selector {
  max-width: 960px;
  margin: 0 auto;
  padding: 60px 24px;
  text-align: center;
}

.selector-title {
  font-family: 'Merriweather', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--pg-heading);
  margin: 0 0 12px;
}

.selector-subtitle {
  font-size: 16px;
  color: var(--pg-text-muted);
  margin: 0 0 40px;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .mode-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  background: var(--pg-card-bg);
  border: 1px solid var(--pg-card-border);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}

.mode-icon {
  width: 36px;
  height: 36px;
  color: var(--pg-accent);
  margin-bottom: 16px;
}

.mode-title {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--pg-card-title);
  margin: 0 0 8px;
}

.mode-description {
  font-size: 14px;
  color: var(--pg-card-excerpt);
  margin: 0 0 20px;
  line-height: 1.5;
}

.mode-cta {
  margin-top: auto;
  font-size: 14px;
  font-weight: 600;
  color: var(--pg-accent);
}
</style>
