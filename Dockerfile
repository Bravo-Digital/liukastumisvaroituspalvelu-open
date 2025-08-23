# Stage 1: Install dependencies and build (can be dev or prod)
FROM node:20-alpine AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (dev + prod)
RUN pnpm install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Build Next.js for production
RUN pnpm build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only prod dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Copy the built Next.js app from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose app port
EXPOSE 8080

# Production start
CMD ["pnpm", "start"]

# Stage 3 (optional): Development image
FROM node:20-alpine AS development

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files and install all dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy all app files
COPY . .

# Expose dev port
EXPOSE 8080

# Start Next.js dev server
CMD ["pnpm", "dev"]
