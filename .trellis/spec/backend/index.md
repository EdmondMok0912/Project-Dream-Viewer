# Backend (AI API) Development Guidelines

> Server-side conventions for the Next.js API routes that call Google Gemma/OpenRouter models.

This is a single Next.js app (no separate backend package). "Backend" here means `app/api/**` route handlers plus their `lib/` dependencies.

---

## Guidelines Index

| Guide | Description |
|-------|-------------|
| [AI API Guidelines](./ai-api-guidelines.md) | Route structure, model fallback chain, prompt/schema contracts, error mapping, contract tests (`tests/api/`) |

Frontend conventions: [`../frontend/index.md`](../frontend/index.md).
