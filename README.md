# split

Trustless freelance escrow platform on Solana: connecting clear contract summaries with automated payments.

## About

`split` is a monorepo with separate workspaces for frontend, backend, and smart-contract layers.
The product goal is to support two core roles:

- `customer` (заказчик): creates contracts, funds escrow, accepts results.
- `user` (исполнитель): accepts contracts, submits work, receives payouts.

## Project structure

- `frontend/` - React + TypeScript + Vite application (UI, onboarding flow, contract list screens).
- `backend/` - API layer and business logic (auth by wallet signature, role model, contracts endpoints).  
  Currently reserved and prepared for implementation.
- `contracts/` - Solana smart contracts / on-chain integration layer.  
  Currently reserved and prepared for implementation.
- `docs/` - project documentation and implementation plans.

### Frontend structure (`frontend/src`)

- `app/` - app bootstrap, providers, global router setup.
- `pages/` - route-level screens (onboarding steps, contracts pages).
- `widgets/` - composed UI blocks for pages (for example, contracts list).
- `features/` - user actions/scenarios (connect wallet, select role, etc.).
- `entities/` - domain entities and typed models (`user`, `contract`).
- `shared/` - shared utilities, config, UI primitives.

## Documentation

- Implementation plan: [`docs/implementation-plan.md`](docs/implementation-plan.md) - detailed scope for role-based UX (`customer` / `user`), 2-step onboarding (`connect wallet` + `select role`), contracts main screen behavior, and backend MVP tasks (auth, roles, contracts API, Solana integration).
- Product concept (presentation/doc): [Google Docs](https://docs.google.com/document/d/1JX1wBwHltzNiBXpKYEifue5pPyNqh-4z_HEr6ek6pts/edit?tab=t.0)
[figma slides](https://www.figma.com/deck/bWqYUJ8SCArbf2HHg62MYT/split?node-id=1-266&t=kutk2bNqa3hABxZD-1)
