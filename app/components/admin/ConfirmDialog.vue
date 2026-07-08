<script setup lang="ts">
interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

const dialogRef = ref<HTMLDialogElement>()
const title = ref('')
const message = ref('')
const confirmLabel = ref('Confirmar')
const cancelLabel = ref('Cancelar')
const danger = ref(true)

let resolvePromise: ((value: boolean) => void) | null = null
let confirmed = false

function open(options: ConfirmOptions) {
  title.value = options.title ?? 'Confirmar ação'
  message.value = options.message
  confirmLabel.value = options.confirmLabel ?? 'Confirmar'
  cancelLabel.value = options.cancelLabel ?? 'Cancelar'
  danger.value = options.danger ?? true
  confirmed = false
  dialogRef.value?.showModal()
  return new Promise<boolean>((resolve) => {
    resolvePromise = resolve
  })
}

function handleConfirm() {
  confirmed = true
  dialogRef.value?.close()
}

function handleClose() {
  resolvePromise?.(confirmed)
  resolvePromise = null
}

defineExpose({ open })
</script>

<template>
  <dialog ref="dialogRef" class="modal" @close="handleClose">
    <div class="modal-box confirm-box">
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <div class="modal-action">
        <button type="button" class="btn-cancel" @click="dialogRef?.close()">{{ cancelLabel }}</button>
        <button
          type="button"
          class="btn-confirm"
          :class="{ 'btn-confirm--danger': danger }"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<style scoped>
.confirm-box {
  background: var(--adm-surface);
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.confirm-title {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--adm-heading);
  margin: 0 0 12px 0;
}

.confirm-message {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--adm-text-secondary);
  margin: 0;
}

.modal-action {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 24px;
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

.btn-confirm {
  padding: 10px 24px;
  background: var(--adm-accent);
  color: #D8D2E6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}
.btn-confirm:hover {
  background: var(--adm-accent-hover);
}

.btn-confirm--danger {
  background: #7C2D3B;
  color: #F2E9D8;
}
.btn-confirm--danger:hover {
  background: #611f2a;
}
</style>
