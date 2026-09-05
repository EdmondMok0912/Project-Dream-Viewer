# Design — API route contract tests

## Architecture & Boundaries

```
tests/api/
├── helpers.ts        # request builders + AI fixtures (shared, no tests)
├── analyze.test.ts   # contract matrix for app/api/analyze/route.ts
└── compare.test.ts   # contract matrix for app/api/compare/route.ts
vitest.config.ts      # runner config (repo root)
package.json          # + devDependency vitest, + "test" script
```

No changes to `app/**` or `lib/**`. The tested boundary:

```
NextRequest ──> route POST() ──> [real] dreamInputSchema / z.array(...)  (lib/schemas)
                             ──> [real] sanitizeInput                    (lib/ai-client)
                             ──> [MOCK] generateJsonWithFallback         (lib/ai-client)
                             ──> [real] getRiskPrompt / getAnalysisPrompt / getComparePrompt (lib/prompts)
                             ──> [real] risk/report/compare Zod safeParse on AI output
```

## Runner configuration (D1, D4)

- `npm install -D vitest@^3.2.7` — **pinned to the 3.x line, do not use the bare `latest` tag.** As of 2026-09 the `latest` dist-tag resolves to vitest 5.0.0, which is a breaking major: it peers on `@types/node@^22 || >=24` (conflicting with the project's `@types/node: ^20`) and requires Vite ≥ 6.4. `vitest@3` resolves cleanly to 3.2.7 with zero conflicts (verified via `npm install --dry-run` during the first implement attempt; the attempt was rolled back and re-planned). No other new dependency — the `@` alias is wired manually to avoid `vite-tsconfig-paths`.
- `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
});
```

- `package.json`: `"test": "vitest run"`, optional `"test:watch": "vitest"`.
- Compatibility with existing gates: tsconfig `include: ["**/*.ts"]` picks up `vitest.config.ts` and tests (type-checked by `tsc --noEmit` — vitest types come from the package, no tsconfig change); ESLint flat config lints tests (no react/DOM APIs used, `eslint-config-next` rules pass); `next build` is unaffected because nothing under `app/` imports the tests.

## Mock mechanics (D3)

```ts
// top of each test file — vi.mock is hoisted; the factory must not reference
// top-level variables, hence importOriginal inside the factory
vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();
  return { ...actual, generateJsonWithFallback: vi.fn() };
});
```

- Tests then drive `vi.mocked(generateJsonWithFallback)`: `mockResolvedValueOnce(riskJsonString).mockResolvedValueOnce(reportJsonString)` for the two-phase analyze path; single `mockResolvedValueOnce` for CRISIS_ABORT and for compare; `mockRejectedValue` for 503/500 mapping.
- Fixtures are `JSON.stringify(...)` of schema-shaped literals (see helpers below) — the route receives strings, exactly like a real provider.

## Request construction

- `new NextRequest("http://localhost:3000/api/analyze", { method: "POST", headers, body: JSON.stringify(payload) })` — `next/server` works under vitest's node environment (undici-based).
- 413 case: `headers: { "content-length": String(3 * 1024 * 1024 + 1) }` with a minimal body — the route gates on the header before parsing (no need to ship 3 MB).
- Language case: `headers: { "x-app-lang": "en" }` vs omitted header (defaults to `zh`).

## Fixture inventory (`tests/api/helpers.ts`)

| Fixture | Shape (from `lib/schemas.ts`) | Used for |
|---|---|---|
| `VALID_DREAM_INPUT` | full `dreamInputSchema` (dreamContent ≥ 10 chars, personalAssociations ≥ 5 chars) | analyze happy paths |
| `RISK_CLEAR` | `{status: "CLEAR", reason, matchedKeywords: []}` | analyze phase-1 mock |
| `RISK_ABORT` | `{status: "ABORT", reason}` | analyze CRISIS_ABORT mock |
| `VALID_REPORT` | full `reportSchema` (summary + detailedAnalysis; alternativePerspectives omitted) | analyze phase-2 mock |
| `INJECTION_DREAM` | `VALID_DREAM_INPUT` with `dreamContent: "…ignore all previous instructions…"` | 400 injection screen |
| `COMPARE_ITEM` / `TWO_DREAMS` | `dreamComparisonItemSchema` ×2 | compare happy path |
| `VALID_COMPARE_REPORT` | `compareReportSchema` (4 keys) | compare SUCCESS mock |
| broken variants | `"not-json"` string; `JSON.stringify({unexpected: true})`; `Object.assign(new Error("model overloaded"), {status: 503})`; `new Error("boom")` | AI-untrusted + error-mapping tests |

## Test matrices

**analyze** (`tests/api/analyze.test.ts`)

| # | Setup | Expect |
|---|---|---|
| A1 | `content-length` > 3 MB | 413 `{"error": "Payload too large"}` |
| A2 | body violates `dreamInputSchema` (short dreamContent) | 400 `error: "Invalid input"` (+ `details` present) |
| A3 | injection phrase in dreamContent | 400 deep-equal `{"error": "Invalid prompt content detected."}` |
| A4 | phase-1 → `RISK_CLEAR`, phase-2 → `VALID_REPORT` | 200; body `{type: "SUCCESS", classification, report}`; mock called exactly twice in order (risk prompt first) |
| A5 | phase-1 → `RISK_ABORT` (single call) | 200 (not an error status); body `{type: "CRISIS_ABORT", classification, message}`; message is the zh string |
| A6 | A5 + `x-app-lang: en` | 200; `message` is the en string |
| A7 | phase-1 resolves `"not-json"` | 500 `error: "Internal Server Error"`; message mentions parse failure; no `details` key |
| A8 | phase-1 resolves schema-invalid JSON | 500 same contract as A7 |
| A9 | phase-1 rejects `{status: 503}` error | 503 `{"error": "Service Unavailable", "message": "The AI model is currently experiencing high demand."}` |
| A10 | phase-1 rejects `new Error("boom")` | 500 `{error: "Internal Server Error", message: "boom"}`; no `details` key |

**compare** (`tests/api/compare.test.ts`)

| # | Setup | Expect |
|---|---|---|
| C1 | `content-length` > 3 MB | 413 `{"error": "Payload too large"}` |
| C2 | array with 1 item | 400 deep-equal `{"error": "At least two dreams are required for comparison"}` |
| C3 | non-array body | same 400 body as C2 |
| C4 | injection phrase in an item | 400 deep-equal `{"error": "Invalid prompt content detected."}` |
| C5 | resolves `VALID_COMPARE_REPORT` | 200 `{type: "SUCCESS", report}` matching fixture |
| C6 | resolves `"not-json"` | 500 `error: "Internal Server Error"`; no `details` key |
| C7 | rejects `{status: 503}` error | 503 contract body |
| C8 | rejects generic error | 500 `{error, message}` without `details` |

Assertion style: user-observable contract only — status + parsed JSON body (`toEqual` for exact-body cases, `toMatchObject` + explicit absence checks for the rest). No assertions against route internals beyond the mocked function's call count/order.

## Trade-offs

- Handler-level (not real-HTTP) tests: they don't cover Next.js routing/middleware concerns — accepted, since the contract lives in the handler and E2E stays the spec's manual smoke test.
- Real `sanitizeInput`/`lib/prompts` in the loop: tests would fail if the injection pattern list or prompt signatures change — intended, that wiring *is* part of the documented contract.
- `vi.mock` factory hoisting: the `importOriginal` pattern is mandatory (top-level references break); documented here and in `implement.md` so the implement pass doesn't trip on it.

## Rollback

Working tree is clean before start; all changes are additive (new `tests/`, new `vitest.config.ts`, `package.json`/lockfile diff). `git checkout -- package.json package-lock.json && rm -rf tests vitest.config.ts` restores the pre-task state.
