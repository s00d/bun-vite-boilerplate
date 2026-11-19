// src/server/services/session-store.ts
// The one owner of session state. Created once in createApp and handed to the session plugin.
import { randomUUIDv7 } from "bun";
import { and, eq, gt, lt } from "drizzle-orm";
import Redis from "ioredis";
import { LRUCache } from "lru-cache";
import { SECURITY_CONFIG } from "../../../config/security.config";
import { db } from "@/server/db/init";
import { sessions } from "@/server/models/session";
import { type User, users } from "@/server/models/user";

export type SessionData = {
  id: string;
  userId: number | null;
  csrfToken: string | null;
  createdAt: Date;
  expiresAt: Date;
};

export type SessionStorageType = "memory" | "redis" | "db";

/** Milliseconds until `session` expires (every backend expires by `expiresAt`, nothing else). */
const msLeft = (session: SessionData) => Math.max(1, session.expiresAt.getTime() - Date.now());

export class SessionStore {
  private readonly memory: LRUCache<string, SessionData> | null = null;
  private readonly redis: Redis | null = null;

  constructor(readonly storage: SessionStorageType = "db") {
    if (storage === "memory") {
      this.memory = new LRUCache({ max: Number.parseInt(process.env.SESSION_MEMORY_COUNT ?? "10000", 10) });
    } else if (storage === "redis") {
      this.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
    }
  }

  /** A fresh session (not stored yet), guest when `userId` is null. */
  createNew(userId: number | null = null): SessionData {
    const now = new Date();
    return {
      id: randomUUIDv7(),
      userId,
      csrfToken: randomUUIDv7(),
      createdAt: now,
      expiresAt: new Date(now.getTime() + SECURITY_CONFIG.sessionMaxAge * 1000),
    };
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const now = new Date();

    if (this.redis) {
      const json = await this.redis.get(`session:${sessionId}`);
      if (!json) return null;
      const data = JSON.parse(json);
      return { ...data, createdAt: new Date(data.createdAt), expiresAt: new Date(data.expiresAt) };
    }

    if (this.memory) {
      const data = this.memory.get(sessionId);
      return data && data.expiresAt > now ? data : null;
    }

    const row = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
      .get();
    return row ? { ...row, userId: row.userId ?? null, csrfToken: row.csrfToken ?? null } : null;
  }

  async set(session: SessionData): Promise<void> {
    if (this.redis) {
      await this.redis.set(`session:${session.id}`, JSON.stringify(session), "PX", msLeft(session));
    } else if (this.memory) {
      this.memory.set(session.id, session, { ttl: msLeft(session) });
    } else {
      await db.insert(sessions).values(session);
    }
  }

  async delete(sessionId: string): Promise<void> {
    if (this.redis) await this.redis.del(`session:${sessionId}`);
    else if (this.memory) this.memory.delete(sessionId);
    else await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  /** Drops expired rows (db only: memory and redis expire entries themselves). */
  async purgeExpired(): Promise<void> {
    if (this.storage === "db") await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  async getUser(userId: number): Promise<User | null> {
    return db.select().from(users).where(eq(users.id, userId)).get() ?? null;
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    return db.select().from(users).where(eq(users.apiKey, apiKey)).get() ?? null;
  }

  close() {
    this.redis?.disconnect();
  }
}
