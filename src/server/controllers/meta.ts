import type { Context, RouteSchema } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { TFunction } from "i18next";
import { db } from "@/server/db/init";

const startedAt = new Date();

export type AppContext<T extends Partial<RouteSchema> = {}> = Context<T> & {
  log: Logger;
  db: typeof db;
  t: TFunction;
};

export function healthController({ t }: AppContext) {
  return { status: "ok", message: t("meta:health") };
}

export function infoController({ t }: AppContext) {
  return {
    status: "ok",
    message: t("meta:info"),
    startedAt: startedAt.toISOString(),
    nodeVersion: process.version,
    bunVersion: Bun.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptimeSeconds: process.uptime(),
    cluster: process.env.WORKER_ID,
  };
}
