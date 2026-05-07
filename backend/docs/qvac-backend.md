# QVAC backend integration

This document describes the backend-side QVAC flow for `split`.

## Goal

Move AI execution from browser runtime to backend runtime:

- frontend sends AI input to backend;
- backend executes QVAC via `@qvac/sdk`;
- backend stores normalized output in `AiOutput`;
- frontend receives persisted result payload.

## Environment

Add to `backend/.env`:

```env
QVAC_ENABLED=true
QVAC_MODEL_ID=qvac-llamacpp
QVAC_MODEL_VERSION=0.17.4
```

Install backend dependencies:

```bash
npm install --workspace backend
```

### Docker (Bare + `@qvac/llm-llamacpp`)

The llama.ggml **prebuilt `.bare`** binary links **`libvulkan.so.1`**. On Debian slim (including `node:*-bookworm-slim`) only installing `openssl`/`libgomp` is **not enough**: dynamic loader cannot resolve Vulkan, and the Bare worker never completes IPC connect (timeouts like `RPC initialization timed out …`).

**Fix baked into this repo:**

- **`backend/Dockerfile.dev`** is the dev backend image: same native stack as production (`libvulkan1`, `mesa-vulkan-drivers`, **`libatomic1`** for `rocksdb-native` under Bare, `libstdc++6`, `libgomp1`, …). Dev compose **builds** this image instead of running `apt-get` on every container start (avoids silent `apt` failures without `set -e` and guarantees `libatomic.so.1` is on disk before Node runs).
- **`docker-compose.dev.yml`** uses that image and runs the install/dev script with **`set -e`**.
- **`backend/Dockerfile`** (production) installs the same package set.

Checks:

1. Prefer the **native CPU architecture** of the daemon (Apple Silicon hosts: **linux/arm64** images; avoid forcing **linux/amd64** globally — Bare + GGUF startup becomes unrealistic).
2. After `compose up`, `docker logs …` should eventually show Bare / QVAC messages; **`GET /health`** includes `qvac.state` (`warming` → `ready`).
3. In a pinch, verify preload inside the backend container:

   ```bash
   docker compose -f docker-compose.dev.yml exec backend sh -lc '
   ARCH=$(uname -m)
   case "$ARCH" in aarch64|arm64) DIR=linux-arm64 ;; *) DIR=linux-x64 ;; esac
   ldd "node_modules/@qvac/llm-llamacpp/prebuilds/$DIR/qvac__llm-llamacpp.bare"
   '
   ```

   Lines ending in `=> not found` mean a missing distro library (Vulkan was the usual offender before we added Mesa).

4. If Bare logs `libatomic.so.1: cannot open shared object file`, the container does not have **`libatomic1`** (rebuild the backend image: `docker compose -f docker-compose.dev.yml build --no-cache backend`).

## Endpoints

### POST `/contracts/:id/copilot-run`

Runs QVAC contract copilot on backend and stores one `AiOutput` row (`kind=contract_copilot`).

Request body:

```json
{
  "scenario": "design",
  "input": {
    "scope": "Landing page redesign",
    "deliverables": "Figma + exported assets",
    "timeline": "10 working days",
    "paymentTerms": "50/50"
  }
}
```

Access:

- authenticated user;
- only contract `customer`.

Response includes:

- persisted `AiOutput` metadata;
- `result` in frontend-friendly camelCase shape.

### POST `/ai/copilot-preview`

Runs the same copilot inference without requiring a contract id and without writing `AiOutput`.

Use this route from contract creation UI where the contract is not saved yet.

### POST `/contracts/:id/dispute-run`

Runs embeddings + dispute brief generation and stores one `AiOutput` row (`kind=dispute_brief`).

Request body:

```json
{
  "scenario": "logo",
  "input": {
    "requirementSnapshot": ["Need SVG + PNG", "2 revisions included"],
    "submissionSummary": "Performer delivered PNG only",
    "conversation": ["Client asked for source files", "Performer said final files were sent"]
  }
}
```

Access:

- authenticated user;
- caller must be a contract party;
- contract status must be `disputed`.

## Persistence model

Both `*-run` routes create `AiOutput` rows with:

- `modelId`, `modelVersion` from env (`QVAC_MODEL_ID`, `QVAC_MODEL_VERSION`);
- deterministic `inputHash` and `outputHash` (SHA-256);
- `resultJson` (raw model output after normalization).

Scalars:

- copilot writes `riskScore`;
- dispute writes `similarityScore` (stored as 0..1, response returns 0..100-scale value from model output).

## Frontend contract

Frontend should call `*-run` routes when AI source is `qvac`.
Use `*-output` routes only for legacy/browser-local inference mode.

Suggested rollout:

1. keep `demo` mode as fallback;
2. enable `qvac-api` mode for internal/staging;
3. remove browser-executed QVAC adapter after validation.
