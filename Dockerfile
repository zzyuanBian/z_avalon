FROM node:20-slim AS builder

WORKDIR /app

# Copy all source
COPY package.json ./
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN cd server && npm ci
RUN cd client && npm ci

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build client (vite build → client/dist/)
RUN cd client && npx vite build

# Build server (tsc → server/dist/)
RUN cd server && npx tsc

# --- Production image ---
FROM node:20-slim

WORKDIR /app

# Copy server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy built server
COPY --from=builder /app/server/dist ./server/dist

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Copy shared types (needed at runtime? no, compiled into dist)
# Create data directory for JSON game records
RUN mkdir -p /app/server/data

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server/dist/server/src/index.js"]
