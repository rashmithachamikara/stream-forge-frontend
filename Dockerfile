# Stage 1: Build base
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
# Copy the local SDK dependency (now internal to the repo)
WORKDIR /app/sdk/js-sdk
COPY sdk/js-sdk/package*.json ./
COPY sdk/js-sdk/tsconfig.json ./
COPY sdk/js-sdk/src ./src
RUN npm install && npm run build

# Create compatibility symlink for any old package-lock.json sibling relative path references
RUN mkdir -p /stream-forge-backend/sdk && ln -s /app/sdk/js-sdk /stream-forge-backend/sdk/js-sdk

# Copy the frontend dependencies
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

# Copy SDK, node_modules, and symlinks from deps stage
COPY --from=deps /app/sdk/js-sdk /app/sdk/js-sdk
COPY --from=deps /stream-forge-backend /stream-forge-backend
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANALYTICS_INGESTION_ENABLED
ARG NEXT_PUBLIC_ANALYTICS_SEND_ANONYMOUS
ARG NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE
ARG NEXT_PUBLIC_ANALYTICS_TRACK_SEEK
ARG NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE
ARG NEXT_PUBLIC_ANALYTICS_ENDPOINT_BASE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ANALYTICS_INGESTION_ENABLED=$NEXT_PUBLIC_ANALYTICS_INGESTION_ENABLED
ENV NEXT_PUBLIC_ANALYTICS_SEND_ANONYMOUS=$NEXT_PUBLIC_ANALYTICS_SEND_ANONYMOUS
ENV NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE=$NEXT_PUBLIC_ANALYTICS_TRACK_PAUSE
ENV NEXT_PUBLIC_ANALYTICS_TRACK_SEEK=$NEXT_PUBLIC_ANALYTICS_TRACK_SEEK
ENV NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE=$NEXT_PUBLIC_ANALYTICS_TRACK_CLOSE
ENV NEXT_PUBLIC_ANALYTICS_ENDPOINT_BASE_URL=$NEXT_PUBLIC_ANALYTICS_ENDPOINT_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Run Next.js production build
RUN npm run build

# Stage 4: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Setup non-root execution user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built artifacts, compatibility layouts, and configurations
COPY --from=builder /app/sdk/js-sdk ./sdk/js-sdk
COPY --from=builder /stream-forge-backend /stream-forge-backend
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
