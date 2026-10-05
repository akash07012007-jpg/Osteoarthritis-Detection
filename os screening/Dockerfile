# Production Multi-Stage Dockerfile for Sakhi OA Screening Web App
# Builds the React frontend + Express SQLite backend for self-hosted deployment

FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy build artifacts & dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Expose API and static app port
EXPOSE 3001

# Initialize SQLite seed data & start API server
CMD ["node", "--loader", "tsx", "server/index.ts"]
