# Type Safety

> TypeScript conventions and validation rules. `tsconfig.json` uses `strict: true`; keep it.

---

## Zod Is the Single Source of Truth

All data contracts live in `lib/schemas.ts`:

- **Input**: `dreamInputSchema` → `DreamInput` (user form data; validated client-side via `zodResolver` in `components/dream-form.tsx`).
- **Risk gate**: `riskClassificationSchema` → `RiskClassification`.
- **Analysis output**: `reportSchema` → `AnalysisReport` (the shape the AI must return).
- **Export format**: `ExportedDream` (versioned `"1.0"` JSON download).

Types are derived with `z.infer<typeof schema>` — never hand-write a duplicate interface for the same data. Zod error messages inside `dreamInputSchema` are user-facing and currently Traditional Chinese only; when touching them, route through i18n keys instead of hardcoding more languages inline.

## Validation Rules by Data Source

| Source | Rule |
|---|---|
| User form input | Validate with `dreamInputSchema` (already done by react-hook-form). |
| Server → client JSON | Must be validated with the matching Zod schema before `setState` — **currently NOT done** for `/api/analyze` responses (`reportSchema` is defined but unused at runtime). New code must validate; the gap is tracked in backend specs as debt to fix. |
| Uploaded files (`app/archive/page.tsx`) | `JSON.parse` in try/catch + minimal shape check (`version && input && report`). Upgrade to `exportedDreamSchema.safeParse` when touching this code. |
| AI raw output (server) | `JSON.parse` then `safeParse` against the Zod schema — treat LLM output as untrusted, never cast. |

## Forbidden

- `any` for data crossing a boundary. `app/archive/page.tsx` `compareReport` is `any` (known debt) — don't add new ones.
- `@ts-ignore` — `i18n-provider.tsx` has one on the `t()` lookup (known debt). Prefer typed key unions or indexed access with a fallback.
- Type assertions (`as`) to silence mismatches (`result as string` in file reading exists — avoid new ones).
- Non-null `!` on possibly-missing fields from AI output.

## Typing the i18n `t()`

`t(key: string)` returns `translations[lang][key] || key`. If you touch it, type keys as `keyof typeof translations.zh` so missing keys are compile errors instead of silent English fallbacks (the current `@ts-ignore` then becomes removable).
