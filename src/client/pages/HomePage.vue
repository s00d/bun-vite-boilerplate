<template>
  <div class="p-6 space-y-6 bg-surface text-foreground rounded shadow-md max-w-2xl mx-auto">
    <LocaleSwitcher class="mb-4" />

    <h1 class="text-2xl font-bold">{{ t("home.title") }}</h1>
    <p class="text-muted">{{ t("home.welcome") }}</p>

    <router-link to="/profile" class="text-link underline">
      {{ t("home.go_to_profile") }}
    </router-link>

    <div class="mt-4">
      <template v-if="isLoggedIn">
        <span class="text-success font-medium">{{ t("home.logged_in") }}</span>
        <button @click="logout" class="ml-4 text-error underline hover:opacity-80">
          {{ t("home.logout") }}
        </button>
      </template>
      <template v-else>
        <router-link to="/auth/login" class="mr-2 text-primary hover:underline">
          {{ t("home.login") }}
        </router-link>
        |
        <router-link to="/auth/register" class="ml-2 text-primary hover:underline">
          {{ t("home.register") }}
        </router-link>
      </template>
    </div>

    <div>
      <p class="text-lg font-medium">
        {{ t("home.counter") }}: <span class="text-strong">{{ count }}</span>
      </p>
      <div class="mt-2 flex gap-2">
        <button @click="count--" class="btn btn-outline px-4 py-2">-</button>
        <button @click="count++" class="btn btn-solid px-4 py-2">+</button>
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
