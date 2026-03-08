import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      result: analysis.result as object,
      fileName: analysis.fileName,
      level: analysis.level ?? null,
      createdAt: analysis.createdAt.toISOString(),
    },
    { status: 200 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getOrCreateUser(request);
  if (!user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to delete papers." },
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
    select: { id: true, userId: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }

  if (analysis.userId !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own papers." },
      { status: 403 }
    );
  }

  await prisma.analysis.delete({
    where: { slug },
  });

  return new NextResponse(null, { status: 204 });
}
