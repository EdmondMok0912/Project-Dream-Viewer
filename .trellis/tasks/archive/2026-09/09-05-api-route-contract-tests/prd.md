# API route contract tests

## Goal

Add automated contract tests for the two AI API routes (`app/api/analyze/route.ts`, `app/api/compare/route.ts`) and wire the project's first test runner into `package.json`. This closes the "no automated tests exist yet" gap noted in `.trellis/spec/backend/ai-api-guidelines.md` § Verification, so future prompt/schema/route changes are guarded by tests instead of manual real-key smoke tests.

## Background (confirmed facts from inspection)

- No test framework or `test` script exists today (`package.json`); Node is v24.16.0; tsconfig maps `@/*` → `./*` and includes `**/*.ts`, so new test files are type-checked by the existing `npx tsc --noEmit` gate.
- The backend spec explicitly instructs: "When adding the first test file, wire `node:test` or vitest into `package.json`."
- Route-level contract (documented in `.trellis/spec/backend/ai-api-guidelines.md` § Route-Level Contract, mirrored in the code):
  - Both routes: `content-length > 3MB` → 413 `{"error": "Payload too large"}` · language from `x-app-lang` header (default `"zh"`) · Zod-validated input · `sanitizeInput` screen → 400 with the exact body `{"error": "Invalid prompt content detected."}` · 503 overload mapping (`error.status 503` / `"UNAVAILABLE"` / message contains "503") → `{"error": "Service Unavailable", "message": "The AI model is currently experiencing high demand."}` · generic failure → 500 `{"error": "Internal Server Error", "message": <error.message>}` and never `details: error`.
  - analyze input: `dreamInputSchema`; compare input: `z.array(dreamComparisonItemSchema).min(2)` → 400 `{"error": "At least two dreams are required for comparison"}`.
  - AI output is untrusted: `JSON.parse` + `safeParse` against `riskClassificationSchema`/`reportSchema` (analyze) or `compareReportSchema` (compare); AI parse/validate failure = controlled 500, nothing unvalidated reaches a response.
  - Success bodies: `{type: "SUCCESS", classification, report}` (analyze) / `{type: "SUCCESS", report}` (compare); risk `ABORT` → HTTP 200 with `{type: "CRISIS_ABORT", classification, message}` where the message language follows `x-app-lang` — clients key off the body `type`, not the status code.
- The routes' only external dependency is `generateJsonWithFallback` in `lib/ai-client.ts` (requires `GEMINI_API_KEY`/`OPENROUTER_API_KEY`); `sanitizeInput` is a pure regex function with no I/O.
- analyze calls the AI twice in sequence (risk phase, then analysis phase) — a mock must supply different payloads per call; CRISIS_ABORT short-circuits after the first call.
- Schema shapes for fixtures: `lib/schemas.ts` (`dreamInputSchema`, `riskClassificationSchema` status enum `CLEAR|WARNING|ABORT`, `reportSchema`, `dreamComparisonItemSchema`, `compareReportSchema`).

## Requirements

- R1. Wire a test runner into `package.json` (`npm test`) so the suite runs locally with no API keys set and no network access.
- R2. Contract tests cover the documented contract above for **both** routes, by calling the route handlers directly with constructed `NextRequest` objects and mocking the AI client boundary (`generateJsonWithFallback`) per call (risk phase vs analysis phase).
- R3. `sanitizeInput` stays real (pure function) so the injection-screen wiring is exercised end-to-end; only the network-facing AI function is mocked.
- R4. Fixtures cover schema-valid AI responses (CLEAR-success and ABORT variants) plus broken variants (non-JSON text, schema-invalid JSON, 503-shaped throw, generic throw) so error mapping is asserted — including that 500 responses never carry a `details` field.
- R5. Tests assert user-observable behavior only: status code + response JSON body per the contract, including the exact injection-screen body, the exact compare "at least two dreams" body, CRISIS_ABORT message language for `zh` (default) and `en`, and 413 via an oversized `content-length` header.

## Acceptance Criteria

- [x] `npm test` runs the suite green with no API keys set and no network access.
- [x] analyze route tests cover: 413; 400 invalid input (Zod failure shape `{error: "Invalid input", details: ...}`); 400 injection with the exact contract body; 200 SUCCESS `{type, classification, report}` with per-phase mock payloads; 200 CRISIS_ABORT `{type, classification, message}` with zh default and en via `x-app-lang`; AI non-JSON → controlled 500; AI schema-invalid → controlled 500; AI 503-shaped throw → 503 contract body; generic throw → 500 `{error, message}` with no `details` key.
- [x] compare route tests cover: 413; 400 with 1 dream and with a non-array body (exact contract body); 400 injection with the exact contract body; 200 SUCCESS `{type, report}`; AI non-JSON → controlled 500; AI 503-shaped throw → 503; generic throw → 500 without `details`.
- [x] `npx tsc --noEmit && npm run lint && npm run build` all still pass (spec § Verification).
- [x] No product code under `app/` or `lib/` is modified — changes limited to tests, test config, and `package.json`/lockfile (any genuine blocker returns the task to planning).

## Out of Scope

- CI wiring (no CI config exists in the repo).
- Frontend/component tests and E2E tests.
- Real-key smoke tests (remain the manual step per spec § Verification).
- Any change to route behavior, prompts, or schemas; no refactor of the AI client (e.g. adding dependency injection).

## Key Decisions

- D1. Test runner: **Vitest, pinned to the 3.x line (`vitest@^3.2.7`)** with `vitest.config.ts` (node environment, `@` → project-root alias, `tests/**/*.test.ts` include). Rationale: the routes need module-boundary mocking of `generateJsonWithFallback` — vitest's `vi.mock` is mature and standard for Next.js route handlers, while Node 24's `node:test` `mock.module` is still flagged-experimental and needs a separate TS loader/alias story anyway. **Confirmed by the user in session** (clarify prompt answered "Vitest（建議）"). The 3.x pin was added after the first implement attempt: the bare `latest` tag now resolves to breaking vitest 5.0.0 (peer-conflicts with the project's `@types/node: ^20`, requires Vite ≥ 6.4); `vitest@3` → 3.2.7 verified to resolve cleanly.
- D2. Test level: route-handler level (import `POST` from each `route.ts` and invoke it directly). Rationale: the contract under test is the documented HTTP behavior; a real server adds startup latency and cannot mock the AI boundary hermetically. Real-HTTP E2E remains the spec's manual smoke test.
- D3. Mock boundary is `@/lib/ai-client` only; `sanitizeInput` (and `lib/prompts`, `lib/schemas`) stay real so the screen wiring and language handling are exercised, not re-implemented in mocks.
- D4. Scripts: `"test": "vitest run"` (CI-friendly, exits after run); watch mode optional as `"test:watch"`.
