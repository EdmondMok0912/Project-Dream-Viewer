# PRD: P2 使用體驗 (P2 UX / Accessibility / Robustness)

**Source**: Full-codebase audit 2026-09-05, P2 findings (UI/UX, a11y, robustness).
**Scope**: `app/page.tsx`, `app/archive/page.tsx`, `app/layout.tsx`, `components/dream-form.tsx`, `components/tutorial-modal.tsx`, `components/report-view.tsx`, `components/i18n-provider.tsx`, deleted: `hooks/use-mobile.ts`, `.eslintrc.json`.
**Out of scope**: API routes, prompts, tests infrastructure (deferred — separate task), archive localStorage persistence (contradicts documented privacy stance, see Risks).

---

## Problem

The audit's P2 batch: all error/status messaging uses blocking `alert()` (and one hardcoded `window.confirm`), the tutorial modal is not an accessible dialog (no Esc, no focus trap, no dialog role, icon-only close button without label), `<html lang="en">` contradicts the zh default for screen readers, three generated-markdown headings and the report download buttons bypass the translation table, and dead code (unused hook, legacy eslint config, orphaned i18n keys) still ships.

## Requirements

### R1. Replace blocking dialogs with inline UI states

- `app/page.tsx`: the 6 `alert()` error branches (413/504/503/400-injection/generic/network) → an inline error banner (`role="alert"`, red design-system styling) above the form, keyed by translation key; shown only while `appState === "FORM"`, cleared on next submit/reset.
- `app/archive/page.tsx`: the 7 `alert()` branches → the same inline banner pattern (upload invalid-file + comparison errors).
- `components/dream-form.tsx`: draft-saved `alert()` → transient inline text (`aria-live="polite"`) beside the draft buttons; `form_draft_cleared` (currently an orphaned key) becomes the cleared-state text; the hardcoded bilingual `window.confirm` for clearing → two-step confirm button (click once → "confirm?" label, click again to clear, auto-revert after 3 s).
- Error message keys are unified into shared `error_*` keys (both pages currently duplicate near-identical wording); the 6 archive-specific error keys added in P1 are replaced by them. Analyze-vs-compare 504 wording stays separate (`error_timeout` / `error_timeout_compare`).

### R2. Tutorial modal accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the panel; Esc closes; focus moves into the dialog on open and returns to the trigger on close; Tab cycles inside the dialog (simple focus trap); icon-only X close button gets `aria-label={t("close")}`.

### R3. `<html lang>` sync

- `app/layout.tsx` renders `lang="zh"` (matches the pre-mount default); `I18nProvider` syncs `document.documentElement.lang` to the active language on mount and on every `setLang`.

### R4. Remaining i18n table bypasses

- `components/report-view.tsx`: the 3 inline bilingual Markdown-export headings → new `md_*` keys; the download buttons adopt the existing orphaned `report_download_json` / `report_download_md` keys as labels.
- `header.tsx` line 47 is a className-only ternary (styling, no user-facing string) — not a violation, left as-is.

### R5. Dead code removal

- Delete `hooks/use-mobile.ts` (0 usages) and legacy `.eslintrc.json` (ESLint 9 flat config is authoritative).
- Delete unused keys `archive_overall_title`, `archive_suggestion_title` (both languages).
- Note: the audit's "empty if block in analyze route" no longer exists (removed in the P0 route rewrite) — nothing to do.

## Explicitly NOT doing

- **Archive localStorage persistence** — `state-management.md` rules: "Keep server/AI results out of localStorage — the product intentionally keeps user data local via explicit JSON export… Don't change this privacy stance without discussion." The audit's soft suggestion ("可以考慮") does not override a documented privacy contract; this needs an explicit product decision from the developer.
- **Contract tests infrastructure** — a separate task (requires a dependency choice: node:test vs vitest, and CI wiring).
- API route logic, prompts, client-facing API contract (untouched).

## Acceptance Criteria

- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass. (lint: 0 errors, 1 known `watch()` warning — pre-existing baseline; archive route 2.47 kB, rest unchanged)
- [x] `grep -rn "alert(\|window.confirm" app/ components/` returns 0 hits (verified).
- [x] No user-facing string is produced by an inline bilingual ternary in touched components (verified: the only remaining `lang === "en" ?` is header.tsx's className styling toggle).
- [x] Tutorial modal: `role="dialog"`/`aria-modal`/`aria-labelledby` present; Esc closes; Tab focus trap + focus restore to trigger implemented; X button labeled with `t("close")`.
- [x] `<html lang>` reflects the active language (server default `zh` in layout; `document.documentElement.lang` synced in I18nProvider effect on mount + setLang).
- [x] `hooks/use-mobile.ts`, `.eslintrc.json`, `archive_overall_title`, `archive_suggestion_title` are gone; `report_download_json`/`report_download_md` (now button labels) and `form_draft_cleared` (now the cleared-draft notice) are used; `form_draft_confirm` added for the two-step confirm.
- [x] Error banners carry `role="alert"`; draft notice is `aria-live="polite"`.
- [x] Spec sync: quality-guidelines (forbidden-pattern rewrite, debt rows retired, P2 fixed line), component-guidelines (ternary exception, inline-state messaging rule, modal a11y reference), hook-guidelines (useIsMobile deletion noted), state-management.md intentionally unchanged (no persistence introduced).

Completed 2026-09-05. Not done by design: archive localStorage persistence — **developer decided 2026-09-05 to keep the privacy stance (AI results stay out of localStorage; explicit JSON export remains the only persistence path)** — and contract tests infrastructure (deferred to a separate task; requires a node:test vs vitest choice). The audit's "empty if block in analyze route" was already gone (removed in the P0 route rewrite). P1's six archive-specific error keys were unified into shared `error_*` keys used by both pages.

## Risks / Notes

- The two-step clear-draft confirm changes interaction slightly (no more native confirm dialog); the auto-revert timeout must be cleaned up if the component unmounts mid-confirmation.
- `document.documentElement.lang` update happens post-hydration; a brief `zh` flash for stored-`en` users is acceptable (server cannot know localStorage).
- Error banner keys unify P1's archive keys — wording changes slightly for compare-timeout (shorter, same meaning).
