# Architecture Overview

StoryForge runs on Cloudflare Workers using Hono for the API and Vite-powered React for the UI.

## Runtime & Structure
- Worker: `/worker` exports `{ fetch }` from a Hono app.
- Client: `/src` SPA served as static assets from `dist/`.
- Config: `wrangler.json` with `env.staging` and `env.prod`.

## Bindings & Data
- D1 (`DB`): primary structured storage (projects, stories, scenes, notes).
- KV (`KV`): lightweight config and cache.
- No R2/DO/Queues/Vectorize for MVP.

## API Design
- Base: `/api/*` with JSON responses and explicit status codes.
- Foundational routes: `GET /healthz`, `GET /api/time`.
- Resource pattern (to be implemented):
  - `GET /api/<resource>` list with optional `?limit=&cursor=`.
  - `POST /api/<resource>` create; `GET /api/<resource>/:id` fetch.
  - `PUT/PATCH /api/<resource>/:id` update; `DELETE /api/<resource>/:id` remove.

## Frontend
- React SPA with functional components and hooks.
- Clear loading/error states; minimal client routing.

## Security & CORS
- Single-user, no auth for MVP.
- Same-origin CORS (no cross-origin access); dev served via Wrangler/Vite.
- Centralized error handling; do not leak stack traces in production.

## Environments & Deploy
- `wrangler deploy` to staging and prod; assets in `dist/`.
- Keep binding names consistent across code and `wrangler.json`.

## Observability
- Structured logs for requests and errors; consider Workers Analytics Engine later.
