FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

# Copy everything needed
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY packages/lightway/ packages/lightway/
COPY apps/api/ apps/api/

# Install deps and build — single layer avoids symlink issues
RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @mindvault/types build && \
    pnpm --filter @mindvault/lightway build && \
    pnpm --filter @mindvault/api build

# --- runtime: copy only what's needed ---
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=build /app/packages/lightway/dist ./packages/lightway/dist
COPY --from=build /app/packages/lightway/package.json ./packages/lightway/
COPY --from=build /app/packages/lightway/node_modules ./packages/lightway/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]