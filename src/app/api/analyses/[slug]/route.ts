import { NextRequest, NextResponse } from "next/server";
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
      createdAt: analysis.createdAt.toISOString(),
    },
    { status: 200 }
  );
}
