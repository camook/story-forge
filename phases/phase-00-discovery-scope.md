# Phase 0 — Discovery & Scope Lock

## Overview
Confirm product scope, data model, platform bindings, and environment strategy before implementation. Establish architectural guardrails and initial configuration skeletons.

## Tasks
- Confirm core features, routes, and data flows.
- Decide bindings: KV/D1/R2/Durable Objects/Queues/Vectorize (which and why).
- Choose auth approach (Bearer/JWT) and outline protected routes.
- Draft `ARCHITECTURE.md` (routes, modules, data flow, error handling, security model).
- Create `wrangler.json` skeleton with `env.staging` and `env.prod` placeholders.
- List risks, assumptions, and success metrics.

## Acceptance Criteria
- Stakeholders agree on scope, bindings, and auth approach.
- `ARCHITECTURE.md` first draft exists and is coherent.
- `wrangler.json` contains env sections and placeholder bindings.

## Codex Prompts
- "Draft ARCHITECTURE.md outlining routes, data flow, and bindings; include error handling and security notes."
- "Create a wrangler.json skeleton with env.staging and env.prod, including placeholders for KV, D1, R2, DO, Queues, Vectorize."
- "Add a RISKS.md with top risks, mitigations, and success metrics."

## Guardrails
- Workers runtime only; avoid Node-only APIs.
- Keep decisions aligned with `agents.md` constraints.
