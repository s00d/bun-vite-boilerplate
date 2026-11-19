import "dotenv/config";
import { createApp } from "./app";

try {
  const app = await createApp();
  app.listen({
    port: Number(process.env.PORT ?? 3000),
    hostname: process.env.HOST ?? "localhost",
    // scripts/cluster.ts: several processes share the port, the kernel balances (Linux).
    reusePort: process.env.REUSE_PORT === "1",
  });
  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}
