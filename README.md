## Story Forge — Phase 1 Scaffold

Commands:

- `npm run dev`: Builds the SPA then starts `wrangler dev` (serves `dist/`).
- `npm run vite:dev`: Starts Vite dev server (proxies `/api` to `127.0.0.1:8787`).
- `npm run build`: Builds the React app into `dist/`.
- `npm run deploy`: Builds assets then deploys the Worker via Wrangler.
- `npm run test`: Runs unit tests (Vitest).
- `npm run lint` / `npm run type-check`: Lint and TS diagnostics.

Notes:

- Runtime is Cloudflare Workers. No Node-only APIs at runtime.
- Static assets are served from `dist/` via Wrangler `assets` with SPA fallback.
- API routes live under `/api/*` in `worker/index.ts` (Hono).

