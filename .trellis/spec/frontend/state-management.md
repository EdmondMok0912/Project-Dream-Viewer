# State Management

> How state is managed in this project. There is no global state library — keep it that way unless a task genuinely outgrows it.

---

## Layers

1. **Component-local `useState`** — the default. Even page-level flow state is local (`app/page.tsx`).
2. **App-flow state machine** — `app/page.tsx` models the whole analysis flow as `type AppState = "FORM" | "LOADING" | "REPORT" | "CRISIS"` plus `inputData` / `reportData`. New screens on the home flow must extend this union, not add booleans like `isLoading` + `showReport`.
3. **Context** — only `I18nContext` (`components/i18n-provider.tsx`). Language is persisted to `localStorage` under `"dream_app_lang"`.
4. **localStorage** — draft form state (`"dream_form_draft"`, debounced 500 ms in `components/dream-form.tsx`) and language (`"dream_app_lang"`).

## Rules

- Keep server/AI results out of localStorage — the product intentionally keeps user data local via **explicit JSON export** (`components/report-view.tsx` `handleDownloadJSON`), not silent persistence. Don't change this privacy stance without discussion.
- Persisted values must be read inside `useEffect` after mount and parsed defensively (JSON.parse in try/catch, validate shape before `reset()`).
- i18n hydration: provider renders `zh` fallback until `mounted` (see `i18n-provider.tsx`); `app/layout.tsx` carries `suppressHydrationWarning` to absorb the mismatch. Any new Context must follow the same mount-guard pattern.
- Derived values (`dreams` sort in `app/archive/page.tsx`) are computed at set-time, not memoized selectors — fine at this scale; don't introduce `useMemo` ceremony unless there's a measured problem.
- Archive page state (`dreams: ExportedDream[]`) lives in component state and is lost on refresh — accepted MVP behavior (records are re-importable from exported JSON).

## Anti-patterns

- Don't add Redux/Zustand/Jotai for what a `useState` union handles.
- Don't store UI state in `sessionStorage`/URL in parallel with the `AppState` machine — one source of truth.
- Don't duplicate language persistence; always go through `setLang` from `useI18n`.
