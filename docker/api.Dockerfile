# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --no-frozen-lockfile --filter @formcraft/api...

# ─── Stage 2: build (also used as runner — pnpm store includes generated Prisma client) ───
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN pnpm --filter @formcraft/db db:generate
RUN pnpm --filter @formcraft/db build
RUN pnpm --filter @formcraft/api build

ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
