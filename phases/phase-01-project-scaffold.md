# Phase 1 — Project Scaffold (Workers-first)

## Overview
Initialize the project with a Workers-first setup, strict TypeScript, and baseline tooling.

## Tasks
- Initialize project; add deps: `react`, `react-dom`, `hono`, `typescript`, `vite`, `@vitejs/plugin-react`.
- Add `eslint` + `prettier` configs; set TS strict flags: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Create folder structure: `/worker` (Hono Worker entry), `/src` (React app).
- Add scripts: `dev` (wrangler dev + vite), `build` (vite build), `deploy` (wrangler deploy).
- Ensure no Cloudflare Pages; serve via Worker.

## Acceptance Criteria
- `wrangler dev` runs and serves a minimal SPA shell.
- Type-check, lint, and a sample unit test run successfully.

## Codex Prompts
- "Scaffold React + Hono + Vite + TypeScript for Cloudflare Workers. Strict TS, ESLint, Prettier, Vitest. No Cloudflare Pages."
- "Add `tsconfig.json` with strict flags and `paths` if needed; create `vite.config.ts` with React plugin."
- "Create `/worker/index.ts` exporting `{ fetch }` and `/src` minimal React app."
- "Add npm scripts: dev (wrangler dev + vite), build (vite build), deploy (wrangler deploy)."

## Guardrails
- Workers runtime only; avoid Node built-ins.
- TS strict across the repo.
