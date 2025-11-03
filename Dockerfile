# Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install runtime dependencies
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]