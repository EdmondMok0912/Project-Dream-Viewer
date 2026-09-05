# Bump GitHub Actions to v7

## Goal

Upgrade the two GitHub Actions used by `.github/workflows/ci.yml` — `actions/checkout` and `actions/setup-node` — from `@v4` to the latest stable major (`@v7`), clearing the recurring "Node.js 20 is deprecated" runtime annotation that appeared on the workflow's first runs.

## Background (confirmed facts from inspection)

- `.github/workflows/ci.yml` (added in `09-05-ci-wiring`, PR #3) uses `actions/checkout@v4` and `actions/setup-node@v4` with inputs `node-version: 24` and `cache: npm`. The first CI run passed fully but carried the annotation: "Node.js 20 is deprecated … actions/checkout@v4, actions/setup-node@v4 … being forced to run on Node.js 24".
- Latest stable majors verified live via GitHub API on 2026-09-05: `actions/checkout` **v7.0.1**, `actions/setup-node` **v7.0.0** (so v5 is already superseded — bump straight to v7, not v5).
- This workflow's usage surface is inputs-free checkout plus `node-version`/`cache` on setup-node — inputs that are stable across those majors. GitHub-hosted `ubuntu-latest` runners satisfy the minimum-runner requirements of the newer action runtimes.
- CI itself was merged with a green first run; the suite is hermetic and needs no secrets, so a regression here can only come from the actions themselves, and the PR's CI run proves it before merge.

## Requirements

- R1. In `.github/workflows/ci.yml`, change `actions/checkout@v4` → `actions/checkout@v7` and `actions/setup-node@v4` → `actions/setup-node@v7`. No other workflow edits (inputs, triggers, steps stay as-is).
- R2. The PR's CI run completes green on the `pull_request` trigger with **no Node 20 deprecation annotation**, all four steps (test/typecheck/lint/build) passing.

## Acceptance Criteria

- [ ] `git diff` shows exactly two changed lines in `.github/workflows/ci.yml` (the two `uses:` version tags).
- [ ] CI run on the PR is green and its annotations no longer include the Node 20 deprecation notice.
- [ ] After squash-merge, the push-to-`main` run is also green.

## Out of Scope

- Any workflow restructuring (matrix, caching changes, new jobs), dependabot/renovate setup for action pinning, and Node runtime version changes (`node-version: 24` stays).

## Key Decisions

- D1. Bump to **v7** (latest stable for both), not the earlier-mentioned v5 — v5/v6 are already superseded; going straight to current avoids repeating this chore.
- D2. Pin by major tag (`@v7`), not SHA pinning — matches the repo's existing style; SHA pinning would be a separate hardening decision if ever wanted.

## Risks / Rollback

- Major-version behavior changes beyond the annotation are possible but unlikely for this inputs-free usage; if the PR run fails, the fallback is reverting the two tags to `@v4` (annotation is cosmetic, CI was green on v4).
