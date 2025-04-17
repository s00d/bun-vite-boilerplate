// src/server/routes/protected.ts
import { logoutController, profileController } from "../controllers/auth";
import type { User } from "../models/user";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ProtectedRouteHandler = (req: Request, ctx: { user: User }) => Promise<Response>;
export type ProtectedRouteMap = Record<string, Partial<Record<Method, ProtectedRouteHandler>>>;

const routes: ProtectedRouteMap = {
  "/api/profile": {
    GET: profileController,
  },
  "/api/logout": {
    POST: logoutController,
  },
};

export async function protectedRoutes(request: Request, context: { user: User }): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method as Method;
  const path = url.pathname;

  const methodHandlers = routes[path];
  const handler = methodHandlers?.[method];

  if (handler) {
    return handler(request, context);
  }

  return new Response("Not Found", { status: 404 });
}
