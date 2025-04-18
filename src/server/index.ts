import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { guestRoutes } from "./routes/guest";
import { metaRoutes } from "./routes/meta";
import { protectedRoutes } from "./routes/protected";
import { wsRoutes } from "./routes/ws";
import { ssr } from "./routes/ssr";
import {initDb} from "@/server/db/init";

try {
  await initDb();
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}

const port = process.env.PORT ? Number(process.env.PORT) : 3000
const hostname = process.env.HOST ? process.env.HOST : "localhost"

const app = new Elysia()
  .use(staticPlugin({ prefix: "/" }))
  .use(cookie())
  .use(swagger({
    documentation: {
      info: {
        title: 'bun-vite-boilerplate',
        version: '1.0.0'
      }
    }
  }))
  .use(guestRoutes)
  .use(metaRoutes)
  .use(protectedRoutes)
  .use(wsRoutes)
  .use(ssr)
  .onError(({ code, error }) => {
    if (code === "NOT_FOUND") return "Page not found";
    console.error(error);
  })
  .listen({ port, hostname });;

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
