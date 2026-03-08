import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getOrCreateUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to save quiz attempts." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  const analysis = await prisma.analysis.findUnique({ where: { slug } });
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  let body: { score: number; total: number; answers: { questionIndex: number; selectedAnswer: unknown; correct: boolean }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { score, total, answers } = body;
  if (typeof score !== "number" || typeof total !== "number" || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "Body must include score, total, and answers array." },
      { status: 400 }
    );
  }

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      analysisId: analysis.id,
      score,
      total,
      answers: answers as object,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
