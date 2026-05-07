# backend

Fastify + TypeScript + Prisma + PostgreSQL service for split.

Responsibilities:

- Wallet sign-in (SIWS) → JWT.
- Role profile (`customer` / `user`).
- Contracts CRUD and lifecycle: create, fund, accept, submit, approve, dispute, resolve.
- Storage of QVAC AI outputs (contract copilot + dispute brief).
- Optional backend-side QVAC inference (`/copilot-run`, `/dispute-run`) with persistence to `AiOutput`.
- Optional arbiter wallet that resolves disputes on-chain when `ARBITER_AUTOEXECUTE=true`.

## Local run

1. Start Postgres (from repo root):

   ```
   docker compose up -d postgres
   ```

2. From `backend/`:

   ```
   cp .env.example .env
   npm install --workspace backend
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   npm run dev --workspace backend
   ```

3. Smoke check:

   ```
   curl http://localhost:4000/health
   ```

4. API docs (Swagger):

   - Open UI: `http://localhost:4000/docs`
   - Raw OpenAPI JSON: `http://localhost:4000/docs/openapi.json`

## Endpoints

- `POST /auth/nonce` — issue a sign-in nonce for a wallet.
- `POST /auth/verify` — verify signature, upsert user, return JWT.
- `GET /me` — current user (requires `Authorization: Bearer <jwt>`).
- `POST /me/role` — pick role once.
- `PATCH /me/role` — change role.
- `POST /contracts` — customer creates a contract (returns unsigned escrow tx + `contractHash`).
- `GET /contracts?role=...&status=...` — list (role-aware).
- `GET /contracts/:id` — detail.
- `PATCH /contracts/:id` — edit while in `draft`.
- `POST /contracts/:id/fund` — record funding tx signature.
- `POST /contracts/:id/accept` — user accepts open contract.
- `POST /contracts/:id/submit` — assignee submits work.
- `POST /contracts/:id/approve` — customer approves and records release tx.
- `POST /contracts/:id/dispute` — open a dispute.
- `POST /contracts/:id/resolve-dispute` — record agreed outcome (calls on-chain ResolveDispute when `ARBITER_AUTOEXECUTE=true`).
- `POST /contracts/:id/copilot-output` — store QVAC contract copilot result.
- `POST /contracts/:id/dispute-output` — store QVAC dispute brief.
- `POST /contracts/:id/copilot-run` — run QVAC contract copilot on backend and store output.
- `POST /contracts/:id/dispute-run` — run QVAC dispute brief on backend and store output.
- `POST /ai/copilot-preview` — run QVAC contract copilot without persisting output.
- `GET /contracts/:id/ai-outputs?kind=...` — list AI outputs for a contract.

## QVAC modes

The backend supports two integration styles:

- **Backend inference (recommended):** frontend calls `/ai/copilot-preview` or `/contracts/:id/*-run`; the server runs **`@qvac/sdk` in-process** (Bare subprocess for native modules). Persisted outputs use `*-run` routes.
- **Legacy:** frontend ran QVAC elsewhere and POSTs finished JSON via `*-output` routes.

Copilot **`input`** can be **`{ "technicalAssignment": "…" }`** (single textarea) **or** the four-field section object. See **`backend/docs/qvac-backend.md`** for Docker prerequisites (Vulkan, libatomic), env vars (`QVAC_RPC_INIT_TIMEOUT_MS`), and examples.
