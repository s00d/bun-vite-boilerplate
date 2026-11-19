// src/server/routes/ws.ts
import { Elysia, t } from "elysia";
import type { AppContextPlugin } from "@/server/context";

export const wsRoutes = (context: AppContextPlugin) =>
  new Elysia()
    .use(context)
    // Chat: every client gets every message, signed with the sender's email.
    .ws("/ws", {
      body: t.Object({ message: t.String({ minLength: 1, maxLength: 2000 }) }),
      open(ws) {
        ws.subscribe("clients");
      },
      message(ws, { message }) {
        const line = `${ws.data.user?.email ?? "guest"}: ${message}`;
        ws.publish("clients", line);
        ws.send(line);
      },
    })
    // Flash: read-only, per user (see POST /api/flash/:userId).
    .ws("/ws/flash", {
      open(ws) {
        const { user } = ws.data;
        if (!user) return ws.close(4401, "Unauthorized");
        ws.subscribe(`flash:${user.id}`);
        ws.subscribe("flash:all");
      },
    });
