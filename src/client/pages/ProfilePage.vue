<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "../store/user";

const store = useUserStore();
const user = ref<{ email: string; apiKey: string } | null>(null);

await store.get();
user.value = store.user;
</script>

<template>
  <div class="p-6 max-w-xl mx-auto bg-surface text-foreground rounded shadow space-y-6">
    <h1 class="text-2xl font-bold">{{ $t("title") }}</h1>

    <div v-if="user" class="space-y-2">
      <p><span class="font-medium text-muted-foreground">{{ $t("email") }}:</span> {{ user.email }}</p>
      <p><span class="font-medium text-muted-foreground">{{ $t("apiKey") }}:</span> {{ user.apiKey }}</p>
    </div>

    <div v-else class="text-error">
      <p>User not found or unauthorized.</p>
    </div>

    <RouterLink to="/" class="text-link underline hover:opacity-80"> ← Back to home </RouterLink>
  </div>
</template>
