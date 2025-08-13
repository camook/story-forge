# Phase 6 — Auth & Security

## Overview
Introduce authentication/authorization and tighten security headers and validation.

## Tasks
- Implement minimal CORS policy; strict origins outside dev.
- Add auth middleware (Bearer/JWT); validate token and attach typed auth context.
- Add security headers (best-effort CSP for SPA, no sniff, referrer-policy).
- Sanitize and validate inputs for API routes.
- Optional: secure cookies (HttpOnly, Secure, SameSite) if session-based.

## Acceptance Criteria
- Protected routes require valid token; failures return 401 JSON with reason.
- Security headers present on responses.

## Codex Prompts
- "Add Bearer/JWT auth middleware to Hono; set `c.get('auth')` with typed user."
- "Tighten CORS: allow specific origins in non-dev; include preflight."
- "Set CSP and other security headers appropriate for SPA on Workers."
- "Add input validation for key routes with clear error objects."

## Guardrails
- Stateless tokens preferred; avoid storing secrets in client.
- Centralize error handling for uniform JSON errors.

