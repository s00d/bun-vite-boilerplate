import { build } from "vite";

// перед началом генерации
await build({
  configFile: resolve(process.cwd(), "vite.config.prod.ts"),
});

// scripts/generateStatic.ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateCsrfToken } from "@/server/middleware/csrf";
import { staticRoutes } from "../config/ssg.config";
import manifest from "../dist/server/.vite/ssr-manifest.json" assert { type: "json" };
// scripts/generateStatic.ts
// @ts-expect-error no types from Vite SSR build
import { render } from "../dist/server/entry-server.js";
import {SECURITY_CONFIG} from "../config/security.config"; // SSR-рендерер

const outDir = resolve(process.cwd(), "dist/static");
const template = await Bun.file("dist/client/index.html").text();

async function generate() {
  for (const route of staticRoutes) {
    const headers = new Headers({ cookie: `${SECURITY_CONFIG.csrfHeaderName}=${generateCsrfToken()}` });
    const { html, state, preloadLinks, env, headTags } = await render(route, headers, manifest);

    const pageHtml = template
      .replace("<!--preload-links-->", preloadLinks)
      .replace("<!--ssr-outlet-->", html)
      .replace("<!--head-tags-->", headTags)
      .replace("<!--pinia-state-->", `window.__pinia = ${state}`)
      .replace("<!--ssr-env-->", `<script>window.__env = ${JSON.stringify(env)}</script>`);

    const filePath = resolve(outDir, `.${route === "/" ? "/index" : route}.html`);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, pageHtml);
    console.log(`✅ Generated ${filePath}`);
  }
}

await generate();
