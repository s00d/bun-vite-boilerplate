// src/scripts/gen.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function genController(name: string) {
  const content = `// src/server/controllers/${name}.ts
export async function ${name}Controller(req: Bun.BunRequest): Promise<Response> {
  return Response.json({ message: "${name} controller works" });
}`;

  const path = resolve(`src/server/controllers/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Controller created: ${path}`);
}

function genRoute(name: string, type: "guest" | "protected") {
  const controllerName = `${name}Controller`;
  const routePath = resolve(`src/server/routes/${type}.ts`);
  const controllerImport = `import { ${controllerName} } from "../controllers/${name}";`;
  const routeKey = `/api/${type}/${name.toLowerCase()}`;

  const routeVar = type === "guest" ? "guestRoutes" : "protectedRoute";
  const indent = "  ";

  // If file doesn't exist — create full boilerplate
  if (!existsSync(routePath)) {
    const header =
      type === "protected"
        ? `import type { User } from "../models/user";\n\nexport type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";\nexport type ProtectedRouteHandler = (req: Bun.BunRequest, ctx: { user: User }) => Promise<Response>;\nexport type ProtectedRouteMap = Record<string, Partial<Record<Method, ProtectedRouteHandler>>>;\n\n${controllerImport}\n\nexport const ${routeVar}: ProtectedRouteMap = {\n${indent}"${routeKey}": {\n${indent}${indent}GET: ${controllerName},\n${indent}},\n};\n`
        : `export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";\nexport type RouteMap = Record<string, Partial<Record<Method, (req: Bun.BunRequest) => Promise<Response>>>>;\n\n${controllerImport}\n\nexport const ${routeVar}: RouteMap = {\n${indent}"${routeKey}": {\n${indent}${indent}GET: ${controllerName},\n${indent}},\n};\n`;

    writeFileSync(routePath, header);
    console.log(`✔ Route file created: ${routePath}`);
    return;
  }

  let file = readFileSync(routePath, "utf8");

  // Check if route already exists
  if (file.includes(`"${routeKey}"`)) {
    console.warn(`✘ Route already exists: ${routeKey}`);
    return;
  }

  // Add import if missing
  if (!file.includes(controllerImport)) {
    const importInsertIndex = file.indexOf("export ");
    file = `${controllerImport}\n${file.slice(0, importInsertIndex)}${file.slice(importInsertIndex)}`;
  }

  // Insert route into route object
  const routeObjectRegex = new RegExp(`export const ${routeVar}:[^{]+{`, "m");
  const match = routeObjectRegex.exec(file);
  if (!match) {
    console.error(`✘ Could not locate route object: ${routeVar}`);
    return;
  }

  const objectStartIndex = file.indexOf("{", match.index) + 1;
  const routeCode = `\n${indent}"${routeKey}": {\n${indent}${indent}GET: ${controllerName},\n${indent}},`;

  file = file.slice(0, objectStartIndex) + routeCode + file.slice(objectStartIndex);
  writeFileSync(routePath, file);
  console.log(`✔ Route added to ${routePath}: ${routeKey}`);
}

function genModel(name: string) {
  const content = `// src/server/models/${name}.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const ${name} = sqliteTable('${name.toLowerCase()}', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql\`CURRENT_TIMESTAMP\`),
});

export type ${name}Type = typeof ${name}.$inferSelect;`;

  const path = resolve(`src/server/models/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Model created: ${path}`);
}

function genMiddleware(name: string) {
  const content = `// src/server/middleware/${name}.ts
export async function ${name}(request: Bun.BunRequest): Promise<boolean> {
  // Add your middleware logic here
  return true;
}`;

  const path = resolve(`src/server/middleware/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Middleware created: ${path}`);
}

function usage() {
  console.log("Usage:");
  console.log("  bun run src/scripts/gen.ts controller <Name>");
  console.log("  bun run src/scripts/gen.ts route <Name> <guest|protected>");
  console.log("  bun run src/scripts/gen.ts model <Name>");
  console.log("  bun run src/scripts/gen.ts middleware <Name>");
  process.exit(1);
}

const [, , type, ...args] = process.argv;
if (!type || args.length === 0) usage();

ensureDir("src/server");

switch (type) {
  case "controller":
    genController(args[0]);
    break;
  case "route":
    if (args.length !== 2 || !["guest", "protected"].includes(args[1])) usage();
    genRoute(args[0], args[1] as "guest" | "protected");
    break;
  case "model":
    genModel(args[0]);
    break;
  case "middleware":
    genMiddleware(args[0]);
    break;
  default:
    usage();
}
