import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { staticRoutes } from "../config/ssg.config";
import { loadRenderer } from "../src/server/plugin/vite-ssr";

process.env.NODE_ENV = "production";

const outDir = resolve(process.cwd(), "dist/static");
// Old pages would be served instead of rendering; start clean.
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

// Pages call the API (PUBLIC_API_URL) while rendering, so the server must be up.
// Importing it starts listening in this process.
await import("../src/server/index");

const renderer = await loadRenderer({ dev: false });

// Env stays a slot (<!--ssr-env-->): the server fills it at request time.
await Promise.all(
  staticRoutes.map(async (route) => {
    const filePath = resolve(outDir, `.${route === "/" ? "/index" : route}.html`);
    const page = await renderer.render(route, new Headers());
    if (page.status !== 200) throw new Error(`${route}: status ${page.status}, not prerendered`);
    await Bun.write(filePath, page.html);
    console.log(`✅ Generated ${filePath}`);
  }),
);

process.exit(0);
