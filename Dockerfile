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

# Install dependencies
RUN pnpm install --frozen-lockfile

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

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN pnpm build

# ============================================================================
# Stage 3: Runner
# ============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder for standalone mode
# Note: Next.js standalone output bundles all dependencies into .next/standalone
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
# Next.js standalone mode creates server.js at the root
CMD sh -c "node server.js"
