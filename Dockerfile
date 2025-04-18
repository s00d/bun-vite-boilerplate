# Dockerfile
FROM oven/bun:1.2.10 as base
WORKDIR /app
COPY . .

# Установка зависимостей
RUN bun install

# Сборка клиента
RUN bun run build

# Production stage
FROM oven/bun:1.2.10 as prod
WORKDIR /app
COPY --from=base /app /app

# Установка только прод-зависимостей (если нужно)
# RUN bun install --production

EXPOSE 3000
CMD ["bun", "run", "src/server/index.ts"]
