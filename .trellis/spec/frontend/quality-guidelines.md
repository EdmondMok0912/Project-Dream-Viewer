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

- Inline bilingual ternaries in components — use `t()` keys (see component-guidelines). Exception: className-only styling toggles (e.g. the header lang switch).
- `any` / `@ts-ignore` on data boundaries (see type-safety).
- `console.log` left in client components; server route logging is fine (`console.error`/`warn` in `app/api/*` is intentional).
- `alert()`/`window.confirm` — none exist; errors render as inline banners with `role="alert"`, transient confirmations use `aria-live="polite"` text, destructive actions use two-step confirm buttons (see `dream-form.tsx`).
- Never log or return raw API keys / full `error` objects to clients.

## Known Debt Registry (fix, don't replicate)

| Debt | Location | Why it matters |
|---|---|---|
| Gemma `responseMimeType` unverified at runtime | `lib/ai-client.ts` Gemini path | If Gemma rejects JSON mime type the request 500s; smoke-test with a real key |

Fixed 2026-09-05 (task `09-05-p0-correctness`): AI output Zod validation, route helper duplication (now `lib/ai-client.ts`), Gemma `systemInstruction` (folded into contents), OpenRouter timeout, `details: error` leak.
Fixed 2026-09-05 (task `09-05-p1-quality-refactor`): Tailwind typography + tw-animate-css loaded (`prose`/`animate-in` now generate real CSS), `sanitizeInput` redesigned to injection-phrase patterns (benign "instruction"/"bypass" no longer blocked), archive upload validated with `exportedDreamSchema`, i18n drift fixed (archive themes heading on `t()`, `crisis-stop.tsx` on `crisis_*` keys, zh typo, typed `t()` without `@ts-ignore`).
Fixed 2026-09-05 (task `09-05-p2-ux`): all `alert()`/`window.confirm` replaced by inline UI states (error banners, `aria-live` draft notice, two-step clear confirm), tutorial modal a11y (dialog role/aria, Esc, focus trap + restore), `<html lang>` synced with UI language, Markdown-export headings + report download buttons on `t()` keys, dead code removed (`hooks/use-mobile.ts`, legacy `.eslintrc.json`, orphaned i18n keys).

## Discipline

- Search before changing shared values: `grep -rn "<symbol>" app components lib`.
- One logical change per commit; conventional commit style is in use (`feat:`, `fix:`, `refactor:`, `docs:`, `security:` — see `git log`).
- `.env.local` is gitignored; `.env.example` documents required vars (`GEMINI_API_KEY`, optional `OPENROUTER_API_KEY`, `PRIMARY_MODEL`, `FALLBACK_MODEL`).
