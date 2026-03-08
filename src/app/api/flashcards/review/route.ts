import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

const INTERVAL_DAYS: Record<string, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 5,
};

/** POST /api/flashcards/review - record a rating and schedule next review */
export async function POST(request: NextRequest) {
  const user = await getOrCreateUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to save review." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  let body: { slug: string; conceptIndex: number; rating: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { slug, conceptIndex, rating } = body;
  if (!slug || typeof conceptIndex !== "number" || conceptIndex < 0) {
    return NextResponse.json(
      { error: "slug and conceptIndex are required." },
      { status: 400 }
    );
  }

  const intervalDays = INTERVAL_DAYS[rating] ?? INTERVAL_DAYS.good;

  const analysis = await prisma.analysis.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  await prisma.conceptReview.upsert({
    where: {
      userId_analysisId_conceptIndex: {
        userId: user.id,
        analysisId: analysis.id,
        conceptIndex,
      },
    },
    create: {
      userId: user.id,
      analysisId: analysis.id,
      conceptIndex,
      nextReviewAt,
      interval: intervalDays,
    },
    update: {
      nextReviewAt,
      interval: intervalDays,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
