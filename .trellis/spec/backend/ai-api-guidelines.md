# AI API Guidelines

> How the AI-calling API routes work and the rules for changing them.

---

## Route Inventory

- `app/api/analyze/route.ts` — POST: dream input → risk classification gate → structured Jungian analysis. Two-phase LLM call.
- `app/api/compare/route.ts` — POST: 2+ dream summaries → recurring symbols/emotions/themes/timeline.

## Shared AI Client (`lib/ai-client.ts` — canonical, do not re-inline)

All provider plumbing lives here and is imported by both routes:

- `sanitizeInput(text)` — prompt-injection keyword screen returning boolean. Naive by design (has false positives, e.g. "instruction" in a legitimate dream); redesign if it must change, do not accrete keywords.
- `generateJsonWithFallback({ systemInstruction, contents })` → `Promise<string>`. Call chain:
  1. If `OPENROUTER_API_KEY` is set → OpenRouter phase (`google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free`, OpenAI-compatible, `response_format: { type: "json_object" }`). This is a **cost-control primary, not a failure fallback** — the whole phase shares one time budget (`OPENROUTER_TIMEOUT_MS`, default 30 s) enforced with `AbortSignal.timeout`; a hung provider cannot consume the 60 s `maxDuration`.
  2. Gemini API via `@google/genai`: `PRIMARY_MODEL` (default `gemma-4-31b-it`) → on failure `FALLBACK_MODEL` (default `gemma-4-26b-a4b-it`), with `responseMimeType: "application/json"`.
  3. **Gemma constraint**: Gemma models on the Gemini API do not reliably support `config.systemInstruction`, so the system instruction is folded into `contents` on this path; OpenRouter keeps a real `system` message. Preserve this when touching the client.
  4. Each success logs which provider/model served the request.
- Secrets are read inside the client (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`). Never accept keys from the client (BYOK was removed in commit `83dacaa` — do not reintroduce).

## Route-Level Contract

Request path (both routes): `content-length > 3MB` → 413 · language from `x-app-lang` header (`"zh"` default) · input Zod-validated · `sanitizeInput` screen → 400 with the exact body `{"error": "Invalid prompt content detected."}`.

- **analyze** input: `dreamInputSchema`. **compare** input: `z.array(dreamComparisonItemSchema).min(2)` → 400 `"At least two dreams are required for comparison"`.
- **AI output is untrusted.** `JSON.parse` then `safeParse` against the matching schema — `riskClassificationSchema` + `reportSchema` (analyze), `compareReportSchema` (compare). Failure = logged + controlled 500; no unvalidated cast ever reaches a response. Empty response text throws and falls through to the fallback model.
- **Success bodies**: `{ type: "SUCCESS", classification, report }` (analyze) / `{ type: "SUCCESS", report }` (compare). Risk `status === "ABORT"` returns `{ type: "CRISIS_ABORT", classification, message }` with HTTP 200 — clients key off the body `type`, not the status code.
- **Error mapping** (client code in `app/page.tsx` / `app/archive/page.tsx` branches on these): 400 + exact injection string · 413 payload · 503 overload (`error.status 503` / `"UNAVAILABLE"` / message contains "503") · 500 generic with `message: error.message` only — **never `details: error`** (no raw error objects or stacks in responses).
- Response schemas and prompt JSON-key contracts live together: prompts in `lib/prompts.ts` (`getRiskPrompt`, `getAnalysisPrompt`, `getComparePrompt` — all language-parameterized), schemas in `lib/schemas.ts`. Keep keys English, values in the user's language; prompt text and Zod schema must stay in sync.
- Timeouts: `export const maxDuration = 60` in every AI route; the OpenRouter phase budget is the only outbound timeout today — any new outbound call must carry one too.
- **Statelessness**: routes are pure request→response; user data is never persisted server-side. Keep it that way (privacy stance).

## Verification

- `npx tsc --noEmit && npm run lint && npm run build` must all pass.
- No automated tests exist yet; before deploying prompt/schema changes, smoke-test both routes with a real key (AI Studio Cloud Run injects `GEMINI_API_KEY`). When adding the first test file, wire `node:test` or vitest into `package.json`.
