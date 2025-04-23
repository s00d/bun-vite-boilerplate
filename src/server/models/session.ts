// src/server/models/session.ts
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // UUID или сессионный токен
    userId: integer("user_id"), // nullable для гостя
    csrfToken: text("csrf_token"), // nullable
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export type Session = typeof sessions.$inferSelect;
