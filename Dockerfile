# Stage 1: Builder (for building both Next.js and TypeScript workers)
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js app
RUN pnpm build

# Build workers (TypeScript -> JavaScript)
RUN pnpm build:workers

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/messages ./messages

# Copy compiled workers
COPY --from=builder /app/dist/workers ./dist/workers


EXPOSE 8080

# Run Next.js in production
CMD ["pnpm", "start"]

# Stage 3: Development image
FROM node:20-alpine AS development

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies (dev + prod)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 8080

# Build workers first, then start Next.js dev
CMD ["sh", "-c", "pnpm build:workers && pnpm dev"]

# Stage: Migrator
FROM node:20-alpine AS migrator
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install deps (dev + prod) for drizzle
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Only what drizzle needs to resolve the schema/config
COPY drizzle.config.ts tsconfig.json ./
COPY src/lib ./src/lib

CMD ["pnpm","dlx","drizzle-kit@latest","push","--config=drizzle.config.ts"]