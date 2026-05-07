# syntax=docker/dockerfile:1.7
# --- builder ------------------------------------------------------------------
# Vite 8 requires Node.js 20.19+ or 22.12+; node:22-bookworm-slim is well
# inside that window and matches the runtime the rest of the stack uses.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG QVAC_NPM_REGISTRY=https://registry.npmjs.org

# Install only what the frontend workspace needs from the root lockfile.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

RUN if [ -n "$NPM_TOKEN" ]; then \
      printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
    fi \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set prefer-offline true \
    && npm install --workspaces=false --include-workspace-root \
    && npm install --workspace frontend --include-workspace-root --no-save \
    && rm -f .npmrc

COPY frontend ./frontend

RUN npm run build --workspace frontend

# --- runtime -----------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
