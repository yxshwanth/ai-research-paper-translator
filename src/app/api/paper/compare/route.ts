import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePapers } from "@/lib/gemini";
import type { AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: { slugs: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { slugs } = body;
  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 5) {
    return NextResponse.json(
      { error: "slugs must be an array of 2-5 analysis slugs." },
      { status: 400 }
    );
  }

  const uniqueSlugs = [...new Set(slugs.map(String).filter(Boolean))];
  if (uniqueSlugs.length < 2) {
    return NextResponse.json(
      { error: "At least 2 unique slugs required." },
      { status: 400 }
    );
  }

  const analyses = await prisma.analysis.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: { slug: true, fileName: true, result: true },
  });

  if (analyses.length < 2) {
    return NextResponse.json(
      { error: "Could not find at least 2 analyses with the given slugs." },
      { status: 404 }
    );
  }

  const payload = analyses.map((a) => ({
    slug: a.slug,
    fileName: a.fileName,
    result: a.result as unknown as AnalysisResult,
  }));

  try {
    const comparison = await comparePapers(payload);
    return NextResponse.json(comparison, { status: 200 });
  } catch (err) {
    console.error("[POST /api/paper/compare]", err);
    const message =
      err instanceof Error ? err.message : "Failed to compare papers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
