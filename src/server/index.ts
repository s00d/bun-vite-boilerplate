import "dotenv/config";

import { readdirSync, watch } from "node:fs";
import { join, sep } from "node:path";
import { type BunFile, serve } from "bun";
import { initDb } from "./db/init";
import { handleRequest } from "./routes/router";
import { setupWebSocket } from "./ws/server";

const PUBLIC_DIR = join(process.cwd(), "./public");

// Кеш всех статичных файлов: /favicon.ico → BunFile
const staticFiles = new Map<string, BunFile>();

function walkStaticFiles(dir: string, base = "") {
  staticFiles.clear();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relativePath = join(base, entry.name);

    if (entry.isDirectory()) {
      walkStaticFiles(fullPath, relativePath);
    } else {
      const pathKey = `/${relativePath.split(sep).join("/")}`;
      staticFiles.set(pathKey, Bun.file(fullPath));
    }
  }
}

watch(PUBLIC_DIR, { recursive: true }, () => {
  console.log("♻️ Static files changed, reloading cache");
  walkStaticFiles(PUBLIC_DIR); // твоя функция
});

try {
  walkStaticFiles(PUBLIC_DIR);
  await initDb();
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}

const server = serve({
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  hostname: process.env.HOST ? process.env.HOST : "localhost",
  async fetch(request, server) {
    const url = new URL(request.url);

    // Быстрая проверка и отдача статики
    const file = staticFiles.get(url.pathname);
    if (file) {
      return new Response(file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
    }

    if (url.pathname === "/ws" && request.headers.get("upgrade") === "websocket") {
      const cookie = request.headers.get("cookie") || "";
      const cookies = Object.fromEntries(cookie.split("; ").map((s) => s.split("=")));
      const sessionId = cookies.sessionId;

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
