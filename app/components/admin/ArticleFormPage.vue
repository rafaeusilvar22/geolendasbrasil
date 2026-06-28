<script setup lang="ts">
import type { Article, Category } from '~/types/article'
import { STATES } from '~/constants/states'

const props = defineProps<{
  mode: 'create' | 'edit'
  article?: Article
  categories: Category[]
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()
const saving = ref(false)
const error = ref('')
const aiError = ref('')
const generatingExcerpt = ref(false)

const audioUrl = ref<string | null>(props.article?.audio_url ?? null)
const generatingAudio = ref(false)
const deletingAudio = ref(false)
const audioError = ref('')

async function handleGenerateAudio() {
  if (!form.content) {
    audioError.value = 'Adicione conteúdo ao artigo antes de gerar o áudio.'
    return
  }
  generatingAudio.value = true
  audioError.value = ''
  try {
    const { data, error: fnError } = await client.functions.invoke('generate-audio', {
      method: 'POST',
      body: { conteudo: form.content, id: form.slug, tipo: 'artigo' },
    })
    if (fnError) throw fnError
    if (!data?.audioUrl) throw new Error('Resposta inválida da função')
    audioUrl.value = data.audioUrl
    if (props.article) {
      await client.from('articles').update({ audio_url: data.audioUrl }).eq('id', props.article.id)
    }
  } catch (err) {
    audioError.value = err instanceof Error ? err.message : 'Erro desconhecido'
  } finally {
    generatingAudio.value = false
  }
}

async function handleDeleteAudio() {
  if (!audioUrl.value) return
  deletingAudio.value = true
  audioError.value = ''
  try {
    const { error: fnError } = await client.functions.invoke('generate-audio', {
      method: 'DELETE',
      body: { audioUrl: audioUrl.value },
    })
    if (fnError) throw fnError
    audioUrl.value = null
    if (props.article) {
      await client.from('articles').update({ audio_url: null }).eq('id', props.article.id)
    }
  } catch (err) {
    audioError.value = err instanceof Error ? err.message : 'Erro desconhecido'
  } finally {
    deletingAudio.value = false
  }
}

async function generateExcerpt() {
  if (!form.title) {
    aiError.value = 'Preencha o título antes de gerar o resumo.'
    return
  }
  aiError.value = ''
  generatingExcerpt.value = true
  try {
    const categoryName = props.categories.find(c => c.id === form.category_id)?.name
    const { data, error: fnError } = await client.functions.invoke('generate-excerpt', {
      body: {
        title: form.title,
        category: categoryName,
        state: form.state,
        type: form.type,
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
    if (data?.excerpt) {
      form.excerpt = data.excerpt
    } else {
      aiError.value = 'A IA não retornou um resumo. Verifique o console.'
    }
  } catch (err: unknown) {
    aiError.value = err instanceof Error ? err.message : 'Erro desconhecido ao chamar a IA.'
  } finally {
    generatingExcerpt.value = false
  }
}

const states = STATES

const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  state: '',
  category_id: null as number | null,
  type: '',
  published: false,
})

watch(
  () => props.article,
  (a) => {
    if (!a) return
    Object.assign(form, {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content ?? '',
      state: a.state,
      category_id: a.category_id,
      type: a.type,
      published: a.published,
    })
    audioUrl.value = a.audio_url ?? null
  },
  { immediate: true },
)

watch(
  () => form.title,
  (val) => {
    if (props.mode !== 'create') return
    form.slug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  },
)

async function handleSubmit() {
  error.value = ''
  if (!form.title || !form.slug || !form.excerpt) {
    error.value = 'Título, slug e resumo são obrigatórios.'
    return
  }

  saving.value = true

  const payload = {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content || null,
    state: form.state,
    category_id: form.category_id,
    type: form.type,
    published: form.published,
    updated_at: new Date().toISOString(),
  }

  let dbError
  if (props.mode === 'edit' && props.article) {
    const res = await client.from('articles').update(payload).eq('id', props.article.id)
    dbError = res.error
  } else {
    const res = await client.from('articles').insert(payload)
    dbError = res.error
  }

  saving.value = false

  if (dbError) {
    error.value = dbError.message
    return
  }

  await navigateTo('/admin/articles')
}
</script>

<template>
  <div class="form-page">
    <div class="form-header">
      <div class="form-header-left">
        <NuxtLink to="/admin/articles" class="back-btn">← Voltar</NuxtLink>
        <h1 class="form-title">
          {{ mode === 'create' ? 'Novo artigo' : 'Editar artigo' }}
        </h1>
      </div>
      <button class="btn-save" :disabled="saving" @click="handleSubmit">
        {{ saving ? 'Salvando...' : 'Salvar artigo' }}
      </button>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="form-layout">
      <div class="form-main">
        <div class="field">
          <label class="field-label" for="f-title">Título</label>
          <input
            id="f-title"
            v-model="form.title"
            class="field-input"
            type="text"
            placeholder="Ex: A Lenda do Boto Cor-de-Rosa"
          />
        </div>

        <div class="field">
          <label class="field-label" for="f-slug">Slug (URL)</label>
          <input
            id="f-slug"
            v-model="form.slug"
            class="field-input"
            type="text"
            placeholder="Ex: lenda-boto-cor-de-rosa"
          />
          <span class="field-hint">Apenas letras, números e hífens.</span>
        </div>

        <div class="field">
          <div class="field-label-row">
            <label class="field-label" for="f-excerpt">Resumo</label>
            <button
              type="button"
              class="btn-ai"
              :disabled="generatingExcerpt || !form.title"
              @click="generateExcerpt"
            >
              {{ generatingExcerpt ? 'Gerando...' : '✦ Gerar com IA' }}
            </button>
          </div>
          <p v-if="aiError" class="ai-error">{{ aiError }}</p>
          <textarea
            id="f-excerpt"
            v-model="form.excerpt"
            class="field-input field-textarea"
            rows="3"
            placeholder="Descrição curta exibida nos cards da homepage"
          />
        </div>

        <div class="field">
          <label class="field-label">Conteúdo</label>
          <TiptapEditor v-model="form.content" />
        </div>
      </div>

      <aside class="form-sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Publicação</h3>

          <div class="field">
            <label class="field-label" for="f-category">Categoria</label>
            <select id="f-category" v-model="form.category_id" class="field-input">
              <option :value="null">Sem categoria</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="f-state">Estado</label>
            <select id="f-state" v-model="form.state" class="field-input">
              <option value="">Selecione um estado</option>
              <option v-for="s in states" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label" for="f-type">Tipo</label>
            <input
              id="f-type"
              v-model="form.type"
              class="field-input"
              type="text"
              placeholder="Ex: Mitologia, Folclore, História"
            />
          </div>

          <div class="field">
            <label class="toggle-label">
              <input v-model="form.published" type="checkbox" class="toggle-input" />
              <span class="toggle-text">Publicado</span>
            </label>
            <span class="field-hint">
              {{ form.published ? 'Visível no site' : 'Rascunho' }}
            </span>
          </div>
        </div>

        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Narração em áudio</h3>

          <template v-if="mode === 'edit'">
            <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player" />

            <p v-if="audioError" class="ai-error">{{ audioError }}</p>

            <div class="audio-actions">
              <button
                type="button"
                class="btn-ai"
                :disabled="generatingAudio || !form.content"
                @click="handleGenerateAudio"
              >
                {{ generatingAudio ? 'Gerando...' : audioUrl ? 'Regenerar áudio' : 'Gerar áudio' }}
              </button>
              <button
                v-if="audioUrl"
                type="button"
                class="btn-delete-audio"
                :disabled="deletingAudio"
                @click="handleDeleteAudio"
              >
                {{ deletingAudio ? 'Excluindo...' : 'Excluir' }}
              </button>
            </div>

            <span v-if="!form.content" class="field-hint">Adicione conteúdo ao artigo para habilitar.</span>
          </template>

          <span v-else class="field-hint">Salve o artigo para poder gerar o áudio.</span>
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

.audio-player {
  width: 100%;
  height: 36px;
  border-radius: 6px;
}

.audio-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-delete-audio {
  padding: 4px 12px;
  background: transparent;
  color: #c9724a;
  border: 1.5px solid #c9724a;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}
.btn-delete-audio:hover:not(:disabled) {
  background: #c9724a;
  color: #fff;
}
.btn-delete-audio:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
