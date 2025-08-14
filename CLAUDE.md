# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev`: Builds the SPA then starts wrangler dev (serves dist/)
- `npm run vite:dev`: Starts Vite dev server with API proxy to :8787
- `npm run build`: Builds the React app into dist/
- `npm run deploy`: Builds assets then deploys via Wrangler
- `npm run test`: Runs Vitest tests
- `npm run test:watch`: Runs tests in watch mode
- `npm run lint`: ESLint check for .ts/.tsx files
- `npm run type-check`: TypeScript check for both main and worker configs

## Architecture Overview

**Runtime**: Cloudflare Workers with Hono API framework and React SPA frontend

**Key Directories**:
- `/worker/` - Hono-based Worker with separate tsconfig.json
- `/src/` - React SPA with Vite build system
- `/dist/` - Built static assets served by Worker

**Dual Development Setup**:
- Primary: `npm run dev` (builds SPA → Wrangler dev serves from dist/)
- Alternative: `npm run vite:dev` (Vite dev server with proxy to :8787)

## Worker Configuration

**Entry Point**: `worker/index.ts` exports Hono app with typed bindings:
```typescript
export type Env = {
  Bindings: {
    KV: KVNamespace;
    DB: D1Database;
  };
};
```

**Wrangler Config**: Uses environment-specific bindings in `wrangler.json`:
- `staging` and `prod` environments configured
- Assets served from `dist/` with SPA fallback
- Compatibility date: 2025-01-01

**API Patterns**:
- Routes under `/api/*` with CORS middleware
- Centralized error handling and request logging
- Standard REST patterns planned: GET/POST/PUT/DELETE with cursor pagination

## Frontend Architecture

**React Setup**:
- Functional components with hooks pattern
- Lazy loading with Suspense (see TimePanel example)
- ErrorBoundary for component error handling
- Custom `apiFetch` utility for API calls with proper error handling

**Build Integration**:
- Vite build outputs to `dist/`
- Proxy configuration for `/api` routes during development
- JSX via react-jsx transform

## TypeScript Configuration

**Dual Configs**:
- Main: `tsconfig.json` (React app with DOM types)
- Worker: `worker/tsconfig.json` (ES2022 + @cloudflare/workers-types)

**Strict Settings**: Both configs use strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`

## Testing

**Vitest** with jsdom environment for React components. Sample test in `src/utils/sum.test.ts` shows the pattern.

## Cloudflare Bindings Usage

**KV Service** (`worker/lib/kv.ts`):
- Typed wrapper with `KVService` class providing get/put/delete/list operations
- JSON serialization support via `putJSON()` method
- Comprehensive error handling with typed error responses

**D1 Service** (`worker/lib/d1.ts`):
- Typed wrapper with `D1Service` class for database operations
- Schema management with `initializeSchema()` method
- CRUD operations for items with pagination support
- Input validation and constraint error handling

**API Endpoints**:
- `/api/kv/*` - KV namespace operations (GET/PUT/DELETE key, list keys)
- `/api/d1/init` - Initialize database schema (development helper)
- `/api/d1/items/*` - CRUD operations for items with full REST interface

**Local Development**:
- KV namespace configured with preview_id for local testing
- D1 database configured for local development
- Use `npm run dev` to start development server with bindings

## Key Considerations

- No Node.js APIs available at Worker runtime
- Single-user application (no auth for MVP)
- D1 for structured data, KV for config/cache
- Static assets served via Wrangler assets with SPA fallback
- Keep binding names consistent between code and wrangler.json
- All binding operations use typed service classes with comprehensive error handling