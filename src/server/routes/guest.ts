// src/server/routes/guest.ts
import { loginController, registerController } from "../controllers/auth";

// Тип для контроллеров по HTTP-методу
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RouteMap = Record<string, Partial<Record<Method, (req: Request) => Promise<Response>>>>;

const routes: RouteMap = {
  "/api/guest/register": {
    POST: registerController,
    GET: registerController,
  },
  "/api/guest/login": {
    POST: loginController,
  },
};

export async function guestRoutes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method as Method;
  const path = url.pathname;

  const methodHandlers = routes[path];
  const handler = methodHandlers?.[method];

  if (handler) {
    return handler(request);
  }

  return new Response("Not Found", { status: 404 });
}
