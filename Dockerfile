FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build && bun run generate

FROM oven/bun:1 AS prod
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist
COPY tsconfig.json ./
COPY src ./src
COPY config ./config
COPY locales ./locales
COPY drizzle ./drizzle
COPY public ./public
RUN mkdir -p data && chown bun:bun data
USER bun
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["bun", "run", "src/server/index.ts"]
