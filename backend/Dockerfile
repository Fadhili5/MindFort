FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY infra/lightway/ infra/lightway/
COPY backend/ backend/

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @mindvault/types build && \
    pnpm --filter @mindvault/lightway build && \
    pnpm --filter @mindvault/backend build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=build /app/infra/lightway/dist ./infra/lightway/dist
COPY --from=build /app/infra/lightway/package.json ./infra/lightway/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/dist/server.js"]
