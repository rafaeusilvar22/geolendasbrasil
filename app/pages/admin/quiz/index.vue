<script setup lang="ts">
import type { AdminQuizQuestion, QuizDifficulty, QuizType } from '~/composables/useQuiz'

definePageMeta({ layout: 'admin' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

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

const PAGE_SIZE = 20
const page = ref(1)
const quizTypeFilter = ref<QuizType | ''>('')
const difficultyFilter = ref<QuizDifficulty | ''>('')
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')
const searchInput = ref('')
const searchQuery = ref('')

const hasFilters = computed(() =>
  !!quizTypeFilter.value || !!difficultyFilter.value || activeFilter.value !== 'all' || !!searchQuery.value,
)

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = val.trim()
    page.value = 1
  }, 350)
})

watch([quizTypeFilter, difficultyFilter, activeFilter], () => { page.value = 1 })

function clearFilters() {
  searchInput.value = ''
  searchQuery.value = ''
  quizTypeFilter.value = ''
  difficultyFilter.value = ''
  activeFilter.value = 'all'
  page.value = 1
}

const { data, refresh } = await useAsyncData(
  'admin-quiz-questions',
  async () => {
    const from = (page.value - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = client
      .from('quiz_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (quizTypeFilter.value) query = query.eq('quiz_type', quizTypeFilter.value)
    if (difficultyFilter.value) query = query.eq('difficulty', difficultyFilter.value)
    if (activeFilter.value !== 'all') query = query.eq('is_active', activeFilter.value === 'active')
    if (searchQuery.value) query = query.ilike('question', `%${searchQuery.value}%`)

    const { data, count } = await query
    return { questions: (data ?? []) as AdminQuizQuestion[], total: count ?? 0 }
  },
  { watch: [page, quizTypeFilter, difficultyFilter, activeFilter, searchQuery] },
)

const questions = computed(() => data.value?.questions ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

async function toggleActive(question: AdminQuizQuestion) {
  await client.from('quiz_questions').update({ is_active: !question.is_active }).eq('id', question.id)
  await refresh()
}

async function deleteQuestion(question: AdminQuizQuestion) {
  if (!confirm(`Excluir a pergunta "${question.question}"?`)) return
  await client.from('quiz_questions').delete().eq('id', question.id)
  if (questions.value.length === 1 && page.value > 1) page.value--
  else await refresh()
}

function formattedDate(str: string) {
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Perguntas do Quiz</h1>
      <NuxtLink to="/admin/quiz/new" class="btn-new">+ Nova pergunta</NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="filters">
      <div class="filter-search">
        <Icon name="heroicons:magnifying-glass" class="search-icon" />
        <input
          v-model="searchInput"
          class="search-input"
          type="text"
          placeholder="Buscar por pergunta..."
        />
        <button v-if="searchInput" class="search-clear" @click="searchInput = ''">✕</button>
      </div>

      <select v-model="quizTypeFilter" class="filter-select">
        <option value="">Todos os tipos</option>
        <option v-for="(label, type) in QUIZ_TYPE_LABELS" :key="type" :value="type">{{ label }}</option>
      </select>

      <select v-model="difficultyFilter" class="filter-select">
        <option value="">Todas as dificuldades</option>
        <option v-for="(label, diff) in DIFFICULTY_LABELS" :key="diff" :value="diff">{{ label }}</option>
      </select>

      <select v-model="activeFilter" class="filter-select">
        <option value="all">Todas</option>
        <option value="active">Ativas</option>
        <option value="inactive">Inativas</option>
      </select>

      <button v-if="hasFilters" class="btn-clear" @click="clearFilters">Limpar filtros</button>
    </div>

    <!-- Contagem de resultados -->
    <p v-if="hasFilters" class="results-count">
      {{ total }} {{ total === 1 ? 'pergunta encontrada' : 'perguntas encontradas' }}
    </p>

    <!-- Desktop: tabela -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Pergunta</th>
            <th>Tipo</th>
            <th>Dificuldade</th>
            <th>Status</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="question in questions" :key="question.id" class="table-row">
            <td class="td-title">{{ question.question }}</td>
            <td class="td-cat">{{ QUIZ_TYPE_LABELS[question.quiz_type] }}</td>
            <td class="td-state">{{ DIFFICULTY_LABELS[question.difficulty] }}</td>
            <td class="td-status">
              <button
                class="status-badge"
                :class="question.is_active ? 'status-badge--published' : 'status-badge--draft'"
                @click="toggleActive(question)"
              >
                {{ question.is_active ? 'Ativa' : 'Inativa' }}
              </button>
            </td>
            <td class="td-date">{{ formattedDate(question.created_at) }}</td>
            <td class="td-actions">
              <NuxtLink :to="`/admin/quiz/${question.id}`" class="action-edit">Editar</NuxtLink>
              <button class="action-delete" @click="deleteQuestion(question)">Excluir</button>
            </td>
          </tr>
          <tr v-if="!questions.length">
            <td colspan="6" class="td-empty">Nenhuma pergunta encontrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <div class="card-list">
      <div v-if="!questions.length" class="card-empty">Nenhuma pergunta encontrada.</div>
      <div v-for="question in questions" :key="question.id" class="card">
        <div class="card-top">
          <span class="card-title">{{ question.question }}</span>
          <button
            class="status-badge"
            :class="question.is_active ? 'status-badge--published' : 'status-badge--draft'"
            @click="toggleActive(question)"
          >
            {{ question.is_active ? 'Ativa' : 'Inativa' }}
          </button>
        </div>
        <div class="card-meta">
          <span>{{ QUIZ_TYPE_LABELS[question.quiz_type] }}</span>
          <span class="meta-sep">·</span>
          <span>{{ DIFFICULTY_LABELS[question.difficulty] }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-date">{{ formattedDate(question.created_at) }}</span>
        </div>
        <div class="card-actions">
          <NuxtLink :to="`/admin/quiz/${question.id}`" class="action-edit">Editar</NuxtLink>
          <button class="action-delete" @click="deleteQuestion(question)">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="page === 1" @click="page--">← Anterior</button>
      <span class="page-info">
        Página {{ page }} de {{ totalPages }}
        <span class="page-total">({{ total }} perguntas)</span>
      </span>
      <button class="page-btn" :disabled="page === totalPages" @click="page++">Próxima →</button>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 32px 40px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.page-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--adm-heading);
  margin: 0;
}

.btn-new {
  padding: 10px 20px;
  background: var(--adm-accent);
  color: #f5f1e6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  text-decoration: none;
  transition: background 0.2s ease;
}
.btn-new:hover {
  background: var(--adm-accent-hover);
}

/* FILTROS */
.filters {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 11px;
  width: 16px;
  height: 16px;
  color: var(--adm-text-faint);
  pointer-events: none;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 9px 32px 9px 34px;
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: var(--adm-text);
  background: var(--adm-input-bg);
  outline: none;
  transition: border-color 0.2s ease;
}
.search-input::placeholder {
  color: var(--adm-text-faint);
}
.search-input:focus {
  border-color: var(--adm-accent);
}

.search-clear {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: var(--adm-text-faint);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  line-height: 1;
}
.search-clear:hover {
  color: var(--adm-text-secondary);
}

.filter-select {
  padding: 9px 12px;
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: var(--adm-text);
  background: var(--adm-input-bg);
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;
  min-width: 170px;
}
.filter-select:focus {
  border-color: var(--adm-accent);
}

.btn-clear {
  padding: 9px 14px;
  background: transparent;
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--adm-text-muted);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.btn-clear:hover {
  border-color: var(--adm-text-muted);
  color: var(--adm-label);
}

.results-count {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--adm-text-muted);
  margin: 0 0 16px 0;
}

/* TABLE (desktop) */
.table-wrapper {
  background: var(--adm-surface);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
}

.table thead tr {
  background: var(--adm-surface-alt);
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--adm-text-muted);
}

.table-row {
  border-top: 1px solid var(--adm-row-divider);
  transition: background 0.15s ease;
}
.table-row:hover {
  background: var(--adm-row-hover);
}

.table td {
  padding: 14px 16px;
  color: var(--adm-text);
  vertical-align: middle;
}

.td-title {
  font-weight: 600;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.td-cat {
  color: var(--adm-text-muted);
}

.td-state {
  color: var(--adm-text-secondary);
  font-size: 13px;
}

.td-date {
  color: var(--adm-text-faint);
  font-size: 13px;
  white-space: nowrap;
}

.td-empty {
  text-align: center;
  color: var(--adm-text-faint);
  padding: 40px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: opacity 0.15s ease;
  white-space: nowrap;
}
.status-badge:hover {
  opacity: 0.8;
}
.status-badge--published {
  background: rgba(45, 106, 79, 0.12);
  color: var(--adm-accent);
}
.status-badge--draft {
  background: rgba(139, 111, 71, 0.12);
  color: var(--adm-text-muted);
}

.td-actions {
  display: flex;
  gap: 12px;
}

.action-edit {
  color: var(--adm-accent);
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  font-family: 'Inter', sans-serif;
}
.action-edit:hover {
  text-decoration: underline;
}

.action-delete {
  background: none;
  border: none;
  color: #c9724a;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  padding: 0;
}
.action-delete:hover {
  text-decoration: underline;
}

/* CARDS (mobile) */
.card-list {
  display: none;
}

.card-empty {
  text-align: center;
  color: var(--adm-text-faint);
  font-size: 14px;
  padding: 40px 0;
  font-family: 'Inter', sans-serif;
}

.card {
  background: var(--adm-surface);
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--adm-text);
  line-height: 1.4;
  flex: 1;
}

.card-meta {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--adm-text-muted);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.meta-sep {
  color: var(--adm-text-faint);
}

.meta-date {
  color: var(--adm-text-faint);
}

.card-actions {
  display: flex;
  gap: 16px;
  padding-top: 4px;
  border-top: 1px solid var(--adm-row-divider);
}

/* PAGINAÇÃO */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  font-family: 'Inter', sans-serif;
}

.page-btn {
  padding: 8px 16px;
  background: var(--adm-surface);
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--adm-label);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--adm-accent);
  color: var(--adm-accent);
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--adm-text-secondary);
}

.page-total {
  color: var(--adm-text-faint);
  margin-left: 4px;
}

@media (max-width: 640px) {
  .page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-search {
    min-width: unset;
  }

  .filter-select {
    min-width: unset;
  }

  .table-wrapper {
    display: none;
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pagination {
    gap: 8px;
  }

  .page-info {
    font-size: 12px;
    text-align: center;
  }
}
</style>
