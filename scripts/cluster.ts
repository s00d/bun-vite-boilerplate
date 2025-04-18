// scripts/cluster.ts
import "dotenv/config";
import { cpus } from "node:os";
import { join } from "node:path";
import * as process from "node:process";

const numCPUs = cpus().length;
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const workers: Bun.Subprocess[] = [];

for (let i = 0; i < numCPUs; i++) {
  const proc = Bun.spawn({
    cmd: ["bun", "src/server/index.ts"],
    cwd: join(process.cwd()),
    env: Object.fromEntries(
      Object.entries({
        ...process.env,
        PORT: port, // один и тот же порт
        WORKER_ID: i,
        BASE_URL: `http://localhost:${port}`,
        MODE: "production",
        DEV: false,
        PROD: true,
        SSR: true,
      }).map(([k, v]) => [k, String(v)]),
    ),
    stdout: "inherit",
    stderr: "inherit",
    onExit(_, code) {
      console.log(`❌ Worker ${i} exited with code ${code}`);
    },
  });

  workers.push(proc);
  console.log(`🚀 Worker ${i + 1}/${numCPUs} started on port ${port}`);
}

function shutdown() {
  for (const worker of workers) {
    worker.kill();
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);
