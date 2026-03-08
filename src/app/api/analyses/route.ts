import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getOrCreateUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to view your papers." },
      { status: 401 }
    );
  }

  if (!prisma) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 }
    );
  }

  const analyses = await prisma.analysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      slug: true,
      fileName: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      analyses: analyses.map((a) => ({
        slug: a.slug,
        fileName: a.fileName,
        createdAt: a.createdAt.toISOString(),
      })),
    },
    { status: 200 }
  );
}
