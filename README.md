# Dream Reflection App

AI-assisted dream reflection app with risk screening, structured Jungian-style reports, archive import, and cross-dream comparison.

## Overview

Dream Reflection App is a full-stack monorepo for AI-assisted dream reflection and journaling.

It helps users:
- submit a single dream for structured analysis,
- receive a report with themes, emotions, symbols, and reflection prompts,
- export results as Markdown or JSON,
- import previous records into a local archive,
- compare recurring patterns across multiple dreams.

The system includes safety-aware screening so potentially harmful content can be blocked from general interpretation and routed to support guidance instead.

## Features

- Single-dream analysis with structured report output.
- Risk screening before general interpretation.
- Markdown and JSON export for later review.
- Archive import for previously exported dream records.
- Cross-dream comparison for recurring symbols, emotions, and themes.
- Next.js frontend with backend API and shared schemas.
- Local fallback behavior for comparison when the backend compare API is unavailable.
