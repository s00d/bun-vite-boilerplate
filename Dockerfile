# Dockerfile
FROM oven/bun:1.0.30 as base
WORKDIR /app
COPY . .

# Установка зависимостей
RUN bun install

# Сборка клиента
RUN bun run vite build

# Production stage
FROM oven/bun:1.0.30 as prod
WORKDIR /app
COPY --from=base /app /app

# Установка только прод-зависимостей (если нужно)
# RUN bun install --production

EXPOSE 3000
CMD ["bun", "run", "src/server/index.ts"]
