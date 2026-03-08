import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateSpineComprehension, truncatePaperMiddle } from "@/lib/gemini";

const MAX_PAPER_CHARS = 120000;

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: { slug: string; nodeIndex: number; userAnswer: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { slug, nodeIndex, userAnswer } = body;
  if (!slug || typeof nodeIndex !== "number" || nodeIndex < 0 || typeof userAnswer !== "string") {
    return NextResponse.json(
      { error: "slug, nodeIndex (number), and userAnswer (string) are required." },
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
    argumentSpine?: { claim: string; role: string; connectionToNext: string; comprehensionQuestion: string }[];
  };

  const spine = result?.argumentSpine;
  if (!Array.isArray(spine) || nodeIndex >= spine.length) {
    return NextResponse.json(
      { error: "Invalid node index or argument spine not available." },
      { status: 400 }
    );
  }

  const node = spine[nodeIndex];
  const summary = String(result?.summary ?? "");
  const keyContributions = Array.isArray(result?.keyContributions)
    ? result.keyContributions.map(String)
    : [];
  const concepts = Array.isArray(result?.concepts)
    ? (result.concepts as { term: string; explanation: string }[])
    : [];
  const relevantIndices = (node as { relevantConceptIndices?: number[] }).relevantConceptIndices ?? [];
  const relevantConcepts = relevantIndices
    .filter((i) => i >= 0 && i < concepts.length)
    .map((i) => concepts[i])
    .map((c) => `${c.term}: ${c.explanation}`)
    .join("\n");

  const paperExcerpt = truncatePaperMiddle(analysis.paperText, MAX_PAPER_CHARS).slice(0, 15000);
  const paperContext = `Summary: ${summary}\n\nKey contributions:\n${keyContributions.join("\n")}\n\nRelevant concepts for this step:\n${relevantConcepts}\n\nPaper excerpt:\n${paperExcerpt}`;

  try {
    const evaluation = await evaluateSpineComprehension(
      paperContext,
      {
        claim: node.claim,
        role: node.role,
        connectionToNext: node.connectionToNext,
        comprehensionQuestion: node.comprehensionQuestion,
      },
      userAnswer.trim()
    );
    return NextResponse.json(evaluation, { status: 200 });
  } catch (err) {
    console.error("[POST /api/paper/spine-check]", err);
    const message =
      err instanceof Error ? err.message : "Failed to evaluate answer.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
