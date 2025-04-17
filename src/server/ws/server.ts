import { getUserFromHeaders } from "@/server/middleware/auth";
// src/server/ws/server.ts
import type { ServerWebSocket, WebSocketHandler } from "bun";

interface WsData {
  sessionId: string | null;
  email?: string;
  lastPong?: number;
}

const sockets = new Set<ServerWebSocket<WsData>>();
const PING_INTERVAL = 30_000; // 30s
const PONG_TIMEOUT = 10_000; // 10s

export function setupWebSocket(): WebSocketHandler<WsData> {
  // Пинг-сервер
  setInterval(() => {
    const now = Date.now();
    for (const ws of sockets) {
      if (ws.readyState !== 1) continue;

      if (ws.data.lastPong && now - ws.data.lastPong > PONG_TIMEOUT) {
        console.log("⚠️ WS timed out:", ws.data.email);
        ws.close();
        sockets.delete(ws);
        continue;
      }

      try {
        ws.send("ping");
      } catch {
        ws.close();
        sockets.delete(ws);
      }
    }
  }, PING_INTERVAL);

  return {
    async open(ws) {
      const { sessionId } = ws.data;
      let email = "guest";

      if (sessionId) {
        const { user } = await getUserFromHeaders({ cookie: `sessionId=${sessionId}` });
        if (user?.email) {
          email = user.email;
        }
      }

      ws.data.email = email;
      ws.data.lastPong = Date.now();
      sockets.add(ws);
      console.log("🔌 WS connected:", email);
    },

    message(ws, message) {
      const text = message.toString();
      if (text === "pong") {
        ws.data.lastPong = Date.now();
        return;
      }

      const sender = ws.data.email || "guest";
      for (const client of sockets) {
        if (client.readyState === 1) {
          client.send(`${sender}: ${text}`);
        }
      }
    },

    close(ws) {
      sockets.delete(ws);
      console.log("❌ WS disconnected:", ws.data.email);
    },

    drain() {},
  };
}
