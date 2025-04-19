<template>
  <div>
    <LocaleSwitcher class="mb-4" />

    <h1>{{ t("home.title") }}</h1>
    <p>{{ t("home.welcome") }}</p>
    <router-link to="/profile">{{ t("home.go_to_profile") }}</router-link>

    <div class="mt-4">
      <template v-if="isLoggedIn">
        <span class="text-green-600 font-medium">{{ t("home.logged_in") }}</span>
        <button @click="logout" class="ml-4 text-red-600 underline">
          {{ t("home.logout") }}
        </button>
      </template>
      <template v-else>
        <router-link to="/auth/login" class="mr-2 text-blue-600">
          {{ t("home.login") }}
        </router-link>
        |
        <router-link to="/auth/register" class="text-blue-600">
          {{ t("home.register") }}
        </router-link>
      </template>
    </div>

    <div class="mt-6">
      <p class="text-xl">{{ t("home.counter") }}: {{ count }}</p>
      <div class="mt-2 flex gap-2">
        <button @click="count--" class="px-4 py-2 bg-gray-200 rounded">-</button>
        <button @click="count++" class="px-4 py-2 bg-gray-200 rounded">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { api } from "@/shared/axios";
import { useHead } from "@vueuse/head";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../store/user";
import { useI18n } from "vue-i18n";
import LocaleSwitcher from "@/client/components/LocaleSwitcher.vue";

useHead({
  title: "Home Page - My App",
});

const { t } = useI18n();
const count = ref(0);
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
