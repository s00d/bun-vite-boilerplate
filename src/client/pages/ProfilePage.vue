<!-- src/client/pages/ProfilePage.vue -->
<template>
  <div>
    <h1>Profile</h1>
    <div v-if="user">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>API Key:</strong> {{ user.apiKey }}</p>
    </div>
    <div v-else>
      <p>User not found or unauthorized.</p>
    </div>
    <router-link to="/">Back to home</router-link>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useUserStore } from "../store/user";

const store = useUserStore();

const user = ref<{ email: string; apiKey: string } | null>(null);
await store.get();
user.value = store.user;

onMounted(async () => {
  // await store.get();
  // user.value = store.user;
});
</script>
