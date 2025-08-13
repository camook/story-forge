# Phase 4 — Dev/Build Integration (Vite + Assets)

## Overview
Tighten dev experience and ensure correct asset output and serving via the Worker.

## Tasks
- Configure `@vitejs/plugin-react` and dev proxy `/api` → Worker if using split processes.
- Ensure `vite build` outputs hashed assets to `dist/`.
- Add Worker static assets handler or manifest-based serving.
- Set cache headers for static assets vs API responses.

## Acceptance Criteria
- `vite build` followed by `wrangler dev` serves the built SPA correctly.
- Static assets are cached appropriately; APIs are not cached unless intended.

## Codex Prompts
- "Configure `vite.config.ts` with React plugin and dev proxy for `/api`."
- "Implement Worker static asset serving for files in `dist/` with sensible caching."
- "Verify build+serve flow and document commands in README."

## Guardrails
- Avoid premature optimizeDeps changes; keep defaults.
- Workers serves assets; not Cloudflare Pages.

