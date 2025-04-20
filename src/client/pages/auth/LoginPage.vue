<template>
  <div class="max-w-md mx-auto px-6 py-10 bg-surface text-foreground rounded shadow space-y-6">
    <h1 class="text-2xl font-bold text-center">Login</h1>

    <form @submit.prevent="login" class="space-y-4">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        required
        class="w-full px-4 py-2 border border-border rounded bg-input text-foreground placeholder:text-muted-foreground"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        required
        class="w-full px-4 py-2 border border-border rounded bg-input text-foreground placeholder:text-muted-foreground"
      />
      <button type="submit" class="w-full btn btn-solid py-2">
        Login
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Don’t have an account?
      <router-link to="/auth/register" class="text-link hover:underline ml-1">
        Register
      </router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { api } from "@/shared/axios";
import { ref } from "vue";
import { useRouter } from "vue-router";

const email = ref("admin@admin.ru");
const password = ref("admin@admin.ru");
const router = useRouter();

async function login() {
  try {
    await api.post("/api/guest/login", {
      email: email.value,
      password: password.value,
    });
    await router.push("/profile");
  } catch (e) {
    alert("Invalid credentials");
  }
}
</script>
