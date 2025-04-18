<template>
  <main>
    <h1>About</h1>

    <section class="buttons">
      <button @click="increment">Increment</button>
      <button @click="reset">Reset</button>
      <p>Count: {{ count }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useHead } from "@vueuse/head";
import { ref } from "vue";

useHead({
  title: "About",
});

const count = ref(0);

function increment() {
  count.value++;
  console.log("🔼 Count incremented:", count.value);
}

function reset() {
  count.value = 0;
  console.log("🔁 Count reset");
}
</script>

<style scoped>
.buttons {
  margin-top: 2rem;
}
button {
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  background: #f60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background: #d45000;
}
</style>
