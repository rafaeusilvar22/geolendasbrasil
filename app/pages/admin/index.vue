<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <div class="dashboard">
    <p class="dashboard-placeholder">Dashboard em construção.</p>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 32px 40px;
}

@media (max-width: 640px) {
  .dashboard {
    padding: 24px 16px;
  }
}

.dashboard-placeholder {
  color: var(--adm-text-muted);
  font-size: 15px;
  margin: 0;
}
</style>
