// src/scripts/gen.ts
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function genController(name: string) {
  const content = `// src/server/controllers/${name}.ts
export async function ${name}Controller(req: Request): Promise<Response> {
  return Response.json({ message: "${name} controller works" });
}`;

  const path = resolve(`src/server/controllers/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Controller created: ${path}`);
}

function genRouteFile(name: string, type: "guest" | "protected") {
  const routeName = name.toLowerCase();
  const controllerName = `${name}Controller`;
  const filePath = resolve(`src/server/routes/${type}.ts`);

  if (!existsSync(filePath)) {
    const content = `// src/server/routes/${type}.ts
import { ${controllerName} } from "../controllers/${name}";

export async function ${type}Routes(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === "GET" && url.pathname === "/api/${type}/${routeName}") {
    return ${controllerName}(request);
  }

  return new Response("Not Found", { status: 404 });
}`;
    writeFileSync(filePath, content);
    console.log(`✔ Route file created: ${filePath}`);
  } else {
    console.warn(`✘ Route file already exists: ${filePath}`);
  }
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
export async function ${name}(request: Request): Promise<boolean> {
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
    genRouteFile(args[0], args[1] as "guest" | "protected");
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
