FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types/ packages/types/
COPY frontend/ frontend/

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @mindvault/types build && \
    pnpm --filter @mindvault/frontend build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/package.json ./frontend/
COPY --from=build /app/frontend/node_modules ./frontend/node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "frontend/node_modules/.bin/next", "start", "-p", "3000"]
