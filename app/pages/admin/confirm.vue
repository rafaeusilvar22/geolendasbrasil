<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<template>
  <div class="confirm-page">
    <span class="spinner" />
    <p class="confirm-text">Autenticando...</p>
  </div>
</template>

<style scoped>
.confirm-page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #2d6a4f, #1b4332, #8b6f47);
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-family: 'Inter', sans-serif;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(245, 241, 230, 0.2);
  border-top-color: #f5f1e6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.confirm-text {
  color: rgba(245, 241, 230, 0.8);
  font-size: 14px;
  margin: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
