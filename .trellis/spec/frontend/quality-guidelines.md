# Quality Guidelines

> Code standards, verification, and known debt for this project.

---

## Gates (all must pass before finishing a task)

```bash
npx tsc --noEmit   # 0 errors expected
npm run lint       # eslint flat config (eslint.config.mjs, eslint-config-next); expect 0 errors
npm run build      # full production build
```

Notes:
- `next.config.ts` sets `eslint.ignoreDuringBuilds: true`, so `npm run build` alone does NOT lint — run lint explicitly.
- ESLint 9 flat config is authoritative; the legacy `.eslintrc.json` is dead config pending cleanup.
- React Compiler lint rules are active (`react-hooks/incompatible-library` warning on `watch()` calls in `dream-form.tsx` is known/accepted).

## Forbidden Patterns

- Inline bilingual ternaries in components — use `t()` keys (see component-guidelines).
- `any` / `@ts-ignore` on data boundaries (see type-safety).
- `console.log` left in client components; server route logging is fine (`console.error`/`warn` in `app/api/*` is intentional).
- New `alert()`/`window.confirm` flows — prefer inline UI states; migrate existing ones only when the file is being touched anyway.
- Never log or return raw API keys / full `error` objects to clients (`app/api/*/route.ts` currently returns `details: error` on 500 — flagged as security debt, do not replicate).

## Known Debt Registry (fix, don't replicate)

| Debt | Location | Why it matters |
|---|---|---|
| `prose` / `animate-in` classes are no-ops | `app/globals.css` missing `@plugin "@tailwindcss/typography"` and `@import "tw-animate-css";` | Report styling + all CSS entrance animations silently do nothing |
| Gemma `responseMimeType` unverified at runtime | `lib/ai-client.ts` Gemini path | If Gemma rejects JSON mime type the request 500s; smoke-test with a real key |
| Prompt-injection blacklist false positives | `sanitizeInput` in `lib/ai-client.ts` blocks benign words like "instruction" | Naive approach; needs redesign, not keyword accretion |
| Dead code | `hooks/use-mobile.ts` unused; unused i18n keys (`crisis_*`, `report_download_*`, `archive_overall_title`, `archive_suggestion_title`, `form_draft_cleared`) | Cleanup candidates |
| i18n drift | hardcoded heading 反覆出現的主題 in `app/archive/page.tsx`; zh typo 並未未來的比較 in `tutorial_step2_desc`; `<html lang="en">` vs default zh | Follow i18n rules when touching |
| `<html lang>` not synced with i18n | `app/layout.tsx` | a11y |

Fixed 2026-09-05 (task `09-05-p0-correctness`): AI output Zod validation, route helper duplication (now `lib/ai-client.ts`), Gemma `systemInstruction` (folded into contents), OpenRouter timeout, `details: error` leak.

## Discipline

- Search before changing shared values: `grep -rn "<symbol>" app components lib`.
- One logical change per commit; conventional commit style is in use (`feat:`, `fix:`, `refactor:`, `docs:`, `security:` — see `git log`).
- `.env.local` is gitignored; `.env.example` documents required vars (`GEMINI_API_KEY`, optional `OPENROUTER_API_KEY`, `PRIMARY_MODEL`, `FALLBACK_MODEL`).
