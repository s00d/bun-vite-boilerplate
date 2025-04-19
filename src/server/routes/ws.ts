import { Elysia, t } from "elysia";
import { getUserFromHeaders } from "@/server/middleware/auth";
import {SECURITY_CONFIG} from "../../../config/security.config";

export const wsRoutes = new Elysia()
  .derive(async ({ headers }) => {
    const cookieHeader = headers.cookie ?? "";
    const cookies = Object.fromEntries(cookieHeader.split("; ").map((s) => s.split("=")));
    const sessionId = cookies[SECURITY_CONFIG.sessionCookieName];

    let email = "guest";
    if (sessionId) {
      const { user } = await getUserFromHeaders({ cookie: cookieHeader });
      if (user?.email) email = user.email;
    }

    return {
      email,
      lastPong: Date.now()
    } as const;
  })
  .ws("/ws", {
    ping: (message) => message,
    pong: (message) => message,
    body: t.Object({
      message: t.String()
    }),

    open(ws) {
      console.log("🔌 WS connected:", ws.data.email);
      ws.subscribe('clients')
    },

    message(ws, { message }) {
      const sender = ws.data.email;
      ws.publish('clients', `${sender}: ${message}`)
      ws.send(`${sender}: ${message}`)
    },

    close(ws) {
      console.log("❌ WS disconnected:", ws.data.email);
    }
  });
