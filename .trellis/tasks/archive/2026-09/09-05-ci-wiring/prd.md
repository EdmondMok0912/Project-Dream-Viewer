# CI wiring

## Goal

Add GitHub Actions CI so the four verification gates (`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`) run automatically on every PR and every push to `main`. Today the gates only run when someone remembers to run them locally; this makes the contract tests added in `09-05-api-route-contract-tests` an actual merge gate.

Rider (user-requested 「順手修」): fix the one pre-existing ESLint warning so CI lint logs are clean.

## Background (confirmed facts from inspection)

- No `.github/` directory exists — there is no CI today.
- The suite is hermetic (passes with no API keys and no network; proven when unsetting `GEMINI_API_KEY`/`OPENROUTER_API_KEY` locally), and all `process.env` reads in `app/`/`lib/` happen at request time in `lib/ai-client.ts` — no `NEXT_PUBLIC` vars — so `next build` needs no secrets. CI requires **zero repository secrets**.
- Local dev Node is v24.16.0; vitest 5 (landing in `09-05-vitest5-upgrade`) requires Node ≥ 22.12. CI should pin the same major line as local dev: **Node 24**.
- Past repo flow: squash-merge PRs onto `main` (linear history, no merge commits).
- Lint today: `0 errors, 1 warning` — `components/dream-form.tsx:116` `const values = watch();` inside the `handleManualSave` event handler, flagged by `react-hooks/incompatible-library` (React Hook Form's `watch()` can't be memoized safely when called in a callback). The reactive `watch()` at line 64 is the sanctioned render-time subscription and does not warn.

## Requirements

- R1. Add `.github/workflows/ci.yml`: trigger on `pull_request` and `push` to `main`; steps: checkout → `setup-node` (Node 24, npm cache) → `npm ci` → `npm test` → `npx tsc --noEmit` → `npm run lint` → `npm run build`. No secrets, no services.
- R2. Fix the `dream-form.tsx:116` warning by switching the event-handler read from `watch()` to `getValues()` (destructure `getValues` from `useForm`); the render-time `watch()` at line 64 and all component behavior stay unchanged.
- R3. Persist a real-key smoke-test runbook as `docs/smoke-test.md` (the manual deploy-time step mandated by `.trellis/spec/backend/ai-api-guidelines.md` § Verification), covering: local `.env.local` key setup, `npm run dev`, curl recipes for `/api/analyze` (benign 200 SUCCESS · injection 400 exact body · zh/en via `x-app-lang`) and `/api/compare` (two dreams 200 SUCCESS), and the same curls against the deployed Cloud Run URL. Content mirrors the runbook already delivered in session chat; no app code affected.

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` exists, runs the four gates, uses Node 24 + `npm ci`, and needs no secrets.
- [ ] CI run on the PR (and push to `main` after squash-merge) is green.
- [ ] `npm run lint` reports 0 errors **and 0 warnings** locally; `components/dream-form.tsx` diff is limited to the `getValues` destructure + the one call-site change.
- [ ] `docs/smoke-test.md` exists with runnable curl recipes for both routes (valid dream input satisfies `lib/schemas.ts` constraints: `dreamContent` ≥ 10 chars, `personalAssociations` ≥ 5 chars).
- [ ] `npx tsc --noEmit && npm test && npm run build` still pass.

## Out of Scope

- Vitest/@types/node upgrades (separate task `09-05-vitest5-upgrade`; sequence: upgrade task first, CI second, so CI tests the final state).
- Deploy automation, Cloud Run config, scheduled/nightly jobs, coverage reporting, matrix builds.
- Any change to route/lib behavior.

## Key Decisions

- D1. Node 24 in CI (matches local dev v24.16.0; satisfies vitest 5 floor ≥ 22.12).
- D2. Lint fix = `getValues()` swap for the handler call site, not an eslint-disable. **Resolution note (implementation)**: the PRD premise that the render-time `watch()` at line 64 does not warn was false — `react-hooks/incompatible-library` (eslint-plugin-react-hooks 7.1.1) flags every `useForm().watch` call and reports the first hit, so fixing the handler relocated the warning to the render subscription. `formValues` is load-bearing (autosave effect + ~11 WordCount sites), so the render subscription was switched to the rule-sanctioned `useWatch({ control })` — tsc passed with zero call-site changes (`WordCount.text` is already `text?: string`). End state: 0 errors, 0 warnings, no behavior change.
- D3. Triggers: all PRs + push to `main` only (no full matrix on every branch push).
