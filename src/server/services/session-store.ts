import { db } from "@/server/db/init";
import { sessions } from "@/server/models/session";
import { users, type User } from "@/server/models/user";
import { and, eq, gt } from "drizzle-orm";
import { LRUCache } from "lru-cache";
import Redis from "ioredis";
import { randomUUIDv7 } from "bun";

export type SessionData = {
  id: string;
  userId: number | null;
  csrfToken: string | null;
  createdAt: Date;
  expiresAt: Date;
};

type SessionStorageType = "memory" | "redis" | "db";

export class SessionStore {
  private readonly storage: SessionStorageType;
  private readonly memory: LRUCache<string, SessionData>;
  private readonly redis: Redis;
  private readonly ttl: number;

  constructor(storage: SessionStorageType = "db") {
    this.storage = storage;

    const SESSION_TTL_HOURS = Number.parseInt(process.env.SESSION_TTL_HOURS ?? "1", 10);
    this.ttl = SESSION_TTL_HOURS * 60 * 60 * 1000;


    this.memory = new LRUCache({
      max: Number.parseInt(process.env.SESSION_MEMORY_COUNT ?? '10000'),
      ttl: this.ttl,
    });

    this.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const now = new Date();

    if (this.storage === "redis") {
      const json = await this.redis.get(`session:${sessionId}`);
      if (!json) return null;

      const data = JSON.parse(json) as Omit<SessionData, "createdAt" | "expiresAt"> & {
        createdAt: string;
        expiresAt: string;
      };

      const expiresAt = new Date(data.expiresAt);
      if (expiresAt <= now) {
        await this.redis.del(`session:${sessionId}`);
        return null;
      }

      return {
        ...data,
        createdAt: new Date(data.createdAt),
        expiresAt,
      };
    }

    if (this.storage === "db") {
      const row = db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
        .get();

      return row
        ? {
          id: row.id,
          userId: row.userId ?? null,
          csrfToken: row.csrfToken ?? null,
          createdAt: new Date(row.createdAt),
          expiresAt: new Date(row.expiresAt),
        }
        : null;
    }

    const data = this.memory.get(sessionId);
    return data && data.expiresAt > now ? data : null;
  }

  async set(session: SessionData): Promise<void> {
    if (this.storage === "memory") {
      this.memory.set(session.id, session);
    } else if (this.storage === "redis") {
      await this.redis.setex(
        `session:${session.id}`,
        this.ttl / 1000,
        JSON.stringify({
          ...session,
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
        })
      );
    } else if (this.storage === "db") {
      await db.insert(sessions).values(session);
    }
  }

  async delete(sessionId: string): Promise<void> {
    switch (this.storage) {
      case "memory":
        this.memory.delete(sessionId);
        break;

      case "redis":
        await this.redis.del(`session:${sessionId}`);
        break;

      case "db":
        await db.delete(sessions).where(eq(sessions.id, sessionId));
        break;
    }
  }

  createNew(): SessionData {
    const now = new Date();
    const id = randomUUIDv7();
    const csrfToken = randomUUIDv7();

    return {
      id,
      userId: null,
      csrfToken,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ttl),
    };
  }

  async getUser(userId: number): Promise<User | null> {
    return db.select().from(users).where(eq(users.id, userId)).get() ?? null;
  }
}
