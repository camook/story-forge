# Phase 7 — Testing & Quality

## Overview
Establish testing across units, integrations, and optionally E2E, plus continuous checks.

## Tasks
- Configure Vitest and write unit tests for utils/components.
- Add integration tests for Hono handlers via `app.fetch` (happy and error paths).
- Optionally add Playwright for critical E2E flows.
- Add scripts: `lint`, `type-check`, `test`, and ensure build runs in CI.

## Acceptance Criteria
- Unit and integration tests pass locally.
- Critical API paths covered with error handling assertions.

## Codex Prompts
- "Add `vitest.config.ts`, setup tests, and example unit tests for utilities."
- "Write integration tests that call `app.fetch` for `/healthz`, `/api/time`, and a binding-backed route."
- "Wire npm scripts for lint, type-check, test, and build; ensure they run locally."

## Guardrails
- Do not mock Workers APIs unnecessarily; prefer real `app.fetch` for handlers.
- Keep tests deterministic; avoid network.

