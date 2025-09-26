# Multi-stage build for AIM Currency Server
FROM node:18-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY scripts/ ./scripts/

# Install root dependencies
RUN npm install --only=production

# Copy all service directories
COPY agent-gateway/ ./agent-gateway/
COPY aim-cli/ ./aim-cli/
COPY disputes/ ./disputes/
COPY gateway/ ./gateway/
COPY infra/ ./infra/
COPY ledgerd/ ./ledgerd/
COPY logd/ ./logd/
COPY marketplace/ ./marketplace/
COPY metering/ ./metering/
COPY mintd/ ./mintd/
COPY onramp/ ./onramp/
COPY pqsigner/ ./pqsigner/
COPY scripts/ ./scripts/
COPY treasury/ ./treasury/
COPY verifier-advanced/ ./verifier-advanced/
COPY verifier-simple/ ./verifier-simple/
COPY webhookd/ ./webhookd/

# Install dependencies for each service (including dev dependencies for building)
RUN cd gateway && npm install && cd .. && \
    cd ledgerd && npm install && cd .. && \
    cd mintd && npm install && cd .. && \
    cd treasury && npm install && cd .. && \
    cd logd && npm install && cd .. && \
    cd agent-gateway && npm install && cd .. && \
    cd disputes && npm install && cd .. && \
    cd metering && npm install && cd .. && \
    cd marketplace && npm install && cd .. && \
    cd onramp && npm install && cd .. && \
    cd webhookd && npm install && cd .. && \
    cd verifier-advanced && npm install && cd .. && \
    cd aim-cli && npm install && cd ..

# Build services
RUN cd gateway && npm run build && cd .. && \
    cd ledgerd && npm run build && cd .. && \
    cd mintd && npm run build && cd .. && \
    cd treasury && npm run build && cd .. && \
    cd logd && npm run build && cd .. && \
    cd agent-gateway && npm run build && cd .. && \
    cd disputes && npm run build && cd .. && \
    cd metering && npm run build && cd .. && \
    cd marketplace && npm run build && cd .. && \
    cd onramp && npm run build && cd .. && \
    cd webhookd && npm run build && cd .. && \
    cd verifier-advanced && npm run build && cd .. && \
    cd aim-cli && npm run build && cd ..

# Clean up dev dependencies to reduce image size
RUN cd gateway && npm prune --production && cd .. && \
    cd ledgerd && npm prune --production && cd .. && \
    cd mintd && npm prune --production && cd .. && \
    cd treasury && npm prune --production && cd .. && \
    cd logd && npm prune --production && cd .. && \
    cd agent-gateway && npm prune --production && cd .. && \
    cd disputes && npm prune --production && cd .. && \
    cd metering && npm prune --production && cd .. && \
    cd marketplace && npm prune --production && cd .. && \
    cd onramp && npm prune --production && cd .. && \
    cd webhookd && npm prune --production && cd .. && \
    cd verifier-advanced && npm prune --production && cd .. && \
    cd aim-cli && npm prune --production && cd ..

# Expose main gateway port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run database migrations before starting
RUN chmod +x ./scripts/migrate.sh

# Start all services with migrations
CMD ["sh", "-c", "./scripts/migrate.sh && npm start"]

