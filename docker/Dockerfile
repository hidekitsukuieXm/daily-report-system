# ==============================================================================
# Daily Report System - Dockerfile
# Multi-stage build for development and production
# ==============================================================================

# ==============================================================================
# Stage 1: Base
# ==============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies required for Prisma
RUN apk add --no-cache libc6-compat openssl

# ==============================================================================
# Stage 2: Dependencies
# ==============================================================================
FROM base AS deps

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ==============================================================================
# Stage 3: Development
# ==============================================================================
FROM base AS development

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose development port
EXPOSE 5173

# Start development server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ==============================================================================
# Stage 4: Build
# ==============================================================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# ==============================================================================
# Stage 5: Production (nginx)
# ==============================================================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose production port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
