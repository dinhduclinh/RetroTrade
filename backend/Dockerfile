# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.11.1
FROM node:${NODE_VERSION}-slim AS base

# Install build dependencies for TensorFlow.js and Canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies separately to leverage layer caching
COPY --link package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --production

# Copy application source code (excluding .env, .git*, lock files, etc.)
COPY --link src/ ./src/
COPY --link server.js ./server.js

# Create a non-root user and switch to it
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

RUN npm install


ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 9999

CMD ["node", "server.js"]
