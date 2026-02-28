FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json packages/types/
COPY packages/lightway/package.json packages/lightway/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY packages/lightway/ packages/lightway/
COPY apps/api/ apps/api/
RUN pnpm --filter @mindvault/types build && \
    pnpm --filter @mindvault/lightway build && \
    pnpm --filter @mindvault/api build

# --- Runtime ---
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/lightway/node_modules ./packages/lightway/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/lightway/dist ./packages/lightway/dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY packages/types/package.json packages/types/
COPY packages/lightway/package.json packages/lightway/
COPY apps/api/package.json apps/api/
COPY package.json pnpm-workspace.yaml ./

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
