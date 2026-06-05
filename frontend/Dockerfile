# Use Node.js for building
FROM node:20-alpine AS builder
WORKDIR /app

ARG INTERNAL_API_URL=http://backend:8000
ENV INTERNAL_API_URL=$INTERNAL_API_URL

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files from builder
# Standalone mode only needs the standalone folder and public/static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]

# Development image
FROM node:20-alpine AS dev
WORKDIR /app

ENV NODE_ENV development

COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --prefer-offline 2>/dev/null || npm ci

COPY . .

EXPOSE 3000

CMD ["npx", "next", "dev", "--turbo"]
