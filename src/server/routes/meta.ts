// src/server/routes/meta.ts
import { Elysia } from "elysia";
import { healthController, infoController } from "@/server/controllers/meta";
import { cors } from '@elysiajs/cors'

export const metaRoutes = new Elysia({ prefix: "/meta" })
  .get("/health", healthController)
  .get("/info", infoController)
  .use(cors({
    origin: true, // или указать RegExp, строку, массив и т.д.
    credentials: true // если нужно передавать куки
  }));
