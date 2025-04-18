// src/server/routes/protected.ts
import { logoutController, profileController } from "../controllers/auth";
import type { User } from "../models/user";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ProtectedRouteHandler = (req: Bun.BunRequest, ctx: { user: User }) => Promise<Response>;
export type ProtectedRouteMap = Record<string, Partial<Record<Method, ProtectedRouteHandler>>>;

export const protectedRoute: ProtectedRouteMap = {
  "/api/profile": {
    GET: profileController,
  },
  "/api/logout": {
    POST: logoutController,
  },
};
