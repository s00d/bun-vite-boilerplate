import { sql } from "drizzle-orm";
// src/server/models/session.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // UUID или сессионный токен
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
