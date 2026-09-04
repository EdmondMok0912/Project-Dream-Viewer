import { NextRequest, NextResponse } from "next/server";
import { dreamInputSchema, riskClassificationSchema, reportSchema } from "@/lib/schemas";
import { getRiskPrompt, getAnalysisPrompt } from "@/lib/prompts";
import { generateJsonWithFallback, sanitizeInput } from "@/lib/ai-client";

export const maxDuration = 60; // Allow more time for generation

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

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

    // 1. Risk Classification Phase
    const riskText = await generateJsonWithFallback({
      systemInstruction: getRiskPrompt(lang),
      contents: "Evaluate this dream input:\n\n" + inputContext,
    });

    let riskJson: unknown;
    try {
      riskJson = JSON.parse(riskText);
    } catch (e) {
      console.error("Risk phase returned invalid JSON", riskText.slice(0, 500));
      throw new Error("Failed to parse risk classification");
    }
    const riskResult = riskClassificationSchema.safeParse(riskJson);
    if (!riskResult.success) {
      console.error("Risk phase failed schema validation", riskResult.error.format());
      throw new Error("Failed to parse risk classification");
    }
    const riskData = riskResult.data;

    if (riskData.status === "ABORT") {
      return NextResponse.json({
        type: "CRISIS_ABORT",
        classification: riskData,
        message: lang === "en" ? "System detected high-risk content. Routine analysis paused. If you are in crisis, please seek professional help immediately." : "系統偵測到高度風險內容。我們無法繼續進行常規夢境分析。如果您或他人正處於危機之中，請立即尋求專業協助。"
      });
    }

    // 2. Dream Analysis Phase
    const analysisText = await generateJsonWithFallback({
      systemInstruction: getAnalysisPrompt(lang),
      contents: "Please analyze this dream input:\n\n" + inputContext,
    });

    let analysisJson: unknown;
    try {
      analysisJson = JSON.parse(analysisText);
    } catch (e) {
      console.error("Analysis phase returned invalid JSON", analysisText.slice(0, 500));
      throw new Error("Failed to parse analysis");
    }
    const analysisResult = reportSchema.safeParse(analysisJson);
    if (!analysisResult.success) {
      console.error("Analysis phase failed schema validation", analysisResult.error.format());
      throw new Error("Failed to parse analysis");
    }
    const reportData = analysisResult.data;

    return NextResponse.json({
      type: "SUCCESS",
      classification: riskData,
      report: reportData
    });

  } catch (error: any) {
    console.error("API /analyze Error:", error);

    const isOverloaded = error?.status === 503 || error?.status === "UNAVAILABLE" || (error?.message && error.message.includes("503"));
    if (isOverloaded) {
      return NextResponse.json({
        error: "Service Unavailable",
        message: "The AI model is currently experiencing high demand."
      }, { status: 503 });
    }

    return NextResponse.json({
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
