import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { extractTextFromPDF, checkPdfParseQuality } from "@/lib/pdf-parser";
import { analyzeResearchPaper } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import type { UserLevel } from "@/lib/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MIN_TEXT_LENGTH = 100;

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: object) {
  controller.enqueue(
    new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return new Response(
      JSON.stringify({ error: "Invalid form data." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const file = formData.get("paper");
  const levelRaw = formData.get("level");
  const level: UserLevel =
    levelRaw === "beginner" || levelRaw === "expert" ? levelRaw : "intermediate";

  if (!file || !(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: "No file provided. Please upload a PDF." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (file.type !== "application/pdf") {
    return new Response(
      JSON.stringify({ error: "Invalid file type. Only PDF files are accepted." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: "File too large. Maximum size is 10 MB." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendEvent(controller, "progress", { phase: "extracting" });
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = await extractTextFromPDF(buffer);
        sendEvent(controller, "progress", { phase: "extracting", done: true });

        if (text.length < MIN_TEXT_LENGTH) {
          sendEvent(controller, "error", {
            error: "The PDF has too little readable text. It may be scanned or image-based.",
          });
          controller.close();
          return;
        }

        sendEvent(controller, "progress", { phase: "analyzing" });
        const result = await analyzeResearchPaper(text, level);
        sendEvent(controller, "progress", { phase: "analyzing", done: true });
        sendEvent(controller, "progress", { phase: "finalizing" });

        const parseWarning = checkPdfParseQuality(text);
        if (parseWarning) {
          result.parseQualityWarning = parseWarning;
        }

        let user: Awaited<ReturnType<typeof getOrCreateUser>> = null;
        try {
          user = await getOrCreateUser();
        } catch {
          // guest
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

        sendEvent(controller, "done", {
          ...result,
          slug,
          extractedText: text,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        console.error("[POST /api/analyze/stream]", err);
        sendEvent(controller, "error", { error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
