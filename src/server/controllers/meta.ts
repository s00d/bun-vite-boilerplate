// src/server/controllers/meta.ts
import type { AppContext } from "@/server/context";

const startedAt = new Date();

export function healthController({ t }: Pick<AppContext, "t">) {
  return { status: "ok", message: t("meta.health") };
}

/** Process details: dev only (see routes/meta.ts). */
export function infoController({ t }: Pick<AppContext, "t">) {
  return {
    status: "ok",
    message: t("meta.info"),
    startedAt: startedAt.toISOString(),
    bunVersion: Bun.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    worker: process.env.WORKER_ID,
  };
}
