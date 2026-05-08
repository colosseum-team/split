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

2. From repo root:

   ```
   cp backend/.env.example backend/.env
   npm install --workspace backend
   npm run prisma:generate --workspace backend
   npm run prisma:migrate --workspace backend
   npm run dev --workspace backend
   ```

3. Smoke check:

   ```
   curl http://localhost:4000/health
   ```

## Production deploy

The backend is part of the same compose stack as `frontend` and `landing`. The
manual `Deploy` workflow (`.github/workflows/deploy.yml`) SSHes into the host,
pulls the requested ref, and runs `docker compose build --pull && docker compose up -d`.
This will:

- Build `backend/Dockerfile` (multi-stage Node 22 + Prisma).
- Apply pending Prisma migrations on container start (`prisma migrate deploy`).
- Start the API on `:4000` once Postgres reports healthy.

### Required server-side env vars

The compose file ships with safe defaults for everything except secrets. On
the deploy host place a `.env` next to the compose file:

```
JWT_SECRET=<random 32+ char string>
POSTGRES_PASSWORD=<random>            # optional, defaults to "split"
ARBITER_PRIVATE_KEY=                  # leave empty unless ARBITER_AUTOEXECUTE=true
```

`CORS_ORIGIN` defaults to the staging IPs; override if the demo URL changes.

### Post-deploy smoke

```
curl http://<host>:4000/health
```

### Frontend wiring (TODO)

The frontend on `main` does not yet call any of these endpoints — the
`VITE_API_URL` (or equivalent) is not wired. When the frontend starts hitting
the API, point it at `http://<host>:4000` (or `/api/*` via a future nginx
reverse-proxy rule on the frontend container).

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
