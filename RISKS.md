# Risks, Assumptions, and Success Metrics

## Top Risks & Mitigations
- D1 schema evolution: migrations may break data.
  - Mitigation: versioned migrations; backup/seed scripts; test on staging.
- KV staleness/inconsistency: eventual consistency can surface outdated config.
  - Mitigation: short TTLs, cache-busting keys, validate on write.
- No auth (single-user): scope creep to multi-user may require re-architecture.
  - Mitigation: isolate auth boundary; design tokens behind feature flag later.
- Local vs prod parity: Workers semantics differ from Node.
  - Mitigation: avoid Node-only APIs; integration tests via `app.fetch`.
- Asset caching/staleness: SPA updates may be stale.
  - Mitigation: hashed assets, conservative SW (if enabled), cache headers.

## Assumptions
- Single-user MVP; no cross-origin access needed.
- Bindings limited to D1 (DB) and KV (cache/config) initially.
- Optional PWA added only when requested.

## Success Metrics
- `wrangler dev` runs with strict types and no unhandled errors.
- Deployed staging serves SPA and API with <200ms p50 edge latency for basic endpoints.
- Core routes covered by unit/integration tests; critical-path coverage ≥80%.
