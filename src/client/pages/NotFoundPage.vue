<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface text-foreground px-6 text-center">
    <h1 class="text-3xl font-bold mb-2 text-error">404 — Page Not Found</h1>
    <p class="text-muted-foreground mb-6">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <router-link
      to="/"
      class="btn btn-solid px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded"
    >
      ← Go back home
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useHead } from "@vueuse/head";

useHead({
  title: "Page Not Found",
  meta: [{ name: "robots", content: "noindex" }],
});
</script>
