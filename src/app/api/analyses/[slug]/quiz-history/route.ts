import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getOrCreateUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to view quiz history." },
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

  const analysis = await prisma.analysis.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: user.id, analysisId: analysis.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      score: true,
      total: true,
      createdAt: true,
    },
  });

  const last = attempts[0];
  return NextResponse.json(
    {
      attempts: attempts.map((a) => ({
        score: a.score,
        total: a.total,
        createdAt: a.createdAt.toISOString(),
      })),
      lastAttempt: last
        ? { score: last.score, total: last.total, createdAt: last.createdAt.toISOString() }
        : null,
    },
    { status: 200 }
  );
}
