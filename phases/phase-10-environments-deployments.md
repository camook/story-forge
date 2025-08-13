# Phase 10 — Environments & Deployments (Wrangler)

## Overview
Set up staging and production environments with separate bindings and documented rollout/rollback.

## Tasks
- Configure `env.staging` and `env.prod` in `wrangler.json` with distinct bindings.
- Validate `wrangler dev` locally; deploy to staging with smoke tests.
- Document deploy and rollback procedures; capture env-specific URLs.

## Acceptance Criteria
- Staging and production deploy successfully via `wrangler deploy`.
- Rollback procedure is tested and documented.

## Codex Prompts
- "Configure Wrangler environments for staging and prod in `wrangler.json` with separate bindings; document required secrets."
- "Add npm script `deploy` using `wrangler deploy` and verify staging deployment."
- "Document rollback steps in README with example commands."

## Guardrails
- Ensure binding names match across code and wrangler configs.
- Prefer gradual rollouts if applicable.
