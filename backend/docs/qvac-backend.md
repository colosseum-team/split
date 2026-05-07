# QVAC backend integration

This document describes the backend-side QVAC flow for `split`.

## Goal

Move AI execution from browser runtime to backend runtime:

- frontend sends AI input to backend;
- backend executes QVAC (`@qvac/llm-llamacpp`, `@qvac/embed-llamacpp`);
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
