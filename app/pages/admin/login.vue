<script setup lang="ts">
definePageMeta({ layout: false })

const client = useSupabaseClient()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = 'Preencha todos os campos.'
    return
  }

  loading.value = true

  const { error: authError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  loading.value = false

  if (authError) {
    error.value = 'Credenciais inválidas. Tente novamente.'
    return
  }

  await navigateTo('/admin')
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">GeoLendas Brasil</h1>
        <p class="login-subtitle">Acesso administrativo</p>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field-label" for="email">E-mail</label>
          <input
            id="email"
            v-model="email"
            class="field-input"
            type="email"
            placeholder="admin@exemplo.com"
            autocomplete="email"
            :disabled="loading"
          />
        </div>

        <div class="field">
          <label class="field-label" for="password">Senha</label>
          <input
            id="password"
            v-model="password"
            class="field-input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            :disabled="loading"
          />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button class="submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" />
          <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #2d6a4f, #1b4332, #8b6f47);
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: 'Inter', sans-serif;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #f5f1e6;
  border-radius: 12px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-title {
  font-family: 'Merriweather', serif;
  font-size: 26px;
  font-weight: 700;
  color: #1b4332;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 13px;
  color: #8b6f47;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  letter-spacing: 0.3px;
}

.field-input {
  padding: 12px 14px;
  border: 1.5px solid #d9cfc1;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #1a1a1a;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.field-input::placeholder {
  color: #bbb;
}
.field-input:focus {
  border-color: #2d6a4f;
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.12);
}
.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  font-size: 13px;
  color: #c9724a;
  margin: 0;
  padding: 10px 14px;
  background: rgba(201, 114, 74, 0.08);
  border-radius: 6px;
  border-left: 3px solid #c9724a;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  padding: 13px;
  background: #2d6a4f;
  color: #f5f1e6;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}
.submit-btn:hover:not(:disabled) {
  background: #1b4332;
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(245, 241, 230, 0.4);
  border-top-color: #f5f1e6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
