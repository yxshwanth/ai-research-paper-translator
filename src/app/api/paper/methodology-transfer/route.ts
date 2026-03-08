import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMethodologyTransferSuggestions } from "@/lib/gemini";
import type { AnalysisResult, MethodologyTransferSuggestion } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: { slug: string; targetDomains?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { slug, targetDomains } = body;
  if (!slug || typeof slug !== "string") {
    return NextResponse.json(
      { error: "slug is required." },
      { status: 400 }
    );
  }

  const analysis = await prisma.analysis.findUnique({
    where: { slug },
    select: { paperText: true, result: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const result = analysis.result as unknown as AnalysisResult;

  const domains = Array.isArray(targetDomains)
    ? targetDomains.filter((d) => typeof d === "string").slice(0, 4)
    : undefined;

  if (!domains && result.methodologyTransfer?.length) {
    return NextResponse.json(result.methodologyTransfer, { status: 200 });
  }

  try {
    const methodologyTransfer = await getMethodologyTransferSuggestions(
      analysis.paperText,
      result,
      domains
    );

    if (!domains) {
      const updatedResult: AnalysisResult = {
        ...result,
        methodologyTransfer,
      };
      await prisma.analysis.update({
        where: { slug },
        data: { result: updatedResult as object },
      });
    }

    return NextResponse.json(methodologyTransfer as MethodologyTransferSuggestion[], {
      status: 200,
    });
  } catch (err) {
    console.error("[POST /api/paper/methodology-transfer]", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate methodology transfer suggestions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
