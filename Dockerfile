# syntax=docker/dockerfile:1.6
# ────────────────────────────────────────────────────────────
# Gloford — Next.js production image
# Multi-stage: deps -> builder -> runner. Final image runs
# `node server.js` from Next's standalone output.
# ────────────────────────────────────────────────────────────

ARG NODE_VERSION=22-alpine

# ─── deps ────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# ─── builder ────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client against whichever DB url is passed.
ARG DATABASE_URL="postgresql://user:pass@db/dummy?sslmode=disable"
ARG DIRECT_URL="postgresql://user:pass@db/dummy?sslmode=disable"
ENV DATABASE_URL=${DATABASE_URL} \
    DIRECT_URL=${DIRECT_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=1

RUN pnpm prisma generate
RUN pnpm build

# ─── runner ─────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Next.js standalone output already includes @prisma/client (via file
# tracing). The Prisma CLI is not needed at runtime — migrations are
# applied by the `migrate` compose service, not the app container.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
