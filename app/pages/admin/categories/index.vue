<script setup lang="ts">
import type { Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const { data: categories, refresh } = await useAsyncData<Category[]>('admin-categories', async () => {
  const { data } = await client.from('categories').select('*').order('sort_order')
  return data ?? []
})

const modalRef = ref<HTMLDialogElement>()
const editingId = ref<number | null>(null)
const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  slug: '',
  description: '',
  gradient_from: '2D6A4F',
  gradient_to: 'D4845C',
  sort_order: 0,
})

watch(() => form.name, (val) => {
  if (editingId.value) return
  form.slug = val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

function openCreate() {
  editingId.value = null
  error.value = ''
  Object.assign(form, {
    name: '', slug: '', description: '',
    gradient_from: '2D6A4F', gradient_to: 'D4845C', sort_order: categories.value?.length ?? 0,
  })
  modalRef.value?.showModal()
}

function openEdit(cat: Category) {
  editingId.value = cat.id
  error.value = ''
  Object.assign(form, {
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? '',
    gradient_from: cat.gradient[0] ?? '2D6A4F',
    gradient_to: cat.gradient[1] ?? 'D4845C',
    sort_order: cat.sort_order,
  })
  modalRef.value?.showModal()
}

function closeModal() {
  modalRef.value?.close()
}

async function handleSubmit() {
  error.value = ''
  if (!form.name || !form.slug) {
    error.value = 'Nome e slug são obrigatórios.'
    return
  }

  saving.value = true

  const payload = {
    name: form.name,
    slug: form.slug,
    description: form.description || null,
    gradient: [form.gradient_from, form.gradient_to],
    sort_order: form.sort_order,
  }

  let dbError
  if (editingId.value) {
    const res = await client.from('categories').update(payload).eq('id', editingId.value)
    dbError = res.error
  } else {
    const res = await client.from('categories').insert(payload)
    dbError = res.error
  }

  saving.value = false

  if (dbError) {
    error.value = dbError.message
    return
  }

  closeModal()
  await refresh()
}

async function deleteCategory(cat: Category) {
  if (!confirm(`Excluir a categoria "${cat.name}"?`)) return
  await client.from('categories').delete().eq('id', cat.id)
  await refresh()
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Categorias</h1>
      <button class="btn-new" @click="openCreate">+ Nova categoria</button>
    </div>

    <!-- Desktop: tabela -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Slug</th>
            <th>Descrição</th>
            <th>Ordem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id" class="table-row">
            <td class="td-name">
              <div
                class="gradient-dot"
                :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
              />
              {{ cat.name }}
            </td>
            <td class="td-slug">{{ cat.slug }}</td>
            <td class="td-desc">{{ cat.description ?? '—' }}</td>
            <td class="td-order">{{ cat.sort_order }}</td>
            <td class="td-actions">
              <button class="action-edit" @click="openEdit(cat)">Editar</button>
              <button class="action-delete" @click="deleteCategory(cat)">Excluir</button>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="5" class="td-empty">Nenhuma categoria cadastrada.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile: cards -->
    <div class="card-list">
      <div v-if="!categories?.length" class="card-empty">Nenhuma categoria cadastrada.</div>
      <div v-for="cat in categories" :key="cat.id" class="card">
        <div class="card-top">
          <div
            class="gradient-dot"
            :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
          />
          <span class="card-name">{{ cat.name }}</span>
          <span class="card-order">Ordem {{ cat.sort_order }}</span>
        </div>
        <div class="card-slug">{{ cat.slug }}</div>
        <div v-if="cat.description" class="card-desc">{{ cat.description }}</div>
        <div class="card-actions">
          <button class="action-edit" @click="openEdit(cat)">Editar</button>
          <button class="action-delete" @click="deleteCategory(cat)">Excluir</button>
        </div>
      </div>
    </div>

    <!-- DaisyUI Modal -->
    <dialog ref="modalRef" class="modal">
      <div class="modal-box">
        <h3 class="modal-title">{{ editingId ? 'Editar categoria' : 'Nova categoria' }}</h3>

        <form class="modal-form" @submit.prevent="handleSubmit">
          <div class="field">
            <label class="field-label" for="m-name">Nome</label>
            <input id="m-name" v-model="form.name" class="field-input" type="text" placeholder="Ex: Tradições" required />
          </div>

          <div class="field">
            <label class="field-label" for="m-slug">Slug (URL)</label>
            <input id="m-slug" v-model="form.slug" class="field-input" type="text" placeholder="Ex: tradicoes" required />
            <span class="field-hint">Apenas letras, números e hífens.</span>
          </div>

          <div class="field">
            <label class="field-label" for="m-desc">Descrição</label>
            <textarea id="m-desc" v-model="form.description" class="field-input field-textarea" rows="2" placeholder="Descrição curta da categoria" />
          </div>

          <div class="field">
            <label class="field-label">Gradiente</label>
            <div class="gradient-row">
              <div class="gradient-input-group">
                <span class="field-sublabel">Cor inicial (hex sem #)</span>
                <input v-model="form.gradient_from" class="field-input" type="text" maxlength="6" placeholder="2D6A4F" />
              </div>
              <div class="gradient-input-group">
                <span class="field-sublabel">Cor final (hex sem #)</span>
                <input v-model="form.gradient_to" class="field-input" type="text" maxlength="6" placeholder="D4845C" />
              </div>
              <div
                class="gradient-preview"
                :style="{ '--from': `#${form.gradient_from}`, '--to': `#${form.gradient_to}` }"
              />
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="m-order">Ordem de exibição</label>
            <input id="m-order" v-model.number="form.sort_order" class="field-input field-input--short" type="number" min="0" />
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <div class="modal-action">
            <button type="button" class="btn-cancel" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
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
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 700;
  color: #1b4332;
  margin: 0;
}

.btn-new {
  padding: 10px 20px;
  background: #2d6a4f;
  color: #f5f1e6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-new:hover {
  background: #1b4332;
}

/* TABLE (desktop) */
.table-wrapper {
  background: #fff;
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
  background: #f5f1e6;
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8b6f47;
}

.table-row {
  border-top: 1px solid #f0ebe0;
  transition: background 0.15s ease;
}
.table-row:hover {
  background: #faf8f4;
}

.table td {
  padding: 14px 16px;
  color: #1a1a1a;
  vertical-align: middle;
}

.td-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.gradient-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--from), var(--to));
  flex-shrink: 0;
}

.td-slug {
  color: #8b6f47;
  font-family: monospace;
  font-size: 13px;
}

.td-desc {
  color: #666;
  max-width: 280px;
}

.td-order {
  color: #999;
  text-align: center;
}

.td-actions {
  display: flex;
  gap: 12px;
}

.td-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.action-edit {
  background: none;
  border: none;
  color: #2d6a4f;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  padding: 0;
  text-decoration: none;
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
  color: #999;
  font-size: 14px;
  padding: 40px 0;
  font-family: 'Inter', sans-serif;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-name {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.card-order {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.card-slug {
  font-family: monospace;
  font-size: 13px;
  color: #8b6f47;
}

.card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid #f0ebe0;
}

/* MODAL */
.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-family: 'Merriweather', serif;
  font-size: 20px;
  font-weight: 700;
  color: #1b4332;
  margin: 0 0 24px 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #3d2817;
  font-family: 'Inter', sans-serif;
}

.field-sublabel {
  font-size: 12px;
  color: #8b6f47;
  font-family: 'Inter', sans-serif;
}

.field-hint {
  font-size: 12px;
  color: #999;
  font-family: 'Inter', sans-serif;
}

.field-input {
  padding: 10px 14px;
  border: 1.5px solid #d9cfc1;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.field-input:focus {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}
.field-textarea {
  resize: vertical;
  min-height: 64px;
}
.field-input--short {
  max-width: 100px;
}

.gradient-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.gradient-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.gradient-preview {
  width: 44px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--from), var(--to));
  flex-shrink: 0;
  border: 1px solid #d9cfc1;
}

.error-msg {
  font-size: 13px;
  color: #c9724a;
  margin: 0;
  padding: 10px 14px;
  background: rgba(201, 114, 74, 0.08);
  border-radius: 6px;
  border-left: 3px solid #c9724a;
  font-family: 'Inter', sans-serif;
}

.modal-action {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 8px;
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  border: 1.5px solid #d9cfc1;
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  border-color: #8b6f47;
  color: #3d2817;
}

.btn-save {
  padding: 10px 24px;
  background: #2d6a4f;
  color: #f5f1e6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-save:hover:not(:disabled) {
  background: #1b4332;
}
.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .page {
    padding: 24px 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .table-wrapper {
    display: none;
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .modal-box {
    padding: 24px 20px;
    margin: 0 16px;
  }
}
</style>
