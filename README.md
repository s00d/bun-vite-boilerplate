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

---

## 📁 Project Structure

```
data/                         # SQLite DB file (default: mydb.sqlite)
dist/                         # Production build (client + server bundles)
scripts/                      # Generation, build, and utility scripts
tests/                        # Unit, integration, and load tests
public/                       # Static public assets (e.g., logo, icons)
.env                          # Environment variable definitions
index.html                    # HTML template for SSR rendering
vite.config.ts                # Vite build configuration

config/                       # Configuration layer
├── ssg.config.ts             # Static routes for pre-rendering
├── ws.config.ts              # WebSocket ping/pong settings
└── security.config.ts        # CORS, CSP, cookie settings

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
│   ├── entry-static-client.ts# Static client hydration
│   ├── env.d.ts              # Type declarations
│   └── vite-env.d.ts         # Vite typings
│
├── server/                   # Bun HTTP + WebSocket + Elysia
│   ├── db/                   # Drizzle ORM DB init
│   ├── models/               # Drizzle schemas
│   ├── middleware/           # CSRF, auth, validation
│   ├── controllers/          # Route handlers (business logic)
│   ├── routes/               # API + SSR + WS routes
│   ├── utils/                # preload, static walker
│   └── index.ts              # Server entrypoint (Bun + Elysia)
│
├── shared/                   # Cross-layer utils
│   ├── axios.ts              # Axios with SSR support
│   ├── env.ts                # PUBLIC_ environment reader
│   └── globalCookieJar.ts    # Server cookie holder
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
routes['/api/dashboard'] = { GET: dashboardController };
export const protectedRoutes = new Elysia({ prefix: "/api" })
//...
.post("/api/dashboard", dashboardController)
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
bun run dev       # Dev mode with Vite
bun run build     # Build frontend and SSR bundle
bun run generate  # Generate frontend and bundle
bun run start     # Start production server
```

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
- `middleware/`: validation/auth
- `routes/`: route mapping
- `models/`: Drizzle schema
- `shared/`: universal utils (axios, env, cookies)

---

---

## 🔐 CSRF Protection

The template includes built-in CSRF protection:

- A secure CSRF token is generated on each SSR HTML response and stored in a cookie.
- The client automatically attaches the token via the `x-csrf-token` header on requests.
- Server middleware validates the token by comparing it to the cookie.
- Only affects `POST`, `PUT`, `PATCH`, and `DELETE` methods.
- The logic is implemented in `src/server/middleware/csrf.ts` and used in the main router.

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
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
```

With (example for MySQL):
```ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
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
|------------|--------------|
| 2.5%       | 291          |
| 50%        | 3462         |
| 97.5%      | 4179         |
| 99%        | 4249         |

### 🕒 Session Length (ms)
| Metric | Value  |
|--------|--------|
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
|------------|--------------|
| 2.5%       | 1            |
| 50%        | 1            |
| 97.5%      | 2            |
| 99%        | 4            |

### 🕒 Session Length (ms)
| Metric | Value |
|--------|-------|
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
| Metric | Value |
|--------|-------|
| Min    | 96.7  |
| Max    | 5487.8|
| Mean   | 2714.2|
| Median | 2780  |
| p95    | 4770.6|
| p99    | 5378.9|

---

## 📦 Notes
- All tests were performed on `http://localhost:8888`.
- Bun server memory usage peaked at **327 MB**, with negligible CPU load.


---

## 🧮 Session Duration Stats

Extracted from `artillery` and custom loadtest logs:

| Metric           | Value (seconds) |
|------------------|-----------------|
| Average          | 2714.2          |
| Median           | 2780            |
| 95th Percentile  | 4770.6          |
| 99th Percentile  | 5378.9          |
| Max              | 5487.8          |

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

## ⚙️ Configuration

All project configuration is centralized in the `config/` directory.

### 📄 `config/ssg.config.ts`

```ts
export const staticRoutes = ["/", "/about", "/profile", "/chat", "/auth/login", "/auth/register"];
```

Used by `scripts/generateStaticPages.ts` to pre-render selected routes as static HTML files during production build.

---

### 📄 `config/ws.config.ts`

```ts
export const WS_CONFIG = {
  pingInterval: 30_000,
  pongTimeout: 10_000,
};
```

Used by the WebSocket server (`src/server/ws/server.ts`) to manage keep-alive and timeouts for active connections.

---

### 📄 `config/security.config.ts`

```ts
export const SECURITY_CONFIG = {
  allowedOrigins: ["http://localhost:8888"],
  contentSecurityPolicy: "default-src 'self'; script-src 'self';",
};
```

Used across the server for CORS, CSP headers, and request validation.

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
- Build the project using `vite.config.prod.ts`
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

