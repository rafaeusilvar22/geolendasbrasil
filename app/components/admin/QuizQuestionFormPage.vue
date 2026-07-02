<script setup lang="ts">
import type { AdminQuizQuestion, QuizDifficulty, QuizType } from '~/composables/useQuiz'

const props = defineProps<{
  mode: 'create' | 'edit'
  question?: AdminQuizQuestion
  articles: { id: number, title: string }[]
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()
const saving = ref(false)
const error = ref('')
const aiError = ref('')
const generating = ref(false)

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  adivinhe_lenda: 'Adivinhe a Lenda',
  qual_caracteristica: 'Qual Característica?',
  qual_estado: 'De Qual Estado?',
}

const DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

const form = reactive({
  quiz_type: 'adivinhe_lenda' as QuizType,
  difficulty: 'medio' as QuizDifficulty,
  question: '',
  option_0: '',
  option_1: '',
  option_2: '',
  option_3: '',
  correct_index: 0,
  explanation: '',
  related_article_id: null as number | null,
  is_active: true,
})

watch(
  () => props.question,
  (q) => {
    if (!q) return
    Object.assign(form, {
      quiz_type: q.quiz_type,
      difficulty: q.difficulty,
      question: q.question,
      option_0: q.options[0] ?? '',
      option_1: q.options[1] ?? '',
      option_2: q.options[2] ?? '',
      option_3: q.options[3] ?? '',
      correct_index: q.correct_index,
      explanation: q.explanation ?? '',
      related_article_id: q.related_article_id,
      is_active: q.is_active,
    })
  },
  { immediate: true },
)

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function generateQuestion() {
  aiError.value = ''
  generating.value = true
  try {
    let articleTitle: string | undefined
    let articleContent: string | undefined

    if (form.related_article_id) {
      const { data: art } = await client
        .from('articles')
        .select('title, content')
        .eq('id', form.related_article_id)
        .single()
      if (art) {
        articleTitle = art.title
        articleContent = stripHtml(art.content ?? '').slice(0, 3000)
      }
    }

    const { data, error: fnError } = await client.functions.invoke('generate-quiz-question', {
      body: {
        quizType: form.quiz_type,
        difficulty: form.difficulty,
        articleTitle,
        articleContent,
      },
    })

    if (fnError) {
      aiError.value = fnError.message ?? 'Erro na Edge Function.'
      return
    }
    if (data?.error) {
      aiError.value = data.error
      return
    }
    if (data?.question && Array.isArray(data.options) && data.options.length === 4) {
      form.question = data.question
      form.option_0 = data.options[0]
      form.option_1 = data.options[1]
      form.option_2 = data.options[2]
      form.option_3 = data.options[3]
      form.correct_index = data.correct_index
      form.explanation = data.explanation ?? ''
    } else {
      aiError.value = 'A IA não retornou uma pergunta válida. Tente novamente.'
    }
  } catch (err: unknown) {
    aiError.value = err instanceof Error ? err.message : 'Erro desconhecido ao chamar a IA.'
  } finally {
    generating.value = false
  }
}

async function handleSubmit() {
  error.value = ''
  if (!form.question || !form.option_0 || !form.option_1 || !form.option_2 || !form.option_3) {
    error.value = 'A pergunta e as 4 opções são obrigatórias.'
    return
  }

  saving.value = true

  const payload = {
    quiz_type: form.quiz_type,
    difficulty: form.difficulty,
    question: form.question,
    options: [form.option_0, form.option_1, form.option_2, form.option_3],
    correct_index: form.correct_index,
    explanation: form.explanation || null,
    related_article_id: form.related_article_id,
    is_active: form.is_active,
  }

  let dbError
  if (props.mode === 'edit' && props.question) {
    const res = await client.from('quiz_questions').update(payload).eq('id', props.question.id)
    dbError = res.error
  } else {
    const res = await client.from('quiz_questions').insert(payload)
    dbError = res.error
  }

  saving.value = false

  if (dbError) {
    error.value = dbError.message
    return
  }

  await navigateTo('/admin/quiz')
}
</script>

<template>
  <div class="form-page">
    <div class="form-header">
      <div class="form-header-left">
        <NuxtLink to="/admin/quiz" class="back-btn">← Voltar</NuxtLink>
        <h1 class="form-title">
          {{ mode === 'create' ? 'Nova pergunta' : 'Editar pergunta' }}
        </h1>
      </div>
      <button class="btn-save" :disabled="saving" @click="handleSubmit">
        {{ saving ? 'Salvando...' : 'Salvar pergunta' }}
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="form-layout">
      <div class="form-main">
        <div class="field">
          <div class="field-label-row">
            <label class="field-label">Gerar pergunta com IA</label>
            <button type="button" class="btn-ai" :disabled="generating" @click="generateQuestion">
              {{ generating ? 'Gerando...' : '✦ Gerar com IA' }}
            </button>
          </div>
          <span class="field-hint">
            Selecione o tipo, a dificuldade e, opcionalmente, um artigo de referência na barra lateral antes de gerar.
          </span>
          <p v-if="aiError" class="ai-error">{{ aiError }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="f-question">Pergunta</label>
          <textarea
            id="f-question"
            v-model="form.question"
            class="field-input field-textarea"
            rows="3"
            placeholder="Ex: Ser da floresta com os pés virados para trás..."
          />
        </div>

        <div class="field">
          <label class="field-label" for="f-option-0">Opção 1</label>
          <div class="option-row">
            <input id="f-option-0" v-model="form.option_0" class="field-input" type="text" />
            <label class="correct-radio">
              <input v-model="form.correct_index" type="radio" name="correct_index" :value="0" />
              Correta
            </label>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="f-option-1">Opção 2</label>
          <div class="option-row">
            <input id="f-option-1" v-model="form.option_1" class="field-input" type="text" />
            <label class="correct-radio">
              <input v-model="form.correct_index" type="radio" name="correct_index" :value="1" />
              Correta
            </label>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="f-option-2">Opção 3</label>
          <div class="option-row">
            <input id="f-option-2" v-model="form.option_2" class="field-input" type="text" />
            <label class="correct-radio">
              <input v-model="form.correct_index" type="radio" name="correct_index" :value="2" />
              Correta
            </label>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="f-option-3">Opção 4</label>
          <div class="option-row">
            <input id="f-option-3" v-model="form.option_3" class="field-input" type="text" />
            <label class="correct-radio">
              <input v-model="form.correct_index" type="radio" name="correct_index" :value="3" />
              Correta
            </label>
          </div>
        </div>

        <div class="field">
          <label class="field-label" for="f-explanation">Explicação</label>
          <textarea
            id="f-explanation"
            v-model="form.explanation"
            class="field-input field-textarea"
            rows="3"
            placeholder="Texto exibido após o usuário responder"
          />
        </div>
      </div>

      <aside class="form-sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Configuração</h3>

          <div class="field">
            <label class="field-label" for="f-quiz-type">Tipo de quiz</label>
            <select id="f-quiz-type" v-model="form.quiz_type" class="field-input">
              <option v-for="(label, type) in QUIZ_TYPE_LABELS" :key="type" :value="type">{{ label }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="f-difficulty">Dificuldade</label>
            <select id="f-difficulty" v-model="form.difficulty" class="field-input">
              <option v-for="(label, diff) in DIFFICULTY_LABELS" :key="diff" :value="diff">{{ label }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="f-related-article">Lenda de referência</label>
            <select id="f-related-article" v-model="form.related_article_id" class="field-input">
              <option :value="null">Nenhum</option>
              <option v-for="article in articles" :key="article.id" :value="article.id">
                {{ article.title }}
              </option>
            </select>
            <span class="field-hint">Usado como referência para a IA gerar uma pergunta fiel a esse artigo.</span>
          </div>

          <div class="field">
            <label class="toggle-label">
              <input v-model="form.is_active" type="checkbox" class="toggle-input" />
              <span class="toggle-text">Ativa</span>
            </label>
            <span class="field-hint">
              {{ form.is_active ? 'Visível no quiz público' : 'Oculta do quiz público' }}
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.form-page {
  padding: 40px;
  max-width: 1200px;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.form-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 13px;
  color: var(--adm-text-muted);
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  white-space: nowrap;
}
.back-btn:hover {
  color: var(--adm-label);
  text-decoration: underline;
}

.form-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--adm-heading);
  margin: 0;
}

.btn-save {
  padding: 10px 24px;
  background: var(--adm-accent);
  color: #f5f1e6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-save:hover:not(:disabled) {
  background: var(--adm-accent-hover);
}
.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  font-size: 13px;
  color: #c9724a;
  margin: 0 0 20px 0;
  padding: 12px 16px;
  background: rgba(201, 114, 74, 0.08);
  border-radius: 6px;
  border-left: 3px solid #c9724a;
  font-family: 'Inter', sans-serif;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-card {
  background: var(--adm-surface);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card-title {
  font-family: 'Merriweather', serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--adm-heading);
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--adm-row-divider);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--adm-label);
  font-family: 'Inter', sans-serif;
}

.btn-ai {
  padding: 4px 12px;
  background: transparent;
  color: var(--adm-accent);
  border: 1.5px solid var(--adm-accent);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}
.btn-ai:hover:not(:disabled) {
  background: var(--adm-accent);
  color: #f5f1e6;
}
.btn-ai:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-error {
  font-size: 12px;
  color: #c9724a;
  margin: 4px 0 0;
  font-family: 'Inter', sans-serif;
}

.field-hint {
  font-size: 12px;
  color: var(--adm-text-faint);
  font-family: 'Inter', sans-serif;
}

.field-input {
  padding: 10px 14px;
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: var(--adm-text);
  background: var(--adm-input-bg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.field-input:focus {
  border-color: var(--adm-accent);
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}
.field-textarea {
  resize: vertical;
  min-height: 80px;
}

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.option-row .field-input {
  flex: 1;
}

.correct-radio {
  font-size: 12px;
  color: var(--adm-text-muted);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-input {
  width: 18px;
  height: 18px;
  accent-color: var(--adm-accent);
  cursor: pointer;
}

.toggle-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--adm-label);
  font-family: 'Inter', sans-serif;
}

@media (max-width: 900px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    order: -1;
  }

  .form-page {
    padding: 24px 20px;
  }
}
</style>
