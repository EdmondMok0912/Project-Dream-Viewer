# Type Safety

> TypeScript conventions and validation rules. `tsconfig.json` uses `strict: true`; keep it.

---

## Zod Is the Single Source of Truth

All data contracts live in `lib/schemas.ts`:

- **Input**: `dreamInputSchema` → `DreamInput` (user form data; validated client-side via `zodResolver` in `components/dream-form.tsx`).
- **Risk gate**: `riskClassificationSchema` → `RiskClassification`.
- **Analysis output**: `reportSchema` → `AnalysisReport` (the shape the AI must return).
- **Export format**: `exportedDreamSchema` → `ExportedDream` (versioned `"1.0"` JSON download; the same schema validates archive uploads).

Types are derived with `z.infer<typeof schema>` — never hand-write a duplicate interface for the same data. Zod error messages inside `dreamInputSchema` are user-facing and currently Traditional Chinese only; when touching them, route through i18n keys instead of hardcoding more languages inline.

## Validation Rules by Data Source

| Source | Rule |
|---|---|
| User form input | Validate with `dreamInputSchema` (already done by react-hook-form). |
| Server → client JSON | Must be validated with the matching Zod schema before `setState`. `/api/compare` responses: `compareReportSchema.safeParse` in `app/archive/page.tsx`. `/api/analyze` responses are validated server-side with the same schemas before sending, so the client consumes them directly. |
| Uploaded files (`app/archive/page.tsx`) | `JSON.parse` in try/catch, then `exportedDreamSchema.safeParse` — invalid files alert and are skipped. |
| AI raw output (server) | `JSON.parse` then `safeParse` against the Zod schema — treat LLM output as untrusted, never cast. |

## Forbidden

- `any` for data crossing a boundary.
- `@ts-ignore` — use typed key unions or indexed access with a fallback instead.
- Type assertions (`as`) to silence mismatches (`result as string` in file reading exists — avoid new ones).
- Non-null `!` on possibly-missing fields from AI output.

## Typing the i18n `t()`

`t(key: TranslationKey)` where `TranslationKey = keyof typeof translations.zh`. Missing keys — in either language dictionary or at a call site — are compile errors instead of silent fallbacks, and zh/en key parity is compile-checked. Add every new key to **both** languages.
