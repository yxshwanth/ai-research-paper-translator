import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import { analyzeResearchPaper } from "@/lib/gemini";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_TEXT_LENGTH = 100;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("paper");

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

    const result = await analyzeResearchPaper(text);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
