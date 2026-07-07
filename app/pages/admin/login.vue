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
        <h1 class="login-title">{{ SITE_NAME }}</h1>
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
  background: linear-gradient(to bottom right, #151225, #0E0C18, #7C2D3B);
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
  background: #F2E9D8;
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
  color: #151225;
  margin: 0 0 8px 0;
  line-height: 1.2;
}

.login-subtitle {
  font-size: 13px;
  color: #7A6A52;
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
  color: #211C2E;
  letter-spacing: 0.3px;
}

.field-input {
  padding: 12px 14px;
  border: 1.5px solid #D9CBA8;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #211C2E;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}
.field-input::placeholder {
  color: #bbb;
}
.field-input:focus {
  border-color: #C9A24B;
  box-shadow: 0 0 0 3px rgba(201, 162, 75, 0.12);
}
.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  font-size: 13px;
  color: #7C2D3B;
  margin: 0;
  padding: 10px 14px;
  background: rgba(124, 45, 59, 0.08);
  border-radius: 6px;
  border-left: 3px solid #7C2D3B;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  padding: 13px;
  background: #C9A24B;
  color: #D8D2E6;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}
.submit-btn:hover:not(:disabled) {
  background: #A67F32;
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(216, 210, 230, 0.4);
  border-top-color: #D8D2E6;
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
