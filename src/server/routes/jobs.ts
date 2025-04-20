// src/server/routes/guest.ts
import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";

export const jobs = new Elysia().use(
  cron({
    name: "heartbeat",
    pattern: "*/10 * * * * *",
    run() {
      console.log("Heartbeat");
    },
  }),
);
