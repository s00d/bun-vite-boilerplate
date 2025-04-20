import { onMounted, onUnmounted, ref } from "vue";
import { useUserStore } from "@/client/store/user";

export function useFlashMessages() {
  const flash = ref<string | null>(null);
  let socket: WebSocket | null = null;

  onMounted(() => {
    const store = useUserStore();
    if (!store.user) return;

    socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws/flash`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "flash") {
          flash.value = data.message;
          console.log(111, flash.value);
          setTimeout(() => {
            flash.value = null;
          }, 5000);
        }
      } catch (e) {
        console.warn("Invalid flash message:", event.data);
      }
    };
  });

  onUnmounted(() => {
    socket?.close();
  });

  return { flash };
}
