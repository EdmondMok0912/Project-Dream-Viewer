import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const getComparePrompt = (lang: string) => `
You are an analytical module in a dream reflection system. Your task is to compare multiple dream reports and identify patterns, recurring themes, and emotional shifts over time.

Input will be an array of JSON objects representing multiple dreams, containing their dates, titles, summaries, and emotions.

Analyze the patterns and output a strictly formatted JSON object exactly matching this schema:
{
  "recurringSymbols": ["symbol1", "symbol2"],
  "recurringEmotions": ["emotion1", "emotion2"],
  "commonThemes": ["theme1"],
  "timelineAnalysis": "String (A brief paragraph analyzing any shifts, developments, or recurring patterns across these dreams over time. Write in ${lang === "en" ? "English" : "Traditional Chinese"}.)"
}

Keep all string values inside the JSON in ${lang === "en" ? "English" : "Traditional Chinese"} (except the keys themselves).
`;

function sanitizeInput(text: string): boolean {
  const blacklist = [
    "ignore previous", "ignore all", "system prompt",
    "instruction", "bypass", "jailbreak", "forget everything",
    "ignore above", "you are now"
  ];
  const lower = text.toLowerCase();
  return !blacklist.some(keyword => lower.includes(keyword));
}

function getGoogleGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const lang = req.headers.get("x-app-lang") || "zh";
    const ai = getGoogleGenAI();
    const body = await req.json();
    
    if (!Array.isArray(body) || body.length < 2) {
      return NextResponse.json({ error: "At least two dreams are required for comparison" }, { status: 400 });
    }
    
    const inputContext = JSON.stringify(body, null, 2);

    if (!sanitizeInput(inputContext)) {
      return NextResponse.json({ error: "Invalid prompt content detected." }, { status: 400 });
    }

    const primaryModel = process.env.PRIMARY_MODEL || "gemma-4-31b-it";
    const fallbackModel = process.env.FALLBACK_MODEL || "gemma-4-26b-a4b-it";

    async function callOpenRouter(systemInstruction: string, userContent: string, responseFormat?: string): Promise<string> {
      const openRouterApiKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterApiKey) throw new Error("OPENROUTER_API_KEY is missing");

      const orModels = ["google/gemma-4-31b-it:free", "google/gemma-4-26b-a4b-it:free"];
      let lastError = null;

      for (const model of orModels) {
        try {
          console.log(`Trying OpenRouter model: ${model}`);
          const body: any = {
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userContent }
            ]
          };
          if (responseFormat === "application/json") {
             body.response_format = { type: "json_object" };
          }
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            throw new Error(`OpenRouter ${model} Error: ${res.status} ${await res.text()}`);
          }

          const data = await res.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          } else {
            throw new Error(`Unexpected OpenRouter response format: ${JSON.stringify(data)}`);
          }
        } catch (e) {
          console.error(`OpenRouter model ${model} failed`, e);
          lastError = e;
        }
      }
      throw lastError || new Error("All OpenRouter models failed");
    }

    async function generateWithFallback(contents: string, config: any) {
      if (process.env.OPENROUTER_API_KEY) {
        try {
          console.log("Trying OpenRouter as primary API...");
          const resultText = await callOpenRouter(config.systemInstruction || "", contents, config.responseMimeType);
          return { text: resultText };
        } catch (openRouterError) {
          console.warn("OpenRouter failed, falling back to Google AI Studio...", openRouterError);
        }
      } else {
        console.warn("OPENROUTER_API_KEY is not set. Proceeding directly to Google AI Studio fallback.");
      }

      console.log(`Using Google AI Studio API with model ${primaryModel}`);
      try {
        return await ai.models.generateContent({ model: primaryModel, contents, config });
      } catch (error: any) {
        console.warn(`Primary model ${primaryModel} failed`, error?.message || error);
        
        console.log(`Falling back to secondary model ${fallbackModel}`);
        return await ai.models.generateContent({ model: fallbackModel, contents, config });
      }
    }

    const response = await generateWithFallback(
      "Please compare these dreams and find the recurring patterns:\n\n" + inputContext,
      {
        systemInstruction: getComparePrompt(lang),
        responseMimeType: "application/json",
      }
    );

    if (!response.text) {
        throw new Error("Failed to generate compare response");
    }

    const reportData = JSON.parse(response.text);

    return NextResponse.json({
      type: "SUCCESS",
      report: reportData
    });

  } catch (error: any) {
    console.error("API /compare Error:", error);

    const isOverloaded = error?.status === 503 || error?.status === "UNAVAILABLE" || (error?.message && error.message.includes("503"));
    if (isOverloaded) {
      return NextResponse.json({ 
        error: "Service Unavailable", 
        message: "The AI model is currently experiencing high demand." 
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : String(error),
      details: error
    }, { status: 500 });
  }
}
