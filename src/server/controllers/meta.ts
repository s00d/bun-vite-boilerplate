import type { Context, RouteSchema } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { TFunction } from "i18next";
import type { db } from "@/server/db/init";
import type { CountryResponse } from "mmdb-lib";

const startedAt = new Date();

export type AppContext<T extends Partial<RouteSchema> = Partial<RouteSchema>> = Context<T> & {
  log: Logger;
  db: typeof db;
  t: TFunction;
  geo: CountryResponse | null;
};

export function healthController({ t }: AppContext) {
  return { status: "ok", message: t("meta:health") };
}

export function infoController({ t, geo }: AppContext) {
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
    geo: geo,
  };
}
