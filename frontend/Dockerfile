FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json
COPY packages/api-types/package.json ./packages/api-types/package.json
COPY packages/llm-client/package.json ./packages/llm-client/package.json
COPY packages/mastery-engine/package.json ./packages/mastery-engine/package.json
COPY packages/demo-controller/package.json ./packages/demo-controller/package.json
RUN npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace @mindvault/api-types
RUN npm run build --workspace @mindvault/mastery-engine
RUN npm run build --workspace @mindvault/llm-client
RUN npm run build --workspace @mindvault/demo-controller
RUN npm run build --workspace frontend

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./.next/static
COPY --from=build /app/frontend/public ./frontend/public
EXPOSE 3000
CMD ["node", "frontend/server.js"]
