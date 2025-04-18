// src/server/controllers/meta.ts
const startedAt = new Date();

export async function healthController(): Promise<Response> {
  return Response.json({ status: "ok" });
}

export async function infoController(): Promise<Response> {
  return Response.json({
    status: "ok",
    startedAt: startedAt.toISOString(),
    nodeVersion: process.version,
    bunVersion: Bun.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    cluster: process.env.WORKER_ID,
  });
}
