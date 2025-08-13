# Repository Guidelines

## Project Structure & Module Organization
- `/worker`: Cloudflare Worker entry (Hono); exports `fetch`.
- `/src`: React app (SPA). Components in `components/`, hooks in `hooks/`.
- `/phases`: Execution plan per phase with Codex prompts.
- `wrangler.json`: Workers config (envs, bindings, assets).
- Tests live near code as `*.test.ts`/`*.test.tsx`.

## Build, Test, and Development Commands
- `npm run dev`: Run Wrangler dev and Vite locally (proxy `/api`).
- `npm run build`: Build the React app to `dist/`.
- `npm run deploy`: Deploy the Worker via Wrangler.
- `npm run test`: Run unit/integration tests (Vitest).
- `npm run lint` / `npm run type-check`: Lint and TS diagnostics.

## Coding Style & Naming Conventions
- TypeScript strict; prefer explicit types and narrow return shapes.
- Indentation: 2 spaces; line width ≈ 100.
- React components: `PascalCase.tsx` (one component per file).
- Utilities/hooks: `camelCase.ts` (`useXxx` for hooks).
- Files in feature folders; avoid deep nesting; keep modules focused.
- Formatting via Prettier; lint via ESLint (no Node-only APIs).

## Testing Guidelines
- Framework: Vitest. Name tests `*.test.ts` / `*.test.tsx`.
- Unit tests for utilities/components; integration tests via `app.fetch` for Hono routes.
- Target ≥80% critical-path coverage; test error and success paths.
- Example: `import { app } from "../worker"; await app.fetch(new Request("/healthz"))`.

## Commit & Pull Request Guidelines
- Commits: Conventional style (e.g., `feat: add /api/time`, `fix: handle CORS error`).
- Keep commits small and scoped; include rationale in body when non-trivial.
- PRs: clear description, linked issues (`Closes #123`), screenshots for UI, test notes, and checklist of impacts (bindings, env vars).
- Request at least one reviewer; green CI required.

## Security & Configuration Tips
- Secrets/config only via `wrangler.json` bindings/vars; never ship to client.
- Minimal CORS; JSON responses with explicit status codes; centralized error handling.
- Runtime is Cloudflare Workers; avoid Node built-ins. Serve static from `dist/`.
