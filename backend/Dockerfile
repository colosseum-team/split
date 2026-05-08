# syntax=docker/dockerfile:1.7

# --- builder ------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# OpenSSL is needed at `prisma generate` time too: without it Prisma's engine
# autodetection in the slim image misreads the libssl version, downloads the
# openssl-1.1 engine, and the runtime crashes on bookworm (OpenSSL 3.0) with
# `PrismaClientInitializationError ... required linux-arm64-openssl-3.0.x`.
# `binaryTargets` in schema.prisma also pins this explicitly, but installing
# the package keeps the autodetection honest.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy lockfile + workspace metadata first for layer caching.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Install workspace deps. We deliberately use `npm install` rather than `npm ci`
# because the repo's package-lock.json is generated on x64 maintainer machines
# and may omit linux-arm64 platform entries (npm/cli#4828). `npm install`
# re-resolves for the build platform while still honouring the rest of the
# lockfile. `--no-save` keeps this ephemeral; the repo lockfile is untouched.
RUN npm install --workspace backend --include-workspace-root --include=optional --no-save

# Copy backend sources (after deps so source-only changes hit a warm cache).
COPY backend ./backend

# Generate the Prisma client. Must happen before tsc because the runtime imports
# `@prisma/client` and tsc walks the type definitions Prisma writes into
# node_modules. Prisma downloads the platform-specific query engine here, so
# this image MUST be built on the same arch the runtime image will run on.
RUN npm run prisma:generate --workspace backend

# TypeScript compile.
RUN npm run build --workspace backend


# --- runtime ------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Prisma's query engine dynamically links against libssl + glibc. Bookworm-slim
# ships glibc but not OpenSSL by default.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy resolved dependency tree and compiled output. Prisma's downloaded engines
# live in node_modules/.prisma so they come along automatically.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/

EXPOSE 4000

# Apply pending migrations and then start. If migrate fails the container exits
# and Docker restart policy retries — the schema must converge before traffic.
WORKDIR /app/backend
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
