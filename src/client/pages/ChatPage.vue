<script setup lang="ts">
import { useHead } from "@vueuse/head";
import { ref } from "vue";
import { useWebSocket } from "../composables/useWebSocket";

useHead({ title: "Chat" });

const { messages, connected, send } = useWebSocket();
const draft = ref("");

function submit() {
  const text = draft.value.trim();
  if (!text) return;
  send(text);
  draft.value = "";
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-10 space-y-4">
    <h1 class="text-2xl font-bold">Chat</h1>
    <p class="text-sm text-muted-foreground">{{ connected ? "Connected" : "Connecting…" }}</p>

    <ul class="h-80 overflow-y-auto border border-border rounded p-3 space-y-1 bg-surface">
      <li v-for="(line, i) in messages" :key="i" class="text-sm break-words">{{ line }}</li>
      <li v-if="!messages.length" class="text-sm text-muted-foreground">No messages yet.</li>
    </ul>

    <form class="flex gap-2" @submit.prevent="submit">
      <input
        v-model="draft"
        maxlength="2000"
        placeholder="Message"
        class="flex-1 px-4 py-2 border border-border rounded bg-input text-foreground placeholder:text-muted-foreground"
      />
      <button type="submit" class="btn btn-solid px-4 py-2" :disabled="!connected">Send</button>
    </form>
  </div>
</template>
