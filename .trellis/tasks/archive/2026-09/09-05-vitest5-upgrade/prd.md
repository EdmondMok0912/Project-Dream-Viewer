# Vitest 5 upgrade

## Goal

Lift the deliberate vitest 3.x pin from `09-05-api-route-contract-tests`: upgrade to vitest 5.x together with the required `@types/node` bump, re-run the full gate, and adjust for v5 default changes. Gets the test runner off a two-major-old line before CI (task `09-05-ci-wiring`) locks it in.

## Background (confirmed facts from inspection)

- Current: `vitest@^3.2.7`; the 3.x pin exists because v5.0.0 peers on `@types/node@^22 || >=24` while the project has `@types/node: ^20` (documented in backend spec § Verification and archived task `09-05-api-route-contract-tests`).
- v5 hard floors (from the official migration guide): **Vite ≥ 6.4.0, Node ≥ 22.12.0**. Local Node is v24.16.0 — fine. The vitest dependency tree brings its own Vite; nothing else in the project depends on Vite directly.
- v5 behavior changes relevant to this repo's suite (18 tests in `tests/api/`):
  - `clearMocks` now defaults to `true` — our `beforeEach` `mockReset()` already clears per test, so no assertion-history leakage either way; harmless.
  - `vi.mock`/`vi.hoisted` called inside functions/blocks now **throw** — our `vi.mock("@/lib/ai-client", ...)` calls are at module top level in both test files; compliant.
  - Class-mock prototype chaining and Temporal fake-timer defaults — not used by this suite.
  - JSON/JUnit reporters write files under `.vitest/` by default — we use the default reporter; not triggered, but add `.vitest/` to `.gitignore` defensively.
  - Config lookup no longer searches parent directories — `npm test` runs from repo root where `vitest.config.ts` lives; fine.
- Core test surface used by the suite (`describe`/`it`/`expect`/`vi.mock` + `importOriginal` spread/`mockResolvedValueOnce`/`mockRejectedValue`/`mockReset`) is unchanged between v3 and v5 per the migration guide — test files are expected to pass as-is; any failure = fix or (if structural) return to planning.

## Requirements

- R1. `npm install -D vitest@^5.0.0 @types/node@^24` — bump both devDependencies together (the bump is the enabler for the v5 peer range; it is a deliberate, user-approved change this time, unlike the original 3.x pin situation). No other dependency changes; if `npm` resolves conflicts beyond these two packages, stop and report.
- R2. Re-run the full gate: `npm test` (18/18, hermetic), `npx tsc --noEmit`, `npm run lint`, `npm run build`. Fix test-level fallout only if it is a mechanical v5-default adjustment (documented above); anything structural → back to planning.
- R3. Add `.vitest/` to `.gitignore` (v5 artifact directory, defensive).
- R4. Update backend spec § Verification: change "pinned to the 3.x line" wording to state the project is on vitest 5.x and the pin rationale is historical.

## Acceptance Criteria

- [ ] `package.json` devDependencies show `vitest` `^5.x` and `@types/node` `^24`; lockfile diff limited to those trees.
- [ ] `npm test` — 18/18 green with no API keys and no network (v5 defaults).
- [ ] `npx tsc --noEmit && npm run lint && npm run build` all pass after the `@types/node` bump (no new type errors surfaced in `app/`/`lib/`; if any appear they must be fixed as part of this task or the task returns to planning).
- [ ] `.gitignore` contains `.vitest/`; backend spec § Verification updated.

## Out of Scope

- CI workflow creation (next task `09-05-ci-wiring`).
- Test-coverage expansion, mock-strategy changes, config restructuring beyond what v5 requires.

## Key Decisions

- D1. Bump `@types/node` to `^24` (not `^22`): matches the dev runtime (Node 24.16.0) and satisfies the v5 peer range in one move.
- D2. Sequence before CI wiring so CI's first run locks in the final versions.

## Risks

- The `@types/node` bump can surface new type errors anywhere `@types/node` types are used (`app/`, `lib/`, tests). Mitigation: full `tsc --noEmit` gate; mechanical fixes allowed; structural fallout → return to planning.
- vitest 5.0.0 is a fresh major with no patch releases yet; if a runner-level bug blocks us, fallback is to stay on 3.x (this task would then be closed as "deferred" rather than forced).
