# qvac-worker

Dedicated AI worker that exposes HTTP endpoints for backend:

- `POST /v1/copilot-run`
- `POST /v1/dispute-run`
- `GET /health`

The worker is intended to run in an environment where `globalThis.Bare` is available.
If started in plain Node runtime, requests will fail with:

`QVAC worker requires Bare runtime. globalThis.Bare is not available.`

## Local dev

```bash
npm install --workspace qvac-worker
npm run dev --workspace qvac-worker
```
