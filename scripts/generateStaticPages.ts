import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { generateCsrfToken } from "@/server/middleware/csrf";
import { staticRoutes } from "../config/ssg.config";
import manifest from "../dist/server/.vite/ssr-manifest.json" assert { type: "json" };
import { SECURITY_CONFIG } from "../config/security.config";
// @ts-expect-error no types from Vite SSR build
import { render } from "../dist/server/entry-server.js";

const outDir = resolve(process.cwd(), "dist/static");
const template = await Bun.file("dist/client/index.html").text();

function startServer(): { process: Bun.Subprocess; ready: Promise<void> } {
  const proc = Bun.spawn(["bun", "start"], {
    stdout: "pipe",
    stderr: "inherit",
  });

  const ready = (async () => {
    if (!proc.stdout) return;

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const output = decoder.decode(value);
      process.stdout.write(output); // опционально: дублируем в консоль

      if (output.includes("Elysia is running at")) {
        break;
      }
    }
  })();

  return { process: proc, ready };
}

async function generate() {
  const { process: serverProcess, ready } = startServer();
  await ready;

  console.log("🔄 Bun server ready. Starting static generation...");

  for (const route of staticRoutes) {
    const headers = new Headers({
      cookie: `${SECURITY_CONFIG.csrfHeaderName}=${generateCsrfToken()}`,
    });

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

  console.log("⏹️ Killing Bun server...");
  serverProcess.kill();
}

await generate();
