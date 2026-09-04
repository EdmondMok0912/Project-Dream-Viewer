# PRD: P1 質素重構 (P1 Quality Refactor)

**Source**: Full-codebase audit 2026-09-05 (session `sess_aa1a006`), P1 findings #6, #7, #8, and the archive-upload half of #9.
**Scope**: `app/globals.css`, `lib/ai-client.ts` (`sanitizeInput` only), `lib/schemas.ts`, `components/i18n-provider.tsx`, `components/crisis-stop.tsx`, `app/archive/page.tsx`.
**Out of scope**: `alert()` → inline-state migration, archive localStorage persistence, modal a11y, `<html lang>` sync, dead-code cleanup beyond what R3 touches, tests infrastructure, prompt wording, API route logic, client-facing contract changes. (P0 task `09-05-p0-correctness` already closed findings #1–#5 and the compare-input half of #9.)

---

## Problem

Four P1 quality findings remain from the audit. Together they mean the report body renders unstyled (Markdown `prose` classes are no-ops), all entrance animations silently do nothing, normal users writing about "instructions" in a dream get a 400 from the injection gate, the crisis screen shows hotline numbers that contradict the i18n canonical copy (and breaks in one language mode), the archive page shows a hardcoded Chinese heading in English mode, and uploaded JSON files are trusted on a 3-field surface check.

## Requirements

### R1. Load Tailwind v4 plugins (finding #6)

- `app/globals.css`: add `@plugin "@tailwindcss/typography";` and `@import "tw-animate-css";` (both packages already installed). This activates the existing `prose prose-stone` styling in `components/report-view.tsx:185` and the `animate-in` classes used in `components/crisis-stop.tsx`, `components/scroll-to-top.tsx`, `app/page.tsx`, `app/archive/page.tsx`.
- No other CSS or class changes.

### R2. Redesign `sanitizeInput` injection gate (finding #7)

- Replace the 9-entry substring blacklist in `lib/ai-client.ts` with injection-**phrase** patterns anchored on multi-word shapes (e.g. "ignore all previous…", "disregard your…", "system prompt", "bypass <rules/filters/safety>"). Bare role-hijack prefixes like "you are now" are deliberately not patterned — they appear in benign dream narration and carry no injection signal on their own.
- Precision-first: single generic words like "instruction" and bare "bypass" must **not** trigger — a dream describing a teacher's instructions or a bypass road must reach the model. Rationale: the LLM risk-classification phase (`CRISIS_ABORT`) is the second safety layer; this gate is defense-in-depth against explicit injection attempts.
- Keep the exported signature `sanitizeInput(text: string): boolean` and both routes' behavior byte-identical (400 `{"error": "Invalid prompt content detected."}`).

### R3. i18n repair (finding #8)

- `app/archive/page.tsx`: the third compare card heading 反覆出現的主題 is hardcoded Chinese → new `t()` key (zh `反覆出現的主題` / en `Recurring Themes`). While touching the file, migrate its remaining inline bilingual ternaries (hint / empty-state strings / alert messages) to `t()` keys per the spec's forbidden-pattern rule.
- `components/crisis-stop.tsx`: replace all inline bilingual text with the existing `crisis_title`, `crisis_desc`, `crisis_help`, `crisis_hk`, `crisis_tw`, `crisis_note` keys, so both crisis surfaces share one hotline list. This also clears the `crisis_*` entries from the unused-keys debt.
- `components/i18n-provider.tsx`: fix zh typo 並**未**未來的比較 → 並**為**未來的比較 (`tutorial_step2_desc`).
- `components/i18n-provider.tsx`: remove the `@ts-ignore` and the `as any` — derive `TranslationKey = keyof typeof translations.zh` and type `t(key: TranslationKey): string`. zh/en key parity becomes compile-checked; fix any call-site key mismatches tsc reveals.

### R4. Archive upload validation (finding #9 tail)

- `lib/schemas.ts`: add `exportedDreamSchema` (`version: z.literal("1.0")`, `timestamp: z.string()`, `input: dreamInputSchema`, `report: reportSchema`) and derive `ExportedDream` from it (Zod as source of truth). This matches the payload written by `handleDownloadJSON` in `components/report-view.tsx:38-44`.
- `app/archive/page.tsx`: replace the `json.version && json.input && json.report` surface check with `exportedDreamSchema.safeParse`; only parsed-valid records enter state. Keep the existing invalid-file alert message and dedup-by-timestamp behavior.
- Type the `compareReport` state as `CompareReport` (from `compareReportSchema`) instead of `any`.

## Acceptance Criteria

- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` all pass. (lint: 0 errors, 1 known `watch()` warning — pre-existing baseline; build 230 kB First Load JS, unchanged)
- [x] Built CSS (`.next/static/css`) contains generated `prose` typography rules and `animate-in` utilities (43.4 kB CSS, was near-empty).
- [x] `sanitizeInput` returns `true` for benign text containing "instructions", "bypass", "you are now"; returns `false` for explicit injection phrases ("ignore all previous instructions", "reveal your system prompt"). Verified by compiling `lib/ai-client.ts` standalone and executing the function against 5 benign + 4 injection strings — all correct.
- [x] Both routes still return byte-identical 400 message for blocked content; `SUCCESS`/`CRISIS_ABORT` contract untouched (grep-verified; `git diff` on `app/api/` is empty).
- [x] No hardcoded Chinese heading in `app/archive/page.tsx`; no inline `lang === "en" ?` ternaries remain in touched files; `crisis-stop.tsx` renders only `t()` keys.
- [x] No `@ts-ignore` / `as any` in `components/i18n-provider.tsx`; `t()` is compile-checked (`TranslationKey = keyof typeof translations.zh`; also removed a pre-existing unused eslint-disable in the same file).
- [x] `exportedDreamSchema` exists and is used by the upload path; `ExportedDream` is a `z.infer` type.
- [x] Spec debt registry (`frontend/quality-guidelines.md`) and backend `ai-api-guidelines.md` updated to match the code.

Completed 2026-09-05. Behavior note: uploads that parse as JSON but fail `exportedDreamSchema` now alert the existing invalid-file message instead of being silently skipped (the message's own wording covers this case); compare responses are additionally validated client-side with `compareReportSchema.safeParse` before `setState` (mandated by `type-safety.md`). Remaining human step: visual smoke-test — the report page now renders `prose` styling and entrance animations for the first time.

## Risks / Notes

- Loading `tw-animate-css` makes previously-inert `animate-in *` classes actually animate — a visible behavior change by design (this is the audit's intent). Watch the first-render paint for layout jank on `report-view.tsx` sections.
- The upload schema intentionally reuses `dreamInputSchema` (including its min-length rules). Exports produced by this app satisfy it; hand-edited or foreign JSON that fails parse is rejected with the existing generic message — acceptable, no error-detail surfacing needed.
- `z.literal("1.0")` hard-pins the export format version; bumping the exporter later requires updating this schema in the same change.
