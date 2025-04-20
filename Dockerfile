# Базовый образ
FROM oven/bun:1.2.10 as base
WORKDIR /app
COPY . .

# Установка всех зависимостей (включая dev)
RUN bun install

# Сборка проекта
RUN bun run build
RUN bun run generate

# Production-слой
FROM oven/bun:1.2.10 as prod
WORKDIR /app

# Копируем только необходимые файлы
COPY --from=base /app/package.json .
COPY --from=base /app/bun.lock .
COPY --from=base /app/tsconfig.json .
COPY --from=base /app/twilight.config.ts .
COPY --from=base /app/vite.config.ts .
COPY --from=base /app/postcss.config.mjs .
COPY --from=base /app/dist ./dist
COPY --from=base /app/.env .
COPY --from=base /app/.env.production .
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/src ./src

# Установка только прод-зависимостей при необходимости
# RUN bun install --production --frozen-lockfile

EXPOSE 3000

CMD ["bun", "run", "src/server/index.ts"]
