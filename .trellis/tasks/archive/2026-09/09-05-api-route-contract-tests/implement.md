# Implement — API route contract tests

Ordered checklist. Validation command after each code step: `npx vitest run` (or `npm test` once the script exists).

## Steps

1. [ ] Install runner: `npm install -D vitest@^3.2.7` (pinned 3.x line per design.md — the bare `latest` tag resolves to breaking vitest 5.0.0) — verify `package.json` devDependencies updated and lockfile diff is limited to vitest + its deps.
2. [ ] Create `vitest.config.ts` per design.md (node environment, `include: ["tests/**/*.test.ts"]`, `resolve.alias["@" → project root via import.meta.dirname]`).
3. [ ] Add scripts to `package.json`: `"test": "vitest run"` (and optionally `"test:watch": "vitest"`). Keep existing scripts untouched.
4. [ ] Create `tests/api/helpers.ts` with the fixture inventory from design.md (`VALID_DREAM_INPUT`, `RISK_CLEAR`, `RISK_ABORT`, `VALID_REPORT`, `INJECTION_DREAM`, `COMPARE_ITEM`/`TWO_DREAMS`, `VALID_COMPARE_REPORT`, broken variants) plus a small `makeRequest(url, body, headers?)` helper returning a `NextRequest`.
5. [ ] Create `tests/api/analyze.test.ts` covering matrix A1–A10. Remember: `vi.mock("@/lib/ai-client", async (importOriginal) => ...)` keeps `sanitizeInput` real; drive the two-phase path with `mockResolvedValueOnce(risk).mockResolvedValueOnce(report)`; CRISIS_ABORT expects exactly one AI call and HTTP 200.
6. [ ] Create `tests/api/compare.test.ts` covering matrix C1–C8 (single AI call; exact 400 bodies for the "at least two dreams" and injection cases).
7. [ ] Run `npm test` — all green, no network, no API keys required (unset them locally to prove hermeticity if present).
8. [ ] Full gate from spec § Verification: `npx tsc --noEmit && npm run lint && npm run build` — all must pass.

## Validation commands

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Risky files / rollback points

- Only `package.json` / `package-lock.json` touch existing files; everything else is new (`tests/**`, `vitest.config.ts`).
- Rollback: `git checkout -- package.json package-lock.json && rm -rf tests vitest.config.ts`.
- If `npm install -D vitest@^3.2.7` still fails, stop and return to planning (do not switch major lines or bump `@types/node` without a new planning decision).

## Before task.py start

- [ ] `implement.jsonl` / `check.jsonl` contain real curated spec entries (done in Phase 1.3).
- [ ] Planning summary approved by the user (required gate).
