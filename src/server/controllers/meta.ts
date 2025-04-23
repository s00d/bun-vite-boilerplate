import type {Context as ElysiaContext, Context, RouteSchema} from "elysia";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { TFunction } from "i18next";
import type { db } from "@/server/db/init";
import type { CountryResponse } from "mmdb-lib";
import type {User} from "@/server/models/user";
import type {SessionData, SessionStore} from "@/server/services/session-store";
import type {Cookie, ElysiaCookie} from "elysia/cookies";
import type {Server} from "elysia/universal";
import type {StatusMap} from "elysia/utils";
import type {HTTPHeaders} from "elysia/types";

const startedAt = new Date();

export type AppContext = ElysiaContext & {
  user: User;
  log: Logger;
  db: typeof db;
  t: TFunction;
  session: SessionData;
  geo: CountryResponse | null;
  sessionStore: SessionStore;
  cookie: Record<string, Cookie<string | undefined>>;
  sessionId: string;
  csrfToken: string | null;
  validateCsrf: () => boolean;
  getCsrfToken: () => string;
  server: Server | null;
  set: {
    status?: number | keyof StatusMap;
    headers: HTTPHeaders;
    redirect?: string;
    cookie?: Record<string, ElysiaCookie>;
  };
};

export function healthController({ t }: AppContext) {
  return {
    status: "ok",
    message: t("meta:health")
  };
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
