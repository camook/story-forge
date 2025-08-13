# Phase 12 — Hardening & Performance

## Overview
Polish accessibility, performance, and resiliency prior to broad release.

## Tasks
- Perform accessibility checks targeting WCAG AA; keyboard nav; reduced motion support.
- Run Lighthouse and Web Vitals; address LCP/TTI/layout shifts.
- Add route-level code splitting and lazy-loading where beneficial.
- Tune caches and verify no regressions post-minification.

## Acceptance Criteria
- Meets target Lighthouse scores and a11y checks.
- Noticeable improvements to LCP/TTI without regressions.

## Codex Prompts
- "Add route-based code splitting and lazy imports for heavy views."
- "Introduce prefers-reduced-motion styles and confirm focus-visible patterns."
- "Run a performance pass: analyze bundle, reduce critical path, and adjust cache headers."

## Guardrails
- Keep UX stable; avoid caching dynamic/auth content.

