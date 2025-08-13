# Phase 3 — Frontend Shell (React)

## Overview
Create the SPA shell with accessibility, basic theming, and data fetching from the Worker API.

## Tasks
- Set up `src/main.tsx` and `src/App.tsx` with a minimal layout and theme CSS variables.
- Add accessibility baseline: focus styles, semantic landmarks, prefers-reduced-motion support.
- Fetch `/api/time` and show loading, error, and success states.
- Add an error boundary and basic Suspense where helpful.
- Create a typed fetch helper for JSON APIs.

## Acceptance Criteria
- App renders with visible focus and responsive layout.
- Time endpoint loads and displays with clear loading/error states.

## Codex Prompts
- "Build a minimal React shell in `/src` with `App.tsx` and theme variables; ensure a11y baseline."
- "Add a typed `apiFetch<T>()` helper and use it to call `/api/time`."
- "Implement loading/error states and an ErrorBoundary component."

## Guardrails
- Functional components + hooks; no legacy patterns.
- Keep routing minimal; avoid heavy dependencies unless necessary.

