// src/server/routes/guest.ts
import { loginController, registerController } from "../controllers/auth";

// Тип для контроллеров по HTTP-методу
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RouteMap = Record<string, Partial<Record<Method, (req: Bun.BunRequest) => Promise<Response>>>>;

export const guestRoutes: RouteMap = {
  "/api/guest/register": {
    POST: registerController,
    GET: registerController,
  },
  "/api/guest/login": {
    POST: loginController,
  },
};
