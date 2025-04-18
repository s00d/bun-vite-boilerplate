import "dotenv/config";

import { serve } from "bun";
import { SESSION_COOKIE_NAME } from "../../config/security.config";
import { initDb } from "./db/init";
import { generateRoutes, handleRequest } from "./routes/router";
import { setupWebSocket } from "./ws/server";

try {
  await initDb();
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}

const server = serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  hostname: process.env.HOST ? process.env.HOST : "localhost",
  reusePort: true,
  routes: generateRoutes(),
  development: process.env.NODE_ENV !== "production",
  async fetch(request, server) {
    const url = new URL(request.url);

    if (url.pathname === "/ws" && request.headers.get("upgrade") === "websocket") {
      const cookie = request.headers.get("cookie") || "";
      const cookies = Object.fromEntries(cookie.split("; ").map((s) => s.split("=")));
      const sessionId = cookies[SESSION_COOKIE_NAME];

      server.upgrade(request, {
        data: { sessionId },
      });

      return undefined;
    }
    return handleRequest(request);
  },
  websocket: setupWebSocket(),
});

console.log(`🚀 Server running at http://${server.hostname}:${server.port}`);
