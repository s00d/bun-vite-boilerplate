// src/server/db/init.ts
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../models/schema";

export let db: ReturnType<typeof drizzle>;

export async function initDb() {
  const sqlite = new Database(process.env.DB_FILE_NAME ?? "data/mydb.sqlite");
  db = drizzle(sqlite, { schema });
  console.log("📦 Database initialized");
}
