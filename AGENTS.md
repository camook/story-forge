# Repository Guidelines

## Project Structure & Module Organization
- `/worker`: Cloudflare Worker entry using Hono; exports `fetch`.
- `/src`: React SPA (Vite). Components in `src/components/`, hooks in `src/hooks/`.
- `/phases`: Execution plans and Codex prompts by phase.
- `wrangler.json`: Workers config (envs, bindings, assets). Secrets/bindings live here.
- Tests live near code as `*.test.ts` / `*.test.tsx`.

## Build, Test, and Development Commands
- `npm run dev`: Start Wrangler dev and Vite locally; proxy `/api` to the Worker.
- `npm run build`: Build the React app to `dist/` (assets served by the Worker).
- `npm run deploy`: Deploy the Worker via Wrangler to Cloudflare.
- `npm run test`: Run unit/integration tests (Vitest).
- `npm run lint` / `npm run type-check`: Lint and TypeScript diagnostics.

## Coding Style & Naming Conventions
- TypeScript strict: enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Indentation 2 spaces; target line width ≈ 100.
- React components: `PascalCase.tsx` (one component per file).
- Hooks/utilities: `useXxx.ts` for hooks, `camelCase.ts` for utils.
- Formatting via Prettier; lint via ESLint. Avoid Node-only APIs—use Web/Fetch/URL.

## Testing Guidelines
- Framework: Vitest. Prefer colocated tests `*.test.ts(x)`.
- Integration: test Hono handlers via `app.fetch`.
- Target ≥80% coverage on critical paths; test success and error flows.
- Example: `import { app } from "../worker"; await app.fetch(new Request("/healthz"));`.

## Commit & Pull Request Guidelines
- Conventional commits (e.g., `feat: add /api/time`, `fix: handle CORS error`).
- PRs: clear description, linked issues (`Closes #123`), screenshots for UI changes,
  test notes, and checklist of impacts (bindings/env vars). Require green CI.

## Security & Configuration Tips
- Secrets/config only via `wrangler.json` bindings/vars; never ship to client.
- Minimal CORS; JSON responses with explicit status codes; centralized error handling.
- Runtime is Cloudflare Workers; avoid Node built-ins. Serve static from `dist/`.
