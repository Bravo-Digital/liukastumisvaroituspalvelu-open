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
# Recommended to reduce telemetry/noise in CI images
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
# Build Next (and any TS) + workers
RUN pnpm build && pnpm build:workers

############################
# Runtime: APP (Next.js)
############################
FROM base AS app
# Copy node_modules from deps and prune to prod only
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm prune --prod

# Copy built artifacts
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/messages ./messages
# If you have any other runtime assets, copy them here as needed

# Sensible defaults for containers
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# (Optional) healthcheck for container orchestrators
# HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["pnpm", "start"]

############################
# Runtime: WORKER
############################
FROM base AS worker
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm prune --prod
# Bring only what workers need
COPY --from=build /app/dist/workers ./dist/workers
COPY package.json pnpm-lock.yaml* ./
ENV NODE_ENV=production
CMD ["pnpm", "workers"]

############################
# One-shot: MIGRATOR (Drizzle)
############################
FROM base AS migrator
# Dev deps are fine here for the CLI
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod=false
COPY . .
CMD ["pnpm","drizzle-kit","push","--config=drizzle.config.ts"]
