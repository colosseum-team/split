# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG QVAC_NPM_REGISTRY=https://registry.npmjs.org

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

RUN if [ -n "$NPM_TOKEN" ]; then \
      printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
    fi \
    && npm install --workspaces=false --include-workspace-root \
    && npm install --workspace backend --include-workspace-root --no-save \
    && rm -f .npmrc

COPY backend ./backend

RUN npm run prisma:generate --workspace backend \
    && npm run build --workspace backend

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:deploy --workspace backend && npm run start --workspace backend"]
