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

# Vite 8 pulls in `rolldown`, which ships per-platform native bindings as
# **optional dependencies**. The repo's `package-lock.json` is generated on
# x64 maintainer workstations and does not list a
# `@rolldown/binding-linux-arm64-gnu` entry. The deploy host is Oracle ARM64,
# so any lockfile-driven install (`npm ci`, or even `npm install` honouring
# the existing lockfile) silently skips the ARM64 binding and the next
# `vite build` crashes with `Cannot find native binding`. This is the
# long-standing npm bug tracked at https://github.com/npm/cli/issues/4828.
#
# Workaround: drop the lockfile **inside the build container** so npm
# performs a fresh resolution for the current platform. The repo lockfile
# is untouched; only this ephemeral copy is removed.
RUN rm package-lock.json \
    && if [ -n "$NPM_TOKEN" ]; then \
         printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
       fi \
    && npm install --workspace frontend --include-workspace-root --include=optional \
    && rm -f .npmrc

COPY frontend ./frontend

# Vite inlines `import.meta.env.VITE_*` at build time, so the API base has to
# be baked into the bundle here. Default to `/api` (same-origin, proxied by
# nginx to the backend container) so the SPA stays portable and works behind
# any TLS termination without code changes.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build --workspace frontend

# --- runtime -----------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
