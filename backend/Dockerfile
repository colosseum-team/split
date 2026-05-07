# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG QVAC_NPM_REGISTRY=https://registry.npmjs.org

RUN DEBIAN_FRONTEND=noninteractive apt-get update -y \
    && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    libgomp1 \
    libatomic1 \
    libstdc++6 \
    libvulkan1 \
    mesa-vulkan-drivers \
    && rm -rf /var/lib/apt/lists/* \
    && ldconfig

COPY package.json package-lock.json ./
COPY patches ./patches
COPY backend/package.json ./backend/

RUN if [ -n "$NPM_TOKEN" ]; then \
      printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
    fi \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set prefer-offline true \
    && npm install --workspaces=false --include-workspace-root \
    && npm install --workspace backend --include-workspace-root --no-save \
    && rm -f .npmrc

COPY backend ./backend

RUN npm run prisma:generate --workspace backend \
    && npm run build --workspace backend

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN DEBIAN_FRONTEND=noninteractive apt-get update -y \
    && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    libgomp1 \
    libatomic1 \
    libstdc++6 \
    libvulkan1 \
    mesa-vulkan-drivers \
    && rm -rf /var/lib/apt/lists/* \
    && ldconfig

COPY --from=builder /app /app

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:deploy --workspace backend && npm run start --workspace backend"]
