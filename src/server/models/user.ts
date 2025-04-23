// src/server/models/user.ts
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    apiKey: text("api_key"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    apiKeyIdx: index("users_api_key_idx").on(table.apiKey),
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
