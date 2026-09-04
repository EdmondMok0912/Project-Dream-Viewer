import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dreamComparisonItemSchema, compareReportSchema } from "@/lib/schemas";
import { getComparePrompt } from "@/lib/prompts";
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

    const inputResult = z.array(dreamComparisonItemSchema).min(2).safeParse(body);
    if (!inputResult.success) {
      return NextResponse.json({ error: "At least two dreams are required for comparison" }, { status: 400 });
    }

    const inputContext = JSON.stringify(inputResult.data, null, 2);

    if (!sanitizeInput(inputContext)) {
      return NextResponse.json({ error: "Invalid prompt content detected." }, { status: 400 });
    }

    const responseText = await generateJsonWithFallback({
      systemInstruction: getComparePrompt(lang),
      contents: "Please compare these dreams and find the recurring patterns:\n\n" + inputContext,
    });

    let responseJson: unknown;
    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      console.error("Compare phase returned invalid JSON", responseText.slice(0, 500));
      throw new Error("Failed to parse compare response");
    }
    const reportResult = compareReportSchema.safeParse(responseJson);
    if (!reportResult.success) {
      console.error("Compare phase failed schema validation", reportResult.error.format());
      throw new Error("Failed to parse compare response");
    }

    return NextResponse.json({
      type: "SUCCESS",
      report: reportResult.data
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
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
