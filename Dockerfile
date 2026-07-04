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
RUN npm ci

# Copy the frontend dependencies
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm ci

# Stage 3: Build the application
FROM base AS builder
WORKDIR /app

# Copy SDK and node_modules from deps stage
COPY --from=deps /app/sdk/js-sdk /app/sdk/js-sdk
COPY --from=deps /app/node_modules ./node_modules
COPY . .

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

# Copy built artifacts and configurations
COPY --from=builder /app/sdk/js-sdk ./sdk/js-sdk
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./next.config.mjs

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
