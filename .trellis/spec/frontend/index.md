# Frontend Development Guidelines

> Coding conventions for the Project Dream Viewer React frontend (Next.js App Router, client-side React 19, Tailwind CSS 4).

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | File layout, naming, where new code goes | Filled |
| [Component Guidelines](./component-guidelines.md) | Component patterns, i18n usage, UI primitives | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Custom hooks, react-hook-form patterns | Filled |
| [State Management](./state-management.md) | App state machine, localStorage persistence | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Lint/typecheck/build, forbidden patterns, known debt | Filled |
| [Type Safety](./type-safety.md) | Zod schemas as source of truth, validation rules | Filled |

Backend (AI API routes) conventions live in [`../backend/`](../backend/index.md).

---

## Stack Facts (do not re-derive)

- **Next.js 15 App Router + React 19**, TypeScript `strict` (`tsconfig.json`). Types are checked in CI-equivalent builds; `next.config.ts` sets `eslint.ignoreDuringBuilds: true`, so lint must be run manually.
- **Tailwind CSS v4** via `@tailwindcss/postcss`. v4 loads plugins *in CSS*: current `app/globals.css` contains only `@import "tailwindcss";` — `@tailwindcss/typography` and `tw-animate-css` are installed but **not yet loaded**, so `prose*` and `animate-in` classes are silent no-ops (known debt, see quality-guidelines).
- **Design system**: stone/orange palette. Primitives in `components/ui/` (shadcn-style with `cva`). Layout rhythm: `max-w-5xl mx-auto px-4`, cards as `rounded-xl border border-stone-200 bg-white p-6 shadow-sm`.
- **Animation**: `motion/react` (Framer Motion v12) for orchestrated UI (see `components/report-view.tsx`, `components/tutorial-modal.tsx`); CSS `animate-in` classes appear but are currently non-functional.
- **i18n**: homegrown provider in `components/i18n-provider.tsx` (`useI18n()` → `{ lang, setLang, t }`). No i18n library. All UI strings must come from `t()`; `lang` is also sent to the API via the `x-app-lang` header.

---

## Verification Commands

```bash
npx tsc --noEmit   # types (fast, run before commit)
npm run lint       # eslint (flat config, eslint-config-next)
npm run build      # production build; types are validated here too
```

All three must pass before finishing any task.
