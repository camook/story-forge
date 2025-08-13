# Phase 5 — Data & Bindings Integration

## Overview
Wire required Cloudflare bindings and provide minimal, typed examples for each selected binding.

## Tasks
- Add binding placeholders in `wrangler.json`; fill real IDs per env later.
- Create typed wrappers/utilities for each used binding.
- Implement sample endpoints demonstrating bindings usage:
  - KV: config/cache get/set
  - D1: schema init + simple query
  - R2: upload/download example
  - Durable Objects: coordination/state demo
  - Queues: enqueue + consumer (stub)
  - Vectorize: index + query example

## Acceptance Criteria
- Local dev works with stubs or dev resources.
- Errors are typed and returned as JSON; no silent failures.

## Codex Prompts
- "Add KV/D1/R2/DO/Queues/Vectorize placeholders to `wrangler.json` with per-env sections."
- "Create typed utilities for `c.env` bindings and expose safe helpers."
- "Add `/api/kv` (get/set), `/api/d1` (list/insert), `/api/r2` (upload/get), `/api/queue` (enqueue), `/api/vectorize` (upsert/search) sample routes."
- "Include integration tests for at least one binding path (KV or D1)."

## Guardrails
- Keep secrets in bindings; never ship to client.
- Validate inputs server-side.
