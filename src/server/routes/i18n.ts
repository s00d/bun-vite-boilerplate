// src/server/routes/i18n.ts
import { Elysia, t } from "elysia";
import { I18N_CONFIG, LOCALE_CODES } from "../../../config/i18n.config";
import { pageTranslations } from "@/server/translations";

/** Dictionaries for a client-side navigation: root + route, for the locale and its fallback. */
export const i18nRoutes = new Elysia({ prefix: "/api/i18n", tags: ["i18n"] }).get(
  "/",
  async ({ query, status }) => {
    const locale = query.locale ?? I18N_CONFIG.defaultLocale;
    if (!LOCALE_CODES.includes(locale)) return status(404, "Locale not supported");
    return pageTranslations(locale, query.route ?? "index");
  },
  {
    query: t.Object({
      locale: t.Optional(t.String()),
      route: t.Optional(t.String({ maxLength: 200 })),
    }),
  },
);
