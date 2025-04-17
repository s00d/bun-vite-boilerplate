import { getEnv } from "@/shared/env";
// src/client/composables/useWebSocket.ts
import { onMounted, onUnmounted, ref } from "vue";

const wsUrl = getEnv("PUBLIC_WS_URL");
const RECONNECT_DELAY = 5000;

export function useWebSocket() {
  const messages = ref<string[]>([]);
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;

  function connect() {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WS connected");
    };

    socket.onmessage = (event) => {
      if (event.data === "ping") {
        socket?.send("pong");
        return;
      }

      messages.value.push(event.data);
    };

    socket.onclose = () => {
      console.warn("⚠️ WS disconnected. Reconnecting...");
      reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY);
    };

    socket.onerror = (err) => {
      console.error("❌ WS error:", err);
      socket?.close();
    };
  }

  onMounted(connect);

  onUnmounted(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  });

  function send(msg: string) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(msg);
    }
  }

  return { messages, send };
}
