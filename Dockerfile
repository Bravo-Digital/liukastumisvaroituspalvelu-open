# syntax=docker/dockerfile:1

############################
# Base with pnpm
############################
FROM node:20-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

############################
# Dependencies (cache-friendly)
############################
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

############################
# Build (Next.js + workers)
############################
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build && pnpm build:workers

############################
# Runtime: APP (Next.js)
############################
FROM base AS app
# manifest first (required for prune)
COPY package.json pnpm-lock.yaml* ./
# bring deps and prune to production
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm prune --prod

# bring built artifacts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/messages ./messages

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "start"]

############################
# Runtime: WORKER
############################
FROM base AS worker
# manifest first (required for prune)
COPY package.json pnpm-lock.yaml* ./
# bring deps and prune to production
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm prune --prod

# bring compiled workers only
COPY --from=build /app/dist/workers ./dist/workers
ENV NODE_ENV=production
CMD ["pnpm", "workers"]

############################
# One-shot: MIGRATOR (Drizzle)
############################
FROM base AS migrator
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
CMD ["pnpm","drizzle-kit","push","--config=drizzle.config.ts"]
