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

- `frontend/` - React + TypeScript + Vite application (UI, onboarding flow, contract list screens).
- `backend/` - API layer and business logic (auth by wallet signature, role model, contracts endpoints).
- `contracts/` - Solana smart contracts / on-chain integration layer.
- `docs/` - architecture, plan, demo flow, and submission support docs.

### Frontend structure (`frontend/src`)

- `app/` - app bootstrap, providers, global router setup.
- `pages/` - route-level screens (onboarding steps, contracts pages).
- `widgets/` - composed UI blocks for pages (for example, contracts list).
- `features/` - user actions/scenarios (connect wallet, select role, etc.).
- `entities/` - domain entities and typed models (`user`, `contract`).
- `shared/` - shared utilities, config, UI primitives.

## Local run

1. Install dependencies:
   - `npm install`
2. Run frontend:
   - `npm run dev --workspace frontend`
3. (Planned) run backend:
   - `npm run dev --workspace backend`

## What is implemented vs planned

- Implemented now:
  - Monorepo workspace structure.
  - Frontend foundation and role-focused product direction.
  - Project-level implementation and delivery documentation.
- In progress / planned:
  - Wallet signature auth API, roles API, contracts API in `backend/`.
  - Solana escrow program and on-chain event integration in `contracts/`.
  - End-to-end contract lifecycle: create -> fund -> accept -> submit -> approve/dispute.

## Documentation

- GitHub repository: [colosseum-team/split](https://github.com/colosseum-team/split)
- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md)
- System architecture: [`docs/architecture.md`](docs/architecture.md)
- Demo walkthrough script: [`docs/demo-script.md`](docs/demo-script.md)
- Post-hackathon roadmap: [`docs/roadmap-post-hackathon.md`](docs/roadmap-post-hackathon.md)
- Product concept: [Google Docs](https://docs.google.com/document/d/1JX1wBwHltzNiBXpKYEifue5pPyNqh-4z_HEr6ek6pts/edit?tab=t.0)
- Slides: [Figma deck](https://www.figma.com/deck/bWqYUJ8SCArbf2HHg62MYT/split?node-id=1-266&t=kutk2bNqa3hABxZD-1)
