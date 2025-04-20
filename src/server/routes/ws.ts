import { Elysia, t } from "elysia";
import { getUserFromHeaders } from "@/server/middleware/auth";
import { SECURITY_CONFIG } from "../../../config/security.config";

export const wsRoutes = new Elysia()
  .derive(async ({ headers }) => {
    const cookieHeader = headers.cookie ?? "";
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((s) => s.split("=")));
    const sessionId = cookies[SECURITY_CONFIG.sessionCookieName];

    let email = "guest";
    let userId: number | null = null;

    if (sessionId) {
      const { user } = await getUserFromHeaders({ cookie: cookieHeader });
      if (user) {
        email = user.email;
        userId = user.id;
      }
    }

    return {
      email,
      userId,
      lastPong: Date.now(),
    } as const;
  })
  .ws("/ws", {
    ping: (message) => message,
    pong: (message) => message,
    body: t.Object({
      message: t.String(),
    }),

    open(ws) {
      console.log("🔌 WS connected:", ws.data.email);
      ws.subscribe("clients");
    },

    message(ws, { message }) {
      const sender = ws.data.email;
      ws.publish("clients", `${sender}: ${message}`);
      ws.send(`${sender}: ${message}`);
    },

    close(ws) {
      console.log("❌ WS disconnected:", ws.data.email);
    },
  })
  .ws("/ws/flash", {
    open(ws) {
      const id = ws.data.userId ?? ws.data.email;
      console.log(`📢 WS flash connected for ${id}`);
      ws.subscribe(`flash:${id}`);
      ws.subscribe("flash:all");
    },
    message(ws) {
      // flash-сокет только для приёма, ничего не делает на входящие сообщения
    },
    close(ws) {
      const id = ws.data.userId ?? ws.data.email;
      console.log(`❌ WS flash closed for ${id}`);
    },
  });
