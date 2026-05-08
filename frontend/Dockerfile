# syntax=docker/dockerfile:1.7
# --- builder ------------------------------------------------------------------
# Vite 8 requires Node.js 20.19+ or 22.12+; node:22-bookworm-slim is well
# inside that window and matches the runtime the rest of the stack uses.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install only what the frontend workspace needs from the root lockfile.
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# `npm ci` is intentionally avoided here: Vite 8 pulls in `rolldown`, which
# ships per-platform native bindings as **optional dependencies**. The repo's
# `package-lock.json` is generated on the maintainers' workstations (Windows /
# macOS x64) and therefore does not list a `@rolldown/binding-linux-arm64-gnu`
# entry. Running `npm ci` on the Oracle ARM64 production host then resolves
# strictly from the lockfile, the ARM64 binding is never installed, and the
# next `vite build` crashes with `Cannot find native binding`. This is the
# long-standing npm bug tracked at https://github.com/npm/cli/issues/4828.
#
# `npm install` re-resolves optional dependencies for the current platform
# while still honouring the rest of the lockfile, which sidesteps the bug
# without forcing every developer to regenerate the lockfile per arch.
RUN npm install --workspace frontend --include-workspace-root --include=optional --no-save

COPY frontend ./frontend

RUN npm run build --workspace frontend

# --- runtime -----------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
