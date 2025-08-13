# Phase 8 — PWA (Optional)

## Overview
Add installability and basic offline capabilities with conservative caching.

## Tasks
- Create `manifest.webmanifest` with name, short_name, icons (512/192 maskable), start_url, display, theme/background colors.
- Register a Service Worker; cache strategies: network-first for `/api/*`, stale-while-revalidate for static.
- Provide offline UX (read-only fallback); avoid caching authenticated responses unless short-lived & token-bound.
- Link manifest in `index.html` and verify over HTTPS (Workers provides HTTPS).

## Acceptance Criteria
- App is installable; Lighthouse PWA checks pass.
- SW caches static assets conservatively and respects updates (versioned caches).

## Codex Prompts
- "Add a web app manifest with maskable icons and link it in `index.html`."
- "Implement a Service Worker: network-first for `/api/*`, SWR for static; version caches and register in the app."
- "Add offline fallback UI and document cache busting steps."

## Guardrails
- Keep caches modest to avoid staleness.
- Do not cache sensitive/authenticated responses without care.

