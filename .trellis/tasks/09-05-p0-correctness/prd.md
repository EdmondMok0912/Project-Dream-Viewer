# PRD: P0 Correctness Fixes

**Source**: Full-codebase audit 2026-09-05 (findings #1–#4, priority P0).
**Scope**: `app/api/analyze/route.ts`, `app/api/compare/route.ts`, `lib/schemas.ts`, new `lib/ai-client.ts`.
**Out of scope**: frontend files, prompt wording redesign, sanitizeInput redesign (P1), tests infrastructure.

---

## Problem

The two AI API routes trust LLM output blindly, have an unintended primary/fallback chain, no outbound timeout, and leak internal error details. Together these make real-world failure modes likely (UI crash on malformed AI JSON) and hide the safety-gate behavior (risk classification) behind an unverified Gemma `systemInstruction` call.

## Requirements

### R1. Validate AI output with Zod (finding #1)

- `analyze/route.ts`: after `JSON.parse` of the risk phase, validate with `riskClassificationSchema.safeParse`; after the analysis phase, validate with `reportSchema.safeParse`. On failure → controlled 500 (`{"error": "Internal Server Error", "message": "..."}`), no crash path to the client contract.
- `compare/route.ts`: add `compareReportSchema` to `lib/schemas.ts` (recurringSymbols / recurringEmotions / commonThemes as `z.array(z.string())`, timelineAnalysis as `string`) and validate the parsed response.
- Compare **input**: replace bare `Array.isArray` check with a Zod schema (`dreamComparisonItemSchema` — the 7 fields the client sends in `app/archive/page.tsx` `runComparison`), min 2 items, still returning the same 400 message.
- Keep client contract byte-identical: response `type` values (`SUCCESS`, `CRISIS_ABORT`), status codes, and the exact string `"Invalid prompt content detected."`.

### R2. Intentional model chain + timeouts (finding #3)

- Keep current behavior (OpenRouter first when `OPENROUTER_API_KEY` set, else Gemini primary → Gemini fallback) but make it explicit and documented in code + spec — the commit message said "fallback" while the code made it primary; decide: OpenRouter stays **primary when configured** (free-tier cost control) and the doc/comment says so.
- Add `AbortController` timeout to the OpenRouter `fetch` (default 45 s, env-overridable via `OPENROUTER_TIMEOUT_MS`), so a hung provider cannot consume the whole 60 s `maxDuration`.
- Log which provider/model actually served each request (`console.warn` on fallback path already exists — keep one clear line on success too).

### R3. Stop leaking internals (finding #4)

- Remove `details: error` from both routes' 500 responses. Keep `message` limited to `error.message` (as today) — no raw error objects, no stack.

### R4. Gemma system-instruction safety (finding #2)

- On the Gemini API path, Gemma models don't reliably support `config.systemInstruction`. Fold the system instruction into the request contents (prepend to the user content) for the Gemini path; keep a real `system` message for the OpenRouter path (supported there). Note the reason in a comment (constraint, not narrative).
- This removes dependence on runtime verification we cannot do without a live key.

### R5. De-duplicate shared helpers (enabler)

- Extract `sanitizeInput`, `getGoogleGenAI`, `callOpenRouter`, `generateWithFallback` into `lib/ai-client.ts`; both routes import from there. No behavior change beyond R2/R4. (This was P1 finding #5 but is required here — R1/R2/R4 all touch the same ~100 duplicated lines; fixing them twice would be waste.)

## Acceptance Criteria

- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass.
- [x] Both routes reject malformed AI JSON with a controlled 500 (no unvalidated cast reaches the response).
- [x] `compareReportSchema` + `dreamComparisonItemSchema` exist in `lib/schemas.ts` and are used.
- [x] OpenRouter fetch aborts at the configured timeout; `OPENROUTER_TIMEOUT_MS` env documented in `.env.example`.
- [x] 500 responses contain no `details` field.
- [x] `lib/ai-client.ts` exists; the two route files no longer contain duplicated helper definitions.
- [x] Client-facing contract unchanged (verified by grep of status codes / message strings / `type` values used in `app/page.tsx` + `app/archive/page.tsx`).
- [x] `.trellis/spec/backend/ai-api-guidelines.md` updated to match the new architecture (spec says what code does).

Completed 2026-09-05. `lib/prompts.ts` also gained `getComparePrompt` (moved out of the compare route per backend spec rule — flagged in change boundary). `tsconfig.tsbuildinfo` added to `.gitignore` (artifact of running tsc). Remaining human step: smoke-test both routes with a real API key (see Risks).

## Risks / Notes

- No live API key in this environment: LLM-path behavior is verified by build + code review; the OpenRouter/Gemini chain must be smoke-tested with a real key by the developer before deploying (AI Studio Cloud Run injects `GEMINI_API_KEY`).
- Prompt text and schema-key contract must not change (values language handling stays as-is).
