import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

/** GET /api/flashcards?slug=... - returns due concept indices for spaced repetition */
export async function GET(request: NextRequest) {
  const user = await getOrCreateUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to view due flashcards." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }

  const analysis = await prisma.analysis.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const now = new Date();
  const reviews = await prisma.conceptReview.findMany({
    where: {
      userId: user.id,
      analysisId: analysis.id,
      nextReviewAt: { lte: now },
    },
    select: { conceptIndex: true },
  });

  return NextResponse.json(
    { dueIndices: reviews.map((r) => r.conceptIndex) },
    { status: 200 }
  );
}
