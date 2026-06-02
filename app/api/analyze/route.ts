import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { dreamInputSchema, RiskClassification, AnalysisReport } from "@/lib/schemas";
import { getRiskPrompt, getAnalysisPrompt } from "@/lib/prompts";

export const maxDuration = 60; // Allow more time for generation

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

    const ai = getGoogleGenAI();
    const lang = req.headers.get("x-app-lang") || "zh";
    const body = await req.json();
    const parseResult = dreamInputSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid input", details: parseResult.error.format() }, { status: 400 });
    }
    
    const dreamInput = parseResult.data;
    const inputContext = JSON.stringify(dreamInput, null, 2);

    if (!sanitizeInput(inputContext)) {
      return NextResponse.json({ error: "Invalid prompt content detected." }, { status: 400 });
    }

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

    // 1. Risk Classification Phase
    const riskResponse = await generateWithFallback(
      "Evaluate this dream input:\n\n" + inputContext,
      {
        systemInstruction: getRiskPrompt(lang),
        responseMimeType: "application/json",
      }
    );

    if (!riskResponse.text) {
        throw new Error("Failed to generate risk response");
    }

    let riskData: RiskClassification;
    try {
      riskData = JSON.parse(riskResponse.text);
    } catch (e) {
      console.error("Risk parsing failed", riskResponse.text);
      throw new Error("Failed to parse risk classification");
    }

    // Gatekeeper Layer
    if (riskData.status === "ABORT" || riskData.status === "WARNING") {
        // Technically WARNING can proceed in some designs, 
        // but let's check the proposal: ABORT must stop. 
        // We'll let WARNING proceed but maybe flag it.
    }

    if (riskData.status === "ABORT") {
      return NextResponse.json({
        type: "CRISIS_ABORT",
        classification: riskData,
        message: lang === "en" ? "System detected high-risk content. Routine analysis paused. If you are in crisis, please seek professional help immediately." : "系統偵測到高度風險內容。我們無法繼續進行常規夢境分析。如果您或他人正處於危機之中，請立即尋求專業協助。"
      }); 
    }

    // 2. Dream Analysis Phase
    const analysisResponse = await generateWithFallback(
      "Please analyze this dream input:\n\n" + inputContext,
      {
        systemInstruction: getAnalysisPrompt(lang),
        responseMimeType: "application/json",
      }
    );

    if (!analysisResponse.text) {
        throw new Error("Failed to generate analysis");
    }

    const reportData: AnalysisReport = JSON.parse(analysisResponse.text);

    return NextResponse.json({
      type: "SUCCESS",
      classification: riskData,
      report: reportData
    });

  } catch (error: any) {
    console.error("API /analyze Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : String(error),
      details: error
    }, { status: 500 });
  }
}
