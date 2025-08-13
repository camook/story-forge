# Phase 2 — Worker Core & Middleware (Hono)

## Overview
Implement Hono app with typed Env, middleware, and foundational routes.

## Tasks
- Define `type Env = { Bindings: { /* KV/D1/R2/DO/Queues/Vectorize */ } }`.
- Initialize `const app = new Hono<Env>()`.
- Add middleware: request logging, centralized error handler, minimal CORS.
- Routes: `GET /healthz` → `{ status: "ok" }`; `GET /api/time` → current ISO time.
- Set `content-type: application/json` and intentional cache headers.
- Export `{ fetch: app.fetch }` in `/worker/index.ts`.
- Add integration tests using `app.fetch`.

## Acceptance Criteria
- Routes return typed JSON with explicit status codes and no unhandled rejections.
- Tests for `/healthz` and `/api/time` pass locally.

## Codex Prompts
- "Add typed Hono app in `/worker/index.ts` with Env bindings and export `{ fetch }`."
- "Implement logging, error handler, and minimal CORS middleware."
- "Add routes: GET /healthz and GET /api/time returning JSON with cache headers."
- "Write Vitest integration tests calling `app.fetch` for happy and error paths."

## Guardrails
- Centralized error handling; JSON responses only.
- Minimal CORS; be explicit.

