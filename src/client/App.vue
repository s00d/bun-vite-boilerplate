<!-- src/client/App.vue -->
<template>
  <Suspense>
    <router-view />
  </Suspense>
</template>

<script setup lang="ts">
// глобальные импорты или provide/inject если нужно
</script>

<style scoped>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
</style>
