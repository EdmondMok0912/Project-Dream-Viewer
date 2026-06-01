import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const COMPARE_PROMPT = `
You are an analytical module in a dream reflection system. Your task is to compare multiple dream reports and identify patterns, recurring themes, and emotional shifts over time.

Input will be an array of JSON objects representing multiple dreams, containing their dates, titles, summaries, and emotions.

Analyze the patterns and output a strictly formatted JSON object exactly matching this schema:
{
  "recurringSymbols": ["symbol1", "symbol2"],
  "recurringEmotions": ["emotion1", "emotion2"],
  "commonThemes": ["theme1"],
  "timelineAnalysis": "String (A brief paragraph analyzing any shifts, developments, or recurring patterns across these dreams over time. Write in Traditional Chinese.)"
}

Keep all string values inside the JSON in Traditional Chinese (except the keys themselves).
`;

function getGoogleGenAI(apiKey: string | undefined): GoogleGenAI {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const customApiKey = req.headers.get("x-custom-api-key") || process.env.GEMINI_API_KEY;
    const ai = getGoogleGenAI(customApiKey);
    const body = await req.json();
    
    if (!Array.isArray(body) || body.length < 2) {
      return NextResponse.json({ error: "At least two dreams are required for comparison" }, { status: 400 });
    }
    
    const inputContext = JSON.stringify(body, null, 2);

    const primaryModel = process.env.PRIMARY_MODEL || "gemma-4-31b-it";
    const fallbackModel = process.env.FALLBACK_MODEL || "gemma-4-26b-a4b-it";

    async function generateWithFallback(contents: string, config: any) {
      try {
        return await ai.models.generateContent({ model: primaryModel, contents, config });
      } catch (error) {
        console.warn(`Primary model ${primaryModel} failed, falling back to ${fallbackModel}`, error);
        return await ai.models.generateContent({ model: fallbackModel, contents, config });
      }
    }

    const response = await generateWithFallback(
      "Please compare these dreams and find the recurring patterns:\n\n" + inputContext,
      {
        systemInstruction: COMPARE_PROMPT,
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
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : String(error),
      details: error
    }, { status: 500 });
  }
}
