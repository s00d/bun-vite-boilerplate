# 🍞 Bun + Vue 3 + Drizzle + Elysia Fullstack Template

A full-featured TypeScript boilerplate using **Bun**, **Vue 3** (SSR + SPA), **Drizzle ORM**, **ElysiaJS**, and a built-in **WebSocket server**. Designed without Express or Node.js, this project utilizes **Bun's native HTTP server**, **Vite**, and **Elysia** for modern high-performance development.

Ideal for building isomorphic applications with authentication, real-time features, SSR/SSG, and scalable backend architecture.

---

## 🚀 Features

- ✅ Bun-native backend using **Elysia.js**
- ✅ Fullstack TypeScript (Bun + Vue 3)
- ✅ SSR + SPA hybrid with Vite
- ✅ Static Generation (SSG) support
- ✅ Pinia + SSR hydration
- ✅ Drizzle ORM (SQLite, MySQL, PostgreSQL)
- ✅ Session + API key authentication
- ✅ Native WebSocket server (with Elysia)
- ✅ Clean architecture: MVC + Router + Middleware
- ✅ Unified configuration and composables
- ✅ CSRF protection, CORS, CSP
- ✅ **i18n with dynamic translation loading**
  - 🌐 Auto-detect locale from route
  - 📦 Load only necessary translation namespace per page
  - 🧠 SSR/SSG compatible
  - 🧩 Backend integration via `i18next-fs-backend` and Elysia route

---

## 📁 Project Structure

```
data/                         # SQLite DB file (default: mydb.sqlite)
dist/                         # Production build (client + server bundles)
scripts/                      # Generation, build, and utility scripts
tests/                        # bun test: API, auth, WebSocket, SSR (server starts itself)
public/                       # Static public assets (e.g., logo, icons)
.env                          # Environment variable definitions
index.html                    # HTML template for SSR rendering
vite.config.ts                # Vite build configuration

config/                       # Configuration layer
├── ssg.config.ts             # Static routes for pre-rendering
├── security.config.ts        # Cookie names, CSRF header, session lifetime
└── i18n.config.ts            # i18n config

src/
├── client/                   # Vue 3 SPA (SSR + hydration)
│   ├── pages/                # File-based routing (SPA/SSR)
│   ├── composables/          # Vue composables
│   ├── store/                # Pinia stores
│   ├── App.vue               # Main layout
│   ├── main.ts               # App factory
│   ├── router.ts             # Vue Router config
│   ├── entry-client.ts       # Client SPA bootstrap
│   ├── entry-server.ts       # SSR rendering entry
│   ├── env.d.ts              # Type declarations
│   └── vite-env.d.ts         # Vite typings
│
├── server/                   # Bun HTTP + WebSocket + Elysia
│   ├── db/                   # Drizzle ORM DB init
│   ├── models/               # Drizzle schemas
│   ├── plugin/               # session (cookies, CSRF, user), vite-ssr (pages)
│   ├── services/             # SessionStore: the one owner of sessions (db/memory/redis)
│   ├── controllers/          # Route handlers (business logic)
│   ├── routes/               # API + WS route modules (take the shared context)
│   ├── context.ts            # log, t, session, user for every route
│   ├── app.ts                # createApp(): the whole server, no listen (tests use it)
│   └── index.ts              # Entrypoint: createApp().listen()
│
├── shared/                   # Cross-layer utils
│   ├── axios.ts              # Axios with SSR support
│   ├── env.ts                # PUBLIC_ environment reader
│   └── globalCookieJar.ts    # Per-request cookie for SSR API calls
```

Create `.env`:

```
PORT=8888
HOST=localhost
DB_FILE_NAME=data/mydb.sqlite
PUBLIC_API_URL=http://localhost:8888
PUBLIC_WS_URL=ws://localhost:8888/ws
```

Start in dev:

```bash
bun run dev
```

Build and serve:

```bash
bun run build
bun run start
```

---

## ⚙️ How It Works

### SSR/SPA Hybrid

- Server renders HTML via `entry-server.ts`
- State is hydrated client-side using `window.__pinia`
- Preload links injected into `<head>` for performance

### Authentication

- Session: `Set-Cookie: sessionId`
- Alternative: `Authorization: Bearer <apiKey>`
- Example routes:
  - `POST /api/guest/login`
  - `POST /api/guest/register`
  - `GET /api/profile`
  - `POST /api/logout`

### Data Fetching

- Via global axios client `@/shared/axios.ts`
- SSR requests auto-include cookies from `globalCookieJar`
- `baseURL` is `PUBLIC_API_URL`

### WebSocket

- Connect via `ws://localhost:8888/ws`
- Use `useWebSocket()` composable on the client
- Broadcast server messages with `broadcast()`

---

## ✍️ Adding...

### A Page

Create a `.vue` file in `src/client/pages/` and register it in `router.ts`:

```ts
{ path: '/dashboard', component: () => import('./pages/Dashboard.vue') }
```

### A Model

Add it to `src/server/models`, then export from `schema.ts`:

```ts
export const posts = sqliteTable('posts', { ... });
```

### A Controller

Create a handler in `controllers/`:

```ts
export async function dashboardController({ body, request, set }: Context<{ body: PostBody }>) {
  return { ok: true };
}
```

### An API Route

Add to `routes/guest.ts` or `routes/protected.ts`:

```ts
routes["/api/dashboard"] = { GET: dashboardController };
export const protectedRoutes = new Elysia({ prefix: "/api" })
  //...
  .post("/api/dashboard", dashboardController);
```

### A Generator Script

Use CLI to scaffold code:

```bash
bun run scripts/gen.ts controller MyController
bun run scripts/gen.ts route MyRoute guest
bun run scripts/gen.ts route MyRoute protected
bun run scripts/gen.ts model MyModel
bun run scripts/gen.ts middleware MyMiddleware
```

---

## 📦 Scripts

```bash
bun run dev       # One process: Elysia + Vite in-process, real SSR with HMR
bun run build     # Build client and SSR bundles
bun run generate  # Prerender config/ssg.config.ts routes into dist/static
bun run start     # Start production server
bun run test      # bun test: starts the server itself on a free port, in-memory DB
bun run lint      # oxlint + oxlint-vue-rs (template rules)
bun run format    # oxfmt
```

SSR is one Elysia plugin, `src/server/plugin/vite-ssr.ts` (`viteSSR()`): in dev it runs Vite inside the
Bun process and renders through `vite.ssrLoadModule`; in prod it serves `dist/client/assets`, prerendered
`dist/static` pages and SSR from `dist/server`. `PUBLIC_*` env is injected when a page is served.

---

## 🧠 State Management

- Pinia (`useUserStore`, etc.)
- Auto-hydration in `entry-client.ts`
- Server sets `window.__pinia` on render

---

## 🩱 Database

- Powered by Drizzle ORM
- SQLite by default (`.env: DB_FILE_NAME`)
- Tables:
  - `users`: email, passwordHash, apiKey
  - `sessions`: id, userId, expiresAt

---

## 🗼 Clean Architecture

- `controllers/`: business logic
- `plugin/`: cross-cutting Elysia plugins (session, SSR)
- `routes/`: route mapping
- `models/`: Drizzle schema
- `shared/`: universal utils (axios, env, cookies)

---

---

## 🔐 CSRF Protection

The template includes built-in CSRF protection:

- Every session has a CSRF token; it is sent in the `csrf` cookie (readable by the page) and rotated on login and register.
- The client attaches it as the `x-csrf-token` header on `POST`, `PUT`, `PATCH` and `DELETE` (`src/shared/axios.ts`).
- Handlers call `validateCsrf()` (from `src/server/plugin/session.ts`): register, login, logout and flash require it.
- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure` in production. Login/register are rate-limited per IP (`AUTH_RATE_LIMIT`).

This helps prevent cross-site request forgery attacks in authenticated requests.

---

### 🗄️ Database Support

This template uses **Drizzle ORM**, which supports multiple SQL dialects including:

- **SQLite** (default, easy to start with)
- **MySQL**
- **PostgreSQL**
- **MariaDB**

To switch databases:

1. **Update `.env`:**

```env
# For MySQL:
DB_URL=mysql://user:pass@host:port/dbname
```

2. **Change the Drizzle adapter in `src/server/db/init.ts`:**

Replace:

```ts
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
```

With (example for MySQL):

```ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
```

And update `initDb()`:

```ts
const connection = await mysql.createConnection(process.env.DB_URL!);
db = drizzle(connection, { schema });
```

3. **Adapt models in `src/server/models/`** using the corresponding dialect’s schema utilities:

- `drizzle-orm/sqlite-core` → `drizzle-orm/mysql-core` or `pg-core`

4. **Install required dependencies**:

```bash
bun add mysql2 drizzle-orm
```

Once this is done, the rest of the application logic remains the same — only the schema and adapter change depending on your database engine.

---

## 🏷️ Meta Tags (SEO + Social)

This template supports dynamic `<title>`, `<meta name="description">`, and Open Graph tags both on the **server** (SSR) and **client** using [`@vueuse/head`](https://github.com/vueuse/head).

### 🔧 How to Add Meta Tags to a Page

Import and call `useHead()` inside your `<script setup>` block:

```vue
<!-- src/client/pages/HomePage.vue -->
<script setup lang="ts">
import { useHead } from "@vueuse/head";

useHead({
  title: "Home Page - My App",
  meta: [
    {
      name: "description",
      content: "Welcome to the home page of our app.",
    },
    {
      property: "og:title",
      content: "My App Home",
    },
  ],
});
</script>
```

### ✅ Works with SSR

During server-side rendering, the generated tags are serialized and injected into the `<head>` of the HTML response. This ensures search engines and social media platforms can read correct metadata on first load.

No extra configuration is needed — SSR automatically includes the result of `useHead()` in the response.

---

## 🌐 Internationalization (i18n)

Localization is powered by `vue-i18n`, integrated with **SSR + SPA** support and **automatic translation loading based on the current route**.

---

### 📌 Overview

- Translations are organized by **locale** and **namespace**, e.g.  
  `lang/en/home.json`, `lang/ru/profile.json`
- The namespace is automatically derived from the route:
  - `/en/profile` → namespace: `profile`
  - `/auth/login` → namespace: `auth`
  - `/` → namespace: `home` (default)

🔁 **On the client, translations are automatically loaded based on the current page name**. You don't need to manually specify a namespace — it's inferred from the URL.

---

### 🧠 Usage in Components

```ts
import { useI18n } from "vue-i18n";
const { t } = useI18n();

t("home.title"); // => "Home" (en), "Главная" (ru)
```

---

### 📦 Key Format

- All translation keys use the format `namespace.key`
- Translations are fetched dynamically based on the current route

---

### 🌍 Switching Locale

The `<LocaleSwitcher />` component changes the current language via redirect:

```vue
<LocaleSwitcher />
```

- The **default locale** (`en`) has no prefix
- Other locales use a prefixed path (`/ru/...`)

---

### ⚙️ Adding Translations

#### ➕ Adding a New Namespace

When creating a new translation file (e.g. `lang/en/dashboard.json`, `lang/ru/dashboard.json`):

> Make sure to add the new **namespace** in `config/i18n.config.ts`:

```ts
namespaces: ["common", "auth", "profile", "meta", "home", "dashboard"],
```

#### ➕ Adding a New Locale

When adding a new locale (e.g. `de`):

> Update the i18n config to include it:

```ts
preload: ["en", "ru", "de"],
supportedLngs: ["en", "ru", "de"],
```

Ensure the corresponding translation files exist:

```
lang/de/home.json
lang/de/common.json
...
```

---

### 🖥️ Using i18n on the Backend

To use a translation inside a backend controller or handler, use the `t()` function provided in the context. You must reference translations using the `namespace:key` format.

#### ✅ Example

```ts
export function healthController({ t }: { t: TFunction }) {
  return {
    message: t("meta:health"),
  };
}
```

> This will return a translated string from `lang/{locale}/meta.json` under the key `"health"`.

---

Let me know if you'd like to add an example of pluralization or interpolation too.

### ✅ Summary

- Use `t("namespace.key")` for all translation calls
- **Namespace is resolved automatically from the route**
- Translations are loaded dynamically as needed
- Update `config/i18n.config.ts` when adding new locales or namespaces

---

---

# Load Testing Results

## 📊 Latency Overview

This section summarizes the performance of critical endpoints under load.

# 📊 Load Testing Results

This document presents performance metrics and session analysis based on synthetic load testing using `artillery` and `bun`.

---

## 🔐 Login API (`/api/guest/login`)

- **Connections:** 50
- **Test Duration:** 10 seconds
- **Total Requests:** 191
- **2xx Responses:** 141
- **Average Latency:** 2910 ms
- **p99 Latency:** 4249 ms
- **Max Latency:** 6944 ms
- **Throughput:** 3.27 kB/s

### 📈 Latency Distribution

| Percentile | Latency (ms) |
| ---------- | ------------ |
| 2.5%       | 291          |
| 50%        | 3462         |
| 97.5%      | 4179         |
| 99%        | 4249         |

### 🕒 Session Length (ms)

| Metric | Value  |
| ------ | ------ |
| Min    | 96.7   |
| Max    | 5487.8 |
| Mean   | 2714.2 |
| Median | 2780   |
| p95    | 4770.6 |
| p99    | 5378.9 |

---

## 🏠 Homepage (`/`)

- **Load Profile:** 50 → 500 RPS (ramp-up over 30 seconds)
- **Test Duration:** 30 seconds
- **Total Requests:** 8250
- **2xx Responses:** 4501
- **Timeout Errors (ETIMEDOUT):** 3749
- **Average Latency:** 1 ms
- **p99 Latency:** 4 ms
- **Max Latency:** 7 ms
- **Throughput:** ~7.5 MB in 30s

### 📈 Latency Distribution

| Percentile | Latency (ms) |
| ---------- | ------------ |
| 2.5%       | 1            |
| 50%        | 1            |
| 97.5%      | 2            |
| 99%        | 4            |

### 🕒 Session Length (ms)

| Metric | Value |
| ------ | ----- |
| Min    | 1.3   |
| Max    | 219.1 |
| Mean   | 5.7   |
| Median | 2.3   |
| p95    | 5.4   |
| p99    | 127.8 |

---

## 🎯 RPC / Profile Load (CSRF → Login → Profile)

- **Connections:** 50
- **Total Requests:** 600
- **2xx Responses:** 600
- **Average Latency:** 903 ms
- **p99 Latency:** 3605 ms

### 🕒 Session Length (ms)

| Metric | Value  |
| ------ | ------ |
| Min    | 96.7   |
| Max    | 5487.8 |
| Mean   | 2714.2 |
| Median | 2780   |
| p95    | 4770.6 |
| p99    | 5378.9 |

---

## 📦 Notes

- All tests were performed on `http://localhost:8888`.
- Bun server memory usage peaked at **327 MB**, with negligible CPU load.

---

## 🧮 Session Duration Stats

Extracted from `artillery` and custom loadtest logs:

| Metric          | Value (seconds) |
| --------------- | --------------- |
| Average         | 2714.2          |
| Median          | 2780            |
| 95th Percentile | 4770.6          |
| 99th Percentile | 5378.9          |
| Max             | 5487.8          |

> Most user sessions range between 2.5–5 minutes. A few sessions exceed 20 minutes, indicating background usage or idle tabs.

---

## 🚀 Performance Without Frontend or WebSocket

To isolate backend performance, we executed a high-load benchmark targeting the `/meta/info` endpoint without involving frontend rendering, WebSocket communication, or additional system load (e.g., SSR or SQLite queries).

### 📌 Test Configuration:

- **Command:** `bun run scripts/metatest.ts`
- **Connections:** 1000
- **Duration:** 10 seconds
- **Workers:** 1

### 📈 Results:

- **Average Latency:** `72.28 ms`
- **p99 Latency:** `142 ms`
- **Max Latency:** `269 ms`
- **Avg Throughput:** `~49,686 req/sec`, `~19.3 MB/s`
- **Total Processed:** `~501,000 requests in 10 seconds`

---

## ✅ Conclusion

Given the SQLite backend and SSR integration, the Bun server delivers:

- **High performance** for static and API requests.
- **Consistent latency** within a few hundred milliseconds for chained operations (e.g., CSRF → Login → Profile).
- **Excellent RPS handling** in raw conditions without frontend or I/O overhead.

These results confirm that the backend powered by **Bun is highly capable under load**, especially when isolated from rendering or database operations.

---

## 🏗️ Static Generation (SSG)

This template supports static pre-rendering (SSG) for selected routes.

### ⚙️ Setup

1. **Define routes** to generate in `ssg.config.ts`:

   ```ts
   export const staticRoutes = ["/", "/about", "/auth/login"];
   ```

2. **Run the generation** script:

   ```bash
   bun run generate
   ```

   This will:

- Build the project using `vite.config.ts`
- Render all configured routes to HTML
- Save files to `dist/static`

4. **Serve the app**:
   ```bash
   bun run start
   ```

---

### 🚦 How it works

- When a user requests a page:
  - If a pre-rendered HTML file exists in `dist/static`, it is served instantly.
  - Otherwise, the page is rendered via SSR on demand.
- This ensures fast load for common pages, while keeping SSR flexibility.

---

### 💡 Notes

- You can mix SSG and SSR freely.
- Useful for marketing, landing, auth, and public pages.
- Static files are generated once and served without re-computation.

_Last updated: April 18, 2025_

---

## 🦊 Powered By

- **[Bun](https://bun.sh/)** — fast all-in-one JS runtime
- **[Vue 3](https://vuejs.org/)** — reactive UI framework
- **[Elysia.js](https://elysiajs.com/)** — ultra-fast server framework
- **[Drizzle ORM](https://orm.drizzle.team/)** — typesafe SQL
- **[Pinia](https://pinia.vuejs.org/)** — Vue store with SSR support
- **[Vite](https://vitejs.dev/)** — dev/build tool

---

## 📜 License

MIT © s00d

---

Pull requests and contributions welcome.
