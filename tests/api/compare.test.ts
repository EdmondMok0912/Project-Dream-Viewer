import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/compare/route";
import { generateJsonWithFallback } from "@/lib/ai-client";
import {
  GENERIC_ERROR,
  INJECTION_TWO_DREAMS,
  NOT_JSON,
  OVERLOAD_ERROR,
  TWO_DREAMS,
  VALID_COMPARE_REPORT,
  makeRequest,
} from "./helpers";

// Keep everything real except the network-facing AI function.
vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>();
  return { ...actual, generateJsonWithFallback: vi.fn() };
});

const mockedGenerate = vi.mocked(generateJsonWithFallback);

beforeEach(() => {
  mockedGenerate.mockReset();
});

describe("POST /api/compare", () => {
  it("C1: returns 413 when content-length exceeds 3 MB", async () => {
    const res = await POST(
      makeRequest("/api/compare", "{}", { "content-length": String(3 * 1024 * 1024 + 1) })
    );

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toEqual({ error: "Payload too large" });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("C2: returns the exact 400 body for a single-dream array", async () => {
    const res = await POST(makeRequest("/api/compare", JSON.stringify([TWO_DREAMS[0]])));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "At least two dreams are required for comparison",
    });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("C3: returns the same 400 body for a non-array body", async () => {
    const res = await POST(makeRequest("/api/compare", JSON.stringify({ notAnArray: true })));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "At least two dreams are required for comparison",
    });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("C4: returns 400 with the exact injection-screen body", async () => {
    const res = await POST(makeRequest("/api/compare", JSON.stringify(INJECTION_TWO_DREAMS)));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid prompt content detected." });
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("C5: returns SUCCESS with the compare report after a single AI call", async () => {
    mockedGenerate.mockResolvedValueOnce(JSON.stringify(VALID_COMPARE_REPORT));

    const res = await POST(makeRequest("/api/compare", JSON.stringify(TWO_DREAMS)));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      type: "SUCCESS",
      report: VALID_COMPARE_REPORT,
    });
    expect(mockedGenerate).toHaveBeenCalledTimes(1);
  });

  it("C6: non-JSON AI response maps to a controlled 500 without details", async () => {
    mockedGenerate.mockResolvedValueOnce(NOT_JSON);

    const res = await POST(makeRequest("/api/compare", JSON.stringify(TWO_DREAMS)));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");
    expect(body.message).toContain("Failed to parse compare response");
    expect(body).not.toHaveProperty("details");
  });

  it("C7: 503-shaped AI failure maps to the overload contract body", async () => {
    mockedGenerate.mockRejectedValueOnce(OVERLOAD_ERROR);

    const res = await POST(makeRequest("/api/compare", JSON.stringify(TWO_DREAMS)));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: "Service Unavailable",
      message: "The AI model is currently experiencing high demand.",
    });
  });

  it("C8: generic AI failure maps to 500 with message only, never details", async () => {
    mockedGenerate.mockRejectedValueOnce(GENERIC_ERROR);

    const res = await POST(makeRequest("/api/compare", JSON.stringify(TWO_DREAMS)));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal Server Error", message: "boom" });
    expect(body).not.toHaveProperty("details");
  });
});
