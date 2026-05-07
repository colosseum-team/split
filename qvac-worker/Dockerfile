# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG NPM_TOKEN
ARG QVAC_NPM_REGISTRY=https://registry.npmjs.org

COPY package.json package-lock.json ./
COPY qvac-worker/package.json ./qvac-worker/

RUN if [ -n "$NPM_TOKEN" ]; then \
      printf "@qvac:registry=%s\n//registry.npmjs.org/:_authToken=%s\n" "$QVAC_NPM_REGISTRY" "$NPM_TOKEN" > .npmrc; \
    fi \
    && npm install --workspaces=false --include-workspace-root \
    && npm install --workspace qvac-worker --include-workspace-root --no-save \
    && rm -f .npmrc

COPY qvac-worker ./qvac-worker

RUN npm run build --workspace qvac-worker

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 4100

CMD ["npm", "run", "start", "--workspace", "qvac-worker"]
