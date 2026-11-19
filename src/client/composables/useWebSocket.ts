// src/client/composables/useWebSocket.ts
import { onMounted, onUnmounted, ref } from "vue";
import { getEnv } from "@/shared/env";

const RECONNECT_DELAY = 5000;

/** Same-origin /ws unless PUBLIC_WS_URL says otherwise. */
function wsUrl(): string {
  return getEnv("PUBLIC_WS_URL") || `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;
}

/** Chat socket: reconnects until the component unmounts. */
export function useWebSocket() {
  const messages = ref<string[]>([]);
  const connected = ref(false);
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let stopped = false;

  function connect() {
    socket = new WebSocket(wsUrl());
    socket.onopen = () => {
      connected.value = true;
    };
    socket.onmessage = (event) => {
      messages.value.push(String(event.data));
    };
    socket.onclose = () => {
      connected.value = false;
      if (!stopped) reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY);
    };
    socket.onerror = () => socket?.close();
  }

  onMounted(connect);
  onUnmounted(() => {
    stopped = true;
    clearTimeout(reconnectTimer);
    socket?.close();
  });

  function send(message: string) {
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ message }));
  }

  return { messages, connected, send };
}
