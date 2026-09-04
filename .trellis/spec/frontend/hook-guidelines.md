# Hook Guidelines

> Custom hooks and data-fetching patterns in this project.

---

## Existing Custom Hooks

- `useI18n()` (`components/i18n-provider.tsx`) — throws outside `I18nProvider`; returns `{ lang, setLang, t }`. This is the only hook components should reach for globally.
- `useIsMobile()` (`hooks/use-mobile.ts`) — matchMedia-based, currently **unused anywhere**. Either delete it or adopt it; don't leave it drifting.

## Rules for New Custom Hooks

- File name = hook name in kebab-case, one hook per file under `hooks/` (`hooks/use-mobile.ts` is the pattern).
- Prefix with `use`; return a stable object shape; guard `window` usage inside `useEffect` (SSR-safe) — never read browser APIs during render.
- Prefer `matchMedia` listeners with cleanup over resize listeners.

## Data Fetching Pattern (current convention)

There is no react-query/SWR. Fetching is plain `fetch` in handlers with this shape (reference: `app/page.tsx` `handleSubmit`, `app/archive/page.tsx` `runComparison`):

1. `POST` JSON with headers `Content-Type` + `x-app-lang: lang` (both must be sent — routes rely on the language header).
2. Explicit status branches for `413`, `503`, `504`, and `400` with `error === "Invalid prompt content detected."` — keep these in sync with what `app/api/*/route.ts` actually returns.
3. `await response.json()` wrapped in try/catch (server can return non-JSON on proxy timeouts).
4. Success is keyed off the JSON body `type` field (`"SUCCESS"` / `"CRISIS_ABORT"`), not just HTTP status.
5. Drive UI state transitions (`setAppState`) in `finally`-equivalent paths so the app never gets stuck in `LOADING`.

If a third fetch site appears, extract a shared `postJson` helper into `lib/` instead of copy-pasting the status ladder a third time.

## react-hook-form

- `useForm<DreamInput>({ resolver: zodResolver(dreamInputSchema), defaultValues: {...} })` — see `components/dream-form.tsx`.
- Types come from `lib/schemas.ts` (`z.infer`), never re-declared locally.
- Controlled value access via `watch()`; programmatic updates via `setValue(..., { shouldValidate: true, shouldDirty: true })`.
- Draft persistence pattern: debounced `useEffect` on watched values → `localStorage` (see `dream-form.tsx` `DRAFT_KEY`). Reuse that pattern for any new persistence need; parse stored JSON defensively.
