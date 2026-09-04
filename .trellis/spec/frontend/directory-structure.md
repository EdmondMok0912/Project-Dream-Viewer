# Directory Structure

> How frontend code is organized in this project.

---

## Layout

```
app/
├── layout.tsx              # Root layout: I18nProvider + ScrollToTop, <html lang="en">
├── page.tsx                # Home: FORM → LOADING → REPORT / CRISIS state machine
├── globals.css             # Tailwind entry (currently 1 line — see known debt)
├── archive/page.tsx        # Upload exported JSONs + cross-dream comparison
└── api/
    ├── analyze/route.ts    # POST: risk gate → structured analysis
    └── compare/route.ts    # POST: multi-dream pattern comparison

components/
├── ui/                     # shadcn-style primitives (button, input, textarea) — no business logic
├── i18n-provider.tsx       # I18nProvider + useI18n + ALL translation strings
├── header.tsx              # Nav + language toggle + tutorial modal trigger
├── dream-form.tsx          # Main input form (react-hook-form + zodResolver)
├── report-view.tsx         # Analysis report display + JSON/Markdown export
├── crisis-stop.tsx         # Crisis-intervention screen
├── tutorial-modal.tsx      # How-to modal
└── scroll-to-top.tsx       # Floating button

hooks/use-mobile.ts         # useIsMobile (currently unused — candidate for deletion)
lib/
├── schemas.ts              # ALL Zod schemas + inferred types (single source of truth)
├── prompts.ts              # AI system prompts (risk + analysis), language-parameterized
└── utils.ts                # cn() only
```

---

## Rules

- **Route files** live in `app/` with App Router naming (`page.tsx`, `layout.tsx`, `route.ts`). API handlers are always `app/api/<name>/route.ts` exporting `POST`.
- **Components** use kebab-case filenames with a named export matching PascalCase (`components/dream-form.tsx` exports `DreamForm`). Only `app/page.tsx` / `app/archive/page.tsx` use default exports (Next.js requirement).
- **Reusable UI primitives** go in `components/ui/` and must stay presentation-only. Business logic never enters `ui/`.
- **Domain logic** (schemas, prompts, types) goes in `lib/`, never inline in components or routes.
- **Translation strings** live in the `translations` object inside `components/i18n-provider.tsx` — there is no separate locale file. New UI text = new key there (both `zh` and `en`).
- `metadata.json`, `next.config.ts` (`output: 'standalone'`, `DISABLE_HMR` handling) are Google AI Studio deployment artifacts — keep them working, don't remove.

---

## When Adding a Feature

- New page → `app/<route>/page.tsx` + add `Header` inside it (both existing pages wrap `Header` themselves inside the shared white banner div — copy that pattern).
- New AI capability → new `app/api/<name>/route.ts` + prompt builder in `lib/prompts.ts` + response schema in `lib/schemas.ts`. Do **not** copy-paste from existing routes; extract shared helpers (see code-reuse guide — `analyze` vs `compare` duplication is known debt to fix, not to repeat).
