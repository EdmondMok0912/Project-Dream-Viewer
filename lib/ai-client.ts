import { GoogleGenAI } from "@google/genai";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS = ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"];
const OPENROUTER_DEFAULT_TIMEOUT_MS = 30_000;
const GEMINI_PRIMARY_MODEL_DEFAULT = "gemma-4-31b-it";
const GEMINI_FALLBACK_MODEL_DEFAULT = "gemma-4-26b-a4b-it";

// Defense-in-depth screen against explicit prompt-injection attempts before
// the input reaches the model. Precision-first: patterns match
// instruction-shaped phrases, not single generic words — "instruction" and
// "bypass" appear in benign dreams (e.g. a teacher's instructions). Content
// safety itself is the risk-classification phase's job, so missing a novel
// phrasing here is acceptable; blocking a legitimate dream is not.
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|earlier|above)/i,
  /ignore\s+(all|any|your)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|earlier|above|your)/i,
  /forget\s+(everything|all\s+your|your\s+(instructions|training|prompt))/i,
  /\bsystem\s+prompts?\b/i,
  /reveal\s+(your|the)\s+(system|initial|hidden|original)\s+(prompts?|instructions?)/i,
  /bypass\s+(all\s+)?(your\s+)?(rules?|restrictions?|filters?|safety|guardrails?|content\s+polic)/i,
  /jailbreak\s+(the\s+|this\s+|your\s+)?(ai|bot|model|chatbot|system|assistant)/i,
];

export function sanitizeInput(text: string): boolean {
  return !PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

interface JsonGenerationRequest {
  systemInstruction: string;
  contents: string;
}

function readOpenRouterTimeoutMs(): number {
  const parsed = Number(process.env.OPENROUTER_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : OPENROUTER_DEFAULT_TIMEOUT_MS;
}

function getGoogleGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
}

async function callOpenRouter(apiKey: string, req: JsonGenerationRequest): Promise<string> {
  const deadline = Date.now() + readOpenRouterTimeoutMs();
  let lastError: unknown = new Error("OpenRouter phase produced no response");

  for (const model of OPENROUTER_MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 2_000) break;

    try {
      console.log(`Trying OpenRouter model: ${model}`);
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: req.systemInstruction },
            { role: "user", content: req.contents }
          ],
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(remaining)
      });

      if (!res.ok) {
        throw new Error(`OpenRouter ${model} Error: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`Unexpected OpenRouter response format from ${model}`);
      }
      console.log(`Served by OpenRouter model ${model}`);
      return content;
    } catch (e) {
      console.error(`OpenRouter model ${model} failed`, e);
      lastError = e;
    }
  }
  throw lastError;
}

// OPENROUTER_API_KEY is a cost-control primary (free tier), not a failure
// fallback; the Gemini API chain (primary model -> fallback model) is the
// reliability fallback.
export async function generateJsonWithFallback(req: JsonGenerationRequest): Promise<string> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      return await callOpenRouter(openRouterApiKey, req);
    } catch (openRouterError) {
      console.warn("OpenRouter phase failed, falling back to Google AI Studio...", openRouterError);
    }
  } else {
    console.warn("OPENROUTER_API_KEY is not set. Proceeding directly to Google AI Studio.");
  }

  const ai = getGoogleGenAI();
  const primaryModel = process.env.PRIMARY_MODEL || GEMINI_PRIMARY_MODEL_DEFAULT;
  const fallbackModel = process.env.FALLBACK_MODEL || GEMINI_FALLBACK_MODEL_DEFAULT;

  // Gemma models on the Gemini API do not reliably support systemInstruction,
  // so the instruction is folded into contents instead of sent as config.
  const contents = `${req.systemInstruction}\n\n${req.contents}`;
  const config = { responseMimeType: "application/json" as const };

  console.log(`Using Google AI Studio API with model ${primaryModel}`);
  try {
    const response = await ai.models.generateContent({ model: primaryModel, contents, config });
    if (!response.text) throw new Error("Model returned an empty response");
    console.log(`Served by Gemini API model ${primaryModel}`);
    return response.text;
  } catch (error) {
    console.warn(`Primary model ${primaryModel} failed`, error instanceof Error ? error.message : error);
  }

  console.log(`Falling back to secondary model ${fallbackModel}`);
  const response = await ai.models.generateContent({ model: fallbackModel, contents, config });
  if (!response.text) throw new Error("Model returned an empty response");
  console.log(`Served by Gemini API model ${fallbackModel}`);
  return response.text;
}
