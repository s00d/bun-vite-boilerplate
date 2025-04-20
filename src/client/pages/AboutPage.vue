<template>
  <main class="max-w-xl mx-auto px-6 py-8 bg-surface text-foreground rounded shadow space-y-6">
    <h1 class="text-2xl font-bold">About</h1>

    <section class="space-y-4">
      <div class="flex gap-3">
        <button @click="increment" class="btn btn-solid px-4 py-2">Increment</button>
        <button @click="reset" class="btn btn-outline px-4 py-2">Reset</button>
      </div>
      <p class="text-lg">
        Count: <span class="font-semibold text-primary">{{ count }}</span>
      </p>
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
