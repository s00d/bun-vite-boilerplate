<template>
  <div>
    <h1>WebSocket Chat</h1>
    <div v-for="(msg, i) in messages" :key="i" class="message">{{ msg }}</div>
    <input v-model="input" @keydown.enter="sendMessage" placeholder="Type message" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWebSocket } from "../composables/useWebSocket";

const { messages, send } = useWebSocket();
const input = ref("");

function sendMessage() {
  if (!input.value) return;
  send(input.value);
  input.value = "";
}
</script>

<style scoped>
.message {
  padding: 4px;
  border-bottom: 1px solid #ddd;
}
input {
  margin-top: 8px;
  padding: 4px;
  width: 50%;
}
</style>

