// scripts/cluster.ts — one server process per CPU on the same port.
// The workers share it with SO_REUSEPORT and the kernel balances connections (Linux only:
// macOS accepts the flag but sends everything to one process). WebSockets work as usual.
// Sessions must live outside the process (SESSION_STORAGE=db or redis), or a user would
// lose their session when the next request lands on another worker.
import "dotenv/config";
import { availableParallelism } from "node:os";

if ((process.env.SESSION_STORAGE ?? "db") === "memory") {
  console.error("❌ SESSION_STORAGE=memory can't be shared between workers: use db or redis.");
  process.exit(1);
}

const count = Number(process.env.WORKERS ?? availableParallelism());
const workers = Array.from({ length: count }, (_, i) =>
  Bun.spawn(["bun", "src/server/index.ts"], {
    env: { ...process.env, NODE_ENV: "production", REUSE_PORT: "1", WORKER_ID: String(i) },
    stdout: "inherit",
    stderr: "inherit",
    onExit: (_proc, code) => console.log(`❌ Worker ${i} exited with code ${code}`),
  }),
);
console.log(`🚀 ${count} workers on port ${process.env.PORT ?? 3000}`);

function shutdown() {
  for (const w of workers) w.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
