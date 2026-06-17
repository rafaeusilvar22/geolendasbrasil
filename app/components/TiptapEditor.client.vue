<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const client = useSupabaseClient()
const uploading = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    TiptapImage.configure({ inline: false }),
    Link.configure({ openOnClick: false }),
    Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo aqui...' }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  if (editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '')
  }
})

onBeforeUnmount(() => editor.value?.destroy())

async function insertImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploading.value = true
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await client.storage.from('article-images').upload(path, file)
    if (!error && data) {
      const { data: urlData } = client.storage.from('article-images').getPublicUrl(data.path)
      editor.value?.chain().focus().setImage({ src: urlData.publicUrl }).run()
    }
    uploading.value = false
  }
  input.click()
}

function insertLink() {
  const previous = editor.value?.getAttributes('link').href as string | undefined
  const url = window.prompt('URL do link:', previous ?? '')
  if (url === null) return
  if (!url) {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-toolbar">
      <button
        type="button"
        class="tool-btn tool-btn--bold"
        :class="{ 'tool-btn--active': editor?.isActive('bold') }"
        title="Negrito"
        @click="editor?.chain().focus().toggleBold().run()"
      >B</button>
      <button
        type="button"
        class="tool-btn tool-btn--italic"
        :class="{ 'tool-btn--active': editor?.isActive('italic') }"
        title="Itálico"
        @click="editor?.chain().focus().toggleItalic().run()"
      >I</button>
      <button
        type="button"
        class="tool-btn tool-btn--strike"
        :class="{ 'tool-btn--active': editor?.isActive('strike') }"
        title="Tachado"
        @click="editor?.chain().focus().toggleStrike().run()"
      >S</button>

      <span class="tool-sep" />

      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('heading', { level: 2 }) }"
        title="Título H2"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
      >H2</button>
      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('heading', { level: 3 }) }"
        title="Título H3"
        @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()"
      >H3</button>

      <span class="tool-sep" />

      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('bulletList') }"
        title="Lista com marcadores"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >UL</button>
      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('orderedList') }"
        title="Lista numerada"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >OL</button>
      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('blockquote') }"
        title="Citação"
        @click="editor?.chain().focus().toggleBlockquote().run()"
      >"</button>

      <span class="tool-sep" />

      <button
        type="button"
        class="tool-btn"
        :class="{ 'tool-btn--active': editor?.isActive('link') }"
        title="Inserir link"
        @click="insertLink"
      >Link</button>
      <button
        type="button"
        class="tool-btn"
        :disabled="uploading"
        title="Inserir imagem"
        @click="insertImage"
      >{{ uploading ? '...' : 'Img' }}</button>

      <span class="tool-sep" />

      <button
        type="button"
        class="tool-btn"
        title="Desfazer"
        :disabled="!editor?.can().undo()"
        @click="editor?.chain().focus().undo().run()"
      >&#8630;</button>
      <button
        type="button"
        class="tool-btn"
        title="Refazer"
        :disabled="!editor?.can().redo()"
        @click="editor?.chain().focus().redo().run()"
      >&#8631;</button>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<style scoped>
.editor-wrapper {
  border: 1.5px solid #d9cfc1;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.editor-wrapper:focus-within {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.1);
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px 10px;
  background: #f5f1e6;
  border-bottom: 1px solid #e8e0d4;
}

.tool-btn {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: #3d2817;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1;
  min-width: 32px;
}
.tool-btn:hover:not(:disabled) {
  background: #e8e0d4;
  border-color: #d9cfc1;
}
.tool-btn--active {
  background: #2d6a4f;
  color: #f5f1e6;
  border-color: #2d6a4f;
}
.tool-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.tool-btn--bold { font-weight: 900; }
.tool-btn--italic { font-style: italic; }
.tool-btn--strike { text-decoration: line-through; }

.tool-sep {
  width: 1px;
  height: 24px;
  background: #d9cfc1;
  margin: 0 4px;
  align-self: center;
  flex-shrink: 0;
}

.editor-content {
  font-family: 'Inter', sans-serif;
}

.editor-content :deep(.ProseMirror) {
  min-height: 320px;
  padding: 20px;
  outline: none;
  font-size: 15px;
  line-height: 1.7;
  color: #1a1a1a;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0 0 1em 0;
}
.editor-content :deep(.ProseMirror h2) {
  font-family: 'Merriweather', serif;
  font-size: 22px;
  font-weight: 700;
  color: #1b4332;
  margin: 1.5em 0 0.5em 0;
  line-height: 1.3;
}
.editor-content :deep(.ProseMirror h3) {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 700;
  color: #2d6a4f;
  margin: 1.25em 0 0.4em 0;
  line-height: 1.3;
}
.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  margin: 0 0 1em 0;
  padding-left: 1.5em;
}
.editor-content :deep(.ProseMirror li) {
  margin-bottom: 0.25em;
}
.editor-content :deep(.ProseMirror blockquote) {
  border-left: 4px solid #d4845c;
  padding-left: 16px;
  margin: 1em 0;
  color: #666;
  font-style: italic;
}
.editor-content :deep(.ProseMirror a) {
  color: #2d6a4f;
  text-decoration: underline;
}
.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1em 0;
  display: block;
}
.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #bbb;
  pointer-events: none;
  height: 0;
}
</style>
