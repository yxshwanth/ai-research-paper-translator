import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askAboutPaper } from "@/lib/gemini";
import type { AskRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: AskRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { slug, question, history } = body;
  if (!slug || typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "slug and question are required." },
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

  const result = analysis.result as {
    summary?: string;
    keyContributions?: string[];
    concepts?: { term: string; explanation: string }[];
    eli12?: string;
  };

  const summary = String(result?.summary ?? "");
  const keyContributions = Array.isArray(result?.keyContributions)
    ? result.keyContributions.map(String)
    : [];
  const concepts = Array.isArray(result?.concepts)
    ? (result.concepts as { term: string; explanation: string }[])
    : [];
  const eli12 = String(result?.eli12 ?? "");

  try {
    const { answer, suggestedFollowUp } = await askAboutPaper(
      analysis.paperText,
      { summary, keyContributions, concepts, eli12 },
      question.trim(),
      Array.isArray(history) ? history : undefined
    );
    return NextResponse.json({ answer, suggestedFollowUp }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/paper/ask]", err);
    const message =
      err instanceof Error ? err.message : "Failed to get answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
