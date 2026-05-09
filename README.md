# Escros

Trustless freelance escrow platform on Solana: connecting clear contract summaries with automated payments.

Live demo: [escros.work.gd](https://escros.work.gd) (landing) · [app.escros.work.gd](https://app.escros.work.gd) (app)

## Problem

Freelancers and clients often lose time and money due to vague scope, delayed payments, and weak dispute evidence. Existing solutions rely on trusted intermediaries or fragmented off-chain processes.

## Solution

Escros is a role-based escrow product for freelance work with transparent rules and programmable payouts on Solana.

- `customer` (заказчик): creates contracts, funds escrow, accepts results.
- `user` (исполнитель): accepts contracts, submits work, receives payouts.

## Why Solana

- Low transaction costs make escrow flows practical for small and medium contracts.
- Fast confirmations improve UX for funding, milestone updates, and releases.
- Account model supports auditable escrow states and role-bound actions.
- Composability allows integration with wallets, token rails, and future reputation primitives.

## Current status

This repository is in active hackathon build phase.

- Frontend onboarding and role-oriented contracts UX are prioritized first.
- Backend and on-chain workspaces are scaffolded and planned for MVP implementation.
- Detailed implementation sequence is documented in `docs/implementation-plan.md`.

## Project structure

- `frontend/` — React + TypeScript + Vite (UI, onboarding, contracts).
- `backend/` — Fastify API: wallet JWT auth, contracts, optional **on-server QVAC** (`@qvac/sdk` + Bare). See `backend/docs/qvac-backend.md` for AI setup.
- `contracts/` — Solana programs / integration.
- `docs/` — architecture, plans, demo scripts.

### Frontend structure (`frontend/src`)

- `app/` - app bootstrap, providers, global router setup.
- `pages/` - route-level screens (onboarding steps, contracts pages).
- `widgets/` - composed UI blocks for pages (for example, contracts list).
- `features/` - user actions/scenarios (connect wallet, select role, etc.).
- `entities/` - domain entities and typed models (`user`, `contract`).
- `shared/` - shared utilities, config, UI primitives.

## Local run

1. Install from repo root (`patch-package` applies `patches/@qvac+sdk+*.patch` after install):
   - `npm install`
2. Frontend:
   - `npm run dev --workspace frontend`
3. Backend (needs Postgres — use Docker Compose or a local DB):
   - `cp backend/.env.example backend/.env` and set `DATABASE_URL`
   - `npm run prisma:generate --workspace backend && npm run prisma:migrate --workspace backend`
   - `npm run dev --workspace backend`

### Docker dev stack (Postgres + API + QVAC-ready backend + Vite)

First run should build the backend image (Bare needs native libs in the image):

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API / health / Swagger: [http://localhost:4000/health](http://localhost:4000/health), [http://localhost:4000/docs](http://localhost:4000/docs)

QVAC in Docker notes (timeouts, Vulkan, arm64 vs amd64): **`backend/docs/qvac-backend.md`**.

### Shortcut (postgres only)

- `docker compose up -d postgres` then run the backend locally as in step 3 above.

## What is implemented vs planned

- Implemented now:
  - Monorepo workspaces; wallet SIWS JWT + contracts API sketch in backend.
  - Frontend contracts UX; optional **`VITE_AI_SOURCE=qvac`** calls backend **`/ai/copilot-preview`** (requires auth).
  - QVAC inference on the server (`@qvac/sdk`, Bare): see **`backend/docs/qvac-backend.md`**.
- In progress / planned:
  - Production escrow flows and tighter Solana integration in `contracts/`.
  - End-to-end lifecycle polish: fund → milestones → approve / dispute paths.

## Documentation

- GitHub repository: [colosseum-team/split](https://github.com/colosseum-team/split)
- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- QVAC product/architecture plan: [`docs/qvac-ai-arbitration-plan.md`](docs/qvac-ai-arbitration-plan.md)
- **QVAC backend setup (Docker, API payloads, Bare): [`backend/docs/qvac-backend.md`](backend/docs/qvac-backend.md)**
- System architecture: [`docs/architecture.md`](docs/architecture.md)
- Demo walkthrough script: [`docs/demo-script.md`](docs/demo-script.md)
- Post-hackathon roadmap: [`docs/roadmap-post-hackathon.md`](docs/roadmap-post-hackathon.md)
- Product concept: [Google Docs](https://docs.google.com/document/d/1JX1wBwHltzNiBXpKYEifue5pPyNqh-4z_HEr6ek6pts/edit?tab=t.0)
- Slides: [Figma deck](https://www.figma.com/deck/bWqYUJ8SCArbf2HHg62MYT/split?node-id=1-266&t=kutk2bNqa3hABxZD-1)
