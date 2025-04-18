// src/server/controllers/meta.ts
const startedAt = new Date();

export function healthController() {
  return { status: "ok" };
}

export function infoController() {
  return {
    status: "ok",
    startedAt: startedAt.toISOString(),
    nodeVersion: process.version,
    bunVersion: Bun.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    cluster: process.env.WORKER_ID,
  };
}
