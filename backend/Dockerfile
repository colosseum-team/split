# syntax=docker/dockerfile:1.7

# --- builder ------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG QVAC_NPM_REGISTRY=https://registry.npmjs.org

# OpenSSL is needed at `prisma generate` time too: without it Prisma's engine
# autodetection in the slim image misreads the libssl version, downloads the
# openssl-1.1 engine, and the runtime crashes on bookworm (OpenSSL 3.0) with
# `PrismaClientInitializationError ... required linux-arm64-openssl-3.0.x`.
# `binaryTargets` in schema.prisma also pins this explicitly, but installing
# the package keeps the autodetection honest.
# The native libs (libvulkan, mesa-vulkan-drivers, libstdc++/atomic/gomp) are
# required by QVAC's Bare runtime for in-process ML inference.
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

# Copy lockfile + workspace metadata + patches first for layer caching.
# patches/ must be present before `npm install` so the root postinstall hook
# (`patch-package`) can apply the @qvac/sdk RPC init timeout patch.
COPY package.json package-lock.json ./
COPY patches ./patches
COPY backend/package.json ./backend/

# Install workspace deps. We deliberately use `npm install` rather than `npm ci`
# because the repo's package-lock.json is generated on x64 maintainer machines
# and may omit linux-arm64 platform entries (npm/cli#4828). `npm install`
# re-resolves for the build platform while still honouring the rest of the
# lockfile. `--no-save` keeps this ephemeral; the repo lockfile is untouched.
# Two-step install: root first (so `postinstall` patches @qvac/sdk before any
# downstream resolution), then the backend workspace.
RUN if [ -n "$NPM_TOKEN" ]; then \
      printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
    fi \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set prefer-offline true \
    && npm install --workspaces=false --include-workspace-root \
    && npm install --workspace backend --include-workspace-root --include=optional --no-save \
    && rm -f .npmrc

# Copy backend sources (after deps so source-only changes hit a warm cache).
COPY backend ./backend

# Generate the Prisma client. Must happen before tsc because the runtime imports
# `@prisma/client` and tsc walks the type definitions Prisma writes into
# node_modules. Prisma downloads the platform-specific query engine here, so
# this image MUST be built on the same arch the runtime image will run on.
RUN npm run prisma:generate --workspace backend \
    && npm run build --workspace backend


# --- runtime ------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Prisma's query engine dynamically links against libssl + glibc. QVAC's Bare
# worker links against libvulkan + libstdc++/atomic/gomp at inference time.
# Bookworm-slim ships glibc but none of these by default.
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

# Copy resolved dependency tree and compiled output. Prisma's downloaded engines
# live in node_modules/.prisma so they come along automatically.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/package.json ./

EXPOSE 4000

# Apply pending migrations and then start. If migrate fails the container exits
# and Docker restart policy retries — the schema must converge before traffic.
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
