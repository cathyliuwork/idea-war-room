# Multi-stage build for Idea War Room Next.js application
# Optimized for AI Builders Deployment (256 MB RAM limit)

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies with minimal cache
RUN pnpm install --frozen-lockfile --prod=false

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Build Next.js application
# Note: Environment variables will be injected at runtime by Koyeb
RUN pnpm build

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port (will be overridden by PORT env var at runtime)
EXPOSE 3000

# Start Next.js server using PORT environment variable
# CRITICAL: Use shell form (sh -c) to ensure environment variable expansion
# The PORT environment variable is set by Koyeb at runtime
CMD sh -c "node server.js -p ${PORT:-3000}"
