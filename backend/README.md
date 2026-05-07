# backend

Fastify + TypeScript + Prisma + PostgreSQL service for split.

Responsibilities:

- Wallet sign-in (SIWS) → JWT.
- Role profile (`customer` / `user`).
- Contracts CRUD and lifecycle: create, fund, accept, submit, approve, dispute, resolve.
- Storage of QVAC AI outputs (contract copilot + dispute brief). The backend never invokes a model — inference is local in the browser.
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
- `GET /contracts/:id/ai-outputs?kind=...` — list AI outputs for a contract.

## Why no LLM on the backend

`docs/qvac-ai-arbitration-plan.md` is offline-first: all inference runs in the browser via `@qvac/llm-llamacpp`. The backend persists only `result_json`, `model_id`, `model_version`, `input_hash`, `output_hash` so the demo can prove the AI ran locally.
