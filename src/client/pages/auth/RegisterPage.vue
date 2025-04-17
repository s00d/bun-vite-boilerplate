<!--src/client/pages/auth/RegisterPage.vue-->
<template>
  <div>
    <h1>Register</h1>
    <form @submit.prevent="register">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>
    <router-link to="/auth/login">Already have an account? Login</router-link>
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
