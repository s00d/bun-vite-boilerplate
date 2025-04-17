<!-- src/client/pages/HomePage.vue -->
<template>
  <div>
    <h1>Home Page</h1>
    <p>Welcome to the app.</p>
    <router-link to="/profile">Go to profile</router-link>

    <div class="mt-4">
      <template v-if="isLoggedIn">
        <span class="text-green-600 font-medium">You are logged in</span>
        <button @click="logout" class="ml-4 text-red-600 underline">Logout</button>
      </template>
      <template v-else>
        <router-link to="/auth/login" class="mr-2 text-blue-600">Login</router-link> |
        <router-link to="/auth/register" class="text-blue-600">Register</router-link>
      </template>
    </div>

    <div class="mt-6">
      <p class="text-xl">Counter: {{ count }}</p>
      <div class="mt-2 flex gap-2">
        <button @click="count--" class="px-4 py-2 bg-gray-200 rounded">-</button>
        <button @click="count++" class="px-4 py-2 bg-gray-200 rounded">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { api } from "@/shared/axios";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
import { useHead } from "@vueuse/head";

useHead({
  title: "Home Page - My App",
  meta: [
    {
      name: "description",
      content: "Welcome to the home page of our app.",
    },
    {
      property: "og:title",
      content: "My App Home",
    },
  ],
});

const count = ref(0);
count.value++;
count.value++;

const store = useUserStore();
const isLoggedIn = computed(() => store.isLoggedIn);
const router = useRouter();

async function logout() {
  try {
    await api.post("/api/logout");
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    store.user = null;
    await router.push("/");
  }
}
</script>
