# syntax=docker/dockerfile:1.7
# --- builder ------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy lockfile + workspace metadata first to leverage Docker layer cache.
COPY package.json package-lock.json ./
COPY landing/package.json ./landing/

RUN npm ci --workspaces=false --include-workspace-root \
    && npm install --workspace landing --include-workspace-root --no-save

COPY landing ./landing

ARG NEXT_PUBLIC_DEMO_URL
ARG NEXT_PUBLIC_GITHUB_URL
ENV NEXT_PUBLIC_DEMO_URL=$NEXT_PUBLIC_DEMO_URL \
    NEXT_PUBLIC_GITHUB_URL=$NEXT_PUBLIC_GITHUB_URL

RUN npm run build --workspace landing

# --- runtime -----------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Next.js standalone output bundles the minimal server + traced node_modules.
COPY --from=builder /app/landing/.next/standalone ./
COPY --from=builder /app/landing/.next/static ./landing/.next/static
COPY --from=builder /app/landing/public ./landing/public

EXPOSE 3000

CMD ["node", "landing/server.js"]
