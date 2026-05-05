# Frontend (Split)

Frontend application for the `split` project built with:

- `Vite`
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Zustand`

## Getting Started

Requires `Node.js >= 18` (recommended: `20`).

```bash
cd frontend
npm install
npm run dev
```

The app will start on a local Vite server (usually `http://localhost:5173`).

## Useful Commands

```bash
npm run dev          # local development
npm run build        # production build
npm run preview      # preview production build
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
```

## Architecture

The project follows FSD layers:

- `src/app` - app bootstrap and providers
- `src/pages` - route-level pages
- `src/widgets` - composed page blocks
- `src/features` - user scenarios and actions
- `src/entities` - domain entities (reserved for scaling)
- `src/shared` - reusable shared code and configs

## Code Quality

This setup includes:

- `Prettier` for code formatting
- `ESLint` for static analysis
- `Husky` pre-commit hook (runs formatting and lint checks before commit)
