# Frontend (Split)

Frontend application for the **Split** Solana MVP — a contract management dApp where users connect a Solana wallet, pick a role (customer or performer), and sign service agreements directly with the wallet.

## Tech stack

- `Vite` + `React 19` + `TypeScript`
- `Tailwind CSS 4`
- `Zustand 5` (with `persist` to mock the backend in `localStorage`)
- `react-router-dom`
- `react-hook-form`
- `@solana/web3.js` + `@solana/wallet-adapter-react` (Wallet Standard auto-discovery — no individual wallet adapter packages bundled)
- `@heroicons/react/24/outline` for UI icons (only the brand `LogoIcon` is a custom SVG)
- `@noble/hashes` + `bs58` for SHA-256 + base58 wallet signatures
- `nanoid` for client-side IDs

## Getting started

Requires `Node.js >= 18` (recommended: `20`).

```bash
cd frontend
npm install
npm run dev
```

The app will start on a local Vite server (usually `http://localhost:5173`).

## Useful commands

```bash
npm run dev          # local development
npm run build        # production build (tsc -b && vite build)
npm run preview      # preview production build
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
```

## Application flow

1. **`/start`** — connect a Solana wallet (Wallet Standard auto-discovery) → pick a role (`customer` / `performer`).
2. **`/home`** — list of contracts filtered by status; the `+` button is shown only to customers.
3. **`/contracts/new`** — pick one of two starter templates (Landing development / Logo design).
4. **`/contracts/create/:templateKey`** — 6-step form:
   1. Parties (performer pre-filled and read-only)
   2. Technical assignment (large fill-height textarea, pre-filled by template)
   3. Subject of contract (pre-filled by template)
   4. Execution term (start/end dates)
   5. Cost (amount + currency)
   6. Jurisdiction (with optional additional terms)
5. **`/contracts/:id`** — contract summary + view-text modal. Both parties can **Sign contract** (`signMessage(SHA-256(contractText))`). Once both signed, the customer can **Confirm work completion** to mark the contract as `COMPLETED`.

The performer flow is automatically seeded with one mock contract on first login so the inbox is not empty (`useContractsStore.seedPerformerMockOnce`).

## Architecture (FSD)

- `src/app` — app bootstrap, providers (`SolanaProvider`, `StoreProvider`), router
- `src/pages` — route-level pages (`start`, `home`, `contracts/new`, `contracts/create`, `contracts/view`)
- `src/widgets` — composed UI blocks (`Layout`, `Header`, `ContractCard`, `ContractSummary`, `StatusBadge`, `StatusFilterButtons`)
- `src/features` — user scenarios (`wallet`, `role`, `contract/create`, `contract/sign`, `contract/complete`)
- `src/entities` — domain entities and Zustand stores (`user`, `contract`)
- `src/shared` — reusable UI primitives, icons, constants

## Backend mocking

There is no backend in this MVP. All persistence is via `zustand/middleware/persist` in `localStorage`:

- `split-user-store` — wallet address, role, customer profile.
- `split-contracts-store` — contracts list and per-performer mock-seed flags.

## Code quality

- `Prettier` for code formatting
- `ESLint` for static analysis
- `Husky` pre-commit hook (runs formatting and lint checks before commit)
