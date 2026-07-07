<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Category } from '~/types/article'

definePageMeta({ layout: 'admin' })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = useSupabaseClient<any>()

const { data: categoriesData, refresh } = await useAsyncData<Category[]>('admin-categories', async () => {
  const { data } = await client.from('categories').select('*').order('sort_order')
  return data ?? []
})

const localCategories = ref<Category[]>([])
watch(categoriesData, (val) => { localCategories.value = [...(val ?? [])] }, { immediate: true })

const reordering = ref(false)

const topLevelCategories = computed<Category[]>({
  get: () => localCategories.value.filter(c => c.parent_id == null).sort((a, b) => a.sort_order - b.sort_order),
  set: (newOrder) => {
    const children = localCategories.value.filter(c => c.parent_id != null)
    localCategories.value = [...newOrder, ...children]
  },
})

function childrenOf(parentId: number) {
  return localCategories.value.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
}

const parentOptions = computed(() =>
  localCategories.value.filter(c => c.parent_id == null && c.id !== editingId.value),
)

async function handleDragEnd() {
  reordering.value = true
  await Promise.all(
    topLevelCategories.value.map((cat, index) =>
      client.from('categories').update({ sort_order: index }).eq('id', cat.id),
    ),
  )
  reordering.value = false
  await refresh()
}

async function moveChild(child: Category, direction: 'up' | 'down') {
  if (child.parent_id == null) return
  const siblings = childrenOf(child.parent_id)
  const idx = siblings.findIndex(c => c.id === child.id)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= siblings.length) return
  const other = siblings[swapIdx]
  if (!other) return

  reordering.value = true
  await Promise.all([
    client.from('categories').update({ sort_order: other.sort_order }).eq('id', child.id),
    client.from('categories').update({ sort_order: child.sort_order }).eq('id', other.id),
  ])
  reordering.value = false
  await refresh()
}

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
  parent_id: null as number | null,
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

function openCreate(parentId: number | null = null) {
  editingId.value = null
  error.value = ''
  Object.assign(form, { name: '', slug: '', description: '', gradient_from: '2D6A4F', gradient_to: 'D4845C', parent_id: parentId })
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
    parent_id: cat.parent_id,
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
    parent_id: form.parent_id,
    sort_order: editingId.value
      ? localCategories.value.find(c => c.id === editingId.value)?.sort_order ?? 0
      : localCategories.value.filter(c => c.parent_id === form.parent_id).length,
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
  const childCount = childrenOf(cat.id).length
  const message = childCount > 0
    ? `Excluir a categoria "${cat.name}"? As ${childCount} subcategorias serão promovidas a categorias de nível superior.`
    : `Excluir a categoria "${cat.name}"?`
  if (!confirm(message)) return
  await client.from('categories').delete().eq('id', cat.id)
  await refresh()
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Categorias</h1>
      <button class="btn-new" @click="openCreate()">+ Nova categoria</button>
    </div>

    <p v-if="reordering" class="reorder-status">Salvando nova ordem...</p>

    <!-- Desktop: tabela -->
    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th class="th-handle" />
            <th>Nome</th>
            <th>Slug</th>
            <th>Descrição</th>
            <th></th>
          </tr>
        </thead>
        <draggable
          v-model="topLevelCategories"
          tag="tbody"
          item-key="id"
          handle=".drag-handle"
          :animation="150"
          @end="handleDragEnd"
        >
          <template #item="{ element: cat }">
            <tr class="table-row">
              <td class="td-handle">
                <Icon name="lucide:grip-vertical" class="drag-handle" />
              </td>
              <td class="td-name">
                <div class="td-name-main">
                  <div
                    class="gradient-dot"
                    :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
                  />
                  {{ cat.name }}
                </div>
                <div v-if="childrenOf(cat.id).length" class="children-list">
                  <div v-for="(child, idx) in childrenOf(cat.id)" :key="child.id" class="child-row">
                    <span class="child-name">{{ child.name }}</span>
                    <div class="child-actions">
                      <button class="arrow-btn" :disabled="idx === 0" @click="moveChild(child, 'up')">↑</button>
                      <button class="arrow-btn" :disabled="idx === childrenOf(cat.id).length - 1" @click="moveChild(child, 'down')">↓</button>
                      <button class="action-edit" @click="openEdit(child)">Editar</button>
                      <button class="action-delete" @click="deleteCategory(child)">Excluir</button>
                    </div>
                  </div>
                </div>
                <button class="btn-new-sub" @click="openCreate(cat.id)">+ Nova subcategoria</button>
              </td>
              <td class="td-slug">{{ cat.slug }}</td>
              <td class="td-desc">{{ cat.description ?? '—' }}</td>
              <td class="td-actions">
                <button class="action-edit" @click="openEdit(cat)">Editar</button>
                <button class="action-delete" @click="deleteCategory(cat)">Excluir</button>
              </td>
            </tr>
          </template>
          <template #footer>
            <tr v-if="!localCategories.length">
              <td colspan="5" class="td-empty">Nenhuma categoria cadastrada.</td>
            </tr>
          </template>
        </draggable>
      </table>
    </div>

    <!-- Mobile: cards -->
    <draggable
      v-model="topLevelCategories"
      class="card-list"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      @end="handleDragEnd"
    >
      <template #item="{ element: cat }">
        <div class="card">
          <div class="card-top">
            <Icon name="lucide:grip-vertical" class="drag-handle" />
            <div
              class="gradient-dot"
              :style="{ '--from': `#${cat.gradient[0]}`, '--to': `#${cat.gradient[1]}` }"
            />
            <span class="card-name">{{ cat.name }}</span>
          </div>
          <div class="card-slug">{{ cat.slug }}</div>
          <div v-if="cat.description" class="card-desc">{{ cat.description }}</div>
          <div class="card-actions">
            <button class="action-edit" @click="openEdit(cat)">Editar</button>
            <button class="action-delete" @click="deleteCategory(cat)">Excluir</button>
          </div>
          <div v-if="childrenOf(cat.id).length" class="children-list children-list--card">
            <div v-for="(child, idx) in childrenOf(cat.id)" :key="child.id" class="child-row">
              <span class="child-name">{{ child.name }}</span>
              <div class="child-actions">
                <button class="arrow-btn" :disabled="idx === 0" @click="moveChild(child, 'up')">↑</button>
                <button class="arrow-btn" :disabled="idx === childrenOf(cat.id).length - 1" @click="moveChild(child, 'down')">↓</button>
                <button class="action-edit" @click="openEdit(child)">Editar</button>
                <button class="action-delete" @click="deleteCategory(child)">Excluir</button>
              </div>
            </div>
          </div>
          <button class="btn-new-sub" @click="openCreate(cat.id)">+ Nova subcategoria</button>
        </div>
      </template>
      <template #footer>
        <div v-if="!localCategories.length" class="card-empty">Nenhuma categoria cadastrada.</div>
      </template>
    </draggable>

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
            <label class="field-label" for="m-parent">Categoria pai</label>
            <select id="m-parent" v-model="form.parent_id" class="field-input">
              <option :value="null">Nenhuma (categoria de nível superior)</option>
              <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <span class="field-hint">Escolha uma categoria pai para transformar esta em subcategoria.</span>
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
  color: var(--adm-heading);
  margin: 0;
}

.btn-new {
  padding: 10px 20px;
  background: var(--adm-accent);
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
  background: var(--adm-accent-hover);
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

.td-name {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  font-weight: 600;
}

.td-name-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.children-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 38px;
  width: 100%;
}

.children-list--card {
  padding-left: 20px;
  padding-top: 4px;
  border-top: 1px solid var(--adm-row-divider);
}

.child-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 400;
  font-size: 13px;
}

.child-name {
  color: var(--adm-text-secondary);
}

.child-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.arrow-btn {
  background: none;
  border: none;
  color: var(--adm-text-muted);
  cursor: pointer;
  font-size: 13px;
  padding: 0 2px;
}
.arrow-btn:hover:not(:disabled) {
  color: var(--adm-accent);
}
.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-new-sub {
  background: none;
  border: none;
  color: var(--adm-accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: 'Inter', sans-serif;
}
.btn-new-sub:hover {
  text-decoration: underline;
}

.gradient-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--from), var(--to));
  flex-shrink: 0;
}

.th-handle {
  width: 36px;
}

.td-handle {
  width: 36px;
  padding-right: 0;
}

.drag-handle {
  width: 18px;
  height: 18px;
  color: var(--adm-text-faint);
  cursor: grab;
  display: block;
}
.drag-handle:active {
  cursor: grabbing;
}

.table-row.sortable-chosen {
  background: var(--adm-row-hover);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reorder-status {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--adm-text-muted);
  margin: 0 0 16px 0;
}

.td-slug {
  color: var(--adm-text-muted);
  font-family: monospace;
  font-size: 13px;
}

.td-desc {
  color: var(--adm-text-secondary);
  max-width: 280px;
}

.td-actions {
  display: flex;
  gap: 12px;
}

.td-empty {
  text-align: center;
  color: var(--adm-text-faint);
  padding: 40px;
}

.action-edit {
  background: none;
  border: none;
  color: var(--adm-accent);
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
  color: var(--adm-text);
  flex: 1;
}

.card-slug {
  font-family: monospace;
  font-size: 13px;
  color: var(--adm-text-muted);
}

.card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--adm-text-secondary);
  line-height: 1.4;
}

.card-actions {
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid var(--adm-row-divider);
}

/* MODAL */
.modal-box {
  background: var(--adm-surface);
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
  color: var(--adm-heading);
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
  color: var(--adm-label);
  font-family: 'Inter', sans-serif;
}

.field-sublabel {
  font-size: 12px;
  color: var(--adm-text-muted);
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
  border: 1px solid var(--adm-border);
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
  border: 1.5px solid var(--adm-border);
  border-radius: 8px;
  color: var(--adm-cancel-text);
  font-size: 14px;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  border-color: var(--adm-text-muted);
  color: var(--adm-label);
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
}
.btn-save:hover:not(:disabled) {
  background: var(--adm-accent-hover);
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
