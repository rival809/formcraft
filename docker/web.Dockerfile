# ─── Stage 1: deps ───────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --no-frozen-lockfile --filter @formcraft/web...

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @formcraft/types build
RUN pnpm --filter @formcraft/web build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# In monorepo, Next.js standalone output mirrors the monorepo directory structure.
# server.js ends up at apps/web/server.js inside the standalone dir.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
