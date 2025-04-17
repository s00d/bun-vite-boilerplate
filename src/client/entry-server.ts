// src/client/entry-server.ts
import { setGlobalCookie } from "@/shared/globalCookieJar";
import { renderToString } from "@vue/server-renderer";
import { createApp } from "./main";
import { renderPreloadLinks } from "./preload";
import { useUserStore } from "./store/user";
import {type HeadTag} from "@unhead/schema";

function renderHeadTags(tags: HeadTag[]): string {
  return tags
    .map(({ tag, props, textContent }) => {
      const attrs = Object.entries(props || {})
        .map(([key, value]) => `${key}="${String(value).replace(/"/g, '&quot;')}"`)
        .join(" ");
      const openTag = `<${tag}${attrs ? " " + attrs : ""}>`;
      const closeTag = tag === "meta" || tag === "link" ? "" : `</${tag}>`;
      return textContent
        ? `${openTag}${textContent}${closeTag}`
        : `${openTag}${closeTag}`;
    })
    .join("\n");
}

export async function render(url: string, headers: Headers, manifest: Record<string, string[]>) {
  const { app, router, pinia, head } = createApp();

  setGlobalCookie(headers.get("cookie"));

  await router.push(url);
  await router.isReady();

  const store = useUserStore(pinia);
  await store.get();

  const ctx: { modules?: Set<string> } = {};
  const html = await renderToString(app, ctx);
  const rawTags = await head.headTags();
  const headTags = renderHeadTags(rawTags);
  const state = JSON.stringify(pinia.state.value);
  const preloadLinks = renderPreloadLinks(ctx.modules || new Set(), manifest);

  // 🔽 собираем только PUBLIC_ переменные
  const env: Record<string, string> = {};
  for (const key in process.env) {
    if (key.startsWith("PUBLIC_")) {
      if (process.env[key] !== undefined) {
        env[key] = process.env[key];
      }
    }
  }

  return { html, state, preloadLinks, env, headTags };
}
