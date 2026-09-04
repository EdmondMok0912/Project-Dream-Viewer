# Component Guidelines

> Component patterns, i18n usage, and UI primitives in this project.

---

## Component Conventions

- `"use client"` on every interactive component. Only `app/layout.tsx` is a server component (it renders `I18nProvider`).
- Named function-component exports; `React.forwardRef` only inside `components/ui/` primitives (see `components/ui/button.tsx`).
- Props: inline `interface XxxProps` above the component; callbacks named `onSubmit`, `onReset`, `onClose`.
- Class merging via `cn()` from `lib/utils.ts` when classes are conditional; plain template strings otherwise.
- Layout idioms: page shell is `<main className="min-h-screen bg-stone-50 pb-20 selection:bg-stone-200 text-stone-900">` with the white banner + `max-w-5xl mx-auto px-4` container (both `app/page.tsx` and `app/archive/page.tsx`). Cards: `rounded-xl border border-stone-200 bg-white p-6 shadow-sm`.
- Form errors render as `<p className="text-xs text-red-500">{errors.field.message}</p>` (see `components/dream-form.tsx`).

## i18n Rules (strict)

- Every user-visible string comes from `const { t } = useI18n()` with a key defined in `components/i18n-provider.tsx` for **both** `zh` and `en`.
- Forbidden: inline bilingual ternaries (`lang === "en" ? "..." : "..."`) producing user-facing strings. They bypass the translation table and drift. The only allowed form is a className-only styling toggle (e.g. the header lang switch). All known violations were migrated in task `09-05-p2-ux`.
- New language? Extend `type Language` + `translations` in `i18n-provider.tsx` and the `x-app-lang` mapping in API routes (`lib/prompts.ts` currently branches only `"en"` vs Traditional Chinese).
- Error/status messaging uses inline UI states — error banners with `role="alert"` (see `app/page.tsx` `errorKey` / `app/archive/page.tsx` `noticeKey`), transient `aria-live="polite"` notices, and two-step confirm buttons for destructive actions (see `dream-form.tsx` clear-draft). No `alert()`/`window.confirm` anywhere.

## Motion

- Orchestrated entrance animations use `motion/react` with a shared `containerVariants`/`itemVariants` stagger pattern (`components/report-view.tsx` is the reference).
- Modals: `AnimatePresence` + backdrop click to close. `components/tutorial-modal.tsx` is the accessibility reference: `role="dialog"` + `aria-modal` + `aria-labelledby`, Escape-to-close, simple Tab focus trap, focus moved in on open and restored to the trigger on close (migrated in task `09-05-p2-ux`). Copy this pattern for any new modal.

## Accessibility minimums

- Icon-only buttons need `aria-label` (see `components/scroll-to-top.tsx`).
- Dialogs: at minimum `role="dialog"` + `aria-modal` + Escape-to-close.
- Keep the existing focus ring utilities on interactive elements (`focus-visible:ring-*`).
