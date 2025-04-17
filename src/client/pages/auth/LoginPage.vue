<!-- src/client/pages/auth/LoginPage.vue -->
<template>
  <div>
    <h1>Login</h1>
    <form @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <router-link to="/auth/register">Don't have an account? Register</router-link>
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
