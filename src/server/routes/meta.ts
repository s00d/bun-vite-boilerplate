// src/server/routes/guest.ts
import { healthController, infoController } from "@/server/controllers/meta";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RouteMap = Record<string, Partial<Record<Method, (req: Request) => Promise<Response>>>>;

export const metaRoute: RouteMap = {
  "/meta/health": {
    GET: healthController,
  },
  "/meta/info": {
    GET: infoController,
  },
};
