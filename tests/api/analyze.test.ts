import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { generateJsonWithFallback } from "@/lib/ai-client";
import { getRiskPrompt, getAnalysisPrompt } from "@/lib/prompts";
import {
  GENERIC_ERROR,
  INJECTION_DREAM,
  NOT_JSON,
  OVERLOAD_ERROR,
  RISK_ABORT,
  RISK_CLEAR,
  SCHEMA_INVALID_JSON,
  VALID_DREAM_INPUT,
  VALID_REPORT,
  makeRequest,
} from "./helpers";

// Keep everything real except the network-facing AI function, so the
// sanitizeInput screen and language handling are exercised end-to-end.
vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();
  return { ...actual, generateJsonWithFallback: vi.fn() };
});

const mockedGenerate = vi.mocked(generateJsonWithFallback);

const ZH_ABORT_MESSAGE =
  "系統偵測到高度風險內容。我們無法繼續進行常規夢境分析。如果您或他人正處於危機之中，請立即尋求專業協助。";
const EN_ABORT_MESSAGE =
  "System detected high-risk content. Routine analysis paused. If you are in crisis, please seek professional help immediately.";

beforeEach(() => {
  mockedGenerate.mockReset();
});

describe("POST /api/analyze", () => {
  it("A1: returns 413 when content-length exceeds 3 MB", async () => {
    const res = await POST(
      makeRequest("/api/analyze", "{}", { "content-length": String(3 * 1024 * 1024 + 1) })
    );

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ error: "Payload too large" });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("A2: returns 400 with Zod details when body violates dreamInputSchema", async () => {
    const invalidDream = { ...VALID_DREAM_INPUT, dreamContent: "太短" };
    const res = await POST(makeRequest("/api/analyze", JSON.stringify(invalidDream)));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(body).toHaveProperty("details");
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("A3: returns 400 with the exact injection-screen body", async () => {
    const res = await POST(makeRequest("/api/analyze", JSON.stringify(INJECTION_DREAM)));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid prompt content detected." });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("A4: returns SUCCESS after risk-then-analysis AI phases in order", async () => {
    mockedGenerate
      .mockResolvedValueOnce(JSON.stringify(RISK_CLEAR))
      .mockResolvedValueOnce(JSON.stringify(VALID_REPORT));

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      type: "SUCCESS",
      classification: RISK_CLEAR,
      report: VALID_REPORT,
    });
    expect(mockedGenerate).toHaveBeenCalledTimes(2);
    expect(mockedGenerate.mock.calls[0][0].systemInstruction).toBe(getRiskPrompt("zh"));
    expect(mockedGenerate.mock.calls[1][0].systemInstruction).toBe(getAnalysisPrompt("zh"));
  });

  it("A5: CRISIS_ABORT is HTTP 200 with the zh message after a single AI call", async () => {
    mockedGenerate.mockResolvedValueOnce(JSON.stringify(RISK_ABORT));

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      type: "CRISIS_ABORT",
      classification: RISK_ABORT,
      message: ZH_ABORT_MESSAGE,
    });
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("A6: CRISIS_ABORT honors x-app-lang: en", async () => {
    mockedGenerate.mockResolvedValueOnce(JSON.stringify(RISK_ABORT));

    const res = await POST(
      makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT), { "x-app-lang": "en" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      type: "CRISIS_ABORT",
      classification: RISK_ABORT,
      message: EN_ABORT_MESSAGE,
    });
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("A7: non-JSON risk response maps to a controlled 500 without details", async () => {
    mockedGenerate.mockResolvedValueOnce(NOT_JSON);

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
    expect(body.message).toContain("Failed to parse risk classification");
    expect(body).not.toHaveProperty("details");
  });

  it("A8: schema-invalid risk response maps to the same controlled 500", async () => {
    mockedGenerate.mockResolvedValueOnce(SCHEMA_INVALID_JSON);

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
    expect(body.message).toContain("Failed to parse risk classification");
    expect(body).not.toHaveProperty("details");
  });

  it("A9: 503-shaped AI failure maps to the overload contract body", async () => {
    mockedGenerate.mockRejectedValueOnce(OVERLOAD_ERROR);

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: "Service Unavailable",
      message: "The AI model is currently experiencing high demand.",
    });
  });

  it("A10: generic AI failure maps to 500 with message only, never details", async () => {
    mockedGenerate.mockRejectedValueOnce(GENERIC_ERROR);

    const res = await POST(makeRequest("/api/analyze", JSON.stringify(VALID_DREAM_INPUT)));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal Server Error", message: "boom" });
    expect(body).not.toHaveProperty("details");
  });
});
