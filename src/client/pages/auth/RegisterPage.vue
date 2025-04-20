<template>
  <div class="max-w-md mx-auto px-6 py-10 bg-surface text-foreground rounded shadow space-y-6">
    <h1 class="text-2xl font-bold text-center">Register</h1>

    <form @submit.prevent="register" class="space-y-4">
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
        Register
      </button>
    </form>

    <p class="text-center text-sm text-muted-foreground">
      Already have an account?
      <router-link to="/auth/login" class="text-link hover:underline ml-1">
        Login
      </router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { api } from "@/shared/axios";
import { ref } from "vue";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const router = useRouter();

async function register() {
  try {
    await api.post("/api/guest/register", {
      email: email.value,
      password: password.value,
    });
    await router.push("/auth/login");
  } catch (e) {
    alert("Registration failed");
  }
}
</script>
