import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { extractTextFromPDF, checkPdfParseQuality } from "@/lib/pdf-parser";
import { analyzeResearchPaper } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import type { UserLevel } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_TEXT_LENGTH = 100;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("paper");
    const levelRaw = formData.get("level");
    const level: UserLevel =
      levelRaw === "beginner" || levelRaw === "expert"
        ? levelRaw
        : "intermediate";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Please upload a PDF." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const text = await extractTextFromPDF(buffer);

    if (text.length < MIN_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error:
            "The PDF has too little readable text. It may be scanned or image-based.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeResearchPaper(text, level);

    const parseWarning = checkPdfParseQuality(text);
    if (parseWarning) {
      result.parseQualityWarning = parseWarning;
    }

    // No request: use cookies() from next/headers (recommended for App Router Route Handlers)
    let user: Awaited<ReturnType<typeof getOrCreateUser>> = null;
    try {
      user = await getOrCreateUser();
    } catch {
      // Guest or invalid session: continue without saving user
    }

    let slug: string | undefined;
    if (prisma) {
      slug = nanoid(10);
      await prisma.analysis.create({
        data: {
          slug,
          userId: user?.id ?? null,
          fileName: file.name,
          paperText: text,
          result: result as object,
          level,
        },
      });
    }

    return NextResponse.json({ ...result, slug, extractedText: text }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("[POST /api/analyze]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
