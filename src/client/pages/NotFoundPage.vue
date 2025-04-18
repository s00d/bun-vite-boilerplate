<template>
  <div>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <router-link to="/">Go back home</router-link>
  </div>
</template>

<script setup lang="ts">
import { useHead } from "@vueuse/head";

useHead({
  title: "Page Not Found",
  meta: [{ name: "robots", content: "noindex" }],
});
</script>

<style scoped>
h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}
</style>
