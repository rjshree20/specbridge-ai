# SpecBridge AI

Bridge the gap between product requirements and engineering clarity.

SpecBridge AI provides a structured PRD input checkpoint for product managers preparing an engineering handoff. This milestone validates required fields and PRD length only. It does not run AI analysis, save reports, or persist submitted content.

## Run locally

Requirements: Node.js 22 and pnpm.

```sh
pnpm --dir artifacts/specbridge install
PORT=5173 BASE_PATH=/ API_PORT=3001 pnpm --dir artifacts/specbridge dev
```

Open the Vite address printed in the terminal. The development server forwards `/api` requests to the Express validation API.

## Checks

```sh
pnpm --dir artifacts/specbridge test
pnpm --dir artifacts/specbridge typecheck
pnpm --dir artifacts/specbridge build
```
