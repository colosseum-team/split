# QVAC backend integration

This document describes the backend-side QVAC flow for `split`.

## Architecture

- **In-process inference:** the API runs QVAC via `@qvac/sdk` inside the Node process. There is **no** separate HTTP worker service; the SDK spawns a **Bare** subprocess and talks to it over IPC.
- **Patches:** the repo uses [`patch-package`](https://github.com/ds300/patch-package) from the **monorepo root** (`postinstall` in root `package.json`). After `npm install`, `patches/@qvac+sdk+*.patch` is applied. Docker dev runs `npx patch-package` in the backend startup command so the bind-mounted volume gets the patch.
- **`GET /health`** includes a `qvac` field when `QVAC_ENABLED=true` (warm-up state: `warming` → `ready` or `error`).

## Goal

Move AI execution from browser runtime to backend runtime:

- frontend sends AI input to backend;
- backend executes QVAC via `@qvac/sdk` (Bare runtime);
- backend stores normalized output in `AiOutput` (on `*-run` routes);
- frontend receives the result (preview or persisted payload).

## Environment

Add to `backend/.env` (see `.env.example`):

```env
QVAC_ENABLED=true
QVAC_MODEL_ID=qvac-llamacpp
QVAC_MODEL_VERSION=0.17.4
# Bare worker IPC init timeout (ms). Compose sets 900000; first model load in Docker can be slow.
QVAC_RPC_INIT_TIMEOUT_MS=900000
```

Install dependencies from the **repository root** so workspaces and patches resolve:

```bash
npm install
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

Copilot endpoints accept **`scenario`**: `"design"` | `"logo"`.

### Contract copilot `input` (two shapes)

Use **either** a single textarea payload **or** four explicit sections. Bodies must be `{ "scenario": "…", "input": { … } }` — no extra keys (Zod `.strict()`).

**1. Single draft (recommended for wizard step with one technical assignment)**

```json
{
  "scenario": "design",
  "input": {
    "technicalAssignment": "Full text of the technical assignment …"
  }
}
```

**2. Sectioned draft (advanced UI / demo presets)**

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

The backend normalizes both to one internal draft before building the LLM prompt.

### POST `/contracts/:id/copilot-run`

Runs QVAC contract copilot on backend and stores one `AiOutput` row (`kind=contract_copilot`).

Access:

- authenticated user (`Authorization: Bearer <jwt>`);
- only contract `customer`.

Response includes:

- persisted `AiOutput` metadata;
- `result` in frontend-friendly camelCase shape.

### POST `/ai/copilot-preview`

Runs the same copilot inference **without** a contract id and **without** persisting `AiOutput`.

Used from contract creation UI before save. Requires the same JWT as other authenticated routes.

Request body uses the **`input`** shapes described above (`technicalAssignment` or four section strings).

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

- Prefer **`POST /ai/copilot-preview`** for “improve technical assignment” during creation (payload: **`technicalAssignment`** when there is only one textarea).
- Use **`POST /contracts/:id/copilot-run`** when the contract exists and outputs should be stored.
- Use `*-output` routes only for legacy flows where inference ran elsewhere and the client posts a finished JSON result.

Suggested rollout:

1. Keep **`demo`** mode as fallback (`VITE_AI_SOURCE=demo`).
2. Use **`qvac`** (`VITE_AI_SOURCE=qvac`) with backend base URL and wallet SIWS JWT for `/ai/copilot-preview` and `*-run`.
3. Retire browser-executed QVAC (`qvacLocalAiAdapter`) for production demos once backend path is validated.
